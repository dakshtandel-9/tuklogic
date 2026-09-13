import services from '../../../reference/api/services.json';

const readOnlyFunctions = new Set([
  'src_server-functions_posts_ts--fetchPosts_createServerFn_handler',
  'src_server-functions_posts_ts--fetchPostBySlug_createServerFn_handler',
  'src_server-functions_posts_ts--fetchAllCategories_createServerFn_handler',
  'src_server-functions_posts_ts--fetchAllTags_createServerFn_handler',
  'src_server-functions_getCareersData_ts--getCareersData_createServerFn_handler',
  'src_server-functions_getCareersData_ts--searchJobs_createServerFn_handler',
  'src_server-functions_getCareersData_ts--getNextPage_createServerFn_handler',
]);

/** Read only public content; never forward visitor cookies, credentials, or form data. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop() ?? '';
  if (id === 'src_server-functions_services_ts--getServices_createServerFn_handler') {
    return Response.json(services);
  }
  if (!readOnlyFunctions.has(id)) return Response.json({ error: 'Not found' }, { status: 404 });
  try {
    const upstream = await fetch(`https://uxbert.com/_serverFn/${id}${url.search}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return Response.json({ error: 'Public content is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST() {
  return Response.json({ error: 'This website recreation is not connected to a message delivery service.' }, { status: 501 });
}
