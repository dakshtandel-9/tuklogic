import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const origin = process.env.MEDIA_TEST_ORIGIN || 'http://localhost:3100';
const source = await readFile(new URL('../public/assets/ScenesDesktop-cNbGhPlf.js', import.meta.url), 'utf8');
const paths = new Set([
  '/offline/videos/present.mp4', '/offline/videos/voice-assistant-2.mp4',
  '/offline/scenes/desktop/eh/intro.mp4', '/offline/scenes/desktop/apple.mp4',
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

let checks = 0;
const remaining = [...paths];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (remaining.length) {
    const path = remaining.shift();
    const response = await fetch(new URL(path, origin), { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
    assert.ok(!response.headers.has('location'), `${path}: media must stay on the site's origin`);
    assert.match(response.headers.get('content-type') || '', /image|video|font|css|json/, `${path}: wrong content type`);
    assert.ok(Number(response.headers.get('content-length')) > 0, `${path}: empty asset`);
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
