#!/usr/bin/env python3
"""Install the edited Steve Jobs sequence (a generic phone in place of the iPod, clean-shaven) into the /test frames only.

Usage: install-test-steve.py <in+out video, 72 frames> [in+hold video, 73 frames]

The source clips are output/steve-edit-test/steve-io.mp4 and steve-ih.mp4, built from the /test frames at 24 fps.
In and out are edited as one continuous clip (padded to 3 s; the padding is dropped here), so the frame the
scene rests on matches on both sides when scrolling. The hold is edited from the in frames followed by the
source hold, and its first frames are eased onto the installed resting frame so click-and-hold starts and ends
without a jump. Without a hold video the installed hold frames are kept.
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
DEST = ROOT / 'public/offline/test-frames/steve'
BACKUP = ROOT / 'output/steve-edit-test/pre-install-test-steve-frames.tar.gz'
CLIPS = {'in': 23, 'hold': 50, 'out': 35}
QUALITY = {'md': 88, 'sm': 70}
EASE = 6  # hold frames over which the difference to the resting frame fades out
REST = CLIPS['in'] - 2  # the player only loads frames 1 to count - 2, so "in" comes to rest on this one


def decode(video: Path, count: int, folder: Path) -> list[Path]:
    folder.mkdir()
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(video), '-frames:v', str(count),
                    '-vf', 'scale=1920:1080', str(folder / 'frame_%d.png')], check=True)
    pngs = sorted(folder.glob('frame_*.png'), key=lambda path: int(path.stem.split('_')[1]))
    # The edit model can return a frame short; repeat its final frame to keep the count.
    assert count - 2 <= len(pngs) <= count, (video, len(pngs))
    return pngs + [pngs[-1]] * (count - len(pngs))


def ease_onto(rest: Path, hold: list[Path], staging: Path) -> list[Path]:
    """Add the gap between the installed resting frame and the first hold frame, fading it out.

    The source hold does not start on the resting frame (the camera and phone sit slightly elsewhere), so
    closing only the gap between the two edits would leave that jump in. Closing the gap to the first hold
    frame makes it the resting frame exactly.
    """
    with Image.open(rest) as a, Image.open(hold[0]) as b:
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
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        with tarfile.open(BACKUP, 'w:gz') as archive:
            for clip in CLIPS:
                for size in QUALITY:
                    archive.add(DEST / f'{clip}-{size}', arcname=f'{clip}-{size}')
    with tempfile.TemporaryDirectory(prefix='test-steve-') as tmp:
        staging = Path(tmp)
        frames = decode(both, CLIPS['in'] + CLIPS['out'], staging / 'both')
        sequences = {'in': frames[:CLIPS['in']], 'out': frames[CLIPS['in']:]}
        if hold:
            frames = decode(hold, CLIPS['in'] + CLIPS['hold'], staging / 'hold')
            sequences['hold'] = ease_onto(sequences['in'][REST - 1], frames[CLIPS['in']:], staging)
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
