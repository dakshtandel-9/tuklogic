import type { NextConfig } from 'next';
import { getMediaOrigin } from './lib/media-origin';

const mediaOrigin = getMediaOrigin();

// The services experience keeps its scripts, worker, shaders and fonts on this origin
// (workers must be same-origin); only its media files are served from R2.
const serviceMedia = 'mp4|mp3|jpe?g|png|json|bin|ktx2';

const mediaRoutes = [
  { source: '/offline/:path*', destination: `${mediaOrigin}/offline/:path*` },
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
    return mediaRoutes.map(route => ({ ...route, permanent: false }));
  },
};

export default nextConfig;
