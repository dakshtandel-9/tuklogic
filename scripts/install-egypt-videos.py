#!/usr/bin/env python3
"""Install the approved Ancient Egypt clips (grey-haired workers and oxen) as the scene's frame sequences."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/offline/frames/egypt'
OUT = ROOT / 'output/egypt-video'
CLIPS = {'in': 64, 'hold': 33, 'out': 34}
QUALITY = {'md': 88, 'sm': 70}
VARIANT = sys.argv[1] if len(sys.argv) > 1 else 'anchor'


def main():
    backup = OUT / 'pre-install-egypt-frames.tar.gz'
    if not backup.exists():
        with tarfile.open(backup, 'w:gz') as archive:
            for clip in CLIPS:
                for size in QUALITY:
                    archive.add(DEST / f'{clip}-{size}', arcname=f'public/offline/frames/egypt/{clip}-{size}')
    with tempfile.TemporaryDirectory(prefix='egypt-install-') as tmp:
        staging = Path(tmp)
        # Decode and encode every sequence before replacing any installed file.
        for clip, count in CLIPS.items():
            frames = staging / clip
            frames.mkdir()
            subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(OUT / f'{clip}-{VARIANT}-review.mp4'),
                            '-frames:v', str(count), str(frames / 'frame_%d.png')], check=True)
            pngs = sorted(frames.glob('frame_*.png'))
            assert len(pngs) == count, (clip, len(pngs))
            for size, quality in QUALITY.items():
                target = staging / f'{clip}-{size}'
                target.mkdir()

                def encode(png, target=target, quality=quality):
                    with Image.open(png) as image:
                        assert image.size == (1920, 1080)
                        image.convert('RGB').save(target / png.with_suffix('.webp').name, 'WEBP', quality=quality, method=6)

                with ThreadPoolExecutor(max_workers=6) as pool:
                    list(pool.map(encode, pngs))
        for clip, count in CLIPS.items():
            for size in QUALITY:
                folder = DEST / f'{clip}-{size}'
                for i in range(1, count + 1):
                    (staging / f'{clip}-{size}' / f'frame_{i}.webp').replace(folder / f'frame_{i}.webp')
                print(f'Installed {count} frames into {folder.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
