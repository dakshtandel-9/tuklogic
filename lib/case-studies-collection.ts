import { caseStudies } from '../public/case-studies/catalog.js';
import { arabicCaseStudies } from './case-studies-ar';
import { escapeHtml as escape, renderInSiteDocument, type Locale } from './site-document';

import enTranslations from '../public/assets/case-studies-DXyzVGVZ.js';
import arTranslations from '../public/assets/case-studies-jzvd6-T0.js';

export type Translations = {
  meta: { title: string; description: string };
  hero: { title: string; subtitle: string };
  filters: { platform: string; category: string };
  cases?: Record<string, string>;
  platforms?: Record<string, string>;
  categories?: Record<string, string>;
};

// The captured app's own case-studies namespace, rewritten for the approved catalog.
export const translations = { en: enTranslations, ar: arTranslations } as Record<Locale, Translations>;

// Same derivations as the collection route (assets/index-OJ0S0BCm.js), so the
// server markup hydrates without changes.
const platformKey = (value: string) => value.trim().toLowerCase();
const categoryKey = (value: string) => value.trim().toLowerCase().replace(/\s+([a-z])/g, (_, char: string) => char.toUpperCase());
const unique = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

/** Loader data in the shape main-B2LH-fDE.js builds from the catalog for client-side navigation. */
const cases = caseStudies.map((project, index) => ({
  metaTitle: `${project.title} — TUKLOGIC`,
  metaDescription: project.desc,
  name: project.title,
  image: project.image,
  tags: [project.category],
  category: [project.category],
  platform: [project.format],
  index,
  link: project.slug,
}));
const platforms = unique(cases.flatMap(item => item.platform));
const categories = unique(cases.flatMap(item => item.category));

/** Arabic labels for the catalog's English categories, used as card tags. */
const arabicCategories = Object.fromEntries(caseStudies.map(project => [project.category, arabicCaseStudies[project.slug].category]));

/** Card tags are translated through home's `ui.caseStudyTags` on Arabic pages. */
export function withArabicCaseStudyTags(html: string): string {
  if (!/<html lang="ar"/.test(html)) return html;
  const entries = JSON.stringify(arabicCategories).slice(1, -1);
  return html.replace('"caseStudyTags":{', `"caseStudyTags":{${entries},`);
}

const chevron = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.5 3.5H21V3H20.5V3.5ZM20.5 20.5V21H21V20.5H20.5ZM3.5 20.5H3V21H3.5V20.5ZM3.5 3.5V3H3V3.5H3.5ZM12.5 8.50736V8.00736H11.5V8.50736H12.5ZM11.5 15.4926V15.9926H12.5V15.4926H11.5ZM15.4926 12.5H15.9926V11.5H15.4926V12.5ZM8.50736 11.5H8.00736V12.5H8.50736V11.5ZM20 3.5V20.5H21V3.5H20ZM20.5 20H3.5V21H20.5V20ZM4 20.5V3.5H3V20.5H4ZM3.5 4H20.5V3H3.5V4ZM11.5 8.50736L11.5 15.4926H12.5L12.5 8.50736H11.5ZM15.4926 11.5H8.50736V12.5H15.4926V11.5Z" fill="#C8B1D7"></path></svg>';
const optionStyle = 'style="color:#0b042a;background:#ffffff"';

function dropdown(id: string, label: string, options: { value: string; label: string }[]) {
  const choices = [{ value: 'all', label }, ...options]
    .map((option, i) => `<option value="${escape(option.value)}" ${optionStyle}${i === 0 ? ' selected=""' : ''}>${escape(option.label)}</option>`).join('');
  return `<div class="relative h-[40px] w-full sm:w-fit"><div class="relative h-[40px] w-full sm:hidden"><select id="${id}-native" class="h-[40px] w-full cursor-pointer appearance-none truncate border border-[#FFFFFF33] bg-transparent px-5 pe-12 text-start text-[14px] font-normal text-white uppercase min-w-[80px]" style="background:transparent;line-height:normal">${choices}</select><span class="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 shrink-0">${chevron}</span></div><button type="button" id="${id}" aria-haspopup="listbox" aria-expanded="false" class="relative hidden h-[40px] w-full cursor-pointer items-center justify-center gap-2 border border-[#FFFFFF33] px-5 py-2 sm:flex"><span class="sr-only"></span><span class="pointer text-[14px] font-bold min-w-[80px] w-max min-w-max leading-normal break-keep"><span class="SplitClass font-normal uppercase opacity-0">${escape(label)}</span></span><span class="shrink-0">${chevron}</span></button></div>`;
}

function card(item: (typeof cases)[number], locale: Locale, t: Translations) {
  const title = t.cases?.[item.link] ?? item.name;
  const tags = item.tags.map(tag => `<strong class="alt uppercase">${escape(locale === 'ar' ? arabicCategories[tag] ?? tag : tag)}</strong>`).join('');
  return `<a href="/${locale}/case-studies/${item.link}" class="card_set corners_set slider_col static"><div class="case_card f a-c j-c full_bg _eleX slide-left transform transition-all duration-700 " style="animation-delay:${item.index * 70}ms"><div class="corners full_bg">${'<span></span>'.repeat(8)}</div><div class="case_card_cover"><img loading="lazy" referrerPolicy="no-referrer" src="${escape(item.image)}" alt="${escape(title)}" class="transition-transform duration-300 ease-in-out full_bg load_bg cover w-full!" draggable="false" width="300" height="200"/></div><div class="card_content full_bg f f-c a-s s-b"><div class="tags_set f">${tags}</div><h3 class="normal-case!">${escape(title)}</h3></div><div class="rec_btn arrow f a-c j-c pointer"><img loading="lazy" referrerPolicy="no-referrer" src="/offline/icons/link.svg" alt="plus" class="transition-transform duration-300 ease-in-out " draggable="false" width="24" height="24"/></div></div></a>`;
}

function main(locale: Locale, t: Translations) {
  const platformOptions = platforms.map(value => ({ value, label: t.platforms?.[platformKey(value)] ?? value }));
  const categoryOptions = categories.map(value => ({ value, label: t.categories?.[categoryKey(value)] ?? value }));
  return `<main><section class="inner_padding x_padding"><div class="section_set f f-c"><div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div class="section_head"><div class="section_title f f-c _eleWrap"><h2 class="SplitClass alt pink _eleD text-[2.7vw]! uppercase sm:text-[1.3vw]! xl:text-[0.8333vw]! opacity-0">${escape(t.hero.subtitle)}</h2><h1 class="SplitClass _eleD opacity-0">${escape(t.hero.title)}</h1></div></div><div class="flex gap-4">${dropdown('Platform', t.filters.platform, platformOptions)}${dropdown('Category', t.filters.category, categoryOptions)}</div></div><div class="section_body"><div class="cols_set cards_set cases_grid f f-w _eleWrap">${cases.map(item => card(item, locale, t)).join('')}</div></div></div></section></main>`;
}

/** The collection page, served inside the site's own document. */
export async function getCaseStudiesCollection(url: URL): Promise<string | null> {
  const match = /^\/(en|ar)\/case-studies\/?$/.exec(url.pathname);
  if (!match) return null;
  const locale = match[1] as Locale;
  const t = translations[locale];
  const html = await renderInSiteDocument({
    locale,
    origin: url.origin,
    path: '/case-studies',
    title: t.meta.title,
    description: t.meta.description,
    preload: '<link rel="modulepreload" href="/assets/index-OJ0S0BCm.js"/>',
    matchId: `/${locale}/case-studies/`,
    loaderData: cases,
    namespace: ['case-studies', t],
    main: main(locale, t),
  });
  return withArabicCaseStudyTags(html);
}
