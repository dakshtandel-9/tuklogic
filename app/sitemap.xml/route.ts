import { pageLoaders } from '../../lib/page-loaders';
import { caseStudies } from '../../public/case-studies/catalog.js';
import { getSiteOrigin } from '../../lib/seo';

export function GET() {
  const origin = getSiteOrigin();
  const paths = new Set(Object.keys(pageLoaders));
  for (const locale of ['en', 'ar']) {
    paths.add(`/${locale}/digital-services`);
    paths.add(`/${locale}/case-studies`);
    for (const project of caseStudies) paths.add(`/${locale}/case-studies/${project.slug}`);
  }
  const entries = [...paths].sort().map(path => {
    const relative = path.replace(/^\/(en|ar)/, '');
    const alternates = ['en', 'ar', 'x-default'].map(lang =>
      `<xhtml:link rel="alternate" hreflang="${lang}" href="${origin}/${lang === 'x-default' ? 'en' : lang}${relative}"/>`,
    ).join('');
    return `<url><loc>${origin}${path}</loc>${alternates}</url>`;
  });
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
