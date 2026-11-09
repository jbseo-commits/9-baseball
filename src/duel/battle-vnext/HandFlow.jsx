import React,{useEffect,useLayoutEffect,useRef,useState,useCallback} from 'react';
import {atbatCardArt} from './atbat-card-art.js';
import {cue} from '../audio.js';
import './hand-flow.css';

// Only known card discards may animate during execution. Result-dependent
// draws/shuffles/counts/sounds wait for the next selectable hand.
export function useHandFlow({receipts=[],phase,shown,menuOpen,rootRef,rate=1,sound=false}){
  const seen=useRef(new Map()),timers=useRef([]),token=useRef(0),soundRef=useRef(sound),audio=useRef(null);soundRef.current=sound;
  const [flights,setFlights]=useState([]),[counts,setCounts]=useState(null),[step,setStep]=useState(null);
  const clear=useCallback(()=>{
    token.current++;for(const t of timers.current)clearTimeout(t);timers.current=[];
    audio.current?.abort();audio.current=null;
    rootRef.current?.querySelectorAll('[data-flow-hidden]').forEach(e=>e.removeAttribute('data-flow-hidden'));
    rootRef.current?.querySelectorAll('[data-flow-landed]').forEach(e=>e.removeAttribute('data-flow-landed'));
    setFlights([]);setCounts(null);setStep(null);
  },[rootRef]);
  const finish=useCallback(()=>{for(const r of receipts)seen.current.set(r.seq,{discard:true,complete:true});clear();},[receipts,clear]);
  const receiptKey=receipts.map(x=>x.seq).join(':');
  useEffect(()=>{
    const resize=()=>finish(),visibility=()=>{if(document.hidden)finish();};
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);media?.addEventListener?.('change',resize);
    return()=>{window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media?.removeEventListener?.('change',resize);};
  },[receiptKey,clear]); // A resize completes current visuals, never replays stale coordinates.
  useEffect(()=>{if(!sound)audio.current?.abort();},[sound]);
  useLayoutEffect(()=>{
    const discarding=['flight','committing'].includes(phase);
    if((!discarding&&(phase!=='deciding'||!shown))||menuOpen||document.hidden){
      if(menuOpen||document.hidden)for(const r of receipts)seen.current.set(r.seq,{discard:true,complete:true});
      clear();return;
    }
    const batch=receipts.filter(r=>discarding?!seen.current.get(r.seq)?.discard:!seen.current.get(r.seq)?.complete);if(!batch.length)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduced){for(const r of batch)seen.current.set(r.seq,{discard:true,complete:true});return;}
    const root=rootRef.current;if(!root?.getBoundingClientRect().width)return;
    const events=batch.flatMap(r=>r.events.flatMap(e=>discarding?(e.type==='discard'?[{...e,receipt:r}]:[]):seen.current.get(r.seq)?.discard&&e.type==='discard'?[]:e.type==='deal'
      ?e.ids.map((id,i)=>({type:'draw',id,hand:i+1,draw:e.draw+e.ids.length-i-1,discard:e.discard,receipt:r,opening:true}))
      :[{...e,receipt:r}]));
    if(!events.length)return;
    const first=events[0];
    if(!discarding)setCounts(first.type==='draw'?{hand:first.hand-1,draw:first.draw+1,discard:first.discard}:first.type==='shuffle'?{hand:first.hand,draw:0,discard:first.count}:{hand:first.hand+1,draw:first.draw,discard:first.discard-1});
    const ids=new Set(events.filter(e=>e.type==='draw').map(e=>e.id));
    const slot=id=>[...root.querySelectorAll('.bv-card-slot')].find(e=>e.dataset.cardId===id);
    for(const id of ids)slot(id)?.setAttribute('data-flow-hidden','true');
    const mine=++token.current,scale=1/Math.max(.25,rate),duration=230*scale;
    audio.current=new AbortController();const signal=audio.current.signal;
    const later=(fn,at)=>timers.current.push(setTimeout(()=>{if(token.current===mine)fn();},at));
    const center=e=>{const r=e?.getBoundingClientRect();return r&&r.width?{x:r.x+r.width/2,y:r.y+r.height/2}:null;};
    const pile=kind=>{const r=root.getBoundingClientRect();return {x:r.right-(kind==='draw'?64:20),y:Math.max(r.top+70,r.bottom-30)};};
    let at=discarding?0:360*scale;
    for(const [i,e] of events.entries()){
      const start=at;
      later(()=>{
        // Commit only when playback starts: StrictMode's cancelled first setup
        // must not consume an opening deal before its replacement setup runs.
        for(const r of batch)seen.current.set(r.seq,discarding?{discard:true,complete:false}:{discard:true,complete:true});
        setStep(e.type);
        if(e.type==='shuffle'){
          setFlights(prev=>[...prev,{key:mine+'-'+i,type:'shuffle',from:pile('discard'),to:pile('draw'),duration:duration*1.25}]);
          if(soundRef.current)cue('cardSpend',{rate,signal});
        }else{
          const dest=slot(e.id),r=root.getBoundingClientRect();
          const raw=center(dest)||{x:r.right-100,y:r.top+r.height*.5},row=root.querySelector('.bv-hand-row')?.getBoundingClientRect();
          const target={x:Math.max(r.left+40,Math.min(r.right-40,raw.x)),y:Math.max(r.top+65,Math.min(row?.bottom||r.bottom-90,raw.y))};
          const zone=e.receipt.zones?.[e.id],source=Number.isInteger(zone)?center(root.querySelector(`.bv-cell[data-zone="${zone}"]`))||target:target;
          const card=e.receipt.cards[e.id],art=card?atbatCardArt(card):null;
          setFlights(prev=>[...prev,{key:mine+'-'+i,type:e.type,name:card?.name,art:art?.url,from:e.type==='draw'?pile('draw'):source,to:e.type==='draw'?target:pile('discard'),duration}]);
        }
      },start);
      later(()=>{
        if(e.type==='draw'){slot(e.id)?.removeAttribute('data-flow-hidden');slot(e.id)?.setAttribute('data-flow-landed','true');}
        if(!discarding)setCounts({hand:e.hand,draw:e.draw,discard:e.discard});
        setFlights(prev=>prev.filter(f=>f.key!==mine+'-'+i));
        if(e.type!=='shuffle'&&soundRef.current)cue(e.type==='draw'?'cardGet':'cardSpend',{rate,signal});
      },start+(e.type==='shuffle'?duration*1.25:duration));
      // Keep discard/shuffle/draw boundaries ordered; consecutive draw cards
      // overlap slightly for a quick deal rather than waiting on a new step.
      at+=e.type==='shuffle'?duration*1.25:events[i+1]?.type===e.type?100*scale:duration+35*scale;
    }
    later(clear,at+duration+40*scale);
    return clear;
  },[phase,shown,menuOpen,receiptKey,rate,clear]);
  return {flights,counts,step,clear:finish};
}

function Flight({item}){
  const ref=useRef(null);
  useLayoutEffect(()=>{
    const {from,to,duration}=item,e=ref.current;
    const animation=e?.animate?.([{transform:`translate(${from.x}px,${from.y}px) translate(-50%,-50%) scale(.65) rotate(-16deg)`,opacity:0},
      {offset:.25,opacity:1},{transform:`translate(${to.x}px,${to.y}px) translate(-50%,-50%) scale(${item.type==='draw'?1:.35}) rotate(0deg)`,opacity:item.type==='draw'?1:0}],
      {duration,easing:'cubic-bezier(.16,.8,.25,1)',fill:'both'});
    return()=>{animation?.finished?.catch(()=>{});animation?.cancel();};
  },[item]);
  return <div ref={ref} className={'bv-hand-flight is-'+item.type} data-hand-flow={item.type} style={{backgroundImage:item.art?`linear-gradient(0deg,#08152288,transparent),url(${item.art})`:undefined}}>{item.type==='shuffle'?<span>↻</span>:<b>{item.name}</b>}</div>;
}
export default function HandFlow({flow}){
  return <div className="bv-hand-flow" aria-hidden="true" data-testid="bv-hand-flow" data-flow-step={flow.step||undefined}>
    {flow.flights.map(item=><Flight key={item.key} item={item}/>)}
    {flow.step&&<span className="bv-flow-piles"><i data-pile="draw">더미</i><i data-pile="discard">버림</i></span>}
  </div>;
}
