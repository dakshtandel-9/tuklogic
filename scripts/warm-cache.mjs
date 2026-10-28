// Request every animation frame and the images through the live site once, so
// Vercel's edge holds them before visitors arrive. Run after a deploy or a media
// upload. The edge cache is per region: this warms the region nearest to you.
// Audio and video are uploaded as private and are never cached at the edge.
//   WARM_ORIGIN=https://tuklogic.vercel.app node scripts/warm-cache.mjs
import { readdir } from 'node:fs/promises';
import { FRAMES_VERSION } from '../public/assets/frame-loader.js';

const origin = process.env.WARM_ORIGIN || 'https://tuklogic.vercel.app';
const root = new URL('../public/', import.meta.url);

const paths = [];
const walk = async dir => {
  for (const entry of await readdir(new URL(dir, root), { withFileTypes: true })) {
    const path = `${dir}${entry.name}`;
    if (entry.isDirectory()) await walk(`${path}/`);
    else if (/\.(webp|png|jpe?g|svg)$/i.test(entry.name)) paths.push(path.includes('/frames/') ? `${path}?v=${FRAMES_VERSION}` : path);
  }
};
await walk('offline/frames/');
await walk('offline/images/');

let done = 0, hits = 0;
const failures = new Map();
const queue = [...paths];
// r2.dev rate-limits bursts, so keep this modest and retry with a pause.
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const path = queue.shift();
    let status;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch(new URL(`/${encodeURI(path)}`, origin), { signal: AbortSignal.timeout(30000) });
        await response.arrayBuffer();
        status = response.status;
        if (response.headers.get('x-vercel-cache') === 'HIT') hits += 1;
      } catch (error) { status = error.name; }
      if (status === 200) break;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
    if (status !== 200) failures.set(status, (failures.get(status) || 0) + 1);
    if (++done % 500 === 0) console.log(`${done}/${paths.length}`);
  }
}));
console.log(`Warmed ${done} files (${hits} were already cached).`, failures.size ? Object.fromEntries(failures) : 'No failures.');
if (failures.size) process.exitCode = 1;
