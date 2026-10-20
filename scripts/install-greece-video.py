#!/usr/bin/env python3
"""Install a 1920x1080 source video as the Ancient Greece scene (desktop frame sequences and the mobile clip)."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'output/greece-new.mp4'
DEST = ROOT / 'public/offline/frames/greek'
MOBILE = ROOT / 'public/offline/mobile-videos/mobile_greek.mp4'
OUT = ROOT / 'output/greece-video'
# Inclusive source ranges and the frame counts ScenesDesktop expects (inFrames:37, holdFrames:47, outFrames:36).
CLIPS = {'in': (0, 36, 37), 'hold': (37, 83, 47), 'out': (84, 112, 36)}
QUALITY = {'md': 92, 'sm': 78}
SIZE = (1920, 1080)
MOBILE_RANGE = (68, 112)
MOBILE_SIZE = (540, 960)
MOBILE_CENTRE = 0.56


def sample_indices(first, last, count):
    return [first + round(i * (last - first) / (count - 1)) for i in range(count)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    backup = OUT / 'pre-install-greek.tar.gz'
    if not backup.exists():
        with tarfile.open(backup, 'w:gz') as archive:
            for clip in CLIPS:
                for size in QUALITY:
                    archive.add(DEST / f'{clip}-{size}', arcname=f'public/offline/frames/greek/{clip}-{size}')
            archive.add(MOBILE, arcname='public/offline/mobile-videos/mobile_greek.mp4')
    with tempfile.TemporaryDirectory(prefix='greece-') as tmp:
        staging = Path(tmp)
        decoded = staging / 'decoded'
        decoded.mkdir()
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(SOURCE), '-vsync', '0',
                        '-start_number', '0', str(decoded / '%03d.png')], check=True)
        source = sorted(decoded.glob('*.png'))
        assert len(source) == 113, len(source)
        for clip, (first, last, count) in CLIPS.items():
            for size in QUALITY:
                (staging / f'{clip}-{size}').mkdir()

            def encode(item, clip=clip):
                number, index = item
                with Image.open(source[index]) as image:
                    frame = image.convert('RGB')
                    if frame.size != SIZE:
                        frame = frame.resize(SIZE, Image.LANCZOS)
                for size, quality in QUALITY.items():
                    frame.save(staging / f'{clip}-{size}' / f'frame_{number}.webp', 'WEBP', quality=quality, method=6)

            with ThreadPoolExecutor(max_workers=6) as pool:
                list(pool.map(encode, enumerate(sample_indices(first, last, count), start=1)))

        mobile = staging / 'mobile'
        mobile.mkdir()
        for n, index in enumerate(range(MOBILE_RANGE[0], MOBILE_RANGE[1] + 1)):
            with Image.open(source[index]) as image:
                width, height = image.size
                crop_w = round(height * MOBILE_SIZE[0] / MOBILE_SIZE[1])
                left = min(max(round(MOBILE_CENTRE * width - crop_w / 2), 0), width - crop_w)
                image.convert('RGB').crop((left, 0, left + crop_w, height)).resize(MOBILE_SIZE, Image.LANCZOS) \
                    .save(mobile / f'{n:03d}.png')
        mobile_mp4 = staging / 'mobile_greek.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-framerate', '24', '-i', str(mobile / '%03d.png'),
                        '-vf', 'fps=30', '-frames:v', '45', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '22',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(mobile_mp4)], check=True)

        for clip, (_, _, count) in CLIPS.items():
            for size in QUALITY:
                folder = DEST / f'{clip}-{size}'
                assert len(list(folder.glob('frame_*.webp'))) <= count, folder
                for i in range(1, count + 1):
                    (staging / f'{clip}-{size}' / f'frame_{i}.webp').replace(folder / f'frame_{i}.webp')
                print(f'Installed {count} frames into {folder.relative_to(ROOT)}')
        mobile_mp4.replace(MOBILE)
        print(f'Installed {MOBILE.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
