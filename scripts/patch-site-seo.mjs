// The captured frontend is compiled JS. Keep its small SEO integration repeatable
// when refreshing snapshots, without changing its components or interactions.
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../public/assets/main-B2LH-fDE.js', import.meta.url);
let source = readFileSync(file, 'utf8');
if (!source.includes('installSeoRouteHeads as tukInstallSeo')) {
  const replace = (from, to) => {
    if (!source.includes(from)) throw new Error(`SEO patch target missing: ${from.slice(0, 80)}`);
    source = source.replace(from, to);
  };
  source = 'import {installSeoRouteHeads as tukInstallSeo,getSiteStructuredData as tukSchema,imageAlt as tukImageAlt,socialImage as tukSocialImage} from "/site-seo.js";\n' + source;
  replace('const Mt="https://tuklogic.com"', 'const Mt=window.__SITE_SEO_ORIGIN__||window.location.origin');
  replace('function N_(){return r1(', 'function N_(){tukInstallSeo(b_,Mt);return r1(');
  replace('function U1(s){return s==="ar"?V1:H1}', 'function U1(){return ""}');
  replace('function I1(s){return Pf[s]||Pf.en}', 'function I1(s){return tukImageAlt[s]||tukImageAlt.en}');
  const start = source.indexOf('t.jsx("script",{type:"application/ld+json",children:JSON.stringify({"@context":"https://schema.org/","@type":"WebSite"');
  const endMarker = 't.jsx(X1,{locale:o,siteUrl:Mt}),';
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('Captured structured-data block missing');
  source = source.slice(0, start) + 't.jsx("script",{type:"application/ld+json",children:JSON.stringify(tukSchema(Mt,o))}),' + source.slice(end + endMarker.length);
  for (const tag of [
    't.jsx("link",{rel:"alternate",type:"text/markdown",href:`${Mt}/llms.txt`,title:"LLM-friendly site index"}),',
    't.jsx("link",{rel:"describedby",type:"application/openapi+yaml",href:`${Mt}/openapi.yaml`,title:"OpenAPI 3.1 specification"}),',
    't.jsx("link",{rel:"agent-card",type:"application/json",href:`${Mt}/.well-known/agent-card.json`,title:"A2A agent card"}),',
    't.jsx("meta",{name:"keywords",content:z}),',
  ]) replace(tag, '');
  source = source.replaceAll('AWARD WINNING UX/UI DESIGN & DEVELOPMENT AGENCY IN SAUDI ARABIA, UAE & UK.', 'IT services and staffing solutions, including software development, AI, cloud, and enterprise platforms.');
  source = source.replaceAll('`${Mt}/images/og-image.png`', '`${Mt}${tukSocialImage}`');
  source = source.replaceAll('name:"twitter:site",content:"@tuklogic"', 'name:"application-name",content:"TUKLOGIC"');
  source = source.replaceAll('{property:"og:image:width",content:"1200"}', '{property:"og:image:width",content:"1080"}');
  source = source.replaceAll('{property:"og:image:height",content:"630"}', '{property:"og:image:height",content:"560"}');
  writeFileSync(file, source);
}
