/** Resolve original media that is hosted on UXBERT's public CDN. */
export async function GET(request: Request) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/images/') || path.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  return Response.redirect(`https://dxmdwxi6k7ogv.cloudfront.net/public${path}`, 302);
}
