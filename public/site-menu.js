// Use the same header while the native dialog is open, so its logo, language
// switch, sound button and burger remain interactive in the modal top layer.
const toggle = document.getElementById('site-menu-toggle');
const panel = document.getElementById('site-menu-panel');
const header = document.getElementById('service-site-header');

if (toggle && panel) {
  let closeTimer, navigationTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const originalParent = header?.parentNode;
  const originalSibling = header?.nextSibling;
  const openLabel = toggle.getAttribute?.('aria-label') || 'Toggle navigation menu';

  const closeMenu = () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', openLabel);
    clearTimeout(closeTimer);
    if (reducedMotion.matches) panel.close();
    else closeTimer = setTimeout(() => panel.close(), 1100);
  };

  toggle.addEventListener('click', () => {
    if (panel.open) { closeMenu(); return; }
    clearTimeout(closeTimer);
    if (header) panel.prepend(header);
    panel.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', panel.lang === 'ar' ? 'إغلاق قائمة التنقل' : 'Close navigation menu');
    toggle.focus({ preventScroll: true });
    requestAnimationFrame(() => { if (panel.open) panel.classList.add('is-open'); });
  });
  panel.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  panel.addEventListener('close', () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', openLabel);
    if (header && originalParent) {
      originalParent.insertBefore(header, originalSibling?.parentNode === originalParent ? originalSibling : null);
    }
    toggle.focus({ preventScroll: true });
  });
  panel.addEventListener('click', event => {
    const link = event.target.closest?.('nav a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeMenu();
    clearTimeout(navigationTimer);
    navigationTimer = setTimeout(() => window.location.assign(link.href), reducedMotion.matches ? 0 : 500);
  });

  // Menu gestures must not also drive the WebGL experience behind it.
  for (const type of ['wheel', 'pointerdown', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'keydown']) {
    panel.addEventListener(type, event => event.stopPropagation());
  }
}
