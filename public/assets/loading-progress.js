// Display each percentage for the same duration, regardless of cache/network speed.
export const PROGRESS_STEP_MS = 60;
export const LOADING_PAUSE_PERCENT = 50;

export function createLoadingProgress({ onProgress, onComplete }) {
  let value = 0;
  let ready = false;
  let stopped = false;
  let timer = null;

  const schedule = () => {
    if (stopped || timer !== null || value >= (ready ? 100 : LOADING_PAUSE_PERCENT)) return;
    timer = setTimeout(() => {
      timer = null;
      if (stopped) return;
      value += 1;
      onProgress(value);
      if (value === 100) {
        stopped = true;
        onComplete();
      } else {
        schedule();
      }
    }, PROGRESS_STEP_MS);
  };

  onProgress(0);
  schedule();

  return {
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
