import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const origin = process.env.MEDIA_TEST_ORIGIN || 'http://localhost:3100';
const source = await readFile(new URL('../public/assets/ScenesDesktop-cNbGhPlf.js', import.meta.url), 'utf8');
const paths = new Set([
  '/offline/videos/present.mp4', '/offline/videos/voice-assistant-2.mp4',
  '/offline/scenes/desktop/eh/intro.mp4', '/offline/scenes/desktop/apple.mp4',
  '/offline/scenes/desktop/portfolio-20261029.mp4', '/offline/videos/glitch-20261029.mp4',
  // Lighter intro film and loading video for slow connections, and the phones' own cut of the intro (720x1280 HD version).
  '/offline/scenes/desktop/eh/intro-light-20261030.mp4', '/offline/videos/wormhole-light-20261030.webm',
  '/offline/scenes/desktop/eh/intro-phone-20261031c.mp4',
  '/offline/mobile-videos/portfolio_mobile-20261029.mp4', '/offline/fonts/LDIxapCSOBg7S-QT7q4A.woff2',
  '/offline/images/crystal-map.png', '/images/crystal-map.png',
  '/offline/fonts/8dd29564f022c7908c3b.css', '/offline/fonts/LDIxapCSOBg7S-QT7q4A.ttf',
  '/service-experience/content/site-content.json', '/service-experience/reference/data/uil.brand-monogram-v2.json',
]);
for (const match of source.matchAll(/sceneName:"([^"]+)"[^}]*?inFrames:(\d+)(?:,outFrames:(\d+))?,holdFrames:(\d+)/g)) {
  for (const quality of ['sm', 'md']) {
    for (const [kind, count] of [['in', +match[2]], ['out', +match[3]], ['hold', +match[4]]]) {
      if (!count) continue;
      for (const frame of [1, count]) paths.add(`/offline/frames/${match[1]}/${kind}-${quality}/frame_${frame}.webp`);
    }
  }
}
const present = await readFile(new URL('../public/assets/present-Dq_t0PBs.js', import.meta.url), 'utf8');
for (const match of present.matchAll(/"(\/offline\/images\/services\/[^" ]+)"/g)) paths.add(match[1]);
// Phones use independent clips; desktop frame checks cannot catch stale or
// missing mobile character artwork.
const mobile = await readFile(new URL('../public/assets/ScenesMobile-COIEeUsU.js', import.meta.url), 'utf8');
for (const match of mobile.matchAll(/src:"(\/mobile-videos\/[^" ]+)"/g)) paths.add(`/offline${match[1]}`);

let checks = 0;
const remaining = [...paths];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (remaining.length) {
    const path = remaining.shift();
    const response = await fetch(new URL(path, origin), { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
    assert.ok(!response.headers.has('location'), `${path}: media must stay on the site's origin`);
    assert.match(response.headers.get('content-type') || '', /image|video|font|css|json/, `${path}: wrong content type`);
    // Vercel compresses text assets (CSS, JSON) and then sends no Content-Length, so measure the body instead.
    const size = response.headers.has('content-length') ? Number(response.headers.get('content-length'))
      : (await (await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30000) })).arrayBuffer()).byteLength;
    assert.ok(size > 0, `${path}: empty asset`);
    checks += 1;
  }
}));
const range = await fetch(new URL('/offline/videos/present.mp4', origin), {
  headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(30000),
});
assert.equal(range.status, 206, 'Videos must support byte ranges for playback and seeking');
assert.match(range.headers.get('content-range'), /^bytes 0-1023\//);
assert.equal((await range.arrayBuffer()).byteLength, 1024);
console.log(`Passed ${checks} deployment media checks plus video byte-range playback.`);
