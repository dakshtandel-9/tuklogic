// Services is a separate full-page experience, so links to it leave the
// captured site's client-side router and load the document from the server.
(() => {
  const servicesPath = /^\/(?:(en|ar)\/)?digital-services(?:\/|$)/;

  function servicesUrl(href) {
    const url = new URL(href, location.href);
    const match = url.origin === location.origin && servicesPath.exec(url.pathname);
    if (!match) return null;
    const locale = match[1] || (document.documentElement.lang === 'ar' ? 'ar' : 'en');
    return `/${locale}/digital-services`;
  }

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element && event.target.closest('a[href]');
    const target = link && servicesUrl(link.href);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(target);
  }, true);

  // Programmatic router navigation (menus, redirects) goes through history.
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (state, unused, url) {
      const target = url != null && servicesUrl(String(url));
      if (target) return location.assign(target);
      return original.apply(this, arguments);
    };
  }
})();
