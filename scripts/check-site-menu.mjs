import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { getSiteNavigation } from '../public/site-navigation.js';

const source = await readFile(new URL('../public/site-menu.js', import.meta.url), 'utf8');

function setup(reducedMotion = false) {
  const toggle = new EventTarget();
  toggle.attributes = {};
  toggle.setAttribute = (name, value) => { toggle.attributes[name] = value; };
  toggle.focus = () => { toggle.focused = true; };
  const panel = new EventTarget();
  const classes = new Set();
  panel.classList = { add: value => classes.add(value), remove: value => classes.delete(value) };
  panel.showModal = () => { panel.open = true; };
  panel.close = () => { panel.open = false; panel.dispatchEvent(new Event('close')); };
  const close = toggle;
  const elements = { 'site-menu-toggle': toggle, 'site-menu-panel': panel };
  const timers = new Map();
  let timerId = 0;
  vm.runInNewContext(source, {
    document: { getElementById: id => elements[id] },
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    requestAnimationFrame: callback => callback(),
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
  });
  return { toggle, panel, close, classes, finishTransition: () => { for (const callback of timers.values()) callback(); timers.clear(); } };
}

test('both website runtimes use the same seven localized destinations', () => {
  for (const locale of ['en', 'ar']) {
    const items = getSiteNavigation(locale);
    assert.equal(items.length, 7);
    assert.equal(new Set(items.map(item => item.href)).size, 7);
    assert.ok(items.every(item => item.href.startsWith(`/${locale}`)));
    assert.equal(items[3].href, `/${locale}/digital-services`);
  }
  const translated = getSiteNavigation('en', key => `translated:${key}`);
  assert.equal(translated[0].label, 'translated:menu.thePast');
});

test('the same header button opens and closes the modal, restoring focus after the animation', () => {
  const ui = setup();
  ui.toggle.dispatchEvent(new Event('click'));
  assert.equal(ui.panel.open, true);
  assert.equal(ui.toggle.attributes['aria-expanded'], 'true');
  assert.ok(ui.classes.has('is-open'));
  ui.close.dispatchEvent(new Event('click'));
  assert.equal(ui.panel.open, true, 'keep the dialog modal during its exit animation');
  assert.equal(ui.toggle.attributes['aria-expanded'], 'false');
  ui.finishTransition();
  assert.equal(ui.panel.open, false);
  assert.equal(ui.toggle.focused, true);
});

test('Escape closes through the same animation and reduced motion closes immediately', () => {
  for (const reduced of [false, true]) {
    const ui = setup(reduced);
    ui.toggle.dispatchEvent(new Event('click'));
    const cancel = new Event('cancel', { cancelable: true });
    ui.panel.dispatchEvent(cancel);
    assert.equal(cancel.defaultPrevented, true);
    if (!reduced) ui.finishTransition();
    assert.equal(ui.panel.open, false);
    assert.equal(ui.toggle.focused, true);
  }
});
