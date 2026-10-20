#!/usr/bin/env python3
"""Install approved twins clips in the existing interactive section."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/offline/frames/islamic'
OUT = ROOT / 'output/twins-video-revision'
CLIPS = {
    'in': ('output/twins-video-generated/in-twins-review.mp4', 37),
    'hold': ('output/twins-video-revision/hold-revised-review.mp4', 61),
    'out': ('output/twins-video-revision/out-revised-final.mp4', 34),
}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def encode_frame(path):
    with Image.open(path) as image:
        image.convert('RGB').save(path.with_suffix('.webp'), 'WEBP', quality=92, method=6)

def main():
    expected = {}
    for clip, (_, count) in CLIPS.items():
        for size in ['md', 'sm']:
            folder = DEST / f'{clip}-{size}'
            files = [folder / f'frame_{i}.webp' for i in range(1,count+1)]
            assert len(list(folder.glob('frame_*.webp'))) == count
            assert all(p.is_file() for p in files)
            expected[folder.name] = files
    backup = OUT / 'pre-install-islamic-frames.tar.gz'
    if not backup.exists():
        with tarfile.open(backup, 'w:gz') as archive:
            for files in expected.values():
                for path in files:
                    archive.add(path, arcname=str(path.relative_to(ROOT)))
    with tarfile.open(backup) as archive:
        assert len(archive.getmembers()) == 264

    report = {'backup': str(backup.relative_to(ROOT)), 'runtime_code_changed': False, 'clips': {}}
    with tempfile.TemporaryDirectory(prefix='twins-install-') as tmp:
        staging = Path(tmp)
        # Validate and encode every sequence before replacing any installed file.
        for clip, (relative, count) in CLIPS.items():
            video = ROOT / relative
            probe = json.loads(subprocess.check_output([
                'ffprobe','-v','error','-select_streams','v:0','-show_entries',
                'stream=nb_frames,r_frame_rate,width,height','-of','json',str(video)
            ]))['streams'][0]
            assert int(probe['nb_frames']) == count and probe['r_frame_rate'] == '24/1'
            frame_dir = staging / clip
            frame_dir.mkdir()
            subprocess.run([
                'ffmpeg','-hide_banner','-loglevel','error','-nostdin','-i',str(video),
                '-vf','scale=1920:1080:flags=lanczos','-frames:v',str(count),
                str(frame_dir / 'frame_%d.png')
            ],check=True)
            with ThreadPoolExecutor(max_workers=6) as pool:
                list(pool.map(encode_frame, frame_dir.glob('frame_*.png')))
            assert len(list(frame_dir.glob('frame_*.webp'))) == count
            for path in frame_dir.glob('frame_*.webp'):
                with Image.open(path) as image:
                    assert image.size == (1920,1080)
                    image.verify()
            report['clips'][clip] = {'video': relative, 'video_sha256': digest(video),
                'frame_count': count, 'source_resolution': [probe['width'],probe['height']],
                'installed_resolution': [1920,1080], 'frame_hashes': {}}

        for folder, files in expected.items():
            clip = folder.split('-')[0]
            for target in files:
                source = staging / clip / target.name
                replacement = target.with_name('.' + target.name + '.replacement')
                shutil.copyfile(source, replacement)
                replacement.replace(target)
                assert digest(target) == digest(source)
                report['clips'][clip]['frame_hashes'][str(target.relative_to(ROOT))] = digest(target)
    (OUT / 'site-installation.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Installed 264 frames: in 37, hold 61, out 34, for both md and sm. Backup verified.')

if __name__ == '__main__':
    main()
