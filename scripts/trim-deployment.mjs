import fs from 'node:fs';
import path from 'node:path';

// These originals remain in public/ for local development. The browser frontend
// already uses their CDN copies; the image route handles direct image URLs.
const directory = 'dist/client/images';
const retained = new Set(['og-image.png', 'crystal-map.png']);
if (fs.existsSync(directory)) {
  for (const entry of fs.readdirSync(directory)) {
    if (!retained.has(entry)) fs.rmSync(path.join(directory,entry),{recursive:true,force:true});
  }
}
console.log('Prepared CDN-backed media for publishing.');
