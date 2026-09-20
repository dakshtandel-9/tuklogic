import services from '../../../reference/api/services.json';

import content from '../../../reference/api/offline-content.json';

type Post = {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  categories?: number[];
  tags?: number[];
};

const snapshot = content as unknown as {
  en: { data: Post[] };
  ar: { data: Post[] };
  categories: unknown[];
  tags: unknown[];
  careers: { jobs: { total: number; results: unknown[] }; filters: unknown };
};

/** Search and pagination operate on saved public content, without upstream calls. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop() ?? '';
  if (id === 'src_server-functions_services_ts--getServices_createServerFn_handler') {
    return Response.json(services);
  }
  let data: { locale?: string; slug?: string; query?: Record<string, unknown> } = {};
  try {
    data = JSON.parse(url.searchParams.get('payload') || '{}').data || {};
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const respond = (result: unknown) => Response.json({ result, context: {} });
  const prefix = 'src_server-functions_posts_ts--';
  const suffix = '_createServerFn_handler';
  if (id === `${prefix}fetchAllCategories${suffix}`) return respond(snapshot.categories);
  if (id === `${prefix}fetchAllTags${suffix}`) return respond(snapshot.tags);
  const posts = snapshot[data.locale === 'ar' ? 'ar' : 'en'].data;
  if (id === `${prefix}fetchPostBySlug${suffix}`) {
    return respond(posts.find(post => post.slug === data.slug) ?? null);
  }
  if (id === `${prefix}fetchPosts${suffix}`) {
    const query = data.query || {};
    const ids = (value: unknown) => String(value ?? '').split(',').filter(Boolean).map(Number);
    const categories = ids(query.categories);
    const tags = ids(query.tags);
    const excluded = ids(query.exclude);
    const term = String(query.search || '').toLocaleLowerCase();
    const filtered = posts.filter(post =>
      !excluded.includes(post.id) &&
      (!categories.length || post.categories?.some(id => categories.includes(id))) &&
      (!tags.length || post.tags?.some(id => tags.includes(id))) &&
      (!term || `${post.title.rendered} ${post.content.rendered}`.toLocaleLowerCase().includes(term)));
    const perPage = Math.max(1, Math.min(100, Number(query.per_page) || 6));
    const page = Math.max(1, Number(query.page) || 1);
    return respond({ data: filtered.slice((page - 1) * perPage, page * perPage),
      headers: { total: filtered.length, totalPages: Math.ceil(filtered.length / perPage) } });
  }
  const careers = 'src_server-functions_getCareersData_ts--';
  if (id === `${careers}getCareersData${suffix}`) return respond(snapshot.careers);
  if (id === `${careers}searchJobs${suffix}` || id === `${careers}getNextPage${suffix}`) {
    return respond(snapshot.careers.jobs);
  }
  return Response.json({ error: 'Not found in the local snapshot' }, { status: 404 });
}

export async function POST() {
  return Response.json({ error: 'This website recreation is not connected to a message delivery service.' }, { status: 501 });
}
