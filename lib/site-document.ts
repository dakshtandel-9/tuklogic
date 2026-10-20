import { pageLoaders } from './page-loaders';

export type Locale = 'en' | 'ar';

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[char]!);
// Safe inline JSON for <script> blocks, matching the app's own serializer.
export const inlineJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

type SiteDocument = {
  locale: Locale;
  origin: string;
  /** Route path without the locale, e.g. `/case-studies/smart-retail`. */
  path: string;
  title: string;
  description: string;
  /** Absolute social preview image; the site default is kept when omitted. */
  image?: string;
  ogType?: 'website' | 'article';
  /** Modulepreload links for the route's chunk ('' when it lives in the main bundle). */
  preload: string;
  stylesheets?: string[];
  /** Router match id and its dehydrated loader data. */
  matchId: string;
  loaderData: unknown;
  /** i18n namespace the route reads, served next to the shared `home` namespace. */
  namespace: [string, unknown];
  main: string;
};

/**
 * Pages authored here use the site's own captured document — header, menu,
 * footer and runtime — with the route's markup, router state and translations.
 */
export async function renderInSiteDocument(doc: SiteDocument): Promise<string> {
  const { locale, origin, path } = doc;
  let html = await pageLoaders[`/${locale}/about`]();
  const head = html.indexOf('</head>');

  // Head: this route's title, description, URLs, preview and route chunk.
  let headHtml = html.slice(0, head)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(doc.title)}</title>`)
    .replace(/(<meta (?:name|property)="(?:twitter:|og:)?title" content=")[^"]*/g, `$1${escapeHtml(doc.title)}`)
    .replace(/(<meta (?:name|property)="(?:twitter:|og:)?description" content=")[^"]*/g, `$1${escapeHtml(doc.description)}`)
    .replace(/https:\/\/uxbert\.com\/(en|ar)\/about\//g, (_, lang) => `${origin}/${lang}${path}`)
    .replace('<link rel="modulepreload" href="/assets/about-CZJChM-C.js"/><link rel="modulepreload" href="/assets/index-TXdbGZo3.js"/>', doc.preload)
    .replace('<meta property="og:type" content="website"/>', `<meta property="og:type" content="${doc.ogType ?? 'website'}"/>`);
  if (doc.image) {
    headHtml = headHtml.replace(/(<meta (?:name|property)="(?:twitter|og):image" content=")[^"]*/g, `$1${escapeHtml(doc.image)}`);
  }
  headHtml += (doc.stylesheets ?? []).map(href => `<link rel="stylesheet" href="${href}"/>`).join('');
  html = headHtml + html.slice(head);

  // Header: active menu item and language switch.
  html = html
    .replace(/ class="interactive_label group f a-c active" href="(\/(?:en|ar)\/about)" data-status="active" aria-current="page"/g, ' href="$1" class="interactive_label group f a-c"')
    .replace(/ href="(\/(?:en|ar)\/case-studies)" class="interactive_label group f a-c"/g, ' class="interactive_label group f a-c active" href="$1" data-status="active" aria-current="page"')
    .replace(/(<a href=")\/(en|ar)\/about\/?(" class="rec_btn lang)/, `$1/$2${path}$3`);

  // Router state: this route with its loader data.
  html = html.replace(/matches:\$R\[67\]=\[[\s\S]*?dehydratedData:void 0\}\)/, whole => {
    const updated = /u:(\d+)/.exec(whole)![1];
    return `matches:$R[67]=[$R[68]={i:"__root_",u:${updated},s:"success",ssr:!0},$R[69]={i:"/${locale}",u:${updated},s:"success",ssr:!0},$R[70]={i:"${doc.matchId}",u:${updated},s:"success",l:${inlineJson(doc.loaderData)},ssr:!0}],lastMatchId:"${doc.matchId}",dehydratedData:void 0})`;
  });

  // Translations: keep the shared `home` namespace, swap `about` for the route's own.
  html = html.replace(/window\.__I18N__=(\{[\s\S]*?\})(?=<\/script>)/, (_, json: string) => {
    const resources = JSON.parse(json);
    resources[locale] = { home: resources[locale].home, [doc.namespace[0]]: doc.namespace[1] };
    return `window.__I18N__=${inlineJson(resources)}`;
  });

  // Main content streamed into the page body.
  const start = html.indexOf('<div hidden id="S:1">');
  const end = html.indexOf('<script>$RC("B:1","S:1")</script>');
  return `${html.slice(0, start)}<div hidden id="S:1">${doc.main}</div>${html.slice(end)}`;
}
