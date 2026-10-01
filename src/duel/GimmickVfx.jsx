import React,{useEffect,useRef} from 'react';
import {VFX_SIZE,drawGimmickVfx,phaseLevel} from './gimmick-vfx.js';

/* 투수 뒤에 깔리는 도트 VFX 캔버스(.bp-pitcher 안, 투수보다 아래). 장식이라 입력을 받지 않는다. */
export default function GimmickVfx({id,tier,phase}){
  const ref=useRef(null);
  useEffect(()=>{
    const cv=ref.current,ctx=cv?.getContext?.('2d');if(!ctx)return undefined;
    const opts={level:phaseLevel(phase),boss:tier==='boss'};
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduced){drawGimmickVfx(ctx,id,1.3,opts);return undefined;}
    let raf=0,last=0;const t0=performance.now();
    const loop=now=>{
      raf=requestAnimationFrame(loop);
      if(document.hidden||now-last<50)return; // 20fps: 도트 감각 + 가벼움
      last=now;drawGimmickVfx(ctx,id,(now-t0)/1000,opts);
    };
    raf=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf);
  },[id,tier,phase]);
  return <canvas ref={ref} className="bp-gvfx" width={VFX_SIZE} height={VFX_SIZE} aria-hidden="true" data-testid="bp-gvfx"/>;
}
