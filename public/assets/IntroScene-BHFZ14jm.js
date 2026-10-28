import{loadFrames}from"./frame-loader.js";import{createLoadingProgress}from"./loading-progress.js";import{Q as A,ak as L,g as r,k as T,j as m,a8 as F}from"./ui-components-krT5pv9S.js";import{A as U}from"./AudioText-DReP9lcs.js";import{t as V}from"./main-B2LH-fDE.js";const y="/offline",D=({onFinished:j,loaded:f})=>{const{t:P}=A("home"),R=L(o=>o.audios),[g,$]=r.useState(!1),[v,_]=r.useState(!1),[p,B]=r.useState(null),{isBelowSm:b}=V("sm"),E=L(o=>o.quality);r.useEffect(()=>{g&&j?.()},[g,j]);const introDone=r.useRef(!1),a=r.useRef(null),finishIntro=()=>{introDone.current||(introDone.current=!0,$(!0))},C=r.useCallback(()=>{
  let disposed=!1,finishTimer,transitionTimer;
  const counter=createLoadingProgress({
    onProgress:value=>f(value,!1),
    onComplete:()=>{
      // Keep 100% visible before transitioning into the opening film.
      finishTimer=setTimeout(()=>{
        if(disposed)return;
        T.to("#wormhole-intro",{scale:2,ease:"power3.inOut",duration:.6,opacity:0});
        T.to("#main_progress",{autoAlpha:0,ease:"power3.inOut",duration:.6});
        transitionTimer=setTimeout(()=>{
          if(disposed)return;
          B("/scenes/desktop/eh/intro.mp4");
          f(100,!0,n,i);
          _(!0);
        },600);
      },250);
    }
  });
  const e=document.createElement("video"),controller=new AbortController;
  let n=[],i=[],l=!1,c=b;
  const S=()=>{if(!disposed&&l&&c)counter.markReady()};
  const onCanPlay=()=>{l=!0;S()};
  const onError=event=>{console.error("Error loading video:",event)};
  e.preload="auto",e.muted=!0,e.playsInline=!0;
  e.addEventListener("canplay",onCanPlay);
  e.addEventListener("error",onError);
  e.src=`${y}/scenes/desktop/eh/intro.mp4`;
  e.load();
  if(!b)(async()=>{
    try{
      n=await loadFrames(`${y}/frames/eh/throw-${E}`,120,{signal:controller.signal});
      i=await loadFrames(`${y}/frames/eh/loop-${E}`,61,{signal:controller.signal});
      if(!disposed){c=!0;S()}
    }catch(error){if(error.name!=="AbortError")console.error("Unable to preload opening frames:",error)}
  })();
  return()=>{
    disposed=!0;
    controller.abort();
    counter.cancel();
    clearTimeout(finishTimer);
    clearTimeout(transitionTimer);
    e.removeEventListener("canplay",onCanPlay);
    e.removeEventListener("error",onError);
    T.killTweensOf("#wormhole-intro");
    T.killTweensOf("#main_progress");
  };
},[f,E,b]);return r.useEffect(()=>C(),[]),g?null:m.jsxs(m.Fragment,{children:[v&&m.jsx(U,{pasue:!v,speed:.41,audioSource:R.intro?.audio,text:P("scenes.intro.text"),delay:0}),m.jsx("div",{className:"scene shake full_bg f a-c j-c",children:p&&m.jsx(F,{controls:!1,controlsList:"nodownload nofullscreen noremoteplayback",disablePictureInPicture:!0,autoPlay:!0,ref:a,muted:!0,preload:"auto",onCanPlay:()=>{b&&setTimeout(()=>{a.current&&(a.current.style.objectPosition="20% bottom"),setTimeout(()=>{a.current.style.objectPosition="70% bottom"},1500),setTimeout(()=>{a.current.style.objectPosition="50% bottom"},3e3)},3e3)},onEnded:finishIntro,className:"transition-all duration-1000 ease-in-out",src:p,style:{opacity:v?1:0,transition:"opacity 4s ease-in-out"}})})]})};export{D as IntroScene};
