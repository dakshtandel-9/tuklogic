import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFrameLoader, FRAMES_VERSION } from '../public/assets/frame-loader.js';

function images({ fail = () => false, hold = false } = {}) {
  const calls = new Map();
  let active = 0, maximum = 0;
  const createImage = () => ({
    naturalWidth: 100, width: 100, height: 80,
    async decode() {},
    set src(value) {
      this.url = value;
      if (!value) return;
      const path = value.split('?')[0];
      calls.set(path, (calls.get(path) || 0) + 1);
      active += 1;
      maximum = Math.max(maximum, active);
      if (hold) return;
      queueMicrotask(() => {
        active -= 1;
        if (fail(path, calls.get(path))) this.onerror?.();
        else this.onload?.();
      });
    },
  });
  return { createImage, calls, maximum: () => maximum };
}

test('loads every frame including first and last, in playback order', async () => {
  const network = images();
  const loader = createFrameLoader({ ...network, concurrency: 2 });
  const frames = await loader('/frames/egypt/in-md', 64);
  assert.equal(frames.length, 64);
  assert.deepEqual(frames.map(image => image.url),
    Array.from({ length: 64 }, (_, i) => `/frames/egypt/in-md/frame_${i + 1}.webp?v=${FRAMES_VERSION}`));
  assert.equal(network.maximum(), 2);
});

test('all scenes share the concurrency limit', async () => {
  const network = images();
  const loader = createFrameLoader({ ...network, concurrency: 3 });
  await Promise.all([loader('/egypt', 10), loader('/china', 10), loader('/greek', 10)]);
  assert.equal(network.calls.size, 30);
  assert.equal(network.maximum(), 3);
});

test('retries transient failures before declaring a sequence ready', async () => {
  const network = images({ fail: (url, attempt) => url.endsWith('frame_2.webp') && attempt < 3 });
  const loader = createFrameLoader({ ...network, retryDelay: async () => {} });
  const frames = await loader('/scene', 3);
  assert.equal(frames.length, 3);
  assert.equal(network.calls.get('/scene/frame_2.webp'), 3);
  assert.equal(frames[1].url, `/scene/frame_2.webp?v=${FRAMES_VERSION}&retry=3`);
});

test('a frame that never loads borrows its neighbour so the scene still plays', async () => {
  const network = images({ fail: url => url.endsWith('frame_2.webp') });
  const loader = createFrameLoader({ ...network, retryDelay: async () => {} });
  const reported = [];
  const frames = await loader('/scene', 3, { onFrame: (image, index) => { reported[index] = image; } });
  assert.equal(network.calls.get('/scene/frame_2.webp'), 4);
  assert.equal(frames.length, 3);
  assert.equal(frames[1], frames[0]);
  assert.ok(frames.every(Boolean));
  assert.deepEqual(reported, frames);
});

test('a missing first frame borrows the next one', async () => {
  const network = images({ fail: url => url.endsWith('frame_1.webp') });
  const loader = createFrameLoader({ ...network, retryDelay: async () => {} });
  const frames = await loader('/scene', 3);
  assert.equal(frames[0], frames[1]);
  assert.equal(frames[1].url, `/scene/frame_2.webp?v=${FRAMES_VERSION}`);
});

test('a sequence with no frames at all still rejects', async () => {
  const network = images({ fail: () => true });
  const loader = createFrameLoader({ ...network, retryDelay: async () => {} });
  await assert.rejects(loader('/scene', 3), /Failed to load frame/);
});

test('aborting a scene cancels active and queued downloads', async () => {
  const network = images({ hold: true });
  const loader = createFrameLoader({ ...network, concurrency: 2 });
  const controller = new AbortController();
  const loading = loader('/scene', 30, { signal: controller.signal });
  controller.abort();
  await assert.rejects(loading, { name: 'AbortError' });
  assert.equal(network.calls.size, 2);
});
