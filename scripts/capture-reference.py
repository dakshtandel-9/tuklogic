"""Capture the publicly served UXBERT frontend and its same-origin assets."""
import re, json, subprocess, concurrent.futures, pathlib, shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=pathlib.Path('/tmp/uxbert-assets')
PUBLIC=ROOT/'public'
BASE='https://uxbert.com'
seen=set(); failed=[]
def download(path):
 path=path.split('?')[0]
 target=PUBLIC/path.lstrip('/')
 target.parent.mkdir(parents=True,exist_ok=True)
 cache=CACHE/path.rsplit('/',1)[-1]
 if target.exists() and target.stat().st_size: return path
 if cache.exists() and path.startswith('/assets/'):
  shutil.copyfile(cache,target);return path
 for attempt in range(2):
  r=subprocess.run(['curl','-L','--fail','--silent','--max-time','35',BASE+path,'-o',str(target)])
  if r.returncode==0:return path
 failed.append(path)
 return None
queue=['/assets/main-B2LH-fDE.js','/assets/ui-components-krT5pv9S.js','/assets/_locale-Hn_wK68n.js','/assets/index-Ci7J7yHl.js','/assets/app-d58e8pdn.css','/assets/swiper-bundle-BH4JZYC6.css','/assets/lenis-D2oTg1Kg.css','/splash.css']
while queue:
 batch=[p for p in queue if p not in seen];seen.update(batch);queue=[]
 if not batch:break
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex: results=list(ex.map(download,batch))
 for p in results:
  if p and p.endswith(('.css','.js')):
   text=(PUBLIC/p.lstrip('/')).read_text()
   for m in re.findall(r'["\']((?:\./|/?assets/)[^"\'\s]+\.(?:js|css))["\']',text):
    q='/assets/'+m[2:] if m.startswith('./') else '/'+m.lstrip('/')
    if q not in seen:queue.append(q)
 print('Frontend files:',len(seen),'remaining:',len(queue),flush=True)
# Copy every explicitly referenced same-origin image, icon, font, or document.
assets=set()
for f in (PUBLIC/'assets').glob('*'):
 if f.suffix in ('.js','.css'):
  s=f.read_text()
  assets.update(re.findall(r'["\'(](/(?:images|icons|fonts|locales)/[^"\')\s${}]+\.(?:png|jpg|jpeg|webp|svg|avif|woff2?|ttf|json|pdf))["\')]',s))
  assets.update(re.findall(r'["\'](/(?:favicon|apple-touch-icon)[^"\']+\.png)["\']',s))
assets.add('/images/og-image.png')
print('Referenced assets:',len(assets),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex: list(ex.map(download,sorted(assets)))
(ROOT/'reference/asset-manifest.json').write_text(json.dumps({'origin':BASE,'bundles':sorted(seen),'assets':sorted(assets),'failed':failed},indent=2))
print('Capture complete; failures:',failed,flush=True)
