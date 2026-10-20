#!/usr/bin/env python3
"""Submit one approved monk character-replacement clip to Higgsfield O3."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
PLAN_DIR = ROOT / "output" / "monk-video-review-2026-09-20"
LEGACY_INPUTS = ROOT / "output" / "monk-video-plan" / "inputs.json"
OUTPUT_DIR = ROOT / "output" / "monk-video-generated-2026-09-20"
API_ENDPOINT = "https://api.higgsfield.ai/kling-video/o3/video-edit"


def credential() -> str:
    for raw_line in (ROOT / ".env").read_text().splitlines():
        if raw_line.startswith("HF_CREDENTIALS="):
            return raw_line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("HF_CREDENTIALS is missing from .env")


def curl_json(method: str, url: str, *, body: dict | None = None) -> dict:
    config = (
        f'header = "Authorization: Key {credential()}"\n'
        'header = "Content-Type: application/json"\n'
    )
    command = [
        "curl",
        "--silent",
        "--show-error",
        "--location",
        "--max-time",
        "60",
        "--config",
        "-",
        "--request",
        method,
    ]
    if body is not None:
        command.extend(["--data-binary", json.dumps(body)])
    command.append(url)
    result = subprocess.run(command, input=config, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"curl failed: {result.stderr.strip()}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Non-JSON API response: {result.stdout[:500]}") from exc


def download(url: str, destination: Path) -> None:
    partial = destination.with_suffix(destination.suffix + ".partial")
    result = subprocess.run(
        [
            "curl",
            "--fail",
            "--silent",
            "--show-error",
            "--location",
            "--max-time",
            "300",
            "--output",
            str(partial),
            url,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise RuntimeError(f"Download failed: {result.stderr.strip()}")
    partial.replace(destination)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("clip", choices=("in", "hold", "out"))
    args = parser.parse_args()

    proposals = json.loads((PLAN_DIR / "proposed-requests.json").read_text())
    uploaded = json.loads(LEGACY_INPUTS.read_text())
    draft = proposals[args.clip]
    payload = dict(draft["input"])
    payload["video_urls"] = uploaded[args.clip]["video_urls"]
    payload["image_urls"] = uploaded[args.clip]["image_urls"]

    if payload["mode"] != "pro":
        raise RuntimeError("Refusing to submit anything except the approved pro mode")
    if draft["endpoint"] != API_ENDPOINT:
        raise RuntimeError("Approved endpoint does not match the submission endpoint")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    request_path = OUTPUT_DIR / f"{args.clip}-request.json"
    status_path = OUTPUT_DIR / f"{args.clip}-status.json"
    output_path = OUTPUT_DIR / f"{args.clip}-monk-o3-pro.mp4"

    if request_path.exists() or output_path.exists():
        raise RuntimeError(f"Refusing duplicate submission for {args.clip}")

    print(f"Submitting {args.clip} in pro mode", flush=True)
    request = curl_json("POST", API_ENDPOINT, body=payload)
    request_path.write_text(json.dumps(request, indent=2) + "\n")
    request_path.chmod(0o600)
    print(f"Submitted request {request.get('request_id', '<missing>')}", flush=True)

    status_url = request.get("status_url")
    if not status_url:
        raise RuntimeError(f"Submission did not return status_url: {request}")

    previous = None
    deadline = time.monotonic() + 30 * 60
    while time.monotonic() < deadline:
        status = curl_json("GET", status_url)
        status_path.write_text(json.dumps(status, indent=2) + "\n")
        status_path.chmod(0o600)
        state = status.get("status")
        if state != previous:
            print(f"Status: {state}", flush=True)
            previous = state
        if state == "completed":
            video = status.get("video") or {}
            if not video.get("url"):
                raise RuntimeError("Completed response does not include a video URL")
            download(video["url"], output_path)
            print(f"Downloaded {output_path}", flush=True)
            return 0
        if state in {"failed", "nsfw", "canceled"}:
            raise RuntimeError(f"Generation ended with status {state}: {status.get('error')}")
        time.sleep(10)

    raise TimeoutError("Generation did not finish within 30 minutes")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        raise
