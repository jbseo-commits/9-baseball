import React,{useEffect,useState} from 'react';
import {layoutMode} from './layout-mode.js';

/* Wide windows play the phone layout: the same page in a 9:16 portrait iframe (see layout-mode.js).
   Same origin, so the save (localStorage) is shared. If the window turns tall, reload into the app. */
export default function PortraitFrame(){
  const lab=new URLSearchParams(window.location.search).get('experiment')==='defense';
  // Preserve the physical portrait size while keeping controls inside a usable
  // logical viewport. The battle needs 628px; 360x640 also preserves the 9:16 ratio.
  const minHeight=lab?568:640,minWidth=lab?320:360;
  const [height,setHeight]=useState(window.innerHeight);
  useEffect(()=>{
    const resize=()=>setHeight(window.innerHeight);
    window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);
  },[]);
  useEffect(()=>{
    const m=window.matchMedia?.('(orientation: landscape)');if(!m)return;
    const f=()=>{if(layoutMode()!=='frame')window.location.reload();};
    m.addEventListener?.('change',f);return()=>m.removeEventListener?.('change',f);
  },[]);
  return <div className="portrait-frame">
    <iframe className="portrait-frame-screen" title="9ZONE HOMEBOUND" src={window.location.href} allow="autoplay; fullscreen"
      style={height<minHeight?{width:minWidth,height:minHeight,flexShrink:0,transform:`scale(${height/minHeight})`,transformOrigin:'top center'}:undefined}/>
  </div>;
}
