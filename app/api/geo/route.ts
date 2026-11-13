// Visitor's country (ISO 3166-1 alpha-2) from Vercel's edge, used to preselect the
// contact form's phone country. Empty when unknown (for example in local development).
export function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || '';
  return Response.json({ country }, { headers: { 'Cache-Control': 'private, no-store' } });
}
