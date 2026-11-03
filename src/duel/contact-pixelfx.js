/* 타격감 · pixelfx 접점 레이어 (2026-11-03).
   ImpactFx(손으로 그린 플래시·충격파·궤적) 위에 pixelfx 효과를 같은 접점·같은 논리 픽셀(IMPACT_PX)로 덧그린다.
   - 안타 계열: 정타 = hit-spark 두 줄기, 장타·정중앙 = crit-hit, 홈런·만루홈런 = crit-hit(금빛) + 장면 전체 impact-frame 컷.
   - 빗맞음·아웃·희생: blunt-hit(흙먼지 쿵).  파울: 위로 튀는 작은 hit-spark.  헛스윙·삼진·루킹은 기존 연출만.
   상태·판정·타이밍은 건드리지 않는다. 장식이라 입력을 받지 않는다. */
import {createFrame,clearFrame,createFx,composite,fit} from '../vendor/pixelfx/core/index.js';
import * as critHit from '../vendor/pixelfx/fx/impacts/crit-hit.js';
import * as hitSpark from '../vendor/pixelfx/fx/impacts/hit-spark.js';
import * as bluntHit from '../vendor/pixelfx/fx/impacts/blunt-hit.js';
import * as impactFrame from '../vendor/pixelfx/fx/impacts/impact-frame.js';

/* 9ZONE 팔레트: 안타 = 뜨거운 금·주황, 홈런 = 금빛, 빗맞음 = 내야 흙, 파울 = 노란 챙 */
export const CONTACT_PALETTES=Object.freeze({
  hot:['#3a0e04','#7a2a08','#c4561a','#ff8a2a','#ffc23d','#fff09a','#ffffff'],
  gold:['#241204','#4f2a08','#8f5414','#d9902a','#ffc23d','#ffe27a','#fff6c8','#ffffff'],
  foul:['#2a1e06','#5e4410','#a8801e','#e8c040','#fff08a','#ffffff'],
  dust:['#1d1620','#4a3a3c','#7d6a66','#b09c90','#dccab4','#f6ead2','#ffffff'],
  frame:['#140a04','#6a3a10','#fff4d6'],
});

/* 320x180 impact-frame의 첫 4박(종이·종이·먹·먹)은 꽉 찬 면이다. 장면이 그보다 크면 그 면을 레이어 전체로 넓혀
   가장자리에서 경기장이 비치지 않게 한다. 나머지(선이 빠져나가는 4박)는 원본 그대로. */
export const fullImpactFrame=Object.freeze({
  meta:impactFrame.meta,
  create(o){
    const inner=impactFrame.create(o),C=fit(o.palette,3),INK=C[0],PAPER=C[2];
    return {update(dt){inner.update(dt);},
      draw(p,t,opts){const f=Math.floor(t*30+1e-6);if(f<4)p.shade(-4000,-4000,4000,4000,()=>f<2?PAPER:INK);inner.draw(p,t,opts);}};
  },
});
const MODS={crit:critHit,spark:hitSpark,blunt:bluntHit,frame:fullImpactFrame};

/* 등급 → 겹쳐 그릴 pixelfx 목록. height = 접점이 효과 원점(바닥)보다 몇 논리 픽셀 위인지. delay(초)는 시차. */
export function contactPixelPlan(grade){
  const P=CONTACT_PALETTES;
  switch(grade){
    case 'grand-slam':return [{fx:'frame',opts:{palette:P.frame,lines:72}},{fx:'crit',delay:.13,opts:{palette:P.gold,height:30,light:1.35}},{fx:'spark',delay:.13,opts:{palette:P.gold,height:22,aim:-.35}},{fx:'spark',delay:.16,opts:{palette:P.gold,height:22,aim:.3}}];
    case 'homer':return [{fx:'frame',opts:{palette:P.frame,lines:60}},{fx:'crit',delay:.13,opts:{palette:P.gold,height:28,light:1.25}},{fx:'spark',delay:.13,opts:{palette:P.gold,height:20,aim:-.3}}];
    case 'extra':return [{fx:'crit',opts:{palette:P.hot,height:24,light:1.15}},{fx:'spark',delay:.03,opts:{palette:P.hot,height:18,aim:-.25}}];
    case 'dead-center':return [{fx:'crit',opts:{palette:P.hot,height:22,light:1.1}}];
    case 'solid':case 'hit':return [{fx:'spark',opts:{palette:P.hot,height:20}},{fx:'spark',delay:.02,opts:{palette:P.hot,height:16,aim:-.3}}];
    case 'lucky':return [{fx:'spark',opts:{palette:P.hot,height:16,aim:-.45}}];
    case 'jammed':case 'out':case 'sacrifice':case 'sacrifice-run':return [{fx:'blunt',opts:{palette:P.dust,height:16}}];
    case 'battle-foul':return [{fx:'spark',opts:{palette:P.foul,height:18,aim:-.6}},{fx:'spark',delay:.04,opts:{palette:P.foul,height:14,aim:-.9}}];
    case 'foul':return [{fx:'spark',opts:{palette:P.foul,height:16,aim:-.7}}];
    default:return [];
  }
}

/* 히트스톱(장면 CSS 애니메이션 정지, ms). 홈런·만루홈런은 impact-frame 컷(약 133ms)이 끝날 때까지 멈춘다. */
const HITSTOP={'grand-slam':170,homer:150,extra:105,'dead-center':95,solid:72,lucky:50,jammed:48,out:48,sacrifice:44,'sacrifice-run':44,
  'battle-foul':50,foul:40,'near-miss-k':55,'chase-k':55,strikeout:65,'called-k':60};
export function contactHitstop(grade){return HITSTOP[grade]||0;}

/* 논리 픽셀 장면(W×H)에서 접점(px,py)에 효과를 만든다. 반환값 draw(ctx,t)는 ctx 위에 덧그린다(지우지 않음). */
export function createContactPixelFx({W,H,px,py,grade,seed=1,doc=globalThis.document}){
  const plan=contactPixelPlan(grade);if(!plan.length||!(W>0&&H>0))return null;
  const items=plan.map((p,i)=>({...p,fx:createFx(MODS[p.fx],{...p.opts,seed:(seed+i*31)%9973,
    /* 효과 원점은 바닥, 접점은 height 위 → 원점을 height만큼 내린다. impact-frame은 접점이 중심. */
    x:px,y:p.fx==='frame'?py:py+(p.opts.height||0)}),delay:p.delay||0}));
  const frame=createFrame(W,H),off=doc?.createElement?.('canvas');
  const octx=off?(off.width=W,off.height=H,off.getContext?.('2d')):null;
  const img=octx?.createImageData?octx.createImageData(W,H):null;
  let last=0;
  return {
    items,
    /* t: 접점 이후 초. 지난 시간만큼 각 효과를 진행한다. */
    draw(ctx,t){
      const dt=Math.max(0,Math.min(.05,t-last));last=t;
      clearFrame(frame);let live=0;
      for(const it of items){if(t<it.delay||it.fx.done())continue;it.fx.update(dt);it.fx.draw(frame);live++;}
      if(!live||!img||!octx)return live;
      composite(frame,img.data,null);octx.putImageData(img,0,0);
      const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(off,0,0);ctx.imageSmoothingEnabled=smooth;
      return live;
    },
    done(){return items.every(it=>it.fx.done());},
  };
}
