import { pageLoaders } from '../../../lib/page-loaders';
import { applyHeaderBranding } from '../../../lib/header-branding';
import { getCaseStudyDocument } from '../../../lib/case-studies';
import { getCaseStudiesCollection, withArabicCaseStudyTags } from '../../../lib/case-studies-collection';
import { getCaseStudyDetail } from '../../../lib/case-study-detail';
import { getServicesDocument } from '../../../lib/services-page';
import { getMediaOrigin } from '../../../lib/media-origin';

/** Serve the captured document with its original locally hosted frontend runtime. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  const services = getServicesDocument(url);
  if (services && 'redirect' in services) {
    return new Response(null, { status: 308, headers: { Location: services.redirect } });
  }
  if (services) {
    // The WebGL experience streams project films from external media hosts,
    // so it is served without the captured pages' same-origin policy.
    return new Response(services.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });
  }
  const caseStudy = getCaseStudyDocument(url);
  if (caseStudy && 'redirect' in caseStudy) {
    return new Response(null, { status: 308, headers: { Location: caseStudy.redirect } });
  }
  const html = caseStudy?.html ?? await getCaseStudiesCollection(url) ?? await getCaseStudyDetail(url) ?? await pageLoaders[path]?.();
  if (!html) {
    return new Response('Page not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const mediaSource = ` ${getMediaOrigin()}`;
  const branded = applyHeaderBranding(withArabicCaseStudyTags(html));
  return new Response(branded, {
    status: caseStudy?.status ?? 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Copied modules may only load resources from this site and the R2 media origin.
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'${mediaSource}; img-src 'self' data: blob:${mediaSource}; media-src 'self' blob:${mediaSource}; font-src 'self' data:${mediaSource}; connect-src 'self'${mediaSource} ws://localhost:* ws://127.0.0.1:*; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`,
    },
  });
}
