import pages from '../../../lib/pages.json';

const snapshots = pages as Record<string, string>;

/** Serve the captured document with its original locally hosted frontend runtime. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  let html = snapshots[path];
  // Articles and search results can add new public URLs beyond the captured pages.
  // Keep direct links and refreshes working without forwarding visitor identity.
  if (!html && /^\/(en|ar)\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(path)) {
    try {
      const response = await fetch(`https://uxbert.com${path}${url.search}`, {
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
        html = (await response.text())
          .replaceAll('https://www.googletagmanager.com', '/replica/analytics')
          .replaceAll('https://uxbert.com/api/contact', '/api/contact')
          .replaceAll('https://dxmdwxi6k7ogv.cloudfront.net/public/videos/portal.mp4', '/media/portal.mp4')
          .replace(/<script\b[^>]*type="application\/webmcp\+json"[^>]*>.*?<\/script>/gs, '');
      }
    } catch {
      return new Response('This public page is temporarily unavailable. Please try again.', { status: 503 });
    }
  }
  if (!html) {
    return new Response('Page not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}
