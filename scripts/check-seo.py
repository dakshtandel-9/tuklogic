"""Check crawler responses, metadata and unchanged snapshot markup on a running site."""
import json
import os
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('SEO_TEST_ORIGIN', 'http://localhost:3100')
CANONICAL = os.environ.get('SITE_URL', 'https://tuklogic.vercel.app').rstrip('/')


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.feed(html)

    def attrs(self, tag, key, value):
        return [attrs for name, attrs in self.tags if name == tag and attrs.get(key) == value]

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def read(path, status=200, agent='Googlebot'):
    try:
        response = urlopen(Request(BASE + path, headers={'User-Agent': agent}), timeout=30)
    except HTTPError as error:
        response = error
    assert response.status == status, (path, response.status)
    return response, response.read().decode()


_, sitemap = read('/sitemap.xml')
tree = ElementTree.fromstring(sitemap)
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml'}
paths = []
titles = set()
snapshots = 0
locations = {entry.find('s:loc', ns).text for entry in tree.findall('s:url', ns)}
for entry in tree.findall('s:url', ns):
    loc = entry.find('s:loc', ns).text
    assert loc.startswith(CANONICAL + '/'), loc
    path = loc[len(CANONICAL):]
    paths.append(path)
    assert {link.attrib['hreflang'] for link in entry.findall('x:link', ns)} == {'en', 'ar', 'x-default'}
    _, html = read(path)
    doc = Document(html)
    title = re.search(r'<title>(.*?)</title>', html).group(1)
    assert title not in titles, (path, 'Duplicate page title')
    titles.add(title)
    head = html.split('</head>')[0]
    assert not re.search(r'UX/UI|UX Design|UI Design|وكالة|award.winning|user research', head, re.I), path
    assert len(re.findall(r'<title>', head)) == 1
    assert doc.attrs('link', 'rel', 'canonical') == [{'rel': 'canonical', 'href': loc}]
    alternates = doc.attrs('link', 'rel', 'alternate')
    assert len(alternates) == 3, (path, alternates)
    for link in alternates:
        assert link['href'] in locations, (path, link)
    values = {}
    for key in ['description', 'og:title', 'og:description', 'og:image', 'og:url', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:card']:
        tags = doc.attrs('meta', 'property' if key.startswith('og:') else 'name', key)
        assert len(tags) == 1, (path, key, tags)
        values[key] = tags[0]['content']
        assert values[key], (path, key)
    assert values['og:title'] == values['twitter:title']
    assert values['description'] == values['og:description'] == values['twitter:description']
    assert values['og:url'] == loc
    assert values['og:image'] == values['twitter:image']
    assert values['og:image'].startswith(CANONICAL + '/')
    assert values['twitter:card'] == 'summary_large_image'
    assert doc.attrs('html', 'lang', path.split('/')[1]), path
    schema = re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html)
    assert len(schema) == 1, (path, len(schema))
    graph = json.loads(schema[0])['@graph']
    assert {item['@type'] for item in graph} == {'Organization', 'WebSite'}
    assert 'founder' not in schema[0] and 'LocalBusiness' not in schema[0]
    snapshot = ROOT / 'lib/offline-pages' / (path.strip('/').replace('/', '__') + '.json')
    if snapshot.exists():
        original = json.loads(snapshot.read_text())
        # Existing header branding replaces the captured loader logo before SEO runs.
        # Ignore that known substitution; page copy, classes and images must match.
        normalize = lambda value: re.sub(r'(<div\b[^>]*id="loader"[^>]*>)<svg\b[\s\S]*?</svg>', r'\1', value)
        main = re.search(r'<main\b[\s\S]*?</main>', original)
        if main:
            current = re.search(r'<main\b[\s\S]*?</main>', html)
            assert current and normalize(main.group()) == normalize(current.group()), (path, 'Visible main content changed')
            snapshots += 1

assert len(paths) == len(set(paths)) == 38, len(paths)
assert all(not re.search(r'webook|training|articles|digital-services/', path) for path in paths)
_, robots = read('/robots.txt')
assert f'Sitemap: {CANONICAL}/sitemap.xml' in robots and 'Disallow: /\n' not in robots
for image in ['/social/tuklogic.png', '/social/tuklogic-logo.png']:
    with urlopen(BASE + image) as asset:
        assert asset.status == 200 and asset.headers['Content-Type'].startswith('image/')
for locale in ['en', 'ar']:
    _, missing = read(f'/{locale}/case-studies/not-a-project', 404)
    assert 'noindex' in missing and 'rel="canonical"' not in missing
    response, _ = read(f'/{locale}/not-a-page', 404)
    assert response.headers['X-Robots-Tag'] == 'noindex'
    _, section = read(f'/{locale}/digital-services/about?utm_source=test')
    assert f'rel="canonical" href="{CANONICAL}/{locale}/digital-services"' in section
_, google = read('/en?utm_source=test')
_, whatsapp = read('/en?utm_source=test', agent='WhatsApp/2.24')
assert google == whatsapp
assert 'TUKLOGIC | IT Services &amp; Staffing Solutions' in whatsapp
print(f'Passed SEO checks for {len(paths)} pages, both languages, social images, robots, 404s and crawler previews; {snapshots} snapshot main sections unchanged.')
