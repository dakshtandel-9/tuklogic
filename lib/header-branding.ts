import { loaderLogo, splashLogo } from './tuklogic-logo';

// Runs before the app: weak or touch devices, data saving and reduced motion get the
// lighter homepage (960x540 frames, no blur on the narration, no smooth-wheel easing).
const liteModeScript = `<script>(()=>{try{const n=navigator,c=n.connection||{},m=s=>matchMedia(s).matches,lite=!!(c.saveData||/2g|3g/.test(c.effectiveType||"")||n.deviceMemory&&n.deviceMemory<=4||n.hardwareConcurrency&&n.hardwareConcurrency<=4||m("(pointer: coarse)")&&!m("(any-pointer: fine)")||m("(prefers-reduced-motion: reduce)"));window.__TUK_LITE=lite;lite&&document.documentElement.classList.add("tuk-lite")}catch{}})()</script>`;

/** Keep captured header markup consistent with the hydrated header component. */
export function applyHeaderBranding(html: string): string {
  const footerAt = html.indexOf('<footer');
  if (footerAt !== -1) {
    const link = (email: string) =>
      `<a href="mailto:${email}" class="_underline subFont block w-full text-start text-base" dir="ltr">${email}</a>`;
    html =
      html.slice(0, footerAt) +
      html.slice(footerAt).replace(link('info@tuklogic.com'), link('info@tuklogic.com') + link('sales@tuklogic.com'));
  }
  return html.replace(
    /(<a\b[^>]*class="main_logo intElements\b[^>]*>)<img\b[^>]*\/?>/g,
    '$1<span class="tuklogic-header-logo" role="img" aria-label="TUKLOGIC"><span class="tuklogic-symbol" aria-hidden="true"></span><span class="tuklogic-wordmark" aria-hidden="true"></span></span>',
  ).replace(
    /(<footer\b[\s\S]*?<a\b[^>]*class="main_logo\b[^>]*>)<img\b[^>]*\/?>/,
    '$1<span class="tuklogic-header-logo" role="img" aria-label="TUKLOGIC"><span class="tuklogic-symbol" aria-hidden="true"></span><span class="tuklogic-wordmark" aria-hidden="true"></span></span>',
  ).replace(
    /(<div id="splash"[^>]*><div>)<svg\b[\s\S]*?<\/svg>/,
    `$1${splashLogo}`,
  ).replace(
    /(<div\b[^>]*id="loader"[^>]*>)<svg\b[\s\S]*?<\/svg>/g,
    `$1${loaderLogo}`,
  ).replace('</head>', `${liteModeScript}<link rel="stylesheet" href="/header-branding.css"/><link rel="stylesheet" href="/case-studies/homepage.css"/><link rel="stylesheet" href="/contact-redesign.css"/><script defer src="/services-link.js"></script></head>`);
}
