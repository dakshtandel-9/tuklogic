import { caseStudies } from '../public/case-studies/catalog.js';
import { arabicCaseStudies } from './case-studies-ar';
import { translations } from './case-studies-collection';
import { escapeHtml as escape, renderInSiteDocument, type Locale } from './site-document';

type CaseStudy = (typeof caseStudies)[number];
type Copy = CaseStudy & Partial<(typeof arabicCaseStudies)[string]>;

const text = (locale: Locale, en: string, ar: string) => locale === 'ar' ? ar : en;
const copy = (project: CaseStudy, locale: Locale): Copy => locale === 'ar' ? { ...project, ...arabicCaseStudies[project.slug] } : project;
const projectUrl = (locale: Locale, slug: string) => `/${locale}/case-studies/${slug}`;
const total = String(caseStudies.length).padStart(2, '0');
const stylesheet = '/case-studies/detail.css';
const num = (i: number) => String(i + 1).padStart(2, '0');
const each = <T>(items: T[], render: (item: T, i: number) => string) => items.map(render).join('');

/** Stage names for each project's five-step process, as supplied with the content. */
function stageLabels(project: CaseStudy, locale: Locale) {
  const labels: Record<string, [string, string]> = {
    'talent-connect': ['Understand|Source|Screen|Evaluate|Onboard', 'الفهم|الاستقطاب|الفحص|التقييم|التهيئة'],
    'digital-growth': ['Research|Define|Strategise|Launch|Optimise', 'البحث|التحديد|التخطيط|الإطلاق|التحسين'],
    'text-intelligence': ['Collect|Define|Develop|Analyse|Visualise', 'الجمع|التحديد|التطوير|التحليل|العرض'],
    'connected-systems': ['Assess|Architect|Connect|Develop|Monitor', 'التقييم|التصميم|الربط|التطوير|المراقبة'],
  };
  const [en, ar] = labels[project.slug] ?? ['Discover|Design|Build|Connect|Validate', 'الاكتشاف|التصميم|التنفيذ|الربط|التحقق'];
  return text(locale, en, ar).split('|');
}

/** Everything a section needs: the project, its localised copy and the page's fixed labels. */
type Ctx = {
  project: CaseStudy;
  c: Copy;
  locale: Locale;
  stages: string[];
  details?: { solutions?: string[]; results?: string[] };
  label: {
    overview: string; process: string; processSub: string; solutions: string; solutionsSub: string;
    results: string; resultsSub: string; discover: string; visual: string;
  };
};

function context(project: CaseStudy, locale: Locale): Ctx {
  return {
    project,
    c: copy(project, locale),
    locale,
    stages: stageLabels(project, locale),
    details: locale === 'en' ? detailCopy[project.slug] : undefined,
    label: {
      overview: text(locale, 'Overview', 'نظرة عامة'),
      process: text(locale, 'Project process', 'مسار المشروع'),
      processSub: text(locale, 'A considered path.<br> From understanding to delivery.', 'مسار مدروس.<br> من الفهم إلى التنفيذ.'),
      solutions: text(locale, 'The solutions', 'الحلول'),
      solutionsSub: text(locale, 'Designed around<br> what matters.', 'مصمّمة حول<br> ما يهمك.'),
      results: text(locale, 'Key results', 'النتائج'),
      resultsSub: text(locale, 'The difference<br> it makes.', 'الأثر الذي<br> يصنع الفرق.'),
      discover: text(locale, 'Discover the project', 'اكتشف المشروع'),
      visual: text(locale, 'Product visualisation', 'تصوّر مرئي للحل'),
    },
  };
}

/** Supporting copy supplied for the selected case study detail pages. */
const detailCopy: Record<string, { solutions?: string[]; results?: string[] }> = {
  'ai-automation': {
    solutions: [
      'Streamline repetitive business tasks with AI-driven automation. Improve operational efficiency, reduce manual effort, and accelerate workflows with greater accuracy.',
      'Leverage AI and machine learning to analyze historical data and forecast future trends. Make smarter, data-driven decisions and stay ahead of business challenges.',
      'Deliver intelligent, personalized recommendations using advanced AI algorithms. Identify opportunities, enhance customer experiences, and support better decision-making.',
      'Generate accurate, real-time reports with minimal manual intervention. Save time, track key performance indicators, and gain actionable business insights.',
      'Automatically organize, categorize, and prioritize large volumes of data using AI. Improve data accessibility, consistency, and management efficiency.',
      'Transform complex business data into interactive, easy-to-understand dashboards. Monitor performance, visualize trends, and gain real-time insights for strategic growth.',
    ],
  },
  'connected-systems': {
    results: [
      'Gain a unified view of connected systems and devices across your operations. Access real-time data and insights to improve transparency and control.',
      'Monitor connected devices, system performance, and operational activities in real time. Identify potential issues early and respond faster.',
      'Automate system checks and routine inspections through connected technologies. Minimize human intervention, reduce errors, and improve efficiency.',
      'Manage and monitor all connected devices from a single centralized platform. Simplify control, improve coordination, and ensure seamless system integration.',
    ],
  },
  'sales-hub': {
    solutions: [
      'Capture, organize, and track leads from multiple sources in one centralized platform. Streamline lead assignment and ensure every sales opportunity gets the attention it deserves.',
      'Maintain comprehensive customer profiles with contact details, communication history, preferences, and interactions. Build stronger relationships through a complete view of every customer.',
      'Monitor every stage of your sales journey, from initial inquiry to deal closure. Gain clear visibility into opportunities, track progress, and improve sales forecasting.',
      'Never miss an opportunity with automated reminders, follow-up emails, and timely notifications. Keep prospects engaged and ensure consistent communication throughout the sales cycle.',
      'Organize sales activities, assign responsibilities, and track task progress efficiently. Keep your team aligned, productive, and focused on achieving sales targets.',
      'Access real-time sales insights through intuitive and interactive dashboards. Track revenue, conversion rates, team performance, and key metrics to make informed business decisions.',
    ],
    results: [
      'Bring all customer details, interactions, and communication history into one unified platform. Ensure easy access to accurate information and build stronger customer relationships.',
      'Capture, monitor, and manage leads throughout the sales journey. Gain better visibility into lead progress, identify potential opportunities, and improve conversion rates.',
      'Simplify everyday sales operations by automating repetitive tasks and standardising processes. Reduce manual effort, minimise delays, and accelerate deal closures.',
      'Empower your team with organised workflows, real-time insights, and efficient task management. Improve collaboration, save time, and help your team focus on business growth.',
    ],
  },
  'it-workflow': {
    solutions: [
      'Efficiently track, manage, and resolve IT incidents from a centralized platform. Minimize service disruptions, improve response times, and maintain business continuity.',
      'Simplify how employees submit, track, and manage IT service requests. Automate request handling and ensure faster, more consistent service delivery.',
      'Plan, approve, and monitor IT infrastructure and system changes with structured workflows. Reduce operational risks and ensure smooth, controlled transitions.',
      'Provide a centralized catalogue of available IT services with clear descriptions and request options. Help employees easily find and access the services they need.',
      'Automate repetitive IT processes, approvals, notifications, and task assignments. Reduce manual effort, eliminate bottlenecks, and improve operational efficiency.',
      'Monitor IT performance, service requests, incidents, and key operational metrics through interactive dashboards. Gain real-time visibility and make informed decisions.',
    ],
  },
  'talent-connect': {
    solutions: [
      'Connect with skilled IT professionals across diverse technologies and roles. Streamline hiring processes to find the right technical talent for your business needs.',
      'Simplify hiring across business, administrative, operational, and management roles. Identify qualified candidates who align with your company culture and requirements.',
      'Discover potential candidates through multiple talent channels and professional networks. Build a strong talent pipeline and reach the right people faster.',
      'Evaluate resumes efficiently to identify candidates based on skills, experience, and job requirements. Reduce manual screening efforts and accelerate shortlisting.',
      'Find and hire specialized professionals with the technical expertise your organization needs. Focus on skill-based evaluation and a streamlined technical hiring process.',
      'Scale your workforce with skilled professionals to meet changing project demands. Access the right expertise, improve flexibility, and accelerate project delivery.',
    ],
    results: [
      'Identify qualified candidates quickly through efficient sourcing and screening processes. Reduce hiring time and connect with the right talent faster.',
      'Streamline recruitment activities with organized processes, centralized candidate information, and efficient communication. Simplify every stage of the hiring journey.',
      'Connect with skilled professionals across IT, non-IT, and niche technical domains. Find the expertise needed to support your business goals and project requirements.',
      'Scale your workforce based on changing business and project demands. Access the right talent when needed while maintaining operational flexibility and efficiency.',
    ],
  },
};

/* ---------- Shared pieces ---------- */

const title = ({ project }: Ctx) => `<h1 lang="en" dir="ltr">${project.title}</h1>`;
/** The product render; repeats after the first are decorative. */
const product = ({ project }: Ctx, className: string, primary = false) =>
  `<img class="${className}" src="${project.image}" alt="${primary ? escape(project.ref) : ''}"${primary ? '' : ' aria-hidden="true"'} width="1536" height="1024" decoding="async"${primary ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
const art = ({ project }: Ctx, className: string) => `<img class="${className}" src="${project.svg}" alt="" aria-hidden="true" decoding="async">`;
const discover = ({ label }: Ctx, className = '') => `<a class="tcs-discover ${className}" href="#overview">${label.discover}<span aria-hidden="true"> ↓</span></a>`;
const count = ({ project }: Ctx) => `${project.number} / ${total}`;
const arrow = '<svg class="tcs-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10" stroke="currentColor" stroke-width="1.5"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" stroke-width="2"/></svg>';

function facts({ c, locale }: Ctx) {
  return `<dl class="tcs-facts">${each([
    [text(locale, 'Expertise', 'التخصص'), c.category],
    [text(locale, 'Solution', 'الحل'), c.format],
    [text(locale, 'Focus', 'التركيز'), c.results[0]],
  ], ([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`)}</dl>`;
}

/* ---------- Heroes ---------- */

const heroStage = (x: Ctx) => `<section class="tcs-hero tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <div class="tcs-stage">
    <div class="tcs-side tcs-side-start"><span class="tcs-count">${count(x)}</span><ul class="tcs-stages">${each(x.stages, stage => `<li>${escape(stage)}</li>`)}</ul></div>
    <figure class="tcs-visual">${art(x, 'tcs-visual-art')}${product(x, 'tcs-visual-product', true)}</figure>
    <div class="tcs-side tcs-side-end">${discover(x)}<span>${x.label.visual}</span></div>
  </div>
</section>`;

const heroAurora = (x: Ctx) => `<section class="tcs-hero tcs-hero--aurora tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <figure class="tcs-aurora">${product(x, 'tcs-aurora-product', true)}<span class="tcs-aurora-floor" aria-hidden="true"></span></figure>
  ${discover(x, 'tcs-center-link')}
</section>`;

/** Facts over a wide scene of the product at work; the product render itself is shown further down the page. */
const heroPlain = (x: Ctx, variant: string) => `<section class="tcs-hero tcs-hero--${variant} tcs-wrap" aria-label="${escape(x.project.title)}">${facts(x)}<figure class="tcs-hero-scene"><img src="/offline/images/work-images/${x.project.slug}-hero.webp" alt="" aria-hidden="true" width="1344" height="752" decoding="async" fetchpriority="high"></figure></section>`;

/** Product in concentric rings with the five stages placed around the outer ring. */
function heroOrbit(x: Ctx) {
  const stages = each(x.stages, (stage, i) => {
    const angle = -90 + i * 72;
    const left = 50 + 50 * Math.cos(angle * Math.PI / 180);
    const top = 50 + 50 * Math.sin(angle * Math.PI / 180);
    return `<li style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%"><span>${num(i)}</span>${escape(stage)}</li>`;
  });
  return `<section class="tcs-hero tcs-hero--orbit tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <div class="tcs-orbit">
    <span class="tcs-orbit-ring" aria-hidden="true"></span><span class="tcs-orbit-ring tcs-orbit-ring--mid" aria-hidden="true"></span><span class="tcs-orbit-ring tcs-orbit-ring--in" aria-hidden="true"></span>
    <span class="tcs-orbit-spin" aria-hidden="true"><i></i><i></i><i></i></span>
    ${product(x, 'tcs-orbit-product', true)}
    <ol class="tcs-orbit-stages">${stages}</ol>
  </div>
  <div class="tcs-orbit-foot"><span class="tcs-count">${count(x)}</span>${discover(x)}</div>
</section>`;
}

const heroTilt = (x: Ctx) => `<section class="tcs-hero tcs-hero--tilt tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <div class="tcs-tilt">
    ${art(x, 'tcs-tilt-art')}
    <div class="tcs-tilt-card">${product(x, 'tcs-tilt-product', true)}</div>
    <div class="tcs-tilt-meta"><span class="tcs-count">${count(x)}</span><span>${x.label.visual}</span>${discover(x)}</div>
  </div>
</section>`;

const heroBlueprint = (x: Ctx) => `<section class="tcs-hero tcs-hero--blueprint tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <div class="tcs-bp">
    <span class="tcs-bp-corner" aria-hidden="true"></span><span class="tcs-bp-corner" aria-hidden="true"></span><span class="tcs-bp-corner" aria-hidden="true"></span><span class="tcs-bp-corner" aria-hidden="true"></span>
    <div class="tcs-bp-top"><span class="tcs-count">${count(x)}</span><span>${x.label.visual}</span></div>
    ${product(x, 'tcs-bp-product', true)}
    <ol class="tcs-bp-ruler">${each(x.stages, (stage, i) => `<li><span>${num(i)}</span>${escape(stage)}</li>`)}</ol>
  </div>
  ${discover(x, 'tcs-center-link')}
</section>`;

const heroPoster = (x: Ctx) => `<section class="tcs-hero tcs-hero--poster tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <div class="tcs-poster">${art(x, 'tcs-poster-art')}${product(x, 'tcs-poster-product', true)}<span class="tcs-poster-count tcs-count">${count(x)}</span></div>
  ${discover(x)}
</section>`;

const heroSpotlight = (x: Ctx) => `<section class="tcs-hero tcs-hero--spotlight tcs-wrap" aria-label="${escape(x.project.title)}">
  ${facts(x)}
  <div class="tcs-spot">
    <figure class="tcs-spot-visual"><span class="tcs-spot-disc" aria-hidden="true"></span>${product(x, 'tcs-spot-product', true)}</figure>
    <ol class="tcs-spot-stages">${each(x.stages, (stage, i) => `<li><span>${num(i)}</span>${escape(stage)}</li>`)}</ol>
  </div>
  <div class="tcs-spot-foot"><span class="tcs-count">${count(x)}</span>${discover(x)}</div>
</section>`;

/* ---------- Title and overview ---------- */

const introSide = (x: Ctx) => `<section class="tcs-intro tcs-wrap" id="overview">
  <div class="tcs-intro-head">
    <div class="tcs-heading">${title(x)}<p class="tcs-tagline">${escape(x.c.tagline)}</p></div>
    <div class="tcs-overview"><h2>${x.label.overview}</h2><p>${escape(x.c.desc)}</p></div>
  </div>
  <div class="tcs-intro-foot"><p class="tcs-statement">${escape(x.c.headline)}</p><span class="tcs-rule" aria-hidden="true"></span><ul class="tcs-scope">${each(x.c.solutions.slice(0, 3), solution => `<li>${escape(solution)}</li>`)}</ul></div>
</section>`;

/** Two-line title with the tagline in colour, overview beside it. */
const introRing = (x: Ctx, compact = false) => `<section class="tcs-intro tcs-intro--ring${compact ? ' tcs-intro--compact' : ''} tcs-wrap" id="overview">
  <div class="tcs-ring-title">${title(x)}<p class="tcs-tagline">${escape(x.c.tagline)}</p></div>
  <div class="tcs-ring-overview"><h2 class="tcs-kicker">${x.label.overview}</h2><p>${escape(x.c.desc)}</p></div>
</section>`;

const introCenter = (x: Ctx) => `<section class="tcs-intro tcs-intro--center tcs-wrap" id="overview">
  <h2 class="tcs-kicker">${x.label.overview}</h2>${title(x)}<p class="tcs-tagline">${escape(x.c.tagline)}</p><p class="tcs-center-desc">${escape(x.c.desc)}</p>
</section>`;

const introStack = (x: Ctx) => `<section class="tcs-intro tcs-intro--stack tcs-wrap" id="overview">
  ${title(x)}
  <div class="tcs-stack-cols"><p class="tcs-tagline">${escape(x.c.tagline)}</p><div><h2 class="tcs-kicker">${x.label.overview}</h2><p>${escape(x.c.desc)}</p><p class="tcs-stack-headline">${escape(x.c.headline)}</p></div></div>
</section>`;

/* ---------- Project process ---------- */

/** First word light, the rest bold — the process tile heading style. */
function splitHeading(label: string) {
  const [first, ...rest] = label.split(' ');
  return `<span>${escape(first)}</span> <strong>${escape(rest.join(' '))}</strong>`;
}

const processTiles = (x: Ctx) => `<section class="tcs-process tcs-wrap" id="process">
  <div class="tcs-tiles">
    <div class="tcs-tile tcs-tile-title"><h2>${splitHeading(x.label.process)}</h2><p>${x.label.processSub.replace('<br> ', '<br>')}</p></div>
    ${each(x.c.process, (step, i) => `<div class="tcs-tile"><span class="tcs-tile-number">${num(i)}</span><div><h3>${escape(x.stages[i])}</h3><p>${escape(step)}</p></div></div>`)}
  </div>
</section>`;

const stepText = (x: Ctx, i: number) => `<p><strong>${escape(x.stages[i])}:</strong> ${escape(x.c.process[i])}</p>`;

/** Alternating text and imagery rows. */
const processRows = (x: Ctx) => `<section class="tcs-rows tcs-wrap" id="process">
  <div class="tcs-row">
    <div class="tcs-row-text"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p><div class="tcs-row-steps">${stepText(x, 0)}${stepText(x, 1)}</div></div>
    <figure class="tcs-row-media tcs-row-media--zoom">${product(x, 'tcs-row-img')}</figure>
  </div>
  <div class="tcs-row tcs-row--flip">
    <figure class="tcs-row-media tcs-row-media--art">${art(x, 'tcs-row-art')}</figure>
    <div class="tcs-row-text"><div class="tcs-row-steps">${stepText(x, 2)}${stepText(x, 3)}${stepText(x, 4)}</div></div>
  </div>
</section>`;

/** Process and solutions side by side under one heading. */
const processTwoCol = (x: Ctx) => `<section class="tcs-twocol tcs-wrap" id="process">
  <h2 class="tcs-display">${x.label.process} ${text(x.locale, '&amp;', 'و')} ${x.label.solutions}</h2>
  <div class="tcs-twocol-grid">
    <div><h3 class="tcs-col-title">${x.label.processSub}</h3><ul class="tcs-dots">${each(x.c.process, (step, i) => `<li><strong>${escape(x.stages[i])}:</strong> ${escape(step)}</li>`)}</ul></div>
    <div id="solutions"><h3 class="tcs-col-title">${x.label.solutionsSub}</h3><ul class="tcs-dots">${each(x.c.solutions, solution => `<li>${escape(solution)}</li>`)}</ul></div>
  </div>
</section>`;

/** Glowing nodes on a zigzag line, with each step's detail in cards below. */
function processZigzag(x: Ctx) {
  const xs = [6, 27, 48, 69, 90];
  const ys = [72, 26, 72, 26, 72];
  const points = xs.map((px, i) => `${px * 10},${ys[i] * 3}`).join(' ');
  return `<section class="tcs-zig tcs-wrap" id="process">
  <div class="tcs-head"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p></div>
  <div class="tcs-zig-map">
    <svg class="tcs-zig-lines" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
      <path class="tcs-zig-faint" d="M0 40 L270 78 M120 300 L270 78 L330 300 M480 216 L560 0 M690 78 L640 300 M690 78 L1000 20 M900 216 L1000 300 M0 280 L60 216"/>
      <polyline points="${points}"/>
    </svg>
    <ol class="tcs-zig-nodes">${each(x.stages, (stage, i) => `<li style="--x:${xs[i]}%;--y:${ys[i]}%"><span class="tcs-zig-dot"></span><span class="tcs-zig-num">${num(i)}</span><span class="tcs-zig-stage">${escape(stage)}</span></li>`)}</ol>
  </div>
  <ol class="tcs-zig-cards">${each(x.c.process, (step, i) => `<li><h3><span>${num(i)}</span>${escape(x.stages[i])}</h3><p>${escape(step)}</p></li>`)}</ol>
</section>`;
}

/** Steps hanging above and below a single connection line. */
const processCircuit = (x: Ctx) => `<section class="tcs-circuit tcs-wrap" id="process">
  <div class="tcs-head"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p></div>
  <ol class="tcs-circuit-list">${each(x.c.process, (step, i) => `<li><span class="tcs-circuit-node" aria-hidden="true"></span><div class="tcs-circuit-card"><span class="tcs-circuit-num">${num(i)}</span><h3>${escape(x.stages[i])}</h3><p>${escape(step)}</p></div></li>`)}</ol>
</section>`;

/** Stages as board columns, filling up as the project progresses. */
const processPipeline = (x: Ctx) => `<section class="tcs-pipe tcs-wrap" id="process">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p></div>
  <ol class="tcs-pipe-board">${each(x.c.process, (step, i) => `<li class="tcs-pipe-col"><div class="tcs-pipe-top"><h3>${escape(x.stages[i])}</h3><span>${num(i)}</span></div><div class="tcs-pipe-card"><p>${escape(step)}</p><span class="tcs-pipe-bar" style="--p:${(i + 1) * 20}%" aria-hidden="true"></span></div></li>`)}</ol>
</section>`;

const processTimeline = (x: Ctx) => `<section class="tcs-time tcs-wrap" id="process">
  <div class="tcs-head tcs-head--center"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p></div>
  <ol class="tcs-time-list">${each(x.c.process, (step, i) => `<li><span class="tcs-time-dot" aria-hidden="true"></span><div class="tcs-time-card"><span class="tcs-time-status">${num(i)} · ${escape(x.stages[i])}</span><p>${escape(step)}</p></div></li>`)}</ol>
</section>`;

const processStairs = (x: Ctx) => `<section class="tcs-stairs tcs-wrap" id="process">
  <div class="tcs-head"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p></div>
  <ol class="tcs-stairs-list">${each(x.c.process, (step, i) => `<li style="--step:${i}"><div class="tcs-stair-text"><h3>${escape(x.stages[i])}</h3><p>${escape(step)}</p></div><div class="tcs-stair-block" aria-hidden="true"><span>${num(i)}</span></div></li>`)}</ol>
</section>`;

const processFunnel = (x: Ctx) => `<section class="tcs-funnel tcs-wrap" id="process">
  <div class="tcs-head tcs-head--center"><h2 class="tcs-display">${x.label.process}</h2><p class="tcs-sub">${x.label.processSub}</p></div>
  <ol class="tcs-funnel-list">${each(x.c.process, (step, i) => `<li style="--step:${i}"><div class="tcs-funnel-bar"><span class="tcs-funnel-num">${num(i)}</span><h3>${escape(x.stages[i])}</h3><p>${escape(step)}</p></div></li>`)}</ol>
</section>`;

/* ---------- Solutions ---------- */

/** Title art laid on its side with a barcode, like a ticket stub. */
const stub = ({ project }: Ctx) =>
  `<div class="tcs-stub" aria-hidden="true"><img class="tcs-stub-art" src="${project.svg}" alt="" loading="lazy" decoding="async"><span class="tcs-barcode"></span></div>`;

const solutionsTicket = (x: Ctx) => `<section class="tcs-ticket tcs-wrap" id="solutions">
  <div class="tcs-ticket-body"><h2>${x.label.solutions}</h2><h3>${x.label.solutionsSub}</h3><ul class="tcs-bullets">${each(x.c.solutions, solution => `<li>${escape(solution)}</li>`)}</ul></div>
  ${stub(x)}
</section>`;

/** Heading centred over a statement column and a large panel with a frosted list. */
const solutionsCollage = (x: Ctx) => `<section class="tcs-collage tcs-wrap" id="solutions">
  <h2 class="tcs-display tcs-center">${x.label.solutions}</h2>
  <div class="tcs-collage-grid">
    <div class="tcs-collage-side"><h3 class="tcs-col-title">${x.label.solutionsSub}</h3><p class="tcs-lead">${escape(x.c.headline)}</p><figure class="tcs-collage-art">${art(x, 'tcs-collage-art-img')}</figure></div>
    <figure class="tcs-collage-main">${product(x, 'tcs-collage-img')}<div class="tcs-collage-glass"><ul class="tcs-dots">${each(x.c.solutions, solution => `<li>${escape(solution)}</li>`)}</ul></div></figure>
  </div>
</section>`;

const solutionsCards = (x: Ctx) => `<section class="tcs-cards tcs-wrap" id="solutions">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.solutions}</h2><p class="tcs-sub">${x.label.solutionsSub}</p></div>
  <ul class="tcs-cards-grid">${each(x.c.solutions, (solution, i) => `<li${x.details?.solutions?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span class="tcs-card-icon">${num(i)}</span><h3>${escape(solution)}</h3>${x.details?.solutions?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.solutions[i])}</p>` : ''}</li>`)}</ul>
</section>`;

/** Concentric circles with each solution as a node; the numbered list explains them. */
function solutionsOrbit(x: Ctx) {
  const nodes = each(x.c.solutions, (_, i) => {
    const ring = i % 2 ? 31 : 50;
    const angle = -60 + i * 60;
    const left = 50 + ring * Math.cos(angle * Math.PI / 180);
    const top = 50 + ring * Math.sin(angle * Math.PI / 180);
    return `<span class="tcs-orb-node" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%">${num(i)}</span>`;
  });
  return `<section class="tcs-orb tcs-wrap" id="solutions">
  <div class="tcs-orb-text"><h2 class="tcs-display">${x.label.solutions}</h2><p class="tcs-lead">${escape(x.c.headline)}</p><p class="tcs-sub">${x.label.solutionsSub}</p>
    <ol class="tcs-orb-list">${each(x.c.solutions, (solution, i) => `<li><span>${num(i)}</span>${escape(solution)}</li>`)}</ol></div>
  <div class="tcs-orb-diagram" aria-hidden="true"><span class="tcs-orb-ring"></span><span class="tcs-orb-ring tcs-orb-ring--in"></span><span class="tcs-orb-core" lang="en" dir="ltr">${x.project.title}</span>${nodes}</div>
</section>`;
}

const solutionsGrid = (x: Ctx) => `<section class="tcs-grid tcs-wrap" id="solutions">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.solutions}</h2><p class="tcs-sub">${x.label.solutionsSub}</p></div>
  <ol class="tcs-grid-list">${each(x.c.solutions, (solution, i) => `<li${x.details?.solutions?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span class="tcs-grid-num">${num(i)}</span><h3>${escape(solution)}</h3>${x.details?.solutions?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.solutions[i])}</p>` : ''}${arrow}</li>`)}</ol>
</section>`;

const solutionsChecklist = (x: Ctx) => `<section class="tcs-check tcs-wrap" id="solutions">
  <div class="tcs-check-head"><h2 class="tcs-display">${x.label.solutions}</h2><p class="tcs-lead">${escape(x.c.headline)}</p><p class="tcs-sub">${x.label.solutionsSub}</p></div>
  <ul class="tcs-check-list">${each(x.c.solutions, (solution, i) => `<li${x.details?.solutions?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span class="tcs-check-icon">${check}</span><span class="tcs-check-text">${escape(solution)}</span><span class="tcs-check-num">${num(i)}</span>${x.details?.solutions?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.solutions[i])}</p>` : ''}</li>`)}</ul>
</section>`;

const solutionsPills = (x: Ctx) => `<section class="tcs-pills tcs-wrap" id="solutions">
  <div class="tcs-head tcs-head--center"><h2 class="tcs-display">${x.label.solutions}</h2><p class="tcs-sub">${x.label.solutionsSub}</p></div>
  <ul class="tcs-pills-cloud">${each(x.c.solutions, (solution, i) => `<li style="--i:${i}"><span>${num(i)}</span>${escape(solution)}</li>`)}</ul>
</section>`;

const solutionsProfiles = (x: Ctx) => `<section class="tcs-profiles tcs-wrap" id="solutions">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.solutions}</h2><p class="tcs-sub">${x.label.solutionsSub}</p></div>
  <ul class="tcs-profiles-grid">${each(x.c.solutions, (solution, i) => `<li${x.details?.solutions?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span class="tcs-profile-avatar" aria-hidden="true"><span>${num(i)}</span></span><h3>${escape(solution)}</h3>${x.details?.solutions?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.solutions[i])}</p>` : '<span class="tcs-profile-lines" aria-hidden="true"><i></i><i></i></span>'}</li>`)}</ul>
</section>`;

/* ---------- Key results ---------- */

const resultsTicket = (x: Ctx) => `<section class="tcs-ticket tcs-ticket-dark tcs-wrap" id="results">
  ${stub(x)}
  <div class="tcs-ticket-body"><h2>${x.label.results}</h2><h3>${x.label.resultsSub}</h3><ol class="tcs-results">${each(x.c.results, (result, i) => `<li><span>${num(i)} /</span>${escape(result)}</li>`)}</ol></div>
</section>`;

const resultsConclusion = (x: Ctx) => `<section class="tcs-conclusion tcs-wrap" id="results">
  <figure class="tcs-conclusion-visual"><span class="tcs-conclusion-glow" aria-hidden="true"></span>${product(x, 'tcs-conclusion-img')}</figure>
  <div class="tcs-conclusion-text"><h2 class="tcs-display">${x.label.results}</h2><p class="tcs-sub">${x.label.resultsSub}</p><ol class="tcs-numbered">${each(x.c.results, (result, i) => `<li><span>${num(i)}</span>${escape(result)}</li>`)}</ol></div>
</section>`;

const resultsImpact = (x: Ctx) => `<section class="tcs-impact tcs-wrap" id="results">
  <h2 class="tcs-display">${x.label.results}</h2>
  <div><h3 class="tcs-col-title">${x.label.resultsSub}</h3><ul class="tcs-dots tcs-dots--large">${each(x.c.results, result => `<li>${escape(result)}</li>`)}</ul></div>
</section>`;

/** Large closing statement, with the device showcased in a frame. */
const showcase = (x: Ctx) => `<section class="tcs-showcase tcs-wrap" aria-label="${x.label.visual}">
  <div class="tcs-showcase-frame"><span class="tcs-showcase-bar" aria-hidden="true"><i></i><i></i><i></i></span>${product(x, 'tcs-showcase-img')}</div>
  ${art(x, 'tcs-showcase-art')}
</section>`;

const statement = (x: Ctx) => `<section class="tcs-closing tcs-wrap"><span class="tcs-closing-rule" aria-hidden="true"></span><p>${escape(x.c.headline)}</p></section>`;

const resultsMetrics = (x: Ctx) => `<section class="tcs-metrics tcs-wrap" id="results">
  <h2 class="tcs-display tcs-display--xl">${x.label.results}</h2>
  <div class="tcs-metrics-grid">
    <div class="tcs-metrics-col"><p class="tcs-metrics-lead">${escape(x.c.headline)}</p>${each(x.c.results.slice(0, 2), (result, i) => `<div class="tcs-metric"><span>${num(i)}</span><p>${escape(result)}</p></div>`)}</div>
    <div class="tcs-metrics-col"><p class="tcs-metrics-lead">${x.label.resultsSub}</p>${each(x.c.results.slice(2), (result, i) => `<div class="tcs-metric"><span>${num(i + 2)}</span><p>${escape(result)}</p></div>`)}</div>
    <figure class="tcs-metrics-visual">${product(x, 'tcs-metrics-img', true)}</figure>
  </div>
</section>`;

const resultsAchievements = (x: Ctx) => `<section class="tcs-ach tcs-wrap" id="results">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.results}</h2><p class="tcs-sub">${x.label.resultsSub}</p></div>
  <ul class="tcs-ach-grid">${each(x.c.results, (result, i) => `<li${x.details?.results?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span class="tcs-ach-num">${num(i)}</span><h3>${escape(result)}</h3>${x.details?.results?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.results[i])}</p>` : ''}<span class="tcs-ach-glow" aria-hidden="true"></span></li>`)}</ul>
</section>`;

const resultsStatements = (x: Ctx) => `<section class="tcs-lines tcs-wrap" id="results">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.results}</h2><p class="tcs-sub">${x.label.resultsSub}</p></div>
  <ol class="tcs-lines-list">${each(x.c.results, (result, i) => `<li${x.details?.results?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span>${num(i)}</span><h3>${escape(result)}</h3>${x.details?.results?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.results[i])}</p>` : ''}${arrow}</li>`)}</ol>
</section>`;

const resultsBand = (x: Ctx) => `<section class="tcs-band" id="results">
  <div class="tcs-wrap tcs-band-head"><h2 class="tcs-display">${x.label.results}</h2><p class="tcs-sub">${x.label.resultsSub}</p></div>
  <ol class="tcs-band-list tcs-wrap">${each(x.c.results, (result, i) => `<li><span>${num(i)}</span><p>${escape(result)}</p></li>`)}</ol>
</section>`;

const resultsBars = (x: Ctx) => `<section class="tcs-bars tcs-wrap" id="results">
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.results}</h2><p class="tcs-sub">${x.label.resultsSub}</p></div>
  <ol class="tcs-bars-chart">${each(x.c.results, (result, i) => `<li style="--step:${i}"><div class="tcs-bar" aria-hidden="true"><span>${num(i)}</span></div><p>${escape(result)}</p></li>`)}</ol>
</section>`;

const resultsQuote = (x: Ctx) => `<section class="tcs-quote tcs-wrap" id="results">
  <blockquote><span aria-hidden="true">“</span><p>${escape(x.c.headline)}</p></blockquote>
  <div class="tcs-head tcs-head--split"><h2 class="tcs-display">${x.label.results}</h2><p class="tcs-sub">${x.label.resultsSub}</p></div>
  <ol class="tcs-quote-list">${each(x.c.results, (result, i) => `<li${x.details?.results?.[i] ? ' class="tcs-detail-card" tabindex="0"' : ''}><span>${num(i)}</span><h3>${escape(result)}</h3>${x.details?.results?.[i] ? `<p class="tcs-detail-copy">${escape(x.details.results[i])}</p>` : ''}</li>`)}</ol>
</section>`;

/* ---------- One design per project ---------- */

const layouts: Record<string, { name: string; sections: (x: Ctx) => string[] }> = {
  'smart-retail': { name: 'ticket', sections: x => [heroStage(x), introSide(x), processTiles(x), solutionsTicket(x), resultsTicket(x)] },
  'ai-content': { name: 'aurora', sections: x => [heroAurora(x), introRing(x), processRows(x), solutionsCollage(x), resultsConclusion(x)] },
  'text-intelligence': { name: 'editorial', sections: x => [heroPlain(x, 'editorial'), introRing(x), showcase(x), processTwoCol(x), resultsImpact(x), statement(x)] },
  'ai-automation': { name: 'metrics', sections: x => [heroPlain(x, 'glow'), introRing(x, true), resultsMetrics(x), processZigzag(x), solutionsCards(x)] },
  'connected-systems': { name: 'orbit', sections: x => [heroOrbit(x), introCenter(x), processCircuit(x), solutionsOrbit(x), resultsAchievements(x)] },
  'sales-hub': { name: 'pipeline', sections: x => [heroTilt(x), introStack(x), processPipeline(x), solutionsGrid(x), resultsStatements(x)] },
  'it-workflow': { name: 'blueprint', sections: x => [heroBlueprint(x), introCenter(x), processTimeline(x), solutionsChecklist(x), resultsBand(x)] },
  'digital-growth': { name: 'poster', sections: x => [heroPoster(x), introStack(x), processStairs(x), solutionsPills(x), resultsBars(x)] },
  'talent-connect': { name: 'spotlight', sections: x => [heroSpotlight(x), introRing(x), processFunnel(x), solutionsProfiles(x), resultsQuote(x)] },
};

function content(project: CaseStudy, locale: Locale) {
  const x = context(project, locale);
  const index = caseStudies.indexOf(project);
  const next = caseStudies[(index + 1) % caseStudies.length];
  const upNext = (translations[locale] as { upNext?: { label?: string } }).upNext?.label ?? text(locale, 'Up next', 'التالي');
  const layout = layouts[project.slug] ?? layouts['smart-retail'];

  const upNextBanner = `<a class="tcs-next tcs-wrap" href="${projectUrl(locale, next.slug)}" style="--tcs-next:${next.color}"><span class="tcs-next-frame"><img class="tcs-next-art" src="${next.svg}" alt="" aria-hidden="true" loading="lazy" decoding="async"><span class="tcs-next-copy"><span class="tcs-next-label">${escape(upNext)}</span><span class="tcs-next-title" lang="en" dir="ltr">${next.title}</span></span></span></a>`;

  // The stylesheet travels with the markup so in-app navigation renders it styled too.
  return `<div class="tcs tcs--${layout.name}" data-tuk-case style="--tcs-color:${project.color};--tcs-accent:${project.accent}"><link rel="stylesheet" href="${stylesheet}"><div class="tcs-hero-bg" aria-hidden="true"></div><main class="tcs-main">${layout.sections(x).join('')}${upNextBanner}</main></div>`;
}

/** A project page, served inside the site's own document (header, menu, footer). */
export async function getCaseStudyDetail(url: URL): Promise<string | null> {
  const match = /^\/(en|ar)\/case-studies\/([^/]+)\/?$/.exec(url.pathname);
  const project = match && caseStudies.find(item => item.slug === match[2]);
  if (!match || !project) return null;
  const locale = match[1] as Locale;
  const c = copy(project, locale);
  const title = `${project.title} — ${text(locale, 'Case Study', 'دراسة حالة')} — TUKLOGIC`;
  const html = content(project, locale);
  return renderInSiteDocument({
    locale,
    origin: url.origin,
    path: `/case-studies/${project.slug}`,
    title,
    description: c.desc,
    image: `${url.origin}${project.image}`,
    ogType: 'article',
    preload: '',
    stylesheets: [stylesheet],
    matchId: projectUrl(locale, project.slug),
    // The detail route in main-B2LH-fDE.js renders `html` for catalog projects.
    loaderData: { key: project.slug, slug: project.slug, title, description: c.desc, image: project.image, name: project.title, html },
    namespace: ['case-studies', translations[locale]],
    main: `<div class="tuk-case-host">${html}</div>`,
  });
}
