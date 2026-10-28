#!/usr/bin/env python3
"""Recover the original uxbert.com frame sequences of the middle timeline eras for the /test page.

Only the eras between Early Humans and Tuklogic are recovered, and each sequence gets exactly as many
frames as the site's own sequence in public/offline/frames has, so /test plays the same timing.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import shutil
import subprocess
import tempfile
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/offline/frames'
DEST = ROOT / 'public/offline/test-frames'
ORIGIN = 'https://uxbert.com/frames'
SCENES = ['egypt', 'china', 'greek', 'islamic', 'steve']


def fetch(url: str) -> bytes | None:
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            # A missing frame redirects to an HTML page instead of returning 404.
            if response.headers.get_content_type() != 'image/webp':
                return None
            return response.read()
    except urllib.error.HTTPError:
        return None


def recover(sequence: str) -> str:
    count = len(list((SOURCE / sequence).glob('frame_*.webp')))
    target = DEST / sequence
    target.mkdir(parents=True, exist_ok=True)
    available = 0
    for index in range(1, count + 1):
        data = fetch(f'{ORIGIN}/{sequence}/frame_{index}.webp')
        if data is None:
            break
        (target / f'frame_{index}.webp').write_bytes(data)
        available = index
    assert available, sequence
    # When the original sequence is shorter, hold its last frame so the count still matches the site.
    for index in range(available + 1, count + 1):
        shutil.copyfile(target / f'frame_{available}.webp', target / f'frame_{index}.webp')
    padded = f' (original has {available}, last frame held)' if available < count else ''
    return f'{sequence}: {count} frames{padded}'


def match_resting_frame(scene: str, bridge: int = 2):
    """Start a hold from the frame the scene rests on, which is the last frame the player draws of the "in" sequence.

    The player only loads frames 1 to count - 2, so that is where "in" stops. The recovered hold opens on a slightly
    different shot, so `bridge` motion-interpolated frames (ffmpeg minterpolate) lead from the resting frame into the
    hold's second frame; the hold keeps its frame count, dropping only its last, nearly still frames.
    """
    for folder in sorted((DEST / scene).glob('in-*')):
        quality = folder.name.split('-', 1)[1]
        hold = DEST / scene / f'hold-{quality}'
        count = len(list(hold.glob('frame_*.webp')))
        resting = folder / f'frame_{len(list(folder.glob("frame_*.webp"))) - 2}.webp'
        with tempfile.TemporaryDirectory() as work:
            work = Path(work)
            # minterpolate emits nothing for a two-frame input, so the target frame is repeated.
            Image.open(resting).convert('RGB').save(work / 'key_0.png')
            for index in range(1, 4):
                Image.open(hold / 'frame_2.webp').convert('RGB').save(work / f'key_{index}.png')
            steps = 60
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '1', '-i', str(work / 'key_%d.png'),
                            '-vf', f'minterpolate=fps={steps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none',
                            str(work / 'mid_%03d.png')], check=True)
            bridge_frames = [Image.open(work / f'mid_{round(steps * step / (bridge + 1)) + 1:03d}.png').convert('RGB')
                             for step in range(1, bridge + 1)]
        for index in range(count, bridge + 1, -1):
            shutil.copyfile(hold / f'frame_{index - bridge}.webp', hold / f'frame_{index}.webp')
        for offset, frame in enumerate(bridge_frames):
            frame.save(hold / f'frame_{offset + 2}.webp', quality=92, method=6)
        shutil.copyfile(resting, hold / 'frame_1.webp')


def main():
    sequences = [f'{scene}/{folder.name}' for scene in SCENES for folder in sorted((SOURCE / scene).iterdir()) if folder.is_dir()]
    with ThreadPoolExecutor(max_workers=8) as pool:
        for line in pool.map(recover, sequences):
            print(line)
    match_resting_frame('egypt')


if __name__ == '__main__':
    main()
