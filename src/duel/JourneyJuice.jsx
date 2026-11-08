import React,{useCallback,useEffect,useRef} from 'react';
import {cue} from './audio.js';
import collect from '../../assets/menu-journey/collect.png';
import settle from '../../assets/menu-journey/settle.png';
import './journey-juice.css';

// UI feedback owns its audio lifetime, never the engine's clock or save.
export function useMenuFeedback(sound=false){
  const active=useRef(null);
  useEffect(()=>{
    const hide=()=>{if(document.hidden)active.current?.abort();};
    document.addEventListener('visibilitychange',hide);
    return()=>{active.current?.abort();document.removeEventListener('visibilitychange',hide);};
  },[]);
  useEffect(()=>{if(!sound)active.current?.abort();},[sound]);
  return useCallback(kind=>{
    active.current?.abort();
    if(!sound||document.hidden)return;
    const controller=new AbortController();active.current=controller;
    cue(kind,{signal:controller.signal});
  },[sound]);
}

export function JourneyBurst({kind='settle',className='',durationMs}){
  const burst=kind==='collect';
  return <i aria-hidden="true" className={'journey-burst '+className} style={{
    backgroundImage:`url(${burst?collect:settle})`,
    '--j-frames':burst?42:14,'--j-steps':burst?41:13,
    '--j-time':durationMs?durationMs+'ms':burst?'1386ms':'560ms','--j-ratio':burst?'112 / 108':'1',
  }}/>;
}

// A receipt over the destination, not a delayed transition. Every callback and
// save has already committed before this mounts. New input can dismiss it.
export default function JourneyArrival({arrival,onDone}){
  const done=useRef(onDone);done.current=onDone;
  useEffect(()=>{
    if(!arrival)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let finished=false;
    const finish=()=>{if(!finished){finished=true;done.current?.();}};
    const timer=setTimeout(finish,reduced?100:760);
    const hide=()=>{if(document.hidden)finish();};
    document.addEventListener('visibilitychange',hide);
    window.addEventListener('pointerdown',finish,{once:true});
    window.addEventListener('keydown',finish,{once:true});
    return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pointerdown',finish);window.removeEventListener('keydown',finish);};
  },[arrival?.token]);
  if(!arrival)return null;
  return <div className={'journey-arrival journey-'+arrival.type} aria-hidden="true" data-testid="journey-arrival">
    <div className="journey-arrival-scene" style={arrival.backdrop?{backgroundImage:`url(${arrival.backdrop})`}:undefined}>
      {arrival.art&&<img className="journey-arrival-actor" src={arrival.art} alt=""/>}
      {!!arrival.cards?.length&&<div className="journey-arrival-cards">{arrival.cards.map((art,i)=><img key={i} src={art} alt="" style={{'--card-x':(i-1)*28+'px','--card-turn':(i-1)*9+'deg','--card-delay':i*35+'ms'}}/>)}</div>}
      <div className="journey-arrival-copy"><small>{arrival.eyebrow}</small><strong>{arrival.title}</strong></div>
      <JourneyBurst kind="collect" durationMs={650}/>
    </div>
  </div>;
}
