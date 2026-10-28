#!/usr/bin/env python3
"""Install the edited Indian Golden Age sequence (the two gold-armoured warriors from the homepage) into the /test frames only.

Usage: install-test-islamic.py <in+out video, 71 frames> [hold video, 53 frames]

The source clips are output/islamic-twins-test/isl-io.mp4 and isl-hold.mp4, built from the /test frames at 24 fps.
In and out are edited as one continuous clip, so the frame the scene rests on matches on both sides when
scrolling. The hold opens with 8 frames of glitch transition that hide the jump from the resting frame; they
are kept as they are, and the hold video covers the frames after them. Without a hold video the installed
hold frames are kept.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/offline/test-frames/islamic'
BACKUP = ROOT / 'output/islamic-twins-test/pre-install-test-islamic-frames.tar.gz'
CLIPS = {'in': 37, 'hold': 61, 'out': 34}
QUALITY = {'md': 88, 'sm': 70}
GLITCH = 8  # leading hold frames that are pure glitch transition and stay untouched


def decode(video: Path, count: int, folder: Path) -> list[Path]:
    folder.mkdir()
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(video), '-frames:v', str(count),
                    '-vf', 'scale=1920:1080', str(folder / 'frame_%d.png')], check=True)
    pngs = sorted(folder.glob('frame_*.png'), key=lambda path: int(path.stem.split('_')[1]))
    # The edit model can return a frame short; repeat its final frame to keep the count.
    assert count - 2 <= len(pngs) <= count, (video, len(pngs))
    return pngs + [pngs[-1]] * (count - len(pngs))


def main():
    both = Path(sys.argv[1])
    hold = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    if not BACKUP.exists():
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        with tarfile.open(BACKUP, 'w:gz') as archive:
            for clip in CLIPS:
                for size in QUALITY:
                    archive.add(DEST / f'{clip}-{size}', arcname=f'{clip}-{size}')
    with tempfile.TemporaryDirectory(prefix='test-islamic-') as tmp:
        staging = Path(tmp)
        frames = decode(both, CLIPS['in'] + CLIPS['out'], staging / 'both')
        sequences = {'in': (1, frames[:CLIPS['in']]), 'out': (1, frames[CLIPS['in']:])}
        if hold:
            sequences['hold'] = (GLITCH + 1, decode(hold, CLIPS['hold'] - GLITCH, staging / 'hold'))
        jobs = []
        for clip, (first, pngs) in sequences.items():
            for size, quality in QUALITY.items():
                for index, png in enumerate(pngs, first):
                    jobs.append((png, DEST / f'{clip}-{size}' / f'frame_{index}.webp', quality))

        def encode(job):
            png, target, quality = job
            with Image.open(png) as image:
                image.convert('RGB').save(target, 'WEBP', quality=quality, method=6)

        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(encode, jobs))
    print('Installed', {clip: len(pngs) for clip, (_, pngs) in sequences.items()}, 'into', DEST)


if __name__ == '__main__':
    main()
