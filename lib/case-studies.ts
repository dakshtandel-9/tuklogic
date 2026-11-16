import { caseStudies } from '../public/case-studies/catalog.js';

type Locale = 'en' | 'ar';
type CaseStudy = (typeof caseStudies)[number];
type DocumentResult = { html: string; status: number } | { redirect: string };

// Retired project URLs deliberately lead to the approved collection, never to an unrelated project.
const retired = new Set(['webook', 'riyadh-season', 'the-ring', 'koora-break', 'joy-awards', 'alinma-pay', 'dzrt', 'unification-strategy', 'sagp', 'misk', 'asaan', 'alaa-khotah', 'golden-pen', 'ewc']);

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg>';
const text = (locale: Locale, en: string, ar: string) => locale === 'ar' ? ar : en;
const projectUrl = (locale: Locale, slug = '') => `/${locale}/case-studies${slug ? `/${slug}` : ''}`;
const logo = '<span class="tuklogic-header-logo" role="img" aria-label="TUKLOGIC"><span class="tuklogic-symbol" aria-hidden="true"></span><span class="tuklogic-wordmark" aria-hidden="true"></span></span>';

function header(locale: Locale, slug?: string) {
  const links = [
    [`/${locale}/present`, text(locale, 'Home', 'الرئيسية')],
    [projectUrl(locale), text(locale, 'Case studies', 'دراسات الحالة')],
  ];
  const nav = links.map(([href, label]) => `<a href="${href}"${href === projectUrl(locale) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<a class="skip-link" href="#main-content">${text(locale, 'Skip to content', 'انتقل إلى المحتوى')}</a>
  <header class="site-header header_set"><div class="header-inner wrap">
    <a class="main_logo" href="/${locale}/present" aria-label="TUKLOGIC — ${text(locale, 'Home', 'الرئيسية')}">${logo}</a>
    <nav class="desktop-nav" aria-label="${text(locale, 'Main navigation', 'القائمة الرئيسية')}">${nav}</nav>
    <div class="header-actions"><a class="language-link" lang="${locale === 'en' ? 'ar' : 'en'}" href="${projectUrl(locale === 'en' ? 'ar' : 'en', slug)}" aria-label="${text(locale, 'Switch to Arabic', 'Switch to English')}">${locale === 'en' ? 'عربي' : 'EN'}</a>
    <a class="contact-link" href="/${locale}/contact">${text(locale, 'Let’s talk', 'لنتحدث')}${arrow}</a>
    <details class="mobile-menu"><summary aria-label="${text(locale, 'Navigation menu', 'قائمة التنقل')}"><span></span><span></span></summary><nav aria-label="${text(locale, 'Mobile navigation', 'قائمة الجوال')}">${nav}<a href="/${locale}/contact">${text(locale, 'Contact', 'تواصل معنا')}</a></nav></details></div>
  </div></header>`;
}

function footer(locale: Locale) {
  return `<section class="contact-section wrap" aria-labelledby="contact-title"><div><p class="eyebrow">${text(locale, 'YOUR NEXT CHAPTER', 'خطوتك القادمة')}</p><h2 id="contact-title">${text(locale, 'Have a challenge<br>in mind?', 'هل لديك تحدٍّ<br>تريد حله؟')}</h2></div><a class="contact-circle" href="/${locale}/contact"><span>${text(locale, 'Let’s build<br>what’s next.', 'لنبنِ معاً<br>ما هو قادم.')}</span>${arrow}</a></section>
  <footer class="site-footer wrap"><a class="footer-wordmark" href="/${locale}/present">TUKLOGIC<span>®</span></a><p>${text(locale, 'Ideas. Intelligence. Impact.', 'أفكار. ذكاء. أثر.')}</p><nav aria-label="${text(locale, 'Footer', 'روابط التذييل')}"><a href="/${locale}/privacy-policy">${text(locale, 'Privacy', 'الخصوصية')}</a><a href="/${locale}/terms-of-service">${text(locale, 'Terms', 'الشروط')}</a></nav><small>© ${new Date().getUTCFullYear()} TUKLOGIC</small></footer>`;
}

function shell(locale: Locale, origin: string, title: string, description: string, body: string, project?: CaseStudy, notFound = false) {
  const path = projectUrl(locale, project?.slug);
  const image = `${origin}${project?.image ?? caseStudies[0].image}`;
  return `<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101015"><title>${escape(title)}</title><meta name="description" content="${escape(description)}">${notFound ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${escape(origin + path)}"><link rel="alternate" hreflang="en" href="${escape(origin + projectUrl('en', project?.slug))}"><link rel="alternate" hreflang="ar" href="${escape(origin + projectUrl('ar', project?.slug))}">`}<meta property="og:type" content="${project ? 'article' : 'website'}"><meta property="og:site_name" content="TUKLOGIC"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:image" content="${escape(image)}"><meta property="og:url" content="${escape(origin + path)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/case-studies/favicon.svg" type="image/svg+xml"><link rel="preload" href="/offline/fonts/LDI2apCSOBg7S-QT7pa8FsOs.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/case-studies/styles.css"><script src="/case-studies/interactions.js" defer></script></head><body class="case-study-site ${project ? 'project-page' : 'collection-page'}"${project ? ` style="--accent:${project.accent};--project-color:${project.color}"` : ''}>${header(locale, project?.slug)}${body}${footer(locale)}</body></html>`;
}

export function getCaseStudyDocument(url: URL): DocumentResult | null {
  const match = /^\/(en|ar)\/case-studies(?:\/([^/]+))?\/?$/.exec(url.pathname);
  if (!match) return null;
  const locale = match[1] as Locale;
  const slug = match[2];
  // The collection itself is served from the site's document (case-studies-collection.ts).
  if (!slug) return null;
  if (retired.has(slug)) return { redirect: projectUrl(locale) };
  // Project pages are served from the site's document (case-study-detail.ts).
  if (caseStudies.some(item => item.slug === slug)) return null;
  const body = `<main class="not-found wrap" id="main-content"><p class="eyebrow">404 / ${text(locale, 'PROJECT NOT FOUND', 'المشروع غير موجود')}</p><h1>${text(locale, 'A different<br>direction.', 'مسار<br>مختلف.')}</h1><p>${text(locale, 'This case study isn’t part of our current collection. Explore the projects we’re working on.', 'دراسة الحالة هذه ليست ضمن مجموعتنا الحالية. استكشف مشاريعنا المتاحة.')}</p><a class="button" href="${projectUrl(locale)}">${text(locale, 'Explore case studies', 'استكشف دراسات الحالة')}${arrow}</a></main>`;
  return { html: shell(locale, url.origin, 'Project not found — TUKLOGIC', '', body, undefined, true), status: 404 };
}
