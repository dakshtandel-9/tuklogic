/** Query flag that turns the captured homepage into the bare timeline shown on /test and /original. */
export const TIMELINE_ONLY_PARAM = 'timeline-only';

/** Value of the flag on /original, whose frames stream untouched from the original website. */
export const ORIGINAL_FRAMES = 'original';

/** The website the recovered frames come from (scripts/recover-test-frames.py). */
export const ORIGINAL_FRAMES_ORIGIN = 'https://uxbert.com';

/** /test and /original embed the real homepage, so the timeline runs on the homepage's own code and media. */
export function getTestPage(original = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>TUKLOGIC</title>
<style>
  html,body{margin:0;height:100%;overflow:hidden;background:#0b042a}
  iframe{display:block;width:100%;height:100%;border:0}
</style>
</head>
<body>
<iframe src="/en?${TIMELINE_ONLY_PARAM}=${original ? ORIGINAL_FRAMES : '1'}" title="Timeline" allow="autoplay; fullscreen"></iframe>
<script>document.querySelector('iframe').addEventListener('load', function () { this.focus(); });</script>
</body>
</html>`;
}

// Hide the header and intro overlays, swap in the recovered (or, on /original, the website's own) frames, start the experience without the visitor clicking,
// and swallow every real click so nothing on the page can be activated. Presses still reach the scenes so click-&-hold works.
const timelineOnly = (framesBase: string) => `<style>
  header.header,#introSet,div[style*="z-index: 99999"]{display:none!important}
  *{cursor:default!important}
  .scene,.scene *{cursor:none!important}
  .scene.shake > video.transition-all{visibility:hidden!important}
</style>
<script>
(function () {
  ['click','auxclick','dblclick','contextmenu'].forEach(function (type) {
    window.addEventListener(type, function (event) {
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  });
  // Play the original uxbert.com frames for every era except the first and last: the local copies on /test
  // (scripts/recover-test-frames.py), or the files straight from the website on /original.
  var frameSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get: frameSrc.get,
    set: function (value) {
      frameSrc.set.call(this, String(value).replace(/^\\/offline\\/frames\\/(egypt|china|greek|islamic|steve)\\//, '${framesBase}/$1/'));
    },
  });
  // The opening film is skipped by ending it the moment it mounts, which lands on the first scene.
  var started = false;
  new MutationObserver(function () {
    var start = !started && document.querySelector('#introSet button');
    if (start) { started = true; start.click(); }
    var intro = document.querySelector('.scene.shake > video.transition-all');
    if (intro && !intro.dataset.skipped) {
      intro.dataset.skipped = '1';
      intro.dispatchEvent(new Event('ended'));
    }
  }).observe(document, { childList: true, subtree: true });
})();
</script>`;

export function withTimelineOnly(html: string, original = false): string {
  const framesBase = original ? `${ORIGINAL_FRAMES_ORIGIN}/frames` : '/offline/test-frames';
  return html.replace('</head>', `${timelineOnly(framesBase)}</head>`);
}
