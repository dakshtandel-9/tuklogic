#!/usr/bin/env python3
"""Install the approved monk videos as the site's Ancient China frame sets."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "output" / "monk-video-generated-2026-09-20"
FRAME_ROOT = ROOT / "public" / "offline" / "frames" / "china"
REPORT_PATH = VIDEO_DIR / "site-installation.json"

CLIPS = {
    "in": {"video": "in-monk-replaced-final.mp4", "frames": 36},
    "hold": {"video": "hold-monk-replaced-final.mp4", "frames": 20},
    "out": {"video": "out-monk-replaced-final.mp4", "frames": 36},
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sample_indices(source_count: int, target_count: int) -> list[int]:
    """Return evenly spaced, inclusive frame indices without numpy rounding."""
    return [round(i * (source_count - 1) / (target_count - 1)) for i in range(target_count)]


def main() -> None:
    backup = VIDEO_DIR / "pre-install-china-frames.tar.gz"
    if not backup.exists():
        raise RuntimeError("Refusing to install without the pre-install frame backup")

    report: dict[str, object] = {
        "backup": str(backup.relative_to(ROOT)),
        "runtime_code_changed": False,
        "clips": {},
    }

    with tempfile.TemporaryDirectory(prefix="monk-site-install-") as temp_name:
        temp = Path(temp_name)
        for clip, config in CLIPS.items():
            video = VIDEO_DIR / str(config["video"])
            decoded = temp / clip / "decoded"
            decoded.mkdir(parents=True)
            subprocess.run(
                [
                    "ffmpeg",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-i",
                    str(video),
                    "-vsync",
                    "0",
                    str(decoded / "%03d.png"),
                ],
                check=True,
            )
            source_frames = sorted(decoded.glob("*.png"))
            if len(source_frames) != 72:
                raise RuntimeError(f"{clip}: expected 72 source frames, found {len(source_frames)}")

            target_count = int(config["frames"])
            indices = sample_indices(len(source_frames), target_count)
            staged = temp / clip / "staged"
            staged.mkdir()
            for target_number, source_index in enumerate(indices, start=1):
                with Image.open(source_frames[source_index]) as image:
                    if image.size != (1920, 1080):
                        raise RuntimeError(f"{clip}: unexpected source size {image.size}")
                    image.convert("RGB").save(
                        staged / f"frame_{target_number}.webp",
                        "WEBP",
                        quality=92,
                        method=6,
                    )

            staged_files = sorted(staged.glob("*.webp"))
            if len(staged_files) != target_count:
                raise RuntimeError(f"{clip}: staged frame count mismatch")

            installed_dirs = []
            for quality in ("md", "sm"):
                destination = FRAME_ROOT / f"{clip}-{quality}"
                existing = sorted(destination.glob("frame_*.webp"))
                if len(existing) != target_count:
                    raise RuntimeError(
                        f"{destination}: expected {target_count} existing frames, found {len(existing)}"
                    )
                for target in existing:
                    source = staged / target.name
                    replacement = destination / f".{target.name}.replacement"
                    shutil.copyfile(source, replacement)
                    replacement.replace(target)
                installed_dirs.append(
                    {
                        "directory": str(destination.relative_to(ROOT)),
                        "frames": target_count,
                        "first_frame_sha256": sha256(destination / "frame_1.webp"),
                        "last_frame_sha256": sha256(destination / f"frame_{target_count}.webp"),
                    }
                )

            report["clips"][clip] = {
                "video": str(video.relative_to(ROOT)),
                "video_sha256": sha256(video),
                "source_frames": len(source_frames),
                "installed_frames": target_count,
                "source_indices_zero_based": indices,
                "directories": installed_dirs,
            }

    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Installed all Ancient China frame sequences. Report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
