import type { NextConfig } from 'next';
import { getMediaOrigin, startupMediaPattern } from './lib/media-origin';

const mediaOrigin = getMediaOrigin();

// The services experience keeps its scripts, worker, shaders and fonts on this origin
// (workers must be same-origin); only its media files are served from R2.
const serviceMedia = 'mp4|mp3|jpe?g|png|json|bin|ktx2';

const mediaRoutes = [
  // Fonts and startup media stay on this origin; everything else under /offline is on R2.
  { source: `/offline/:path((?!${startupMediaPattern}).*)`, destination: `${mediaOrigin}/offline/:path` },
  { source: '/images/:path*', destination: `${mediaOrigin}/images/:path*` },
  // The clients page requests its logos without the /offline prefix.
  { source: '/client-logos/export/:path*', destination: `${mediaOrigin}/offline/client-logos/export/:path*` },
  {
    source: `/service-experience/:file(.+\\.(?:${serviceMedia}))`,
    destination: `${mediaOrigin}/service-experience/:file`,
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    // Media is sent to R2 with a redirect, not proxied: Vercel cannot proxy to the bucket's
    // custom domain (a subdomain of a domain it serves). The homepage bundles request most
    // media from R2 directly (window.__tukMedia), so this is the fallback for other pages.
    return mediaRoutes.map(route => ({ ...route, permanent: false }));
  },
};

export default nextConfig;
