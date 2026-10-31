"""Phone copy of the intro film: the 50 black opening frames (2.08 s) are cut and the closing
face-and-flame shot runs 50 frames longer (flame frames 186-203 played back and forth), so the
film keeps its 207 frames / 8.625 s and the narration still plays complete and in sync.
Phones only see a quarter of the width; the camera keyframes in IntroScene follow this timing.

  python3 scripts/make-phone-intro.py SOURCE.mp4 OUT.mp4
SOURCE is the full-quality intro (output/backups/intro-20261029-original.mp4)."""
import os, subprocess, sys, tempfile

TRIM, LOW, LAST, GLITCH = 50, 186, 203, 204   # LAST = final frame before the glitch transition
src, out = sys.argv[1], sys.argv[2]

def bounce(count):
    """`count` frames that leave LAST going back toward LOW and return to end on LAST:
    full sweeps down to LOW and up again, then one shorter sweep for what is left."""
    seq, span = [], LAST - LOW
    while len(seq) < count:
        depth = min(span, (count - len(seq)) // 2)
        seq += list(range(LAST - 1, LAST - depth - 1, -1)) + list(range(LAST - depth + 1, LAST + 1))
    assert len(seq) == count and seq[-1] == LAST, seq
    return seq

order = list(range(TRIM, GLITCH)) + bounce(TRIM) + list(range(GLITCH, 207))
assert len(order) == 207
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(['ffmpeg', '-v', 'error', '-i', src, f'{tmp}/s%03d.png'], check=True)
    for n, i in enumerate(order):
        os.link(f'{tmp}/s{i + 1:03d}.png', f'{tmp}/o{n:03d}.png')
    common = ['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{tmp}/o%03d.png', '-c:v', 'libx264', '-preset', 'slow',
              '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-b:v', '700k', '-g', '48', '-an', '-passlogfile', f'{tmp}/pass']
    subprocess.run(common + ['-pass', '1', '-f', 'mp4', os.devnull], check=True)
    subprocess.run(common + ['-pass', '2', '-movflags', '+faststart', out], check=True)
print('frames from source:', order[:3], '...', order[150:160], '...', order[-55:])
