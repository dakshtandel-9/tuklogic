// Progressive enhancement: the complete collection and project pages also work without JavaScript.
const filters = [...document.querySelectorAll('[data-filter]')];
const projects = [...document.querySelectorAll('[data-project]')];
const count = document.querySelector('[data-count]');

function filterProjects(selected) {
  if (!filters.some(link => link.dataset.filter === selected)) selected = 'all';
  filters.forEach(link => {
    if (link.dataset.filter === selected) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  let visible = 0;
  projects.forEach(project => {
    project.hidden = selected !== 'all' && project.dataset.group !== selected;
    if (!project.hidden) visible++;
  });
  if (count) count.textContent = `${String(visible).padStart(2, '0')} ${document.documentElement.lang === 'ar' ? count.dataset.ar : count.dataset.en}`;
}

filters.forEach(link => link.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const url = new URL(link.href);
  history.pushState(null, '', url.pathname + url.search);
  filterProjects(link.dataset.filter);
}));
if (filters.length) window.addEventListener('popstate', () => filterProjects(new URL(location.href).searchParams.get('filter') || 'all'));

const sectionLinks = [...document.querySelectorAll('.section-nav a[href^="#"]')];
if (sectionLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!active) return;
    sectionLinks.forEach(link => {
      if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  sectionLinks.forEach(link => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}

document.addEventListener('keydown', event => {
  const menu = document.querySelector('.mobile-menu[open]');
  if (event.key === 'Escape' && menu) {
    menu.removeAttribute('open');
    menu.querySelector('summary').focus();
  }
});
