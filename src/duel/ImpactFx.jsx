import React,{useEffect,useRef} from 'react';
import {IMPACT_PX,createImpactState,drawImpactFx,impactDuration,impactProfile} from './impact-fx.js';

/* 접점(공이 들어온 존 칸)에서 터지는 타격 연출 캔버스. 장식이라 입력을 받지 않는다.
   stage가 'impact'가 되는 순간 시작하고, 히트스톱(짧은 정지)을 scene에 건다. */
const STOP_MS=g=>({'grand-slam':110,homer:95,extra:75,'dead-center':65,solid:50,lucky:40,jammed:36,'battle-foul':40,foul:34,'near-miss-k':55,'chase-k':55,strikeout:60,'called-k':60}[g]||0);

export function contactPoint(scene,zone){
  const sr=scene.getBoundingClientRect(),zr=scene.querySelector('.bp-zone')?.getBoundingClientRect();
  if(!zr||!sr.width)return {x:sr.width*.55,y:sr.height*.6,sw:sr.width,sh:sr.height};
  const z=Number.isInteger(zone)?zone:4;
  if(z>8)return {x:zr.left-sr.left+zr.width*.5,y:zr.bottom-sr.top+zr.height*.06,sw:sr.width,sh:sr.height};
  const col=z%3,row=Math.floor(z/3);
  return {x:zr.left-sr.left+zr.width*(col+.5)/3,y:zr.top-sr.top+zr.height*(row+.5)/3,sw:sr.width,sh:sr.height};
}

export default function ImpactFx({sceneRef,stage,grade,zone,token}){
  const cv=useRef(null),started=useRef(null),run=useRef({raf:0,alive:false,scene:null});
  /* 연출은 impact에서 시작해 stage가 바뀌어도(slowmo→release→settle) 끝까지 간다. 정리는 언마운트 때만. */
  useEffect(()=>{
    if(stage!=='impact'||started.current===token)return;
    const scene=sceneRef.current,canvas=cv.current;
    if(!scene||!canvas||!impactProfile(grade))return;
    if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const ctx=canvas.getContext?.('2d');if(!ctx)return;
    started.current=token;
    const pt=contactPoint(scene,zone),px=IMPACT_PX;
    const W=Math.max(8,Math.ceil(pt.sw/px)),H=Math.max(8,Math.ceil(pt.sh/px));
    canvas.width=W;canvas.height=H;
    const st=createImpactState({W,H,px:Math.round(pt.x/px),py:Math.round(pt.y/px),grade,seed:(Number(token)||1)*7919+W});
    const dur=impactDuration(grade),stop=STOP_MS(grade);
    if(stop){scene.classList.add('bp-hitstop');setTimeout(()=>scene.classList.remove('bp-hitstop'),stop);}
    const r=run.current;r.alive=true;r.scene=scene;
    const t0=performance.now();
    const loop=now=>{
      if(!r.alive)return;const t=(now-t0)/1000;
      if(t>=dur){ctx.clearRect(0,0,W,H);return;}
      drawImpactFx(ctx,st,t);r.raf=requestAnimationFrame(loop);
    };
    r.raf=requestAnimationFrame(loop);
  },[stage,token,grade,zone,sceneRef]);
  useEffect(()=>()=>{const r=run.current;r.alive=false;cancelAnimationFrame(r.raf);r.scene?.classList.remove('bp-hitstop');},[]);
  return <canvas ref={cv} className="bp-impactfx" width="8" height="8" aria-hidden="true" data-testid="bp-impactfx"/>;
}
