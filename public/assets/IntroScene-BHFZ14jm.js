import{loadFrames}from"./frame-loader.js";import{Q as A,ak as L,g as r,j as m,a8 as F}from"./ui-components-krT5pv9S.js";import{A as U}from"./AudioText-DReP9lcs.js";import{t as V}from"./main-B2LH-fDE.js";const y="/offline",D=({onFinished:j,loaded:f})=>{const{t:P}=A("home"),R=L(o=>o.audios),[g,$]=r.useState(!1),[v,_]=r.useState(!1),[p]=r.useState("/scenes/desktop/eh/intro.mp4?v=20261029"),{isBelowSm:b}=V("sm"),E=L(o=>o.quality);r.useEffect(()=>{g&&j?.()},[g,j]);const introDone=r.useRef(!1),a=r.useRef(null),finishIntro=()=>{introDone.current||(introDone.current=!0,$(!0))},C=r.useCallback(()=>{
  let disposed=!1,reported=!1;
  const e=a.current,controller=new AbortController;
  if(!e)return;
  const mobile=window.matchMedia("(max-width: 576px)").matches;
  let n=[],i=[],l=!1,c=mobile;
  const S=()=>{
    if(disposed||reported||!l||!c)return;
    reported=!0;
    // Asset readiness never hides the loader. Its visible 100% transition
    // invokes this start callback only after the countdown has been painted.
    f(100,!0,n,i,()=>{if(!disposed){_(!0)}});
  };
  const onCanPlay=()=>{l=!0;S()};
  const onError=event=>{console.error("Error loading video:",event)};
  e.addEventListener("canplay",onCanPlay);
  e.addEventListener("error",onError);
  if(e.readyState>=3)onCanPlay();
  else e.load();
  if(!mobile)(async()=>{
    try{
      n=await loadFrames(`${y}/frames/eh/throw-${E}`,120,{signal:controller.signal});
      i=await loadFrames(`${y}/frames/eh/loop-${E}`,61,{signal:controller.signal});
      if(!disposed){c=!0;S()}
    }catch(error){if(error.name!=="AbortError")console.error("Unable to preload opening frames:",error)}
  })();
  return()=>{
    disposed=!0;
    controller.abort();
    e.removeEventListener("canplay",onCanPlay);
    e.removeEventListener("error",onError);
  };
},[f,E,b]);return r.useEffect(()=>C(),[]),r.useEffect(()=>{if(v){const play=a.current?.play();play?.catch?.(()=>{})}},[v]),g?null:m.jsxs(m.Fragment,{children:[v&&m.jsx(U,{pasue:!v,speed:.41,audioSource:R.intro?.audio,text:P("scenes.intro.text"),delay:0}),m.jsx("div",{className:"scene shake full_bg f a-c j-c",children:p&&m.jsx(F,{controls:!1,controlsList:"nodownload nofullscreen noremoteplayback",disablePictureInPicture:!0,autoPlay:v,ref:a,muted:!0,preload:"auto",onPlay:()=>{b&&setTimeout(()=>{a.current&&(a.current.style.objectPosition="20% bottom"),setTimeout(()=>{a.current.style.objectPosition="70% bottom"},1500),setTimeout(()=>{a.current.style.objectPosition="50% bottom"},3e3)},3e3)},onEnded:finishIntro,className:"transition-all duration-1000 ease-in-out",src:p,style:{opacity:v?1:0,transition:"opacity 4s ease-in-out"}})})]})};export{D as IntroScene};
