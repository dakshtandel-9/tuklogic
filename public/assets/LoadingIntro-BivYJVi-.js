import { g as React, k as gsap, j as jsx, a8 as Video } from "./ui-components-krT5pv9S.js";
import { createLoadingProgress } from "./loading-progress.js";
import { lightMedia } from "./homepage-story.js";

const LoadingIntro = ({ ready, onComplete }) => {
  const [progress, setProgress] = React.useState(0);
  const counterRef = React.useRef(null);
  const finishedRef = React.useRef(onComplete);
  React.useLayoutEffect(() => { finishedRef.current = onComplete; }, [onComplete]);

  React.useLayoutEffect(() => {
    let cancelled = false, holdFrame, fade;
    const overlay = document.getElementById("wormhole-intro");
    gsap.set(overlay, { opacity: 1 });
    const controller = createLoadingProgress({
      requirePaint: true,
      onProgress: setProgress,
      onComplete: () => {
        // Keep the committed 100% fully visible for 600 ms of foreground frames.
        let visibleMs = 0, previous;
        const hold = now => {
          if (cancelled) return;
          if (document.hidden) previous = undefined;
          else {
            if (previous !== undefined) visibleMs += Math.min(now - previous, 50);
            previous = now;
          }
          if (visibleMs < 600) { holdFrame = requestAnimationFrame(hold); return; }
          fade = gsap.to(overlay, {
            opacity: 0, duration: .6, ease: "power3.inOut",
            onComplete: () => { if (!cancelled) finishedRef.current(); },
          });
        };
        holdFrame = requestAnimationFrame(hold);
      },
    });
    counterRef.current = controller;
    return () => {
      cancelled = true;
      controller.cancel();
      cancelAnimationFrame(holdFrame);
      fade?.kill();
      counterRef.current = null;
    };
  }, []);

  React.useEffect(() => { if (ready) counterRef.current?.markReady(); }, [ready]);

  React.useLayoutEffect(() => {
    let secondFrame;
    // Layout effects run after React commits; two frames allow this exact number
    // to be painted before the next timer or the completion transition starts.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => counterRef.current?.confirmPainted(progress));
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [progress]);

  return jsx.jsxs("div", {
    className: "scene full_bg f a-c j-c", style: { zIndex: 10000 }, id: "wormhole-intro",
    children: [
      jsx.jsx(Video, { src: lightMedia ? "/videos/wormhole-light-20261030.webm" : "/videos/wormhole-20261029.webm", loop: true, muted: true, autoPlay: true, playsInline: true }),
      jsx.jsxs("div", {
        id: "main_progress", className: "main_progress f a-c j-c",
        children: [jsx.jsx("i", { className: "full_bg spinner" }), jsx.jsxs("h3", { id: "mainProgress", children: [progress, "%"] })],
      }),
    ],
  });
};
export { LoadingIntro as default };
