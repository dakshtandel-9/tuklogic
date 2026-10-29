// Shared by the server document handler and captured frontend's route heads.
// SEO copy only: the visible page content and translations stay unchanged.
export const seoPages = {
  en: {
    home: ['TUKLOGIC | IT Services & Staffing Solutions', 'IT services and staffing solutions for your business. TUKLOGIC delivers software development, AI, cloud, enterprise platforms, and IT and non-IT talent.'],
    present: ['IT Solutions, AI & Enterprise Services | TUKLOGIC', 'Explore TUKLOGIC’s software development, AI, cloud, IoT, enterprise platforms, and staffing solutions built around your business goals.'],
    about: ['About TUKLOGIC | Technology & Talent Solutions', 'Meet TUKLOGIC, your IT services and staffing partner for ServiceNow, Workday, Oracle, Salesforce, AI, IoT, and skilled technology and business talent.'],
    'digital-services': ['IT Services, AI, Cloud & Staffing | TUKLOGIC', 'Explore TUKLOGIC’s development, AI, IoT, cloud, CRM, ServiceNow, ERP, software testing, digital marketing, and IT and non-IT staffing services.'],
    clients: ['Our Clients & Industries | TUKLOGIC', 'Discover how TUKLOGIC supports businesses across healthcare, finance, retail, and technology with IT services, enterprise platforms, and skilled talent.'],
    careers: ['Careers in Technology | TUKLOGIC', 'Explore careers at TUKLOGIC in software development, AI, cloud, DevOps, and enterprise solutions. Learn about our team and check current opportunities.'],
    contact: ['Contact TUKLOGIC | IT Services & Staffing Enquiries', 'Contact TUKLOGIC to discuss software development, AI, cloud, enterprise platforms, or IT and non-IT staffing for your business.'],
    'case-studies': ['Technology & Staffing Case Studies | TUKLOGIC', 'Explore TUKLOGIC projects in software development, AI, NLP, IoT, enterprise platforms, digital marketing, and staffing.'],
    'privacy-policy': ['Privacy Policy | TUKLOGIC', 'Read TUKLOGIC’s Privacy Policy to understand how personal information is collected, used, stored, and protected when you use our website and services.'],
    'terms-of-service': ['Terms of Service | TUKLOGIC', 'Read the terms governing use of TUKLOGIC’s website and services, including user responsibilities, permitted use, and service agreements.'],
  },
  ar: {
    home: ['TUKLOGIC | خدمات تقنية المعلومات وحلول التوظيف', 'خدمات تقنية المعلومات وحلول التوظيف لأعمالك. تقدم TUKLOGIC تطوير البرمجيات والذكاء الاصطناعي والحوسبة السحابية ومنصات الأعمال والكفاءات التقنية وغير التقنية.'],
    present: ['حلول تقنية المعلومات والذكاء الاصطناعي | TUKLOGIC', 'استكشف حلول TUKLOGIC في تطوير البرمجيات والذكاء الاصطناعي والحوسبة السحابية وإنترنت الأشياء ومنصات الأعمال والتوظيف وفق أهداف أعمالك.'],
    about: ['عن TUKLOGIC | حلول التقنية والكفاءات', 'تعرّف على TUKLOGIC، شريكك في خدمات تقنية المعلومات والتوظيف وحلول ServiceNow وWorkday وOracle وSalesforce والذكاء الاصطناعي وإنترنت الأشياء.'],
    'digital-services': ['خدمات تقنية المعلومات والحوسبة السحابية والتوظيف | TUKLOGIC', 'استكشف خدمات TUKLOGIC في التطوير والذكاء الاصطناعي وإنترنت الأشياء والحوسبة السحابية ومنصات الأعمال واختبار البرمجيات والتسويق والتوظيف.'],
    clients: ['عملاؤنا والقطاعات التي نخدمها | TUKLOGIC', 'تعرّف على دعم TUKLOGIC للشركات في قطاعات الرعاية الصحية والتمويل والتجزئة والتقنية من خلال خدمات تقنية المعلومات ومنصات الأعمال والكفاءات المتخصصة.'],
    careers: ['فرص العمل في التقنية | TUKLOGIC', 'استكشف العمل في TUKLOGIC في مجالات تطوير البرمجيات والذكاء الاصطناعي والحوسبة السحابية وDevOps وحلول الأعمال. تعرّف على فريقنا والفرص المتاحة.'],
    contact: ['تواصل مع TUKLOGIC | استفسارات التقنية والتوظيف', 'تواصل مع TUKLOGIC لمناقشة احتياجات أعمالك في تطوير البرمجيات والذكاء الاصطناعي والحوسبة السحابية ومنصات الأعمال والتوظيف التقني وغير التقني.'],
    'case-studies': ['دراسات حالة في التقنية والتوظيف | TUKLOGIC', 'استكشف مشاريع TUKLOGIC في تطوير البرمجيات والذكاء الاصطناعي ومعالجة اللغة الطبيعية وإنترنت الأشياء ومنصات الأعمال والتسويق والتوظيف.'],
    'privacy-policy': ['سياسة الخصوصية | TUKLOGIC', 'اقرأ سياسة خصوصية TUKLOGIC لمعرفة كيفية جمع المعلومات الشخصية واستخدامها وتخزينها وحمايتها عند استخدام موقعنا وخدماتنا.'],
    'terms-of-service': ['شروط الخدمة | TUKLOGIC', 'اطلع على شروط استخدام موقع TUKLOGIC وخدماتها، بما في ذلك مسؤوليات المستخدم والاستخدام المسموح واتفاقيات الخدمات.'],
  },
};

export const socialImage = '/social/tuklogic.png';
export const imageAlt = {
  en: 'TUKLOGIC — IT Services & Staffing Solutions',
  ar: 'TUKLOGIC — خدمات تقنية المعلومات وحلول التوظيف',
};

export function getPageSeo(pathname) {
  const match = /^\/(en|ar)(?:\/(.*?))?\/?$/.exec(pathname);
  if (!match) return null;
  const locale = match[1];
  const page = (match[2] || 'home').replace(/\/$/, '');
  const key = page.startsWith('digital-services/') ? 'digital-services' : page;
  const copy = seoPages[locale][key];
  return copy ? { locale, title: copy[0], description: copy[1] } : null;
}

export function getSiteStructuredData(origin, locale = 'en') {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'TUKLOGIC', url: `${origin}/`,
        description: seoPages[locale].home[1], logo: `${origin}/social/tuklogic-logo.png`,
        image: `${origin}${socialImage}`, email: 'info@tuklogic.com' },
      { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'TUKLOGIC', url: `${origin}/`,
        description: seoPages[locale].home[1], inLanguage: ['en', 'ar'], publisher: { '@id': `${origin}/#organization` } },
    ],
  };
}

// Install before router hydration. Route heads run again during client navigation.
// Preserve non-SEO tags and each project's existing title, description and artwork.
export function installSeoRouteHeads(route, origin) {
  const head = route.options.head;
  if (head) route.options.head = async function (context) {
    const result = await head.call(this, context);
    const pathname = context.match.pathname.replace(/\/$/, '');
    const copy = getPageSeo(pathname);
    if (!copy) return result;
    const owned = new Set(['description', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'og:type', 'og:title', 'og:description', 'og:image', 'keywords', 'twitter:site']);
    return { ...result, meta: [
      ...(result?.meta || []).filter(tag => !('title' in tag) && !owned.has(tag.name || tag.property)),
      { title: copy.title }, { name: 'description', content: copy.description },
      { property: 'og:type', content: 'website' }, { property: 'og:title', content: copy.title },
      { property: 'og:description', content: copy.description }, { property: 'og:image', content: origin + socialImage },
      { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:title', content: copy.title },
      { name: 'twitter:description', content: copy.description }, { name: 'twitter:image', content: origin + socialImage },
    ] };
  };
  for (const child of Object.values(route.children || {})) installSeoRouteHeads(child, origin);
}
