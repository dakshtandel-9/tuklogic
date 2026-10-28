// One set of destinations for the main website and its standalone services page.
const items = [
  { key: 'thePast', path: '', en: 'The Past', ar: 'الماضي', hard: true, exact: true },
  { key: 'thePresent', path: '/present', en: 'The Present', ar: 'الحاضر' },
  { key: 'aboutUs', path: '/about', en: 'About us', ar: 'من نحن' },
  { key: 'services', path: '/digital-services', en: 'Services', ar: 'الخدمات', hard: true },
  { key: 'caseStudies', path: '/case-studies', en: 'Case Studies', ar: 'قصص النجاح', hard: true },
  { key: 'careers', path: '/careers', en: 'Careers', ar: 'الوظائف' },
  { key: 'contactUs', path: '/contact', en: 'Contact us', ar: 'تواصل معنا' },
];

export function getSiteNavigation(locale = 'en', translate) {
  const language = locale === 'ar' ? 'ar' : 'en';
  return items.map(item => ({
    label: translate ? translate(`menu.${item.key}`) : item[language],
    href: `/${language}${item.path}`,
    hard: item.hard,
    exact: item.exact,
  }));
}
