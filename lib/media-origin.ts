/**
 * R2 bucket (tuklogic-media) on its custom domain. Browsers load media from it directly:
 * Vercel cannot proxy to a subdomain of a domain it serves (it answers 404
 * DEPLOYMENT_NOT_FOUND), and the bucket's r2.dev URL is rate-limited.
 */
const DEFAULT_MEDIA_ORIGIN = 'https://media.tuklogic.com';

/** Origin of the R2 media. R2_MEDIA_ORIGIN may override it; normally it is unset. */
export function getMediaOrigin(): string {
  const value = process.env.R2_MEDIA_ORIGIN?.trim() || DEFAULT_MEDIA_ORIGIN;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('R2_MEDIA_ORIGIN must be an HTTPS origin without a path or credentials.');
  }
  return url.origin;
}

/**
 * Paths under /offline that ship with the deployment (committed with `git add -f`, since
 * public/offline is otherwise ignored): everything the homepage needs before and during the
 * intro, so the first screen never waits on R2. Entries ending in / are folders.
 */
export const STARTUP_MEDIA = [
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
  'audio/intro.mp3',
  'audio/eh.mp3',
  'audio/ar/intro.mp3',
  'audio/ar/eh.mp3',
  'audio/click.wav',
  'audio/magic-20261029.mp3',
  'audio/whoosh-20261029.mp3',
];

/** Regex source matching a startup path (relative to /offline/, without a query string). */
export const startupMediaPattern = STARTUP_MEDIA
  .map(path => path.replace(/[.]/g, '\\.') + (path.endsWith('/') ? '' : '$'))
  .join('|');

/**
 * Inline script defining window.__tukMedia(url): maps an /offline URL that is not startup
 * media to the R2 origin. The homepage bundles call it for frames, videos and sounds; any URL
 * they miss still works through the redirect in next.config.ts, at one extra round trip.
 */
export function mediaUrlScript(): string {
  const origin = JSON.stringify(getMediaOrigin());
  const pattern = JSON.stringify(`^(?:${startupMediaPattern})`);
  return `<script>(()=>{const o=${origin},s=new RegExp(${pattern});window.__tukMedia=u=>typeof u=="string"&&u.startsWith("/offline/")&&!s.test(u.slice(9).split(/[?#]/)[0])?o+u:u})()</script>`;
}
