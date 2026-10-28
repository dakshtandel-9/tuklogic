// Display each percentage for the same duration, regardless of cache/network speed.
// Each number also waits for two painted frames (about 33 ms), so a full count
// takes roughly four seconds when everything is already loaded.
export const PROGRESS_STEP_MS = 10;
export const LOADING_PAUSE_PERCENT = 50;

export function createLoadingProgress({ onProgress, onComplete, requirePaint = false }) {
  let value = 0;
  let ready = false;
  let stopped = false;
  let timer = null;
  let awaitingPaint = requirePaint;

  const complete = () => {
    stopped = true;
    onComplete();
  };

  const schedule = () => {
    if (stopped || awaitingPaint || timer !== null || value >= (ready ? 100 : LOADING_PAUSE_PERCENT)) return;
    timer = setTimeout(() => {
      timer = null;
      if (stopped) return;
      value += 1;
      awaitingPaint = requirePaint;
      onProgress(value);
      if (value === 100) {
        if (!requirePaint) complete();
      } else {
        schedule();
      }
    }, PROGRESS_STEP_MS);
  };

  onProgress(0);
  schedule();

  return {
    // The visible loader acknowledges each committed number after a paint.
    // A busy render or a background tab can delay counting, never skip numbers.
    confirmPainted(paintedValue) {
      if (stopped || !awaitingPaint || paintedValue !== value) return;
      awaitingPaint = false;
      if (value === 100) complete();
      else schedule();
    },
    markReady() {
      if (stopped) return;
      ready = true;
      schedule();
    },
    cancel() {
      stopped = true;
      clearTimeout(timer);
      timer = null;
    },
  };
}
