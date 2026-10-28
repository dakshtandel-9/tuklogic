#!/usr/bin/env python3
"""Make phone-only loops from the installed, approved desktop character frames.

Run after replacing the desktop artwork, then upload the new clips with
scripts/upload-media.sh. Use a new VERSION when changing an installed clip.
The original mobile videos and all desktop assets remain untouched.
"""

from pathlib import Path
import hashlib
import json
import subprocess
import tempfile

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
VERSION = '20261029'
SIZE = (720, 1280)
BACKGROUND = '#090225'
# Inclusive hold-frame range, source crop width and horizontal centre.
# Wider windows retain the monk's wheel, warrior's shield and both twins.
# Omit entry glitches, hard camera cuts and the Steve Jobs screen reveal.
SCENES = {
    'egypt': (1, 22, 1000, 1400),
    'china': (1, 20, 1000, 880),
    'greek': (1, 47, 1100, 1000),
    'islamic': (9, 61, 1400, 1020),
    'steve': (1, 18, 1000, 720),
}


def portrait(source, crop_width, centre):
    with Image.open(source) as original:
        image = original.convert('RGB')
    width, height = image.size
    left = max(0, min(width - crop_width, centre - crop_width // 2))
    image = image.crop((left, 0, left + crop_width, height))
    image = image.resize((SIZE[0], round(height * SIZE[0] / crop_width)), Image.Resampling.LANCZOS)
    # Blend the landscape frame into the existing page background, leaving
    # breathing room above and below instead of cropping heads and hands.
    mask = Image.new('L', image.size, 255)
    draw = ImageDraw.Draw(mask)
    feather = 90
    for row in range(feather):
        alpha = round(255 * row / feather)
        draw.line((0, row, image.width, row), fill=alpha)
        draw.line((0, image.height - 1 - row, image.width, image.height - 1 - row), fill=alpha)
    frame = Image.new('RGB', SIZE, BACKGROUND)
    frame.paste(image, (0, (SIZE[1] - image.height) // 2), mask)
    return frame


def main():
    destination = ROOT / 'public/offline/mobile-videos'
    report_dir = ROOT / 'output/mobile-homepage'
    report_dir.mkdir(parents=True, exist_ok=True)
    reports = {}
    with tempfile.TemporaryDirectory(prefix='mobile-characters-') as temporary:
        staging = Path(temporary)
        for scene, (first, last, crop_width, centre) in SCENES.items():
            source_dir = ROOT / f'public/offline/frames/{scene}/hold-md'
            indices = list(range(first, last + 1))
            # Reverse the interior frames for a continuous loop with no jump
            # or duplicated endpoint. A slower cadence keeps gestures gentle.
            indices += indices[-2:0:-1]
            frames = staging / scene
            frames.mkdir()
            for number, index in enumerate(indices):
                portrait(source_dir / f'frame_{index}.webp', crop_width, centre).save(frames / f'{number:03d}.png')
            filename = f'{scene}-characters-{VERSION}.mp4'
            output = staging / filename
            subprocess.run([
                'ffmpeg', '-v', 'error', '-nostdin', '-framerate', '16',
                '-i', str(frames / '%03d.png'), '-vf', 'fps=30',
                '-c:v', 'libx264', '-profile:v', 'main', '-level:v', '3.1',
                '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                '-an', str(output),
            ], check=True)
            probe = json.loads(subprocess.check_output([
                'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(output),
            ]))
            stream = probe['streams'][0]
            assert len(probe['streams']) == 1 and stream['codec_name'] == 'h264'
            assert (stream['width'], stream['height']) == SIZE
            assert stream['pix_fmt'] == 'yuv420p'
            reports[scene] = {
                'source': str(source_dir.relative_to(ROOT)), 'frames': [first, last],
                'crop_width': crop_width, 'crop_centre': centre,
                'output': f'public/offline/mobile-videos/{filename}',
                'bytes': output.stat().st_size,
                'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
                'duration': probe['format']['duration'],
            }
        # Validate every clip before publishing any replacements.
        destination.mkdir(parents=True, exist_ok=True)
        for report in reports.values():
            filename = Path(report['output']).name
            (staging / filename).replace(destination / filename)
            print(f"Prepared {filename}: {report['bytes']:,} bytes")
    (report_dir / 'media-manifest.json').write_text(json.dumps(reports, indent=2) + '\n')


if __name__ == '__main__':
    main()
