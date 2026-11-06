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
