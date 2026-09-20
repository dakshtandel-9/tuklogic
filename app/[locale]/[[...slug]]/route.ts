import { pageLoaders } from '../../../lib/page-loaders';

/** Serve the captured document with its original locally hosted frontend runtime. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  const html = await pageLoaders[path]?.();
  if (!html) {
    return new Response('Page not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Copied modules may only load resources from this local site.
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
    },
  });
}
