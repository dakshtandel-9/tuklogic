import assert from 'node:assert/strict';
import { caseStudies } from '../public/case-studies/catalog.js';

const origin = process.env.CASE_STUDY_TEST_ORIGIN || 'http://localhost:3000';
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const retired = ['webook', 'riyadh-season', 'the-ring', 'koora-break', 'joy-awards', 'alinma-pay', 'dzrt', 'unification-strategy', 'sagp', 'misk', 'asaan', 'alaa-khotah', 'golden-pen', 'ewc'];
let checks = 0;

async function read(path, status = 200) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' });
  assert.equal(response.status, status, `${path}: HTTP ${response.status}, expected ${status}`);
  checks++;
  return { response, html: await response.text() };
}

assert.equal(caseStudies.length, 9);
assert.equal(new Set(caseStudies.map(project => project.slug)).size, 9);

for (const locale of ['en', 'ar']) {
  const { html: collection } = await read(`/${locale}/case-studies`);
  // The collection is the site's own document (header, menu, footer) with the case-studies route.
  assert.equal((collection.match(/class="card_set corners_set/g) || []).length, 9);
  assert.match(collection, new RegExp(`<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));
  assert.ok(collection.includes(`lastMatchId:"/${locale}/case-studies/"`), 'Collection must hydrate the case-studies route');
  assert.ok(collection.includes('<footer'), 'Collection must use the site footer');
  for (const slug of retired) assert.ok(!collection.includes(`/case-studies/${slug}`), `Retired project leaked into the collection: ${slug}`);
  for (const project of caseStudies) {
    const path = `/${locale}/case-studies/${project.slug}`;
    assert.ok(collection.includes(`href="${path}"`), `Missing collection link: ${project.title}`);
    const { html } = await read(path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${path}: expected a single page heading`);
    assert.ok(html.includes(`<h1 lang="en" dir="ltr">${project.title}</h1>`));
    for (const section of ['overview', 'process', 'solutions', 'results']) assert.ok(html.includes(`id="${section}"`), `${path}: missing ${section}`);
    assert.ok(html.includes(`src="${project.image}"`));
    // Project pages are the site's own document (header, menu, footer) hydrating the detail route.
    assert.ok(html.includes(`lastMatchId:"${path}"`), `${path}: must hydrate the case study route`);
    assert.ok(html.includes('<footer') && html.includes('data-tuk-case'), `${path}: missing site footer or case study content`);
    for (const slug of retired) assert.ok(!html.includes(`/case-studies/${slug}`), `${path}: links retired project ${slug}`);
    if (locale === 'en') {
      for (const value of [project.desc, ...project.process, ...project.solutions, ...project.results]) {
        assert.ok(html.includes(escape(value)), `${path}: missing supplied copy: ${value}`);
      }
    }
    const links = [...html.matchAll(/href="(\/(?:en|ar)\/case-studies\/[^"#]+)"/g)].map(match => match[1].split('/').pop());
    for (const slug of links) assert.ok(caseStudies.some(item => item.slug === slug), `${path}: invalid project link ${slug}`);
  }
  for (const slug of retired) {
    const { response } = await read(`/${locale}/case-studies/${slug}`, 308);
    assert.equal(response.headers.get('location'), `/${locale}/case-studies`);
  }
  await read(`/${locale}/case-studies/not-a-project`, 404);
}

for (const project of caseStudies) {
  const response = await fetch(new URL(project.image, origin));
  assert.equal(response.status, 200, `Missing project artwork: ${project.image}`);
  assert.match(response.headers.get('content-type'), /image/);
  checks++;
}
for (const asset of ['styles.css', 'homepage.css', 'detail.css', 'interactions.js', 'catalog.js', 'favicon.svg']) await read(`/case-studies/${asset}`);
console.log(`Passed ${checks} HTTP checks: 18 project pages, both collections, all 28 retired URLs, missing pages and local assets.`);
