// Bridge the shared header to the services experience's own audio state.
// Do not mount the main site's React runtime over its WebGL renderer.
const header = document.getElementById('service-site-header');
const audio = document.getElementById('service-audio-toggle');
const language = document.getElementById('service-language-toggle');

if (header && language) {
  const updateLanguageLink = () => {
    language.href = location.pathname.replace(/^\/(en|ar)(?=\/)/, `/${language.dataset.locale}`) + location.search + location.hash;
  };
  for (const type of ['click', 'pointerenter', 'focus', 'contextmenu']) language.addEventListener(type, updateLanguageLink);
  updateLanguageLink();
}

if (header && audio) {
  const arabic = header.lang === 'ar';
  let intendedState;
  const paint = enabled => {
    audio.setAttribute('aria-pressed', String(Boolean(enabled)));
    audio.setAttribute('aria-label', arabic
      ? (enabled ? 'كتم صوت الخلفية' : 'تشغيل صوت الخلفية')
      : (enabled ? 'Mute background music' : 'Unmute background music'));
  };
  // Record intent before the renderer's first mouseup can unlock Web Audio and
  // restore its saved preference. The user's first click must still do what
  // the button label promised. Keyboard activation follows the same path.
  const rememberIntent = () => { intendedState = audio.getAttribute('aria-pressed') !== 'true'; };
  audio.addEventListener('pointerdown', rememberIntent);
  audio.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') rememberIntent();
  });
  audio.addEventListener('click', () => {
    const enabled = intendedState ?? (audio.getAttribute('aria-pressed') !== 'true');
    intendedState = undefined;
    window.GlobalAudio3D.activateFromHeader();
    window.AppState.set('Global/audioEnabled', enabled);
    window.GlobalAudio3D.muted = !enabled;
    window.Storage.set('muted', !enabled);
    paint(enabled);
  });
  const connect = () => {
    if (!window.AppState?.bind || !window.GlobalAudio3D?.activateFromHeader
      || window.AppState.get('Global/audioEnabled') === undefined) {
      setTimeout(connect, 150);
      return;
    }
    window.AppState.bind('Global/audioEnabled', paint);
    audio.disabled = false;
  };
  connect();
}
