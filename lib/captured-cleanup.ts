/**
 * The captured Present page still holds the former agency's project showcase (WBK, SAGP, Alinma,
 * Joy Awards, ...). It showed until the app replaced it with TUKLOGIC's projects, so slow devices
 * flashed the old site. Drop those sections; the app renders the current projects in their place.
 */
export function withoutCapturedProjects(html: string): string {
  if (!html.includes('id="works-art-section"')) return html;
  return html.replace(
    /(<div class="relative top-0 left-0 z-\[500\] flex w-full flex-col items-center justify-center">)(?:<section class="relative flex h-screen w-full items-center justify-center"[^>]*>[\s\S]*?<\/section>)+/,
    '$1',
  ).replace(
    // The list of the same projects beside the showcase.
    /(?:<button draggable="false" aria-label="[^"]*" class="pointer-events-auto"><h3 [^>]*class="list-works-items[^"]*"[^>]*>[^<]*<\/h3><\/button>)+/g,
    '',
  ).replace(
    // Its case-study slider (the app shows TUKLOGIC's case studies there).
    /<div class="swiper-slide"><a href="\/(?:en|ar)\/case-studies\/[^"]*" class="card_set[^"]*">[\s\S]*?<\/a><\/div>/g,
    '',
  );
}

/**
 * The English About hero label was renamed from "About us" to "Our Story" after capture. Match the
 * app's text, or hydration fails (React error #418) and the page is re-rendered in the browser.
 */
export function withAboutHeroLabel(html: string): string {
  return html.replace(
    /(<div class="hero_content f f-c a-c j-c _eleWrap"><strong class="SplitClass alt _eleD !text-sm uppercase sm:!text-base opacity-0">)About us(<\/strong>)/,
    '$1Our Story$2',
  );
}

/**
 * The About page links to https://www.tuklogic.com/services (a 404) and /case-studies on another
 * host. Point them at this site's own pages so they work on any domain (e.g. tuklogic.vercel.app).
 * Matches the app's links in public/assets/about-CZJChM-C.js.
 */
export function withLocalAboutLinks(html: string, locale: string): string {
  const lang = locale === 'ar' ? 'ar' : 'en';
  return html
    .replace(/href="https:\/\/www\.tuklogic\.com\/services"/g, `href="/${lang}/digital-services"`)
    .replace(/href="https:\/\/www\.tuklogic\.com\/case-studies"/g, `href="/${lang}/case-studies"`);
}
