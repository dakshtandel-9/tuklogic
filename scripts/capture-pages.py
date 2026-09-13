"""Save complete public page responses, including their hydration payloads."""
import re,json,pathlib,subprocess,concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]
PAGES=ROOT/'reference/pages';PAGES.mkdir(parents=True,exist_ok=True)
base=['','present','about','digital-services','case-studies','articles','careers','contact','training','clients','privacy-policy','terms-of-service']
case=['webook','riyadh-season','the-ring','koora-break','joy-awards','alinma-pay','dzrt','unification-strategy','sagp','misk','asaan','alaa-khotah','golden-pen','ewc']
services=['user-research-usability-testing','design-patterns-ui-framework','web-mobile-development','conversion-optimization','ux-and-usability-training','ai-and-data-science','ar-experience-design']
paths=['/'+lang+('/'+p if p else '') for lang in ['en','ar'] for p in base+['case-studies/'+c for c in case]+['digital-services/'+s for s in services]]
def capture(path):
 file=PAGES/(path.strip('/').replace('/','__')+'.html')
 r=subprocess.run(['curl','-L','--fail','--silent','--max-time','40','https://uxbert.com'+path,'-o',str(file)])
 return path,str(file.relative_to(ROOT)) if r.returncode==0 else None
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex: results=dict(ex.map(capture,paths))
(ROOT/'reference/page-manifest.json').write_text(json.dumps(results,indent=2))
print('Captured',sum(bool(v) for v in results.values()),'pages; failed:',[p for p,v in results.items() if not v],flush=True)
# The i18n namespaces are requested dynamically by the frontend.
names=['home','present','common','about','services','caseStudies','articles','careers','contact','courses','clients','footer','header','training','privacyPolicy','termsOfService','navigation','search','error']
# Also discover literal namespace names from the downloaded bundles.
for f in (ROOT/'public/assets').glob('*.js'):
 s=f.read_text()
 for m in re.finditer(r'loadNamespaces\((\[[^\]]+\]|"[^"]+")\)',s):
  names.extend(re.findall(r'"([\w:.-]+)"',m[1]))
paths=['/locales/'+lang+'/'+n+'.json' for lang in ['en','ar'] for n in set(names)]
paths += ['/locales/'+lang+'/services/'+s+'.json' for lang in ['en','ar'] for s in services]
def locale(p):
 dest=ROOT/'public'/p.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True)
 r=subprocess.run(['curl','-L','--fail','--silent','--max-time','20','https://uxbert.com'+p,'-o',str(dest)])
 if r.returncode and dest.exists():dest.unlink()
 return p if r.returncode==0 else None
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex: results=list(ex.map(locale,paths))
print('Captured',sum(bool(v) for v in results),'translation files',flush=True)
