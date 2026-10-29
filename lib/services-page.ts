import { serviceExperienceDocument } from './service-experience-document';

type ServicesResult = { html: string } | { redirect: string };

// Sections and project pages handled by the experience's client router.
const sections = new Set(['home', 'about', 'work', 'tree', 'contact', 'footer']);

export function getServicesDocument(url: URL): ServicesResult | null {
  const match = /^\/(en|ar)\/digital-services(?:\/(.*?))?\/?$/.exec(url.pathname);
  if (!match) return null;
  const root = `/${match[1]}/digital-services`;
  const segments = (match[2] ?? '').split('/').filter(Boolean);
  const routed = segments.length === 0
    || (segments.length === 1 && sections.has(segments[0]))
    || (segments.length === 2 && segments[0] === 'work');
  // Retired per-service pages now open the services experience.
  if (!routed) return { redirect: root };
  return { html: serviceExperienceDocument(url.origin, root, url.pathname) };
}
