import { getSiteOrigin } from '../../lib/seo';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_serverFn/\nDisallow: /replica/\n\nSitemap: ${getSiteOrigin()}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
