import {useEffect,useState} from 'react';
import {loadPrivateFieldArt,disposePrivateFieldArt} from './private-field-art.js';
// Fixed bounded request, no retries. Late images cannot replace an actor mid-pitch.
export default function usePrivateFieldArt(kind,deciding){
 const [candidate,setCandidate]=useState(null),[active,setActive]=useState(null);
 useEffect(()=>{
  const controller=new AbortController();let owned=null;
  setCandidate(null);setActive(null);
  const timeout=setTimeout(()=>controller.abort(),4500);
  if(kind)loadPrivateFieldArt({kind,base:import.meta.env.BASE_URL,signal:controller.signal}).then(actor=>{
   clearTimeout(timeout);
   if(controller.signal.aborted){disposePrivateFieldArt(actor);return;}
   owned=actor;setCandidate(actor?{kind,actor}:null);
  });
  return()=>{clearTimeout(timeout);controller.abort();disposePrivateFieldArt(owned);};
 },[kind]);
 useEffect(()=>{if(deciding)setActive(candidate);},[candidate,deciding]);
 return kind&&active?.kind===kind?active.actor:null;
}
