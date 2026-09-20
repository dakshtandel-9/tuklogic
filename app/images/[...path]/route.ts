/** Resolve legacy image paths to the downloaded local media tree. */
export async function GET(request: Request) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/images/') || path.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  return Response.redirect(new URL(`/offline${path}`, request.url), 302);
}
