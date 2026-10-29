// Share one queue across every scene, rather than requesting hundreds of images
// simultaneously. Keep frame order stable even when downloads finish out of order.

// Browsers keep frames for a week. Change this whenever frames are replaced under the
// same names, so returning visitors download the new ones instead of their old copies.
export const FRAMES_VERSION = '20261029';

// A stalled request is abandoned after timeoutMs and retried on a fresh URL, so one
// slow connection costs seconds, not the minute three 20 s attempts used to take.
export function createFrameLoader({ concurrency = 12, attempts = 4, timeoutMs = 8000,
  createImage = () => new Image(), retryDelay = attempt => new Promise(resolve => setTimeout(resolve, attempt * 400)),
} = {}) {
  const queue = [];
  let active = 0;
  const aborted = () => new DOMException('Frame loading cancelled', 'AbortError');

  const download = (src, signal, attempt) => new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(aborted()); return; }
    const image = createImage();
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      image.onload = image.onerror = null;
      if (error) { image.src = ''; reject(error); }
      else resolve(image);
    };
    const onAbort = () => finish(aborted());
    const timeout = setTimeout(() => finish(new Error(`Frame timed out: ${src}`)), timeoutMs);
    image.onload = () => {
      if (!image.naturalWidth) { finish(new Error(`Invalid frame: ${src}`)); return; }
      // Let canvas decode frames as needed. Eagerly decoding entire HD sequences
      // can retain over a gigabyte of bitmaps before the first scene plays.
      finish();
    };
    image.onerror = () => finish(new Error(`Failed to load frame: ${src}`));
    image.crossOrigin = 'anonymous';
    signal?.addEventListener('abort', onAbort, { once: true });
    // A failed response can remain in the browser cache. Retry a fresh URL.
    image.src = attempt > 1 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;
  });

  const run = async ({ src, signal, resolve, reject }) => {
    try {
      for (let attempt = 1; ; attempt += 1) {
        try { resolve(await download(src, signal, attempt)); return; }
        catch (error) {
          if (error.name === 'AbortError' || attempt >= attempts) throw error;
          await retryDelay(attempt);
        }
      }
    } catch (error) { reject(error); }
    finally { active -= 1; pump(); }
  };
  const pump = () => {
    while (active < concurrency && queue.length) {
      active += 1;
      void run(queue.shift());
    }
  };
  const load = (src, signal) => new Promise((resolve, reject) => {
    queue.push({ src, signal, resolve, reject });
    pump();
  });

  return async function loadFrames(basePath, count, { signal, onFrame } = {}) {
    let lastError = null;
    const frames = await Promise.all(Array.from({ length: count }, (_, index) =>
      load(`${basePath}/frame_${index + 1}.webp?v=${FRAMES_VERSION}`, signal).then(image => {
        if (signal?.aborted) throw aborted();
        onFrame?.(image, index);
        return image;
      }, error => {
        if (error.name === 'AbortError') throw error;
        lastError = error;
        return null;
      })));
    if (signal?.aborted) throw aborted();
    if (!lastError) return frames;
    // A frame that still fails after every retry must not hide the whole scene: every
    // later era waits for this one to report ready. Show its nearest loaded neighbour,
    // which reads as a dropped frame, and fail only when nothing loaded at all.
    if (!frames.some(Boolean)) throw lastError;
    console.warn(`Some frames of ${basePath} could not load; using neighbouring frames.`, lastError);
    return frames.map((image, index) => {
      if (image) return image;
      for (let distance = 1; ; distance += 1) {
        const near = frames[index - distance] || frames[index + distance];
        if (near) { onFrame?.(near, index); return near; }
      }
    });
  };
}

export const loadFrames = createFrameLoader();
