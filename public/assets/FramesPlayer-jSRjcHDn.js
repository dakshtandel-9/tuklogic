import{loadFrames}from"./frame-loader.js";import{g as yt,j as At}from"./ui-components-krT5pv9S.js";import{t as Tt}from"./main-B2LH-fDE.js";
// Drawing a frame that is still compressed decodes it on the main thread, at 15 ms (fast laptop)
// to 50 ms (low-end) per full-HD frame. Frames are instead decoded a few steps ahead of the
// playhead with createImageBitmap(Blob), which runs off the main thread, so drawing is a copy.
const AHEAD=10,BEHIND=2,RELEASE_AFTER=4e3,canDecode=typeof createImageBitmap=="function"&&typeof fetch=="function";
function Lt({framesPath:pt,totalFrames:ut,isLoop:v,onFinish:U,playbackRate:x=1.5,playReverse:l=!1,loaded:h,autoPlay:n,setPlayer:u,framesImages:_}){const b=yt.useRef(null),m=yt.useRef(null),[g,s]=yt.useState({width:0,height:0}),{isBelowMd:r}=Tt("md");return yt.useEffect(()=>{const i=b.current;if(!m.current||!i)return;const a=i.getContext("2d",{alpha:!1});if(!a)return;
  const f=_||[],controller=new AbortController,blobs=new Map,bitmaps=new Map,prepared=new Map;
  // A hidden player keeps a 1x1 canvas and no decoded frames; its full-size canvas and frames
  // come back when it is shown or asked to draw.
  let size=null,released=!0,shown=!1,playing=!1,releaseTimer,lastDrawn=-1,dir=1;
  const blobOf=index=>{let p=blobs.get(index);if(!p){p=fetch(f[index].src,{signal:controller.signal}).then(res=>{if(!res.ok)throw new Error(res.status);return res.blob()});p.catch(()=>blobs.delete(index));blobs.set(index,p)}return p};
  const keepAround=(index,ahead)=>{
    if(!canDecode||released||!ut)return;
    const keep=new Set;
    for(let k=-BEHIND;k<=ahead;k++){let j=index+k*dir;if(v)j=(j%ut+ut)%ut;j>=0&&j<ut&&keep.add(j)}
    for(const[j,entry]of bitmaps)keep.has(j)||(entry.dead=!0,entry.bitmap?.close(),bitmaps.delete(j));
    for(const j of keep){
      if(bitmaps.has(j)||!f[j]?.complete||!f[j].naturalWidth)continue;
      const entry={bitmap:null,dead:!1};bitmaps.set(j,entry);
      blobOf(j).then(blob=>createImageBitmap(blob)).then(bitmap=>{entry.dead?bitmap.close():entry.bitmap=bitmap},()=>{bitmaps.get(j)===entry&&bitmaps.delete(j)});
    }
  };
  const restore=()=>{if(!released||!size)return;released=!1;i.width=size[0];i.height=size[1];lastDrawn=-1};
  const release=()=>{
    if(shown||playing){return}
    released=!0;lastDrawn=-1;
    for(const entry of bitmaps.values())entry.dead=!0,entry.bitmap?.close();
    bitmaps.clear();blobs.clear();i.width=i.height=1;
  };
  // The scene lists the frames this player will show first when it is next shown (negative
  // counts from the end). They are decoded now, so show() draws a ready frame; frames that
  // drop off the list are freed.
  const prepare=list=>{
    const want=new Set((list||[]).map(j=>j<0?j+ut:j));
    for(const[j,entry]of prepared)want.has(j)||(entry.dead=!0,entry.bitmap?.close(),prepared.delete(j));
    if(!canDecode)return;
    for(const j of want){
      if(prepared.has(j)||bitmaps.get(j)?.bitmap||!f[j]?.complete||!f[j].naturalWidth)continue;
      const entry={bitmap:null,dead:!1};prepared.set(j,entry);
      blobOf(j).then(blob=>createImageBitmap(blob)).then(bitmap=>{entry.dead?bitmap.close():entry.bitmap=bitmap},()=>{prepared.get(j)===entry&&prepared.delete(j)});
    }
  };
  // Draw only when the picture changes: the play loop runs at the display's refresh rate
  // (60-144 Hz), while frames advance 36 times a second. While playing, a frame whose decode
  // has not finished is skipped for up to 100 ms rather than decoded on the main thread.
  let lastDrawAt=0;
  const draw=(index,force)=>{
    const image=f[index];
    if(!image?.complete||!image.naturalWidth)return;
    restore();
    if(index!==lastDrawn||force){
      let entry=bitmaps.get(index);const ready=prepared.get(index);
      if(ready?.bitmap){prepared.delete(index);if(entry?.bitmap)ready.bitmap.close();else{entry&&(entry.dead=!0);entry={bitmap:ready.bitmap,dead:!1};bitmaps.set(index,entry)}}
      const bitmap=entry?.bitmap,now=performance.now();
      if(bitmap||force||!playing||!canDecode||now-lastDrawAt>100){a.drawImage(bitmap||image,0,0,i.width,i.height);lastDrawn=index;lastDrawAt=now}
    }
    keepAround(index,playing?AHEAD:1);
  };
  const setSize=image=>{size=[image.width,image.height];s({width:image.width,height:image.height});if(!released){i.width=size[0];i.height=size[1];lastDrawn=-1}};
  const w=async D=>{
  try{
    await loadFrames(D,ut,{signal:controller.signal,onFrame:(image,index)=>{
      f[index]=image;
      if(index===0){setSize(image);shown&&draw(y,!0)}
    }});
    h?.(B),n&&L();
  }catch(error){
    if(error.name==="AbortError")return;
    console.error("Unable to load animation:",D,error);
    // Still report the scene, so the eras after it keep mounting instead of all staying hidden.
    h?.(B);
  }
};let y=0,R,O=!1;
  const L=D=>{if(O){cancelAnimationFrame(R);return}dir=D?-1:1;playing=!0;lastDrawAt=performance.now();let G=null,p=y;keepAround(y,AHEAD);const E=e=>{if(O){cancelAnimationFrame(R);playing=!1;return}G||(G=e);const T=(e-G)*x,q=D?p-Math.floor(T/(1e3/24)):p+Math.floor(T/(1e3/24));q>=0&&q<ut?(y=q,draw(y),R=requestAnimationFrame(E)):v?(G=null,p=D?ut-1:0,R=requestAnimationFrame(E)):(playing=!1,U&&U())};R=requestAnimationFrame(E)},
  B={goToNextFrame:D=>{if(cancelAnimationFrame(R),O=!0,playing=!1,dir=1,y++,y>=ut)return D?.();draw(y),O=!1},goToPrevFrame:D=>{if(cancelAnimationFrame(R),O=!0,playing=!1,dir=-1,y--,y<0)return D?.();draw(y),O=!1},getTotalFrames:()=>ut,goToFrame:(D,G)=>{cancelAnimationFrame(R),O=!0,playing=!1,y=D,draw(y,!0),O=!1,G&&G()},goFromToFrame:(D,G,p)=>{cancelAnimationFrame(R),O=!0,y=D;const E=D>G;dir=E?-1:1;const e=()=>{(E?y>=G:y<=G)?(draw(y),y+=E?-1:1,requestAnimationFrame(e)):(O=!1,p&&p())};e()},play:D=>{cancelAnimationFrame(R),O=!1,L(D)},pause:()=>{O=!0,playing=!1},reset:()=>{y=0,draw(0,!0)},resetReverse:()=>{y=ut-1,draw(ut-1,!0)},onFinish:D=>{U=D},show:()=>{shown=!0,clearTimeout(releaseTimer),m.current&&(m.current.style.visibility="visible",m.current.style.opacity="1"),released&&draw(y,!0)},hide:()=>{shown=!1,m.current&&(m.current.style.visibility="hidden",m.current.style.opacity="0"),clearTimeout(releaseTimer),releaseTimer=setTimeout(release,RELEASE_AFTER)},getCurrentFrame:()=>y,prepare};
  if(u&&u(B),_)h?.(B),setSize(_[0]),n&&L();else if(pt)w(`/offline${pt}`);
  return()=>{controller.abort(),cancelAnimationFrame(R),clearTimeout(releaseTimer),shown=!0,playing=!0;for(const entry of[...bitmaps.values(),...prepared.values()])entry.dead=!0,entry.bitmap?.close();bitmaps.clear(),prepared.clear(),blobs.clear()}},[pt,m,ut,v,U,x,l,n,u]),At.jsx("div",{ref:m,style:{display:"flex",justifyContent:"center",alignItems:"center",width:"100vw",height:"100vh",backgroundColor:"black",visibility:"hidden",opacity:0,position:"absolute",zIndex:1e3},children:At.jsx("canvas",{ref:b,style:{width:r?`${g.width}px`:"100%",height:"100%",objectFit:"cover"}})})}export{Lt as F};
