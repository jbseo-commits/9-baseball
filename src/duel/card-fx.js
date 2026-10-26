/* P3 카드 연출 (2026-10-24): 획득 · 사용 · 소모 · 제거가 눈으로 이어지게.
   - 규칙·상태는 건드리지 않는다. 게임은 이미 결정을 반영했고, 이 층은 그 위에 0.3~0.8초 그림만 그린다.
     그래서 연출 중 중복 입력이 상태를 꼬이게 할 수 없다(입력 잠금은 기존 화면 규칙 그대로).
   - transform/opacity만 움직인다(Web Animations API). 탭하면 즉시 사라진다.
   - 자동 진행(체험 자동전투)·움직임 줄이기 설정에서는 그리지 않는다.
   - 소리는 앱의 효과음 설정(setCardFxSound)을 따른다. */
import {cue} from './audio.js';

let soundOn=false;
export function setCardFxSound(on){soundOn=!!on;}

/* 희귀도 → 테두리 빛. common 흰색 / uncommon·rare 파랑 / signature(강력) 금색 + 글로우 */
export const RARITY_GLOW=Object.freeze({
  common:{color:'#f4f1e8',glow:'0 0 10px rgba(255,255,255,.55)',cue:'cardGet'},
  uncommon:{color:'#5fb8ff',glow:'0 0 16px rgba(95,184,255,.8)',cue:'cardRare'},
  rare:{color:'#5fb8ff',glow:'0 0 22px rgba(95,184,255,.95)',cue:'cardRare'},
  signature:{color:'#ffcc3a',glow:'0 0 18px rgba(255,204,58,.95),0 0 36px rgba(255,170,30,.7)',cue:'cardRare'},
});
export const CARD_FX_MS=Object.freeze({acquire:720,use:520,burn:760,drop:420});

export function cardFxSuppressed(){
  if(typeof document==='undefined'||typeof document.body?.animate!=='function')return true;
  if(document.documentElement?.dataset?.autoSim==='1')return true;
  try{if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return true;}catch{}
  return false;
}

function layer(){
  let el=document.getElementById('card-fx-layer');
  if(!el){el=document.createElement('div');el.id='card-fx-layer';
    Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'9000',pointerEvents:'none',overflow:'hidden'});document.body.appendChild(el);}
  return el;
}
/* a skippable piece: visible → takes the tap that skips it; gone → removed (never left catching touches) */
function piece(rect,style={}){
  const el=document.createElement('div');
  Object.assign(el.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',
    pointerEvents:'auto',willChange:'transform,opacity',borderRadius:'8px',boxSizing:'border-box',...style});
  const done=()=>el.remove();
  setTimeout(done,1200); // never outlive the 0.3–0.8s budget, even if an animation never reports finish
  el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();done();},{once:true});
  layer().appendChild(el);
  return {el,done};
}
/* a plain face (not a DOM clone: clones would carry ids/classes into the page and lose scoped styles) */
const cloneFace=(from,el)=>{
  const name=(from.querySelector('strong')?.textContent||from.getAttribute('aria-label')||'').trim().slice(0,14);
  Object.assign(el.style,{display:'flex',alignItems:'center',justifyContent:'center',padding:'6px',textAlign:'center',
    background:'linear-gradient(160deg,#1b2740 0%,#0c1322 70%)',color:'#f6efd9',font:'800 13px/1.2 system-ui,sans-serif',overflow:'hidden'});
  el.textContent=name;el.setAttribute('aria-hidden','true');
};
const center=r=>({x:r.left+r.width/2,y:r.top+r.height/2});

/* 3-1 획득: 고른 카드가 덱으로 날아가며 뒤집힌다. 희귀도 빛 */
export function playAcquire(fromEl,toEl,tier='common'){
  if(cardFxSuppressed()||!fromEl?.getBoundingClientRect)return false;
  const a=fromEl.getBoundingClientRect(),b=toEl?.getBoundingClientRect?.()||{left:a.left,top:-a.height,width:a.width,height:a.height};
  const g=RARITY_GLOW[tier]||RARITY_GLOW.common,{el,done}=piece(a,{border:`2px solid ${g.color}`,boxShadow:g.glow});
  cloneFace(fromEl,el);
  const ca=center(a),cb=center(b),dx=cb.x-ca.x,dy=cb.y-ca.y;
  el.animate([
    {transform:'perspective(600px) rotateY(180deg) scale(1)',opacity:1},
    {transform:'perspective(600px) rotateY(0deg) scale(1.08)',opacity:1,offset:.45},
    {transform:`translate(${dx}px,${dy}px) perspective(600px) rotateY(0deg) scale(.18)`,opacity:.2},
  ],{duration:CARD_FX_MS.acquire,easing:'cubic-bezier(.3,.7,.2,1)'}).onfinish=done;
  if(soundOn)cue(g.cue);
  return true;
}

/* 3-2 사용: 준비 카드가 존 그리드로 날아가 꽂히고, 꽂힌 자리가 번쩍인다 */
export function playUse(fromEl,toEl){
  if(cardFxSuppressed()||!fromEl?.getBoundingClientRect||!toEl?.getBoundingClientRect)return false;
  const a=fromEl.getBoundingClientRect(),b=toEl.getBoundingClientRect(),{el,done}=piece(a,{border:'2px solid #64d2ff',boxShadow:'0 0 14px rgba(100,210,255,.8)'});
  cloneFace(fromEl,el);
  const ca=center(a),cb=center(b),dx=cb.x-ca.x,dy=cb.y-ca.y;
  el.animate([
    {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1},
    {transform:`translate(${dx*.6}px,${dy*.6-30}px) scale(.7) rotate(-8deg)`,opacity:1,offset:.55},
    {transform:`translate(${dx}px,${dy}px) scale(.35) rotate(0deg)`,opacity:.9},
  ],{duration:CARD_FX_MS.use,easing:'cubic-bezier(.45,0,.2,1)'}).onfinish=()=>{done();flash(b);};
  if(soundOn)cue('cardUse');
  return true;
}
function flash(rect){
  if(cardFxSuppressed())return;
  const {el,done}=piece(rect,{background:'radial-gradient(circle,rgba(180,240,255,.85) 0%,rgba(100,210,255,.25) 55%,transparent 75%)',pointerEvents:'none'});
  el.animate([{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1.05)',offset:.3},{opacity:0,transform:'scale(1.2)'}],{duration:320,easing:'ease-out'}).onfinish=done;
}

/* 3-3 소모: 에너지 구슬이 깨진다 (꺼진 구슬마다 파편 네 조각) */
export function playSpend(ledEls){
  if(cardFxSuppressed()||!ledEls?.length)return false;
  for(const led of ledEls){
    const r=led.getBoundingClientRect(),c=center(r);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy],i)=>{
      const {el,done}=piece({left:c.x-3,top:c.y-3,width:6,height:6},{borderRadius:'1px',background:'#ffd34d',boxShadow:'0 0 6px #ffb800',pointerEvents:'none'});
      el.animate([{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${sx*14}px,${sy*12+10}px) rotate(${(i%2?1:-1)*120}deg)`,opacity:0}],
        {duration:420,easing:'cubic-bezier(.2,.6,.3,1)'}).onfinish=done;
    });
  }
  if(soundOn)cue('cardSpend');
  return true;
}

/* 스토브리그(라커룸) 제거: 카드가 아래에서 위로 타들어가며 사라지고, 제거가 보상처럼 빛난다 */
export function playBurn(fromEl){
  if(cardFxSuppressed()||!fromEl?.getBoundingClientRect)return false;
  const a=fromEl.getBoundingClientRect(),{el,done}=piece(a,{border:'2px solid #ff8a2b',boxShadow:'0 0 18px rgba(255,120,30,.85)'});
  cloneFace(fromEl,el);
  const ember=document.createElement('i');
  Object.assign(ember.style,{position:'absolute',left:'0',right:'0',bottom:'0',height:'18%',pointerEvents:'none',
    background:'linear-gradient(0deg,rgba(255,80,0,.0),rgba(255,140,30,.95) 40%,rgba(255,230,140,.9) 60%,rgba(255,80,0,0))'});
  el.appendChild(ember);
  el.animate([{opacity:1,transform:'scale(1)',filter:'none'},{opacity:1,transform:'scale(1.02)',filter:'sepia(.6) brightness(1.1)',offset:.35},{opacity:0,transform:'scale(.96) translateY(-14px)',filter:'sepia(1) brightness(.4)'}],
    {duration:CARD_FX_MS.burn,easing:'ease-in'}).onfinish=done;
  ember.animate([{transform:'translateY(0)'},{transform:`translateY(-${a.height}px)`}],{duration:CARD_FX_MS.burn,easing:'ease-in'});
  if(soundOn)cue('cardBurn');
  return true;
}

/* 사격 모드(시범): 카드 한 발이 칸에 꽂힌다. 빗나간 칸은 총알 구멍처럼 금이 가고, 명중 칸은 금빛으로 터진다.
   칸 자체의 뚫린 자국(.bp-shot-hole)은 화면이 상태로 그린다. 이 층은 0.3초 남짓의 순간만 그린다. */
export const SHOT_FX_MS=360;
export function playShot(zones,hitZone=null,root=document){
  if(cardFxSuppressed()||!zones?.length)return false;
  for(const z of zones){
    const cell=root.querySelector?.(`.bp-zone [data-zone="${z}"]`);if(!cell?.getBoundingClientRect)continue;
    const r=cell.getBoundingClientRect(),hit=z===hitZone,c=center(r),size=Math.min(r.width,r.height)*.9;
    const {el,done}=piece({left:c.x-size/2,top:c.y-size/2,width:size,height:size},{borderRadius:'50%',pointerEvents:'none',
      background:hit?'radial-gradient(circle,#fff 0%,#ffe27a 30%,rgba(255,170,30,.55) 55%,transparent 72%)'
        :'radial-gradient(circle,#fff 0%,rgba(255,236,200,.9) 18%,rgba(120,90,60,.45) 40%,transparent 66%)'});
    el.animate([{opacity:0,transform:'scale(.3)'},{opacity:1,transform:'scale(1.1)',offset:.25},{opacity:0,transform:`scale(${hit?1.7:1.25})`}],
      {duration:SHOT_FX_MS,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=done;
  }
  if(soundOn)cue(hitZone!=null?'cardRare':'cardSpend');
  return true;
}
