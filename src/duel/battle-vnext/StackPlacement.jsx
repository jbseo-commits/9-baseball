import React,{useEffect,useRef} from 'react';
import {placementGeometry,PLACEMENT} from './placement-motion.js';
import {playPlacementSound} from './placement-audio.js';
import './stack-placement.css';

/* Derive the settled board from the current authored model, not animation
   history. Overlap is not CONNECT and never promises additional damage. */
export function stackFootprint(pieces=[]){
  const byZone=new Map();
  for(const [i,piece]of pieces.entries())for(const z of piece.coverage||[]){
    if(!Number.isInteger(z)||z<0||z>8)continue;
    if(!byZone.has(z))byZone.set(z,[]);byZone.get(z).push(piece.order||i+1);
  }
  return {zones:[...byZone.keys()].sort((a,b)=>a-b),overlaps:[...byZone].filter(([,orders])=>orders.length>1).map(([zone,orders])=>({zone,orders}))};
}
const shape=coverage=>placementGeometry(coverage.map(z=>({z,x:z%3*100,y:Math.floor(z/3)*100,w:100,h:100})),{x:150,y:150,w:100,h:100});
const pt=z=>({x:z%3*100+50,y:Math.floor(z/3)*100+50});
export function StackBoard({pieces=[],links=[],phase='deciding',sound=false}){
  const visible=['deciding','committing'].includes(phase),assembling=phase==='committing'&&pieces.length>1;
  useEffect(()=>{
    if(!assembling||!sound||document.hidden)return;
    const cancel=playPlacementSound({elapsed:PLACEMENT.lockAt,reduced:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches});
    const hide=()=>{if(document.hidden)cancel();};document.addEventListener('visibilitychange',hide);
    return()=>{cancel();document.removeEventListener('visibilitychange',hide);};
  },[assembling,sound]);
  if(!visible||!pieces.length)return null;
  const plan=stackFootprint(pieces);
  return <svg className={'bv-stack-board'+(assembling?' is-assembling':'')} data-testid="bv-stack-board" data-card-count={pieces.length} data-overlap-count={plan.overlaps.length} viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true">
    {pieces.map((piece,i)=>{const g=shape(piece.coverage);return g&&<g key={piece.id} className={'bv-settled-piece q-'+(i+1)} data-board-card-id={piece.id} data-board-order={i+1} data-board-aim={piece.aimZone} style={{'--assembly-delay':i*75+'ms'}}>
      <g transform={`translate(${g.bounds.x} ${g.bounds.y})`}><path className="bv-piece-body" d={g.cells.map(c=>`M${c.x+3} ${c.y+3}h${c.w-6}v${c.h-6}h${-c.w+6}Z`).join('')}/><path className="bv-piece-edge" d={g.outline}/></g>
    </g>;})}
    {plan.overlaps.map(c=><g className="bv-stack-overlap" key={c.zone} data-overlap-zone={c.zone} transform={`translate(${c.zone%3*100} ${Math.floor(c.zone/3)*100})`}><path d="M7 26V7h19M12 31V12h19"/></g>)}
    {pieces.length>1&&links.map((link,i)=>{const a=pt(link.fromZone),b=pt(link.toZone);return <path key={i} className={'bv-stack-join '+(link.connected?'is-connected':'is-broken')} data-link-connected={String(link.connected)} data-link-from={link.fromOrder} data-link-to={link.toOrder} d={link.fromZone===link.toZone?`M${a.x} ${a.y-18}c30 -25 30 35 0 12`:`M${a.x} ${a.y}L${b.x} ${b.y}`} style={{'--assembly-delay':(i+1)*75+'ms'}}/>;})}
  </svg>;
}
export function StackTray({pieces=[],links=[],hand=[],phase='deciding',canAdd=false,canSelect=true,onAdd,onRemove}){
  const press=useRef(null),touchConsumed=useRef(false);
  const button=run=>({
    onPointerDown:e=>{press.current={id:e.pointerId,x:e.clientX,y:e.clientY};},
    onPointerUp:e=>{const p=press.current;press.current=null;if(e.pointerType==='touch'&&p?.id===e.pointerId){e.preventDefault();touchConsumed.current=true;if(!e.currentTarget.disabled&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<10)run();}},
    onPointerCancel:()=>{press.current=null;},onClick:run,
  });
  if(pieces.length<2&&!canAdd)return null;
  const plan=stackFootprint(pieces),connected=links.filter(l=>l.connected).length;
  const cost=pieces.reduce((n,p)=>n+(hand.find(c=>c.id===p.id)?.cost||0),0);
  return <section className="bv-stack-tray" data-testid="bv-stack-tray" data-card-count={pieces.length} data-total-cost={cost} aria-label={`배치 ${pieces.length}장 · 합계 에너지 ${cost}`} onPointerDownCapture={()=>{touchConsumed.current=false;}} onKeyDownCapture={()=>{touchConsumed.current=false;}} onClickCapture={e=>{if(touchConsumed.current){touchConsumed.current=false;e.preventDefault();e.stopPropagation();}}}>
    <div className="bv-stack-tray-head"><b>{phase==='committing'?'조합 확정':`${pieces.length}장 배치`}</b><span>{plan.zones.length}칸{links.length>0?` · 연결 ${connected}/${links.length}`:''}{plan.overlaps.length?` · 중복 ${plan.overlaps.length}칸`:''}</span></div>
    <div className="bv-stack-slots">{pieces.map((piece,i)=>{const item=hand.find(c=>c.id===piece.id);return i===0?<span key={piece.id} className="bv-stack-slot q-1"><i>1</i><b>{item?.name}</b></span>:<button type="button" key={piece.id} className={'bv-stack-slot q-'+(i+1)} disabled={!canSelect||phase!=='deciding'} {...button(()=>onRemove?.(piece.id))} aria-label={`${i+1}번 ${item?.name} 지원 빼기`}><i>{i+1}</i><b>{item?.name}</b><em>×</em></button>;})}
    {canAdd&&<button type="button" className="bv-stack-add" {...button(()=>onAdd?.())} disabled={!canSelect||phase!=='deciding'}>+ 카드 추가</button>}</div>
  </section>;
}
