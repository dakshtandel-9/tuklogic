export async function POST() {
  return Response.json({ error: 'This website recreation is not connected to a message delivery service.' }, { status: 501 });
}
