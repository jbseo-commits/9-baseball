import React,{useEffect,useRef} from 'react';
import {IMPACT_PX} from '../impact-fx.js';
import {createContactPixelFx,contactHitstop} from '../contact-pixelfx.js';

/* 새 가로 전투 화면의 타격감 레이어(2026-11-06). 기존 화면 ImpactFx와 같은 contact-pixelfx(등급별 spark·crit·
   blunt·홈런 impact-frame)와 히트스톱을, 이 장면의 접점(카메라에 맞춘 화면 좌표)에서 한 번 터뜨린다.
   장식이라 입력을 받지 않는다(pointer-events:none). 판정·타이밍·상태는 건드리지 않는다. */
export default function ContactPixelFx({active=false,grade=null,token=0,contact=null,sceneRef}){
  const cv=useRef(null),fired=useRef(null),run=useRef({raf:0,alive:false,timer:0});
  useEffect(()=>{
    if(!active||!grade||!contact||fired.current===token)return;
    const canvas=cv.current,scene=sceneRef?.current;
    if(!canvas||!scene)return;
    if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const ctx=canvas.getContext?.('2d');if(!ctx)return;
    const w=scene.clientWidth,h=scene.clientHeight;if(!(w>0&&h>0))return;
    fired.current=token;
    const W=Math.max(8,Math.ceil(w/IMPACT_PX)),H=Math.max(8,Math.ceil(h/IMPACT_PX));
    canvas.width=W;canvas.height=H;
    let pfx=null;
    try{pfx=createContactPixelFx({W,H,px:Math.round(contact.x/IMPACT_PX),py:Math.round(contact.y/IMPACT_PX),grade,seed:(Number(token)||1)*131+W});}catch{pfx=null;}
    if(!pfx)return;
    const r=run.current;
    const stop=contactHitstop(grade);
    if(stop){scene.classList.add('bv-hitstop');clearTimeout(r.timer);r.timer=setTimeout(()=>scene.classList.remove('bv-hitstop'),stop);}
    cancelAnimationFrame(r.raf);r.alive=true;
    const t0=performance.now();
    const loop=now=>{
      if(!r.alive)return;
      ctx.clearRect(0,0,W,H);
      if(!pfx||pfx.done())return;
      try{pfx.draw(ctx,(now-t0)/1000);}catch{pfx=null;return;}
      r.raf=requestAnimationFrame(loop);
    };
    r.raf=requestAnimationFrame(loop);
  },[active,grade,token,contact,sceneRef]);
  useEffect(()=>()=>{const r=run.current;r.alive=false;cancelAnimationFrame(r.raf);clearTimeout(r.timer);sceneRef?.current?.classList.remove('bv-hitstop');},[sceneRef]);
  return <canvas ref={cv} className="bv-contact-pixelfx" width="8" height="8" aria-hidden="true" data-testid="bv-contact-pixelfx"/>;
}
