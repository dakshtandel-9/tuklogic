"""Package the captured frontend, retaining visual behavior and disabling tracking."""
import json,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
# These edits are deliberately small so the original visual implementation is preserved.
def prepare(s):
 s=s.replace('https://www.googletagmanager.com','/replica/analytics')
 s=s.replace('https://uxbert.com/api/contact','/api/contact')
 s=s.replace('https://dxmdwxi6k7ogv.cloudfront.net/public/videos/portal.mp4','/media/portal.mp4')
 return s
pages={}
for f in (ROOT/'reference/pages').glob('*.html'):
 path='/'+f.stem.replace('__','/')
 html=prepare(f.read_text())
 # Remove third-party agent integrations; keep the rendered user interface intact.
 html=re.sub(r'<script\b[^>]*type="application/webmcp\+json"[^>]*>.*?</script>','',html,flags=re.S)
 pages[path]=html
(ROOT/'lib/pages.json').write_text(json.dumps(pages,separators=(',',':')))
for f in (ROOT/'public/assets').glob('*.js'):
 s=f.read_text();new=prepare(s)
 if new!=s:f.write_text(new)
print('Prepared',len(pages),'routes')
