export async function GET() {
  return new Response('/* Analytics disabled in the recreation. */', { headers: { 'Content-Type': 'application/javascript' } });
}
