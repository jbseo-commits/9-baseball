import React,{useEffect} from 'react';
import {layoutMode} from './layout-mode.js';

/* Wide windows play the phone layout: the same page in a 9:16 portrait iframe (see layout-mode.js).
   Same origin, so the save (localStorage) is shared. If the window turns tall, reload into the app. */
export default function PortraitFrame(){
  useEffect(()=>{
    const m=window.matchMedia?.('(orientation: landscape)');if(!m)return;
    const f=()=>{if(layoutMode()!=='frame')window.location.reload();};
    m.addEventListener?.('change',f);return()=>m.removeEventListener?.('change',f);
  },[]);
  return <div className="portrait-frame">
    <iframe className="portrait-frame-screen" title="9ZONE HOMEBOUND" src={window.location.href} allow="autoplay; fullscreen"/>
  </div>;
}
