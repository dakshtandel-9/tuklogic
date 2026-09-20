"""Download the captured site's media once; subsequent runs reuse local files."""
import concurrent.futures
import hashlib
import html
import json
from pathlib import Path
import re
import ssl
import shutil
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
CDN = 'https://dxmdwxi6k7ogv.cloudfront.net/public'
MANIFEST = ROOT / 'reference/local-assets.json'
EXT = r'(?:webp|png|jpe?g|gif|svg|ico|mp4|webm|mp3|wav|woff2?|ttf|otf|pdf|zip)'
try:
    import certifi
    urllib.request.install_opener(urllib.request.build_opener(
        urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile=certifi.where()))))
except ImportError:
    pass


def discover():
    files = list((PUBLIC / 'assets').glob('*')) + list((PUBLIC / 'locales').rglob('*.json'))
    files += [ROOT / 'lib/pages.json']
    files += list((ROOT / 'reference/api').glob('*.json'))
    texts = [p.read_text() for p in files]
    # Decode the HTML snapshots before scanning their attributes.
    texts += list(json.loads((ROOT / 'lib/pages.json').read_text()).values())
    urls = {}
    for text in texts:
        text = html.unescape(text.replace('\\/', '/').replace('\\"', '"'))
        for path in re.findall(r'/(?:images|icons|videos|mobile-videos|scenes|audio|fonts|client-logos|templates-images)/[^\r\n\t"\x27`<>\\{}]*?\.' + EXT, text):
            if '$' not in path:
                urls[CDN + path] = '/offline' + path
        for url in re.findall(r'https?://[^\s"\x27`<>\\{}]+?\.' + EXT + r'(?:\?[^\s"\x27`<>\\{}]*)?', text):
            if url.startswith(CDN + '/'):
                urls[url] = '/offline' + url[len(CDN):].split('?')[0]
            elif urllib.parse.urlsplit(url).hostname in {'uxbert.com', 'fonts.gstatic.com'}:
                suffix = Path(urllib.parse.urlsplit(url).path).suffix
                urls[url] = '/offline/external/' + hashlib.sha256(url.encode()).hexdigest()[:20] + suffix
    desktop = (PUBLIC / 'assets/ScenesDesktop-cNbGhPlf.js').read_text()
    for scene, body in re.findall(r'sceneName:"(\w+)"(.*?)(?:\}\},|\}\})', desktop):
        for kind, count in re.findall(r'(in|out|hold)Frames:(\d+)', body):
            kind = 'scroll' if scene == 'disney' and kind == 'hold' else kind
            for quality in ('sm', 'md'):
                # The original FramesPlayer loads frames 1 through totalFrames-2.
                for frame in range(1, int(count) - 1):
                    path = f'/frames/{scene}/{kind}-{quality}/frame_{frame}.webp'
                    urls[CDN + path] = '/offline' + path
    for directory, count in [('eh/throw-sm',120), ('eh/throw-md',120), ('eh/loop-sm',61), ('eh/loop-md',61), ('mobile/disney/disney-scroll-md',110), ('mobile/uxbert/uxbert-md',23)]:
        for frame in range(1, count + 1):
            path = f'/frames/{directory}/frame_{frame}.webp'
            urls[CDN + path] = '/offline' + path
    for lang in ('', '/ar'):
        for name in ('intro', 'egypt', 'eh', 'greek', 'china', 'industrial', 'islamic', 'disney', 'uxbert', 'steve'):
            path = f'/audio{lang}/{name}.mp3'
            urls[CDN + path] = '/offline' + path
    return urls, texts


def download(item):
    url, local = item
    target = PUBLIC / local.lstrip('/')
    if target.is_file() and target.stat().st_size:
        return url, local, None
    target.parent.mkdir(parents=True, exist_ok=True)
    if url.startswith(CDN + '/'):
        existing = PUBLIC / urllib.parse.urlsplit(url[len(CDN):]).path.lstrip('/')
        if existing.is_file() and existing.stat().st_size:
            shutil.copyfile(existing, target)
            return url, local, None
    last_error = ''
    for attempt in range(3):
        try:
            parts = urllib.parse.urlsplit(url)
            encoded_url = urllib.parse.urlunsplit(parts._replace(path=urllib.parse.quote(urllib.parse.unquote(parts.path), safe='/@:+')))
            request = urllib.request.Request(encoded_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read()
                if 'text/html' in response.headers.get('Content-Type', ''):
                    raise ValueError('Expected an asset, received HTML')
            temporary = target.with_name(target.name + '.part')
            temporary.write_bytes(data)
            temporary.replace(target)
            return url, local, None
        except Exception as error:
            last_error = str(error)
            if getattr(error, 'code', None) in (403, 404):
                break
            time.sleep(attempt + 1)
    if url.startswith(CDN + '/templates-images/'):
        _, _, fallback_error = download((url.replace(CDN, 'https://uxbert.com', 1), local))
        if not fallback_error:
            return url, local, None
    return url, local, last_error


def main():
    urls, texts = discover()
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    urls.update(previous.get('assets', {}))
    # Google Fonts returns a stylesheet with stable font-file URLs.
    fonts = set()
    for text in texts:
        fonts.update(html.unescape(u) for u in re.findall(r'https://fonts.googleapis.com/[^"\x27<>\\`\s]+', text))
    for url in sorted(fonts):
        if url.endswith(')'):
            url = url[:-1]
        local = '/offline/fonts/' + hashlib.sha256(url.encode()).hexdigest()[:20] + '.css'
        target = PUBLIC / local.lstrip('/')
        if not target.exists():
            try:
                request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                css = urllib.request.urlopen(request, timeout=30).read().decode()
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(css)
            except Exception as error:
                print('Font stylesheet unavailable:', url, str(error), flush=True)
                continue
        for font in re.findall(r'https://fonts.gstatic.com/[^)\s]+', target.read_text()):
            urls[font] = '/offline/fonts/' + Path(urllib.parse.urlsplit(font).path).name
        urls[url] = local
    print(f'Downloading/checking {len(urls)} assets', flush=True)
    successes, failures = {}, {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        for index, (url, local, error) in enumerate(pool.map(download, urls.items()), 1):
            (failures if error else successes)[url] = error or local
            if index % 100 == 0:
                print(f'{index}/{len(urls)} checked; {len(failures)} unavailable', flush=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps({'assets': successes, 'unavailable': failures}, indent=2))
    for target in (PUBLIC / 'offline/fonts').glob('*.css'):
        css = target.read_text()
        for url, local in successes.items():
            if url.startswith('https://fonts.gstatic.com/'):
                css = css.replace(url, local)
        target.write_text(css)
    print(f'Saved {len(successes)} assets; {len(failures)} unavailable. See {MANIFEST}', flush=True)


if __name__ == '__main__':
    main()
