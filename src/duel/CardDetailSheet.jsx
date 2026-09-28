import React,{useEffect,useRef} from 'react';
import {CARDS,AXIS_NAMES,cardText,upgradeText} from './cards.js';
import {cardArtFor,cardArtFocusFor} from './card-art.js';
import './card-detail.css';
import './touch-policy.css';

/* #103 M06 — see touch-policy.css: game-control surfaces and this sheet are never text-selectable */
export const NO_SELECT_CLASS='game-noselect';

/*
 * V12 P2-1 — the card detail sheet (D3: names stay, D4: names stay in the hand, detail = original rule).
 * Three ways in, none of which replaces another:
 *   - an explicit button for the selected card (App renders it in the execute strip)
 *   - the keyboard: `i` on a focused hand card
 *   - long-press / context menu on a hand card — secondary only, never the one path
 * The gestures run in the window capture phase so they see the pointer before the swing stack
 * direct-tap layer (document capture) and can swallow the click that ends a long-press.
 */
export const LONG_PRESS_MS=480;
// under stack-direct-tap's 9px drag start, so a drag or a hand scroll never turns into a detail
const LONG_PRESS_SLOP=8;
/* legacy hand cards (tutorial) and the ballpark hand */
const HAND_CARD='.duel-hand .duel-card[data-card-kind], .bp-hand [data-card-kind]';

const STACK={
  none:null,
  bunt:'겹치기 불가 · 희생 번트에는 다른 카드를 겹칠 수 없고, 겹치기 카드로도 쓸 수 없습니다.',
  basic:'메인 전용 · 다른 카드를 놓으면 BASIC SWING이 교체됩니다.',
  attack:'겹치기 가능 · 메인 또는 지원 카드로 놓을 수 있습니다.',
};
const BASIC={name:'BASIC SWING',kindLabel:'스윙 카드',role:'기본',axis:'1존',rule:'선택한 1존을 칩니다. 카드 소비 없음 — 카드가 없어도 승부할 수 있습니다.',gives:['항상 사용'],needs:[],flavor:null};

export function cardDetailOf(kind,plus=false,problem=null){
  if(kind==='basic')return {...BASIC,kind,plus:false,upgrade:null,problem:problem||null,stack:STACK.basic};
  const c=CARDS[kind];if(!c)return null;
  const up=upgradeText(kind);
  return {
    kind,plus:!!plus,name:c.name+(plus?'+':''),kindLabel:c.type==='skill'?'준비 카드':'스윙 카드',
    role:c.role,axis:c.axis?AXIS_NAMES[c.axis]:'타석 준비',rule:cardText(kind,plus),
    upgrade:up?(plus?'강화됨 · ':'강화하면 · ')+up:null,
    gives:c.gives,needs:c.needs,flavor:c.flavor||null,problem:problem||null,
    stack:c.type==='skill'?STACK.none:kind==='bunt'?STACK.bunt:STACK.attack,
  };
}

const read=card=>({kind:card.dataset.cardKind,plus:card.dataset.cardPlus==='1',problem:card.dataset.cardProblem||null});

/*
 * #103 M06 — the opening touch must not select the sheet's text.
 * The sheet opens at LONG_PRESS_MS while the finger is still down, and it slides in over the hand, so
 * the finger ends up resting on the sheet's rule text. Android Chrome's own long-press (text selection,
 * copy/share menu, Touch to Search) then fires on that text ("뽑기" got selected in the playtest).
 * While the opening press is held — and for a short grace after it lifts, which covers the long-press
 * contextmenu and the ghost click — the gesture layer clears any selection, refuses selectstart and the
 * native contextmenu, and swallows the one click that ends the press. The sheet is also non-selectable
 * (touch-policy.css), so the fix does not depend on event timing alone. Nothing is blocked globally:
 * outside that window selection, contextmenu, scrolling and taps behave as before.
 */
const OPEN_GRACE_MS=350;
/* a held press whose pointerup never arrives (menu on desktop, a lost pointer) stops guarding after this */
const HOLD_GUARD_MAX_MS=4000;

export function installCardDetailGestures(win,open){
  let press=null,hold=null,graceUntil=0,swallowClick=false;
  const downs=new Set();
  const now=()=>Date.now();
  const clear=()=>{if(press){win.clearTimeout(press.timer);press=null;}};
  const clearSelection=()=>{try{const sel=win.getSelection?.();if(sel&&sel.rangeCount)sel.removeAllRanges();}catch{/* no selection API */}};
  const guarding=()=>(hold&&now()-hold.at<HOLD_GUARD_MAX_MS)||now()<=graceUntil;
  const openHeld=(card,id)=>{hold={id,at:now()};swallowClick=true;clearSelection();open(read(card),card);};
  const down=e=>{
    clear();downs.add(e.pointerId);
    // a fresh press after the opening one lifted is the player's own: stop guarding (a quick 닫기 tap counts)
    if(!hold){graceUntil=0;swallowClick=false;}
    if(e.button>0)return;
    const card=e.target?.closest?.(HAND_CARD);if(!card)return;
    press={id:e.pointerId,x:e.clientX,y:e.clientY,timer:win.setTimeout(()=>{press=null;openHeld(card,e.pointerId);},LONG_PRESS_MS)};
  };
  const move=e=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>LONG_PRESS_SLOP)clear();};
  const end=e=>{
    downs.delete(e.pointerId);
    if(press&&e.pointerId===press.id)clear();
    if(hold&&(hold.id==null||e.pointerId===hold.id)){hold=null;graceUntil=now()+OPEN_GRACE_MS;clearSelection();}
  };
  const click=e=>{
    if(!swallowClick)return;
    if(!guarding()){swallowClick=false;return;}
    swallowClick=false;
    // the click that ends the opening press: on the card it would pick the card, on the backdrop it would close the sheet
    if(e.target?.closest?.(HAND_CARD+', .card-detail-backdrop')){e.preventDefault();e.stopImmediatePropagation();}
  };
  const menu=e=>{
    if(guarding()){e.preventDefault();clearSelection();return;}
    const card=e.target?.closest?.(HAND_CARD);if(!card)return;
    e.preventDefault();clear();
    // a touch long-press can reach here first while the finger is still down: guard it like the timer
    // path. A mouse right-click fires after the button is up — nothing is held, so nothing is guarded.
    if(downs.size){openHeld(card,[...downs].pop());return;}
    clearSelection();open(read(card),card);
  };
  const selectStart=e=>{if(guarding())e.preventDefault();};
  const key=e=>{
    if(e.key!=='i'&&e.key!=='I')return;
    const card=e.target?.closest?.(HAND_CARD);if(!card)return;
    e.preventDefault();open(read(card),card);
  };
  const opts={capture:true};
  win.addEventListener('pointerdown',down,opts);win.addEventListener('pointermove',move,{capture:true,passive:true});
  win.addEventListener('pointerup',end,opts);win.addEventListener('pointercancel',end,opts);
  win.addEventListener('scroll',clear,opts);win.addEventListener('click',click,opts);
  win.addEventListener('contextmenu',menu,opts);win.addEventListener('keydown',key,opts);
  win.addEventListener('selectstart',selectStart,opts);
  return ()=>{
    clear();hold=null;downs.clear();
    win.removeEventListener('selectstart',selectStart,opts);
    win.removeEventListener('pointerdown',down,opts);win.removeEventListener('pointermove',move,opts);
    win.removeEventListener('pointerup',end,opts);win.removeEventListener('pointercancel',end,opts);
    win.removeEventListener('scroll',clear,opts);win.removeEventListener('click',click,opts);
    win.removeEventListener('contextmenu',menu,opts);win.removeEventListener('keydown',key,opts);
  };
}

export default function CardDetailSheet({detail,onClose}){
  const closeRef=useRef(null),sheetRef=useRef(null);
  useEffect(()=>{
    if(!detail)return;
    // whatever a press selected on the way in (the gesture layer already refused new selections) goes
    try{const sel=window.getSelection?.();if(sel&&sel.rangeCount)sel.removeAllRanges();}catch{/* no selection API */}
    closeRef.current?.focus();
  },[detail?.kind,detail?.plus]);
  if(!detail)return null;
  const art=cardArtFor(detail.kind),focus=art?cardArtFocusFor(detail.kind):null;
  const titleId='card-detail-title';
  const onKeyDown=e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();return;}
    if(e.key!=='Tab')return;
    const focusable=[...(sheetRef.current?.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')||[])];
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  };
  return <div className={'card-detail-backdrop '+NO_SELECT_CLASS} onClick={onClose}>
    <section ref={sheetRef} className={'card-detail-sheet '+(detail.kindLabel==='준비 카드'?'skill':'attack')} role="dialog" aria-modal="true" aria-labelledby={titleId}
      onClick={e=>e.stopPropagation()} onKeyDown={onKeyDown}>
      <header className="card-detail-head">
        <span className="card-detail-kind">{detail.kindLabel} · {detail.role} · {detail.axis}</span>
        <h2 id={titleId}>{detail.name}<span className="card-detail-sr"> 카드 설명</span></h2>
        <button ref={closeRef} type="button" className="card-detail-close" onClick={onClose}>닫기</button>
      </header>
      {art&&<div className="card-detail-art"><img src={art} alt="" draggable="false" style={focus?{objectPosition:focus.objectPosition}:undefined}/></div>}
      {detail.problem&&<p className="card-detail-problem" role="note">지금 사용할 수 없음 · {detail.problem}</p>}
      <p className="card-detail-rule">{detail.rule}</p>
      {(detail.gives.length>0||detail.needs.length>0)&&<ul className="card-detail-tags" aria-label="효과와 조건">
        {detail.gives.map(g=><li key={'g'+g}>{g}</li>)}
        {detail.needs.map(n=><li key={'n'+n} className="need">조건 · {n}</li>)}
      </ul>}
      {detail.stack&&<p className="card-detail-stack">{detail.stack}</p>}
      {detail.upgrade&&<p className="card-detail-upgrade">{detail.upgrade}</p>}
      {detail.flavor&&<p className="card-detail-flavor">{detail.flavor}</p>}
    </section>
  </div>;
}
