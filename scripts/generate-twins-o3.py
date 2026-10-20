#!/usr/bin/env python3
"""Generate one approved twins character replacement using Kling O3 Video Edit."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import time


ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "output" / "twins-video-plan"
OUT = ROOT / "output" / "twins-video-generated"
MODEL = "kling-video/o3/video-edit"
ENDPOINT = "https://api.higgsfield.ai/" + MODEL

spec = importlib.util.spec_from_file_location("hf", ROOT / "scripts" / "generate-monk-o3.py")
hf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hf)


def save(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n")
    path.chmod(0o600)


def upload(path: Path, content_type: str) -> str:
    info = hf.curl_json(
        "POST",
        "https://api.higgsfield.ai/files/generate-upload-url",
        body={"content_type": content_type},
    )
    command = ["curl", "--fail", "--silent", "--show-error", "--max-time", "120", "--request", "PUT"]
    for key, value in info["upload_headers"].items():
        command.extend(["--header", f"{key}: {value}"])
    command.extend(["--upload-file", str(path), info["upload_url"]])
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError("Padded input upload failed")
    return info["public_url"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("clip", choices=("in", "hold", "out"))
    args = parser.parse_args()

    proposal = json.loads((PLAN / "proposed-requests.json").read_text())[args.clip]
    payload = dict(proposal["input"])
    payload["mode"] = "std"
    padded_urls_path = PLAN / "padded-inputs.json"
    if padded_urls_path.exists():
        padded_urls = json.loads(padded_urls_path.read_text())
    else:
        padded_urls = {}
    if args.clip not in padded_urls:
        padded_urls[args.clip] = upload(PLAN / "padded" / f"{args.clip}-3s.mp4", "video/mp4")
        save(padded_urls_path, padded_urls)
    payload["video_urls"] = [padded_urls[args.clip]]
    identity_urls_path = PLAN / "individual-reference-inputs.json"
    if identity_urls_path.exists():
        identity_urls = json.loads(identity_urls_path.read_text())
    else:
        identity_urls = {
            "left": upload(PLAN / "left-warrior-reference.png", "image/png"),
            "right": upload(PLAN / "right-warrior-reference.png", "image/png"),
        }
        save(identity_urls_path, identity_urls)
    payload["image_urls"] = [identity_urls["left"], identity_urls["right"]]
    payload["prompt"] = payload["prompt"].replace(
        "the two realistic gold-armored warriors shown in @Image1",
        "the two realistic gold-armored warriors shown separately in @Image1 and @Image2",
    ).replace(
        "map the original left telescope holder to the left warrior with tied-up long dark hair, and the original right man to the right warrior with loose swept-back long dark hair.",
        "replace the original left telescope holder with the tied-up-hair warrior in @Image1, and replace the original right turbaned man with the loose-hair warrior in @Image2. Both replacements are mandatory in every visible frame.",
    ).replace(
        "@Image1 supplies character identity and clothing only.",
        "@Image1 and @Image2 supply character identity and clothing only.",
    )
    payload["prompt"] += (
        "\n\nThe final repeated-frame tail is temporary padding. Keep it frozen. "
        "Preserve all preceding motion and event timing exactly; do not redistribute "
        "the action across the full three seconds."
    )

    if proposal["model"] != MODEL:
        raise RuntimeError("Planned model does not match submission model")

    OUT.mkdir(parents=True, exist_ok=True)
    request_path = OUT / f"{args.clip}-two-ref-request.json"
    status_path = OUT / f"{args.clip}-two-ref-status.json"
    output_path = OUT / f"{args.clip}-twins-o3-std-two-ref.mp4"
    started_path = OUT / f"{args.clip}-two-ref-submission-started.json"

    if output_path.exists():
        print(f"Already completed: {output_path}", flush=True)
        return 0

    if request_path.exists():
        request = json.loads(request_path.read_text())
    else:
        if started_path.exists():
            raise RuntimeError("Submission may already exist; refusing a duplicate charge")
        save(started_path, {"model": MODEL, "mode": "std", "clip": args.clip})
        request = hf.curl_json("POST", ENDPOINT, body=payload)
        save(request_path, request)
        print(f"Submitted {args.clip}: {request.get('request_id')}", flush=True)

    status_url = request.get("status_url")
    if not status_url:
        raise RuntimeError("No status URL returned; inspect request file")

    last = None
    deadline = time.monotonic() + 30 * 60
    while time.monotonic() < deadline:
        status = hf.curl_json("GET", status_url)
        save(status_path, status)
        state = status.get("status")
        if state != last:
            print(f"Status: {state}", flush=True)
            last = state
        if state == "completed":
            video = status.get("video") or {}
            if not video.get("url"):
                raise RuntimeError("Completed response has no video URL")
            hf.download(video["url"], output_path)
            print(f"Saved: {output_path}", flush=True)
            return 0
        if state in {"failed", "nsfw", "canceled"}:
            raise RuntimeError(f"Generation ended as {state}; no automatic retry")
        time.sleep(10)
    raise TimeoutError("Polling timed out; request remains saved for continuation")


if __name__ == "__main__":
    raise SystemExit(main())
