import { getPageSeo, getSiteStructuredData, imageAlt, socialImage } from '../public/site-seo.js';
import { escapeHtml, inlineJson, type Locale } from './site-document';

// The current public deployment is the default. Set SITE_URL when attaching a custom domain.
export function getSiteOrigin(): string {
  const url = new URL(process.env.SITE_URL || 'https://tuklogic.vercel.app');
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SITE_URL must be an HTTP(S) URL');
  return url.origin;
}

const attributes = (tag: string) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(match => [match[1].toLowerCase(), match[3]]),
);
const decode = (value: string) => value.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|quot|apos|lt|gt));/gi, (entity, decimal, hex, named) =>
  decimal ? String.fromCodePoint(Number(decimal)) : hex ? String.fromCodePoint(parseInt(hex, 16)) :
    ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' } as Record<string, string>)[named.toLowerCase()] ?? entity,
);
const meta = (key: string, value: string) => `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}"/>`;

/** Replace only SEO tags, serialized metadata and JSON-LD; preserve visible markup. */
export function applySiteSeo(html: string, url: URL, status = 200): string {
  const origin = getSiteOrigin();
  const locale: Locale = url.pathname.startsWith('/ar') ? 'ar' : 'en';
  const rawPath = url.pathname.replace(/\/$/, '');
  // Client-only sections are alternate views of the services document.
  const path = rawPath.replace(/(\/(?:en|ar)\/digital-services)\/.*/, '$1');
  const copy = getPageSeo(path);
  const headEnd = html.indexOf('</head>');
  let head = html.slice(0, headEnd);
  const existing = (key: string) => {
    const tag = [...head.matchAll(/<meta\b[^>]*>/gi)].find(match => {
      const attrs = attributes(match[0]);
      return (attrs.name || attrs.property) === key;
    });
    return tag ? attributes(tag[0]).content : '';
  };
  const title = copy?.title ?? decode(/<title>([\s\S]*?)<\/title>/.exec(head)?.[1] ?? 'TUKLOGIC');
  const description = copy?.description ?? decode(existing('description'));
  const project = /\/(?:en|ar)\/case-studies\/[^/]+$/.test(path) && status === 200;
  const image = project ? new URL(existing('og:image') || socialImage, origin).pathname : socialImage;
  const alt = project ? title : imageAlt[locale];
  head = head.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<meta\b[^>]*>/gi, tag => {
    const attrs = attributes(tag);
    const key = attrs.name || attrs.property || '';
    return /^(?:description|keywords|robots|twitter:.*|og:.*|article:.*)$/.test(key) ? '' : tag;
  }).replace(/<link\b[^>]*>/gi, tag => {
    const attrs = attributes(tag);
    return attrs.rel === 'canonical' || (attrs.rel === 'alternate' && (attrs.hreflang || attrs.type === 'text/markdown')) || ['describedby', 'agent-card'].includes(attrs.rel) ? '' : tag;
  });
  head += `<title>${escapeHtml(title)}</title>` + meta('description', description);
  head += meta('robots', status >= 400 ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  if (status < 400) {
    head += `<link rel="canonical" href="${origin}${path}"/>`;
    for (const lang of ['en', 'ar', 'x-default']) {
      head += `<link rel="alternate" hreflang="${lang}" href="${origin}${path.replace(/^\/(en|ar)/, `/${lang === 'x-default' ? 'en' : lang}`)}"/>`;
    }
  }
  for (const [key, value] of Object.entries({
    'og:type': project ? 'article' : 'website', 'og:site_name': 'TUKLOGIC', 'og:title': title,
    'og:description': description, 'og:url': origin + path, 'og:locale': locale === 'ar' ? 'ar_SA' : 'en_US',
    'og:locale:alternate': locale === 'ar' ? 'en_US' : 'ar_SA', 'og:image': origin + image,
    'og:image:alt': alt, ...(project ? {} : { 'og:image:width': '1080', 'og:image:height': '560', 'og:image:type': 'image/png' }),
    'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description,
    'twitter:url': origin + path, 'twitter:image': origin + image, 'twitter:image:alt': alt,
  })) head += meta(key, value);
  head += `<script>window.__SITE_SEO_ORIGIN__=${inlineJson(origin)}</script>`;
  let result = (head + html.slice(headEnd)).replace(/(<html\b[^>]*\blang=")[^"]*/, `$1${locale}`);
  // Captured schema contains the former agency's founder, locations and FAQ.
  result = result.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace('</head>', `<script id="site-structured-data" type="application/ld+json">${inlineJson(getSiteStructuredData(origin, locale))}</script></head>`);
  // Only the namespace's meta object changes; all rendered translations are preserved.
  result = result.replace(/window\.__I18N__=(\{[\s\S]*?\})(?=<\/script>)/, (_, json: string) => {
    const resources = JSON.parse(json);
    for (const lang of ['en', 'ar']) for (const [namespace, data] of Object.entries(resources[lang] ?? {})) {
      const pageCopy = getPageSeo(`/${lang}${namespace === 'home' ? '' : `/${namespace === 'services' ? 'digital-services' : namespace}`}`);
      if (pageCopy && data && typeof data === 'object' && 'meta' in data) {
        (data as { meta: unknown }).meta = { title: pageCopy.title, description: pageCopy.description };
      }
    }
    return `window.__I18N__=${inlineJson(resources)}`;
  });
  return result;
}
