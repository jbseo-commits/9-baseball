import {useEffect,useRef} from 'react';
import {cue} from '../audio.js';
import {animationRate} from '../animation-speed.js';

// Observe the newest shared scene-clock sample, never enqueue missed ticks.
// No target getter, result, RNG, timer or independent animation clock here.
export function courseAudioEvent(model,rate=1){
 const c=model?.course,speed=animationRate(rate);
 if(model?.phase==='scan'&&c?.scanCount>1&&Number.isInteger(c.scanIndex)&&c.scanIndex>=0
   &&Number.isFinite(c.scanAge)&&c.scanAge>=0&&c.scanAge/speed<=60)
  return {key:'scan:'+c.scanIndex,kind:'courseTick'};
 if(model?.phase==='locked'&&Number.isInteger(c?.targetZone)&&c.targetZone>=0&&c.targetZone<=9
   &&Number.isFinite(c.lockAge)&&c.lockAge>=0&&c.lockAge/speed<=60)
  return {key:'lock',kind:'courseLock'};
 return null;
}
export function useCourseAudio(model,playback,sound=false){
 const seen=useRef(null),abort=useRef(null),token=playback?.token,rate=playback?.rate||1;
 const event=courseAudioEvent(model,rate),key=event?`${token}:${event.key}`:null;
 useEffect(()=>{
  if(!sound||token==null){abort.current?.abort();abort.current=null;}
  if(!key||token==null||seen.current===key)return;
  seen.current=key; // muted/hidden events are consumed, including on unmute.
  if(!sound||globalThis.document?.visibilityState==='hidden')return;
  abort.current?.abort();abort.current=new AbortController();
  cue(event.kind,{rate,signal:abort.current.signal});
 },[key,sound,token,rate,event?.kind]);
 useEffect(()=>()=>{abort.current?.abort();},[token]);
 useEffect(()=>{
  const doc=globalThis.document,cancelHidden=()=>{if(doc?.visibilityState==='hidden')abort.current?.abort();};
  doc?.addEventListener?.('visibilitychange',cancelHidden);
  return ()=>doc?.removeEventListener?.('visibilitychange',cancelHidden);
 },[]);
}
