// The services renderer has its own runtime. A native modal keeps the common
// navigation keyboard accessible without booting the captured React app twice.
const toggle = document.getElementById('site-menu-toggle');
const panel = document.getElementById('site-menu-panel');
const close = document.getElementById('site-menu-close');

if (toggle && panel && close) {
  let closeTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const closeMenu = () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    clearTimeout(closeTimer);
    if (reducedMotion.matches) panel.close();
    else closeTimer = setTimeout(() => panel.close(), 450);
  };

  toggle.addEventListener('click', () => {
    clearTimeout(closeTimer);
    panel.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => { if (panel.open) panel.classList.add('is-open'); });
  });
  close.addEventListener('click', closeMenu);
  panel.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  panel.addEventListener('close', () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus({ preventScroll: true });
  });

  // Menu gestures must not also drive the WebGL experience behind it.
  for (const type of ['wheel', 'pointerdown', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'keydown']) {
    panel.addEventListener(type, event => event.stopPropagation());
  }
}
