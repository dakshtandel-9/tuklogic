#!/usr/bin/env python3
"""Install secv.mp4 as the Ancient Egypt scene (desktop frame sequences and the mobile clip).

Pass a .mp4 path to use a different 1920x1080 source video (used as-is, no upscaling), or a directory of Real-ESRGAN upscaled frames (000.png-120.png, decoded from secv.mp4) to use them
instead of resizing the 720p source directly:
    realesrgan-ncnn-vulkan -i <decoded frames> -o <upscaled> -n realesrgan-x4plus
    python3 scripts/install-secv-egypt.py <upscaled>
    python3 scripts/install-secv-egypt.py output/secv-egypt/firefly.mp4
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].endswith('.mp4') else ROOT / 'secv.mp4'
DEST = ROOT / 'public/offline/frames/egypt'
MOBILE = ROOT / 'public/offline/mobile-videos/mobile_egy.mp4'
OUT = ROOT / 'output/secv-egypt'
# Source frame ranges (inclusive) for each clip, and the frame counts ScenesDesktop expects
# (inFrames:64, holdFrames:33, outFrames:34). Lights ignite at 62; hard cut back to wide at 92.
CLIPS = {'in': (0, 61, 64), 'hold': (62, 91, 33), 'out': (92, 120, 34)}
FADE_IN = 8  # the original scene enters from black
QUALITY = {'md': 92, 'sm': 78}
SIZE = (1920, 1080)
# Mobile loop: 2s portrait clip of the calm block and lights, crop centre following the camera move.
MOBILE_RANGE = (44, 91)
MOBILE_SIZE = (540, 960)
MOBILE_PAN = [(44, 0.56), (62, 0.56), (80, 0.72), (91, 0.72)]


def sample_indices(first, last, count):
    span = last - first
    return [first + round(i * span / (count - 1)) for i in range(count)]


def pan_centre(n):
    for (n0, c0), (n1, c1) in zip(MOBILE_PAN, MOBILE_PAN[1:]):
        if n <= n1:
            t = max(0.0, (n - n0) / (n1 - n0))
            return c0 + (c1 - c0) * t
    return MOBILE_PAN[-1][1]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    backup = OUT / 'pre-install-egypt.tar.gz'
    if not backup.exists():
        with tarfile.open(backup, 'w:gz') as archive:
            for clip in CLIPS:
                for size in QUALITY:
                    archive.add(DEST / f'{clip}-{size}', arcname=f'public/offline/frames/egypt/{clip}-{size}')
            archive.add(MOBILE, arcname='public/offline/mobile-videos/mobile_egy.mp4')

    with tempfile.TemporaryDirectory(prefix='secv-egypt-') as tmp:
        staging = Path(tmp)
        decoded = staging / 'decoded'
        decoded.mkdir()
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(SOURCE), '-vsync', '0',
                        '-start_number', '0', str(decoded / '%03d.png')], check=True)
        source = sorted(decoded.glob('*.png'))
        assert len(source) == 121, len(source)
        if len(sys.argv) > 1 and not sys.argv[1].endswith('.mp4'):
            source = sorted(Path(sys.argv[1]).glob('*.png'))
            assert len(source) == 121, len(source)
            print(f'Using upscaled frames from {sys.argv[1]}')

        # Desktop: stage every sequence before replacing any installed file.
        for clip, (first, last, count) in CLIPS.items():
            indices = sample_indices(first, last, count)
            for size, quality in QUALITY.items():
                (staging / f'{clip}-{size}').mkdir()

            def encode(item, clip=clip):
                number, index = item
                with Image.open(source[index]) as image:
                    frame = image.convert('RGB').resize(SIZE, Image.LANCZOS)
                if clip == 'in' and index < FADE_IN:
                    frame = Image.blend(Image.new('RGB', SIZE), frame, index / FADE_IN)
                for size, quality in QUALITY.items():
                    frame.save(staging / f'{clip}-{size}' / f'frame_{number}.webp', 'WEBP', quality=quality, method=6)

            with ThreadPoolExecutor(max_workers=6) as pool:
                list(pool.map(encode, enumerate(indices, start=1)))

        # Mobile: portrait crop, upscaled to the original clip's size, 30fps for 2s.
        mobile = staging / 'mobile'
        mobile.mkdir()
        for out_number, index in enumerate(range(MOBILE_RANGE[0], MOBILE_RANGE[1] + 1)):
            with Image.open(source[index]) as image:
                width, height = image.size
                crop_w = round(height * MOBILE_SIZE[0] / MOBILE_SIZE[1])
                left = min(max(round(pan_centre(index) * width - crop_w / 2), 0), width - crop_w)
                image.convert('RGB').crop((left, 0, left + crop_w, height)).resize(MOBILE_SIZE, Image.LANCZOS) \
                    .save(mobile / f'{out_number:03d}.png')
        mobile_mp4 = staging / 'mobile_egy.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-framerate', '24', '-i', str(mobile / '%03d.png'),
                        '-vf', 'fps=30', '-frames:v', '60', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '24',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(mobile_mp4)], check=True)

        for clip, (_, _, count) in CLIPS.items():
            for size in QUALITY:
                folder = DEST / f'{clip}-{size}'
                assert len(list(folder.glob('frame_*.webp'))) == count, folder
                for i in range(1, count + 1):
                    (staging / f'{clip}-{size}' / f'frame_{i}.webp').replace(folder / f'frame_{i}.webp')
                print(f'Installed {count} frames into {folder.relative_to(ROOT)}')
        mobile_mp4.replace(MOBILE)
        print(f'Installed {MOBILE.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
