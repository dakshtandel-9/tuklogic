import{loadFrames}from"./frame-loader.js";import{Q as A,ak as L,g as r,j as m,a8 as F}from"./ui-components-krT5pv9S.js";import{A as U}from"./AudioText-DReP9lcs.js";import{t as V}from"./main-B2LH-fDE.js";const y="/offline",STORY_FRAMES=[["egypt",64,33,34],["china",36,20,36],["greek",37,47,36],["islamic",37,61,34],["steve",23,50,35],["uxbert",58,44,0]],D=({onFinished:j,loaded:f})=>{const{t:P}=A("home"),R=L(o=>o.audios),[g,$]=r.useState(!1),[v,_]=r.useState(!1),[started,setStarted]=r.useState(!1),syncState=r.useRef(null),panned=r.useRef(!1),[p]=r.useState("/scenes/desktop/eh/intro.mp4?v=20261029b"),{isBelowSm:b}=V("sm"),E=L(o=>o.quality);r.useEffect(()=>{g&&j?.()},[g,j]);const introDone=r.useRef(!1),framesReady=r.useRef(Promise.resolve()),retryOpening=r.useRef(null),warming=r.useRef(null),a=r.useRef(null),finishIntro=()=>{
  // The first scene needs the throw and loop frames. They load while the intro plays,
  // so this only waits when the connection could not fetch them in time.
  const go=()=>{
    // Each scene loads after the previous one through the same queue; drop the
    // remaining warm-up so it never waits behind later eras.
    warming.current?.abort();
    $(!0)
  };
  // Opening frames that failed outright (not merely a few frames) are fetched again
  // ahead of the warm-up rather than leaving the intro's last frame on screen.
  introDone.current||(introDone.current=!0,framesReady.current.then(go,error=>{
    if(error?.name==="AbortError")return;
    warming.current?.abort();
    retryOpening.current?.().then(go,()=>{})
  }))
},C=r.useCallback(()=>{
  let disposed=!1,reported=!1;
  const e=a.current,controller=new AbortController;
  if(!e)return;
  const mobile=window.matchMedia("(max-width: 576px)").matches;
  // Filled in place as frames arrive. The homepage keeps these arrays and mounts
  // the first scene only after framesReady resolves, when they are complete.
  const n=[],i=[];
  const S=()=>{
    if(disposed||reported)return;
    reported=!0;
    // Asset readiness never hides the loader. Its visible 100% transition
    // invokes this start callback only after the countdown has been painted.
    f(100,!0,n,i,()=>{if(!disposed){_(!0)}});
  };
  let framesStarted=!1;
  // Frames start only once the intro can play, so they never compete with the
  // film the loader is waiting for; they are not shown until the intro ends.
  const startFrames=()=>{
    if(mobile||framesStarted)return;
    framesStarted=!0;
    const options=images=>({signal:controller.signal,onFrame:(image,index)=>{images[index]=image}});
    const opening=()=>Promise.all([
      loadFrames(`${y}/frames/eh/throw-${E}`,120,options(n)),
      loadFrames(`${y}/frames/eh/loop-${E}`,61,options(i)),
    ]);
    retryOpening.current=opening;
    framesReady.current=opening();
    framesReady.current.catch(error=>{if(error.name!=="AbortError")console.error("Unable to preload opening frames:",error)});
    // The network is otherwise idle during the intro. Cache the eras in story order
    // behind the opening frames; the scenes reuse whatever finished.
    warming.current=new AbortController;
    for(const[scene,...counts]of STORY_FRAMES)["in","hold","out"].forEach((part,index)=>{
      counts[index]&&loadFrames(`${y}/frames/${scene}/${part}-${E}`,counts[index],{signal:warming.current.signal}).catch(()=>{});
    });
  };
  const onCanPlay=()=>{startFrames();S()};
  const onError=event=>{console.error("Error loading video:",event)};
  e.addEventListener("canplay",onCanPlay);
  e.addEventListener("error",onError);
  if(e.readyState>=3)onCanPlay();
  else e.load();
  return()=>{
    disposed=!0;
    controller.abort();
    warming.current?.abort();
    e.removeEventListener("canplay",onCanPlay);
    e.removeEventListener("error",onError);
  };
},[f,E,b]);
// The intro film and its narration play as one: they start together once both can play,
// the narration waits whenever the film stalls, the film briefly waits for the narration,
// and small drift is corrected continuously, so they also end together.
const syncIntro=()=>{
  const e=a.current,o=L.getState().audios.intro?.audio;
  if(!e)return;
  let alive=!0,begun=!1,tick=null,ready=null,waitAudio=0;
  const audioOn=()=>L.getState().isAudioOn;
  const inRange=()=>!!o&&Number.isFinite(o.duration)&&e.currentTime<o.duration-.05;
  const playAudio=()=>{
    if(!o||!audioOn()||e.paused||e.ended||!inRange()||syncState.current?.blocked)return;
    Math.abs(o.currentTime-e.currentTime)>.08&&(o.currentTime=e.currentTime);
    if(!o.paused)return;
    const p=o.play();
    // Blocked until the next tap or key press (the unlock below resumes it in sync).
    p?.catch?.(error=>{error?.name==="NotAllowedError"&&syncState.current&&(syncState.current.blocked=!0)})
  };
  const sync=()=>{
    if(!alive||!o)return;
    if(waitAudio){
      if(o.readyState>=3||performance.now()-waitAudio>1500||!audioOn()){waitAudio=0;const p=e.play();p?.catch?.(()=>{})}
      return
    }
    if(!audioOn()){o.paused||o.pause();return}
    if(e.ended||!inRange()){o.playbackRate=1;return}
    if(e.paused||e.readyState<3){o.paused||o.pause();return}
    if(o.paused){playAudio();return}
    const d=o.currentTime-e.currentTime;
    if(Math.abs(d)>.25){o.currentTime=e.currentTime;o.playbackRate=1}
    else o.playbackRate=Math.abs(d)<.03?1:Math.min(1.08,Math.max(.92,1-d*1.5))
  };
  const onAudioWaiting=()=>{
    if(!begun||waitAudio||e.paused||e.ended||!audioOn()||!inRange())return;
    waitAudio=performance.now();e.pause()
  };
  const onEnded=()=>{clearInterval(tick);o&&(o.playbackRate=1)};
  const begin=()=>{
    if(begun||!alive)return;
    begun=!0;clearTimeout(ready);
    o&&(o.removeEventListener("canplay",begin),o.removeEventListener("canplaythrough",begin));
    try{e.currentTime=0}catch{}
    o&&(o.pause(),o.currentTime=0,o.playbackRate=1);
    const p=e.play();p?.catch?.(()=>{});
    playAudio();
    setStarted(!0);
    tick=setInterval(sync,150)
  };
  syncState.current={blocked:!1,kick:()=>{begun&&playAudio()}};
  e.addEventListener("playing",sync);e.addEventListener("waiting",sync);e.addEventListener("ended",onEnded);
  o&&(o.addEventListener("waiting",onAudioWaiting),o.addEventListener("stalled",onAudioWaiting));
  if(!o||!audioOn()||o.readyState>=3)begin();
  else{
    o.preload="auto";o.readyState===0&&o.networkState!==2&&o.load();
    o.addEventListener("canplay",begin);o.addEventListener("canplaythrough",begin);
    ready=setTimeout(begin,1500)
  }
  return()=>{
    alive=!1;clearInterval(tick);clearTimeout(ready);syncState.current=null;
    e.removeEventListener("playing",sync);e.removeEventListener("waiting",sync);e.removeEventListener("ended",onEnded);
    o&&(o.removeEventListener("waiting",onAudioWaiting),o.removeEventListener("stalled",onAudioWaiting),o.removeEventListener("canplay",begin),o.removeEventListener("canplaythrough",begin),o.pause(),o.currentTime=0,o.playbackRate=1)
  }
};
// Safari only lets audio start inside a tap or key press, and the intro starts after the
// loader's transition. Play the narration muted for an instant on the first gesture, and
// resume it in sync on any later gesture if it was still blocked.
const unlockIntro=()=>{
  let primed=!1;
  const u=()=>{
    const s=syncState.current;
    if(s){s.blocked=!1;s.kick();return}
    const o=L.getState().audios.intro?.audio;
    if(primed||!o||!o.paused||o.currentTime>0)return;
    primed=!0;o.preload="auto";o.muted=!0;
    const back=()=>{syncState.current||(o.pause(),o.currentTime=0);o.muted=!1};
    const p=o.play();
    p?.then?p.then(back,()=>{o.muted=!1;primed=!1}):back()
  };
  const types=["pointerdown","touchend","keydown","click"],opts={capture:!0,passive:!0};
  types.forEach(t=>document.addEventListener(t,u,opts));
  return()=>types.forEach(t=>document.removeEventListener(t,u,opts))
};
return r.useEffect(()=>C(),[]),r.useEffect(()=>v?syncIntro():void 0,[v]),r.useEffect(()=>g?void 0:unlockIntro(),[g]),g?null:m.jsxs(m.Fragment,{children:[started&&m.jsx(U,{manualAudio:!0,pasue:!started,speed:.41,audioSource:R.intro?.audio,text:P("scenes.intro.text"),delay:0}),m.jsx("div",{className:"scene shake full_bg f a-c j-c",children:p&&m.jsx(F,{controls:!1,controlsList:"nodownload nofullscreen noremoteplayback",disablePictureInPicture:!0,autoPlay:!1,ref:a,muted:!0,preload:"auto",onPlay:()=>{b&&!panned.current&&(panned.current=!0,setTimeout(()=>{a.current&&(a.current.style.objectPosition="20% bottom"),setTimeout(()=>{a.current.style.objectPosition="70% bottom"},1500),setTimeout(()=>{a.current.style.objectPosition="50% bottom"},3e3)},3e3))},onEnded:finishIntro,className:"transition-all duration-1000 ease-in-out",src:p,style:{opacity:v?1:0,transition:"opacity 4s ease-in-out"}})})]})};export{D as IntroScene};
