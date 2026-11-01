/* 사격 모드(시범) 연출 · pixelfx 버전 (2026-11-01).
   빗나감 = bullet-impact(탄착 섬광 + 파편 + 그을음), 명중 = crit-hit(금빛 별 + 깨지는 링 + 불꽃).
   효과는 칸마다 저해상도 캔버스(빗나감 픽셀 ×3, 명중 ×2) 하나에 그리고, 끝나면 지운다. 상태·판정은 건드리지 않는다.
   칸의 영구 구멍(.bp-shot-hole)은 화면이 상태로 그린다. 이 층은 순간만. */
import {createFrame,clearFrame,createFx,composite} from '../vendor/pixelfx/core/index.js';
import * as bulletImpact from '../vendor/pixelfx/fx/impacts/bullet-impact.js';
import * as critHit from '../vendor/pixelfx/fx/impacts/crit-hit.js';
import {cardFxSuppressed} from './card-fx.js';

/* 9ZONE 팔레트: 빗나감은 흙빛 파편(내야 흙), 명중은 금빛(에너지 구슬·HP 피해와 같은 계열) */
export const SHOT_PIXEL_LOOKS=Object.freeze({
  miss:{mod:bulletImpact,scale:3,w:64,h:48,height:12,max:.9,opts:{stone:'#6b4a33',light:1.6,seed:6}},
  hit:{mod:critHit,scale:2,w:120,h:88,height:20,max:.9,opts:{palette:['#241204','#4f2a08','#8f5414','#d9902a','#ffc23d','#ffe27a','#fff6c8','#ffffff'],seed:3}},
});

function layer(){
  let el=document.getElementById('shot-pixelfx-layer');
  if(!el){el=document.createElement('div');el.id='shot-pixelfx-layer';el.setAttribute('aria-hidden','true');
    Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'9001',pointerEvents:'none',overflow:'hidden'});document.body.appendChild(el);}
  return el;
}

function playOne(cell,look,flip=false){
  const r=cell.getBoundingClientRect(),{w,h,scale:S}=look;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext?.('2d');if(!ctx)return false;
  Object.assign(cv.style,{position:'fixed',width:w*S+'px',height:h*S+'px',imageRendering:'pixelated',pointerEvents:'none',
    left:Math.round(r.left+r.width/2-w*S/2)+'px',top:Math.round(r.top+r.height/2-h*S/2)+'px'});
  layer().appendChild(cv);
  /* 효과의 원점은 바닥, 충돌점은 height 위. 충돌점이 칸 한가운데 오도록 원점을 내린다. */
  const fx=createFx(look.mod,{...look.opts,flip,x:Math.round(w/2),y:Math.round(h/2)+look.height,height:look.height});
  const frame=createFrame(w,h),img=ctx.createImageData(w,h);
  let last=performance.now(),age=0;
  const done=()=>cv.remove();
  const tick=now=>{
    const dt=Math.min(.05,(now-last)/1000);last=now;age+=dt;
    fx.update(dt);clearFrame(frame);fx.draw(frame);composite(frame,img.data,null);ctx.putImageData(img,0,0);
    if(fx.done()||age>=look.max){done();return;}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(done,1600); // 탭을 막지 않는 층이지만, 프레임이 멈춰도 남지 않게
  return true;
}

export function playPixelShot(zones,hitZone=null,root=document){
  if(cardFxSuppressed()||!zones?.length||typeof requestAnimationFrame!=='function')return false;
  let any=false;
  for(const z of zones){
    const cell=root.querySelector?.(`.bp-zone [data-zone="${z}"]`);
    /* bullet-impact는 오른쪽 벽에 맞고 왼쪽으로 튄다. 몸쪽(왼쪽) 열에서는 뒤집어 파편이 판 안쪽으로 튀게 한다. */
    if(cell?.getBoundingClientRect)any=playOne(cell,z===hitZone?SHOT_PIXEL_LOOKS.hit:SHOT_PIXEL_LOOKS.miss,z%3===0)||any;
  }
  return any;
}
