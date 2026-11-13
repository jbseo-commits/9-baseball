import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {cue} from '../audio.js';
import {createHandDrawTracker} from './hand-draw.js';

export default function useHandDraw({enabled,context,phase,receipt,hand,shown,menuOpen,setHandOpen,sound,animationRate=1}){
 const tracker=useRef(null);tracker.current??=createHandDrawTracker();
 const wasShown=useRef(shown);
 const [batch,setBatch]=useState(null),latest=useRef(null),audio=useRef(null),landed=useRef(new Set());
 latest.current={phase,shown,menuOpen,sound,batch,animationRate};
 const ids=hand.filter(c=>c.type!=='basic').map(c=>c.id),idKey=ids.join('|');
 useLayoutEffect(()=>{
  const event=tracker.current.update({enabled,context,phase,receipt,ids});
  if(event){setHandOpen(true);landed.current=new Set();setBatch(event.batch);}
 },[enabled,context,phase,receipt,idKey]);
 useEffect(()=>{
  if(phase!=='deciding'||menuOpen||(wasShown.current&&!shown)){setBatch(null);audio.current?.abort();}
  wasShown.current=shown;
 },[phase,menuOpen,shown]);
 useEffect(()=>{if(!sound)audio.current?.abort();else if(audio.current?.signal.aborted)audio.current=new AbortController();},[sound]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden){audio.current?.abort();setBatch(null);}};
  document.addEventListener('visibilitychange',hide);
  return()=>{document.removeEventListener('visibilitychange',hide);audio.current?.abort();};
 },[]);
 useEffect(()=>{audio.current?.abort();audio.current=new AbortController();return()=>audio.current?.abort();},[batch?.key]);
 const onLand=(id,key)=>{
  const live=latest.current;
  if(!live?.batch||live.batch.key!==key||live.batch.kind!=='draw'||!live.batch.ids.includes(id)
    ||live.phase!=='deciding'||!live.shown||live.menuOpen||landed.current.has(id))return;
  landed.current.add(id);
  if(live.sound&&!document.hidden&&!audio.current?.signal.aborted)cue('handLand',{rate:live.animationRate,signal:audio.current?.signal});
 };
 return {batch,onLand};
}
