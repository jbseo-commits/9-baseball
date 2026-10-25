import React,{useEffect,useRef,useState} from 'react';
import {comparisonViewport,validLayoutMessage} from './battle-layout.js';

/* One App, one live battle. Never change the frame's key or src on A/B. */
export default function BattleLayoutCompare(){
  const frame=useRef(null),sequence=useRef(0),pending=useRef(null);
  const [size,setSize]=useState(()=>({width:window.innerWidth,height:window.innerHeight}));
  const [wide,setWide]=useState(()=>window.innerWidth>window.innerHeight);
  const [stage,setStage]=useState({battle:false,busy:false});
  const [src]=useState(()=>{const url=new URL(window.location.href);url.searchParams.set('battleLayout','inside');return url.href;});
  useEffect(()=>{
    const resize=()=>setSize({width:window.innerWidth,height:window.innerHeight});
    const message=e=>{
      if(!validLayoutMessage(e,frame.current?.contentWindow,window.location.origin))return;
      if(e.data.type==='9zone-layout-stage'){setStage(e.data);return;}
      if(e.data.requestId!==pending.current?.id)return;
      if(e.data.accepted)setWide(pending.current.wide);
      pending.current=null;
    };
    window.addEventListener('resize',resize);window.addEventListener('message',message);
    return()=>{window.removeEventListener('resize',resize);window.removeEventListener('message',message);};
  },[]);
  const choose=value=>{
    if(stage.busy||!stage.battle||value===wide)return;
    const id=++sequence.current;pending.current={id,wide:value};
    frame.current?.contentWindow?.postMessage({type:'9zone-layout-request',requestId:id},window.location.origin);
  };
  const viewport=comparisonViewport({...size,wide,battle:stage.battle});
  return <div className="battle-layout-compare" data-view={wide?'landscape':'portrait'}>
    <header className="blc-toolbar">
      <span role="status">{stage.busy?'실행 중':stage.battle?'같은 전투 · 화면만 전환':'전투에 들어가면 비교할 수 있어요'}</span>
      <div role="group" aria-label="같은 전투 화면 비교">
        <button type="button" aria-label="기존 세로 화면" aria-pressed={!wide} disabled={!stage.battle||stage.busy} onClick={()=>choose(false)}>세로</button>
        <button type="button" aria-label="새 가로 화면" aria-pressed={wide} disabled={!stage.battle||stage.busy} onClick={()=>choose(true)}>가로</button>
      </div>
    </header>
    <div className="blc-viewport"><iframe ref={frame} title="같은 전투 세로·가로 비교" src={src} allow="autoplay; fullscreen"
      style={{width:viewport.width,height:viewport.height,transform:`scale(${viewport.scale})`,transformOrigin:'top center'}}/></div>
  </div>;
}
