#!/usr/bin/env python3
"""Install the edited Ancient Egypt sequence (one bull, jungle-haired lever men) into the /test frames only.

Usage: install-test-egypt.py <in+out video, 98 frames> [in+hold video, 97 frames]

In and out are edited as one continuous clip (the source's last in frame and first out frame are the
same shot), so the frame the scene rests on matches on both sides when scrolling. The hold is edited
from the finished in frames followed by the source hold, and its first frames are eased onto the
installed last in frame so click-and-hold starts and ends without a jump. Without a hold video the
installed hold frames are kept.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/offline/test-frames/egypt'
BACKUP = ROOT / 'output/egypt-test-animal/pre-install-test-egypt-frames.tar.gz'
CLIPS = {'in': 64, 'hold': 33, 'out': 34}
QUALITY = {'md': 88, 'sm': 70}
EASE = 6  # hold frames over which the difference to the last in frame fades out


def decode(video: Path, count: int, folder: Path) -> list[Path]:
    folder.mkdir()
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(video), '-frames:v', str(count),
                    '-vf', 'scale=1920:1080', str(folder / 'frame_%d.png')], check=True)
    pngs = sorted(folder.glob('frame_*.png'), key=lambda path: int(path.stem.split('_')[1]))
    # The edit model can return a frame short; repeat its final (faded-out) frame to keep the count.
    assert count - 2 <= len(pngs) <= count, (video, len(pngs))
    return pngs + [pngs[-1]] * (count - len(pngs))


def ease_onto(rest: Path, edited_rest: Path, hold: list[Path], staging: Path) -> list[Path]:
    """Add the gap between the installed and the hold edit's version of the resting frame, fading it out."""
    with Image.open(rest) as a, Image.open(edited_rest) as b:
        gap = np.asarray(a.convert('RGB'), np.float32) - np.asarray(b.convert('RGB'), np.float32)
    eased = []
    for index, png in enumerate(hold):
        weight = max(0.0, 1 - index / EASE)
        if weight == 0:
            eased.append(png)
            continue
        with Image.open(png) as image:
            pixels = np.asarray(image.convert('RGB'), np.float32) + gap * weight
        target = staging / f'eased_{index + 1}.png'
        Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8)).save(target)
        eased.append(target)
    return eased


def main():
    both = Path(sys.argv[1])
    hold = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    if not BACKUP.exists():
        with tarfile.open(BACKUP, 'w:gz') as archive:
            for clip in CLIPS:
                for size in QUALITY:
                    archive.add(DEST / f'{clip}-{size}', arcname=f'{clip}-{size}')
    with tempfile.TemporaryDirectory(prefix='test-egypt-') as tmp:
        staging = Path(tmp)
        frames = decode(both, CLIPS['in'] + CLIPS['out'], staging / 'both')
        sequences = {'in': frames[:CLIPS['in']], 'out': frames[CLIPS['in']:]}
        if hold:
            frames = decode(hold, CLIPS['in'] + CLIPS['hold'], staging / 'hold')
            sequences['hold'] = ease_onto(sequences['in'][-1], frames[CLIPS['in'] - 1], frames[CLIPS['in']:], staging)
        jobs = []
        for clip, pngs in sequences.items():
            for size, quality in QUALITY.items():
                for index, png in enumerate(pngs, 1):
                    jobs.append((png, DEST / f'{clip}-{size}' / f'frame_{index}.webp', quality))

        def encode(job):
            png, target, quality = job
            with Image.open(png) as image:
                image.convert('RGB').save(target, 'WEBP', quality=quality, method=6)

        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(encode, jobs))
    print('Installed', {clip: len(pngs) for clip, pngs in sequences.items()}, 'into', DEST)


if __name__ == '__main__':
    main()
