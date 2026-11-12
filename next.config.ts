import type { NextConfig } from 'next';
import { getMediaOrigin } from './lib/media-origin';

const mediaOrigin = getMediaOrigin();

// The services experience keeps its scripts, worker, shaders and fonts on this origin
// (workers must be same-origin); only its media files are served from R2.
const serviceMedia = 'mp4|mp3|jpe?g|png|json|bin|ktx2';

// Everything the homepage needs before and during the intro (about 15 MB) ships with the
// deployment and is served by Vercel's CDN, so the first screen never waits on R2. These
// files are committed with `git add -f` (public/offline is otherwise ignored). Other media,
// such as later eras' frames, still comes from R2.
const STARTUP_MEDIA = [
  'fonts/',
  'frames/eh/',
  'videos/portal.mp4',
  'videos/portal_portrait_compressed.webm',
  'videos/wormhole-20261029.webm',
  'videos/wormhole-light-20261030.webm',
  'videos/glitch-20261029.mp4',
  'scenes/desktop/eh/intro.mp4',
  'scenes/desktop/eh/intro-light-20261030.mp4',
  'scenes/desktop/eh/intro-phone-20261031c.mp4',
  'mobile-videos/eh-mobile-20261029c.mp4',
  // Phone eras' posters (each clip's first frame, 14-48 KB): shown while a clip loads, or when Low Power Mode blocks it.
  'mobile-videos/eh-mobile-20261029c.jpg',
  'mobile-videos/egypt-mobile-20261029d.jpg',
  'mobile-videos/china-mobile-20261029c.jpg',
  'mobile-videos/greek-mobile-20261029d.jpg',
  'mobile-videos/islamic-mobile-20261029c.jpg',
  'mobile-videos/steve-mobile-20261029c.jpg',
  'audio/intro.mp3',
  'audio/eh.mp3',
  'audio/ar/intro.mp3',
  'audio/ar/eh.mp3',
  'audio/click.wav',
  'audio/magic-20261029.mp3',
  'audio/whoosh-20261029.mp3',
];
const startupPattern = STARTUP_MEDIA.map(path => path.replace(/[.]/g, '\\.') + (path.endsWith('/') ? '' : '$')).join('|');

const mediaRoutes = [
  // Fonts and startup media stay on this origin; everything else under /offline is on R2.
  { source: `/offline/:path((?!${startupPattern}).*)`, destination: `${mediaOrigin}/offline/:path` },
  // The services scene asks for this normal map under pbr/; the bucket has it under room/.
  { source: '/service-experience/reference/images/pbr/damaged_road_normal.jpg', destination: `${mediaOrigin}/service-experience/reference/images/room/damaged_road_normal.jpg` },
  // The services scene asks for lab.gif as a texture; the bucket only has the still lab.jpg.
  { source: '/service-experience/reference/images/lab.gif', destination: `${mediaOrigin}/service-experience/reference/images/lab.jpg` },
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
    // There is no Articles page; the Present page's "view all" and the site search linked to a 404.
    return [
      { source: '/:locale(en|ar)/articles', destination: '/:locale/case-studies', permanent: false },
      { source: '/:locale(en|ar)/articles/:path*', destination: '/:locale/case-studies', permanent: false },
    ];
  },
  async rewrites() {
    // Proxy media on the site's origin. Redirecting every frame adds a network
    // round trip and makes videos, canvas textures and fetches depend on CORS.
    return { beforeFiles: mediaRoutes };
  },
};

export default nextConfig;
