import React,{useEffect,useLayoutEffect,useRef} from 'react';
import plate from '../../assets/production-art/phone-assets-v18/A06-title-stadium-plate.png';
import './event.css';

/* Road-event screen. Choice mode names every consequence up front; result mode shows what the seed
   actually dealt, then leaves to the map.
   Masterpiece pass (2026-10-10): a full-screen night-road beat in the start-pack family (.ev-*): the
   story sits on a paper plate, each choice is tagged by what it costs (gain / trade / gamble / leave)
   and its concrete cards and relics read as chips, so the trade is weighed before the tap.
   Mounted only while the phase is `event` or a result is pending — no hidden fixed layer. */
// offer: {title,text,choices:[{id,label,desc,problem,ops}]}, result: {title,outcome}
const LOSS=new Set(['sacrificeRandom','outsUp','transformRandom']);
function toneOf(c){
  const ops=c.ops||[];
  if(!ops.length)return {key:'leave',tag:'그냥 간다'};
  if(ops.some(o=>o.op==='gamble'))return {key:'gamble',tag:'도박'};
  if(ops.some(o=>LOSS.has(o.op)))return {key:'trade',tag:'대가'};
  return {key:'gain',tag:'이득'};
}
/* "무작위 카드 1장을 덱에 넣는다 · 강타 획득" → rule line + the named results as chips */
function splitDesc(desc=''){
  const [rule,...named]=desc.split(' · ');
  return {rule,named};
}
const lines=text=>String(text||'').split(/(?<=[.!?])\s+/).filter(Boolean);

export default function BallparkEvent({offer,result,onPick,onLeave,onDeck}){
  const leaveRef=useRef(null),rootRef=useRef(null);
  /* sit under the app header (its height changes per viewport) and under the deck modal (z 50), so
     "덱 보기" opens on top of the event and the header buttons stay reachable */
  useLayoutEffect(()=>{
    const el=rootRef.current;if(!el)return;
    const fit=()=>{const h=document.querySelector('.duel-header');el.style.setProperty('--ev-top',(h?Math.max(0,Math.round(h.getBoundingClientRect().bottom)):0)+'px');};
    fit();window.addEventListener('resize',fit);return ()=>window.removeEventListener('resize',fit);
  },[]);
  useEffect(()=>{if(result)leaveRef.current?.focus?.();},[result]);
  if(!result&&!offer)return null;
  const title=result?result.title:offer.title;
  return <div ref={rootRef} className={'ev-root'+(result?' is-result':'')} role="dialog" aria-modal="true" aria-label={result?`${result.title} 결과`:`${offer.title} 사건`}>
    <div className="ev-bg" style={{backgroundImage:`url(${plate})`}} aria-hidden="true"/>
    <header className="ev-head">
      <span className="ev-eyebrow">ROAD EVENT · 길 위의 사건</span>
      <h2 className="ev-title">{title}</h2>
    </header>
    {result
      ?<section className="ev-paper ev-outcome" aria-live="polite">
        <span className="ev-mark" aria-hidden="true">!</span>
        {lines(result.outcome).map((l,i)=><p key={i} style={{'--i':i}}>{l}</p>)}
      </section>
      :<section className="ev-paper"><span className="ev-mark" aria-hidden="true">?</span><p>{offer.text}</p></section>}
    {!result&&<div className="ev-list" role="group" aria-label="선택지">
      {offer.choices.map((c,i)=>{const tone=toneOf(c),{rule,named}=splitDesc(c.desc);
        return <button key={c.id} type="button" className={'ev-choice t-'+tone.key} data-testid="event-choice" aria-label={c.label}
          disabled={!!c.problem} style={{'--i':i}} onClick={()=>onPick?.(c.id)}>
          <span className="ev-tag">{tone.tag}</span>
          <strong>{c.label}</strong>
          <em>{rule}</em>
          {!!named.length&&<span className="ev-chips">{named.map((n,j)=><i key={j} className={/상실|잃/.test(n)?'loss':''}>{n}</i>)}</span>}
          {c.problem&&<small className="ev-why">✕ {c.problem}</small>}
        </button>;})}
    </div>}
    <footer className="ev-foot">
      {result
        ?<button ref={leaveRef} type="button" className="ev-go" data-testid="event-leave" onClick={onLeave}>지도로</button>
        :<button type="button" className="ev-deck" onClick={onDeck}>덱 보기</button>}
    </footer>
  </div>;
}
