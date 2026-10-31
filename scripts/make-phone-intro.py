"""Phone cut of the intro film: a 9:16 re-edit made of hard cuts between fixed crops of the 16:9
film, so phones (which only show a quarter of its width) see the action without any camera move.

The cut keeps the film's 207 frames / 8.625 s, so the narration (synced 1:1 to film time) plays in
full. Shots: the warrior (dark opening trimmed), the spear lightning, the torch catching fire
(torch, close flame, torch and face), then the face lit by the flame until the end. Lightning and
flame frames that run short are replayed; the flame loop plays back and forth.

  python3 scripts/make-phone-intro.py SOURCE.mp4 OUT.mp4
SOURCE is the full-quality intro (output/backups/intro-20261029-original.mp4)."""
import os, subprocess, sys, tempfile
from PIL import Image

OUT_W, OUT_H = 540, 960
src, out = sys.argv[1], sys.argv[2]


def bounce(count, low, last):
    """`count` frames that leave `last` going back toward `low` and return to end on `last`."""
    seq, span = [], last - low
    while len(seq) < count:
        depth = min(span, (count - len(seq)) // 2)
        seq += list(range(last - 1, last - depth - 1, -1)) + list(range(last - depth + 1, last + 1))
    assert len(seq) == count and seq[-1] == last, seq
    return seq


# (name, source frames, crop centre x as a fraction of the film width, crop width in film pixels,
#  crop top in film pixels). Crop height is width * 16/9; full height (720) needs width 405.
FACE = (0.56, 405, 0)
SHOTS = [
    ('warrior', list(range(66, 144)), 0.50, 405, 0),
    ('spear lightning', list(range(144, 161)) + list(range(149, 164)), 0.235, 405, 0),
    ('torch', list(range(176, 188)), 0.70, 405, 0),
    ('flame close-up', list(range(188, 200)), 0.72, 306, 0),
    ('torch and face', list(range(192, 204)), 0.62, 405, 0),
    ('face and flame', list(range(192, 204)) + bounce(46, 192, 203), *FACE),
    ('glitch', [204, 205, 206], *FACE),
]
order = [(frame, crop) for _, frames, *crop in SHOTS for frame in frames]
assert len(order) == 207, len(order)

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(['ffmpeg', '-v', 'error', '-i', src, f'{tmp}/s%03d.png'], check=True)
    for n, (frame, (cx, cw, top)) in enumerate(order):
        film = Image.open(f'{tmp}/s{frame + 1:03d}.png').convert('RGB')
        ch = min(round(cw * 16 / 9), film.height - top)
        left = min(max(round(cx * film.width - cw / 2), 0), film.width - cw)
        film.crop((left, top, left + cw, top + ch)).resize((OUT_W, OUT_H), Image.LANCZOS).save(f'{tmp}/o{n:03d}.png')
    common = ['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{tmp}/o%03d.png', '-c:v', 'libx264', '-preset', 'slow',
              '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-b:v', '800k', '-g', '48', '-an', '-passlogfile', f'{tmp}/pass']
    subprocess.run(common + ['-pass', '1', '-f', 'mp4', os.devnull], check=True)
    subprocess.run(common + ['-pass', '2', '-movflags', '+faststart', out], check=True)

start = 0
for name, frames, *_ in SHOTS:
    print(f'{name:16} film {start / 24:5.2f}-{(start + len(frames)) / 24:5.2f} s  ({len(frames)} frames)')
    start += len(frames)
