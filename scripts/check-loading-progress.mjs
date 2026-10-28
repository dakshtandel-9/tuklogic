import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLoadingProgress, PROGRESS_STEP_MS } from '../public/assets/loading-progress.js';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const values = [];
  let completions = 0;
  const counter = createLoadingProgress({
    onProgress: value => values.push(value),
    onComplete: () => { completions += 1; },
  });
  const step = () => t.mock.timers.tick(PROGRESS_STEP_MS);
  return { counter, values, step, completions: () => completions };
}

test('cached assets still display every number at the same pace', t => {
  const { counter, values, completions } = setup(t);
  counter.markReady();
  assert.deepEqual(values, [0]);
  for (let value = 1; value <= 100; value += 1) {
    t.mock.timers.tick(PROGRESS_STEP_MS - 1);
    assert.equal(values.at(-1), value - 1);
    t.mock.timers.tick(1);
    assert.equal(values.at(-1), value);
    assert.equal(completions(), value === 100 ? 1 : 0);
  }
  assert.deepEqual(values, Array.from({ length: 101 }, (_, value) => value));
  counter.markReady();
  t.mock.timers.tick(10000);
  assert.equal(completions(), 1);
  assert.equal(values.length, 101);
});

test('slow or stalled loading waits at 50 and resumes with 51', t => {
  const { counter, values, step, completions } = setup(t);
  for (let i = 0; i < 50; i += 1) step();
  assert.equal(values.at(-1), 50);
  t.mock.timers.tick(60000);
  assert.equal(values.at(-1), 50);
  assert.equal(completions(), 0);
  counter.markReady();
  counter.markReady();
  assert.equal(values.at(-1), 50);
  for (let value = 51; value <= 100; value += 1) {
    step();
    assert.equal(values.at(-1), value);
  }
  assert.equal(completions(), 1);
  assert.deepEqual(values, Array.from({ length: 101 }, (_, value) => value));
});

test('readiness midway through counting never skips a number', t => {
  const { counter, values, step } = setup(t);
  for (let i = 0; i < 23; i += 1) step();
  counter.markReady();
  assert.equal(values.at(-1), 23);
  step();
  assert.equal(values.at(-1), 24);
});

test('unmount cancels pending updates and completion', t => {
  const { counter, values, step, completions } = setup(t);
  step();
  counter.cancel();
  counter.markReady();
  t.mock.timers.tick(60000);
  assert.deepEqual(values, [0, 1]);
  assert.equal(completions(), 0);
});

test('a busy React render cannot let the timer skip a displayed number', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const values = [];
  let completed = false;
  const counter = createLoadingProgress({
    requirePaint: true,
    onProgress: value => values.push(value),
    onComplete: () => { completed = true; },
  });
  counter.markReady();
  t.mock.timers.tick(60000);
  assert.deepEqual(values, [0], 'wait for the initial visible commit');
  for (let value = 0; value < 100; value += 1) {
    counter.confirmPainted(value - 1); // Stale render acknowledgements do nothing.
    t.mock.timers.tick(10000);
    assert.equal(values.at(-1), value);
    counter.confirmPainted(value);
    t.mock.timers.tick(PROGRESS_STEP_MS);
    assert.equal(values.at(-1), value + 1);
    assert.equal(completed, false, '100 must also be painted before completion');
  }
  assert.deepEqual(values, Array.from({ length: 101 }, (_, value) => value));
  counter.confirmPainted(100);
  assert.equal(completed, true);
});

test('assets becoming ready at 70 cannot complete the visible countdown early', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const values = [];
  let completions = 0;
  const counter = createLoadingProgress({
    requirePaint: true,
    onProgress: value => values.push(value),
    onComplete: () => { completions += 1; },
  });
  // Loading pauses at 50 until the real assets are ready.
  for (let value = 0; value < 50; value += 1) {
    counter.confirmPainted(value);
    t.mock.timers.tick(PROGRESS_STEP_MS);
  }
  counter.confirmPainted(50);
  t.mock.timers.tick(10000);
  assert.equal(values.at(-1), 50);
  counter.markReady();
  t.mock.timers.tick(PROGRESS_STEP_MS);
  for (let value = 51; value < 100; value += 1) {
    if (value === 70) {
      counter.markReady();
      t.mock.timers.tick(10000);
      assert.equal(values.at(-1), 70);
      assert.equal(completions, 0);
    }
    counter.confirmPainted(value);
    t.mock.timers.tick(PROGRESS_STEP_MS);
  }
  assert.equal(values.at(-1), 100);
  assert.equal(completions, 0);
  counter.confirmPainted(100);
  counter.confirmPainted(100);
  assert.equal(completions, 1);
});
