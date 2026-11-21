import {useEffect,useState} from 'react';
import {loadSluggerMotion,disposeSluggerActor} from './slugger-motion.js';

// Owned by Duel, not an encounter: maps/menus keep the decoded actor alive.
// A failed optional request remains fallback for this ownership period.
export function useSluggerMotionResource(enabled){
 const [candidate,setCandidate]=useState(null);
 useEffect(()=>{
  const controller=new AbortController();let owned=null;setCandidate(null);
  const timer=enabled?setTimeout(()=>controller.abort(),5000):null;
  if(enabled)loadSluggerMotion({enabled,base:import.meta.env.BASE_URL,signal:controller.signal}).then(actor=>{
   clearTimeout(timer);
   if(controller.signal.aborted){disposeSluggerActor(actor);return;}
   owned=actor;setCandidate(actor);
  });
  return ()=>{clearTimeout(timer);controller.abort();disposeSluggerActor(owned);};
 },[enabled]);
 return enabled?candidate:null;
}

export default function useSluggerMotion(enabled,deciding,runCandidate){
 // Standalone legacy consumers still own a request. Normal Duel supplies even
 // a null candidate so encounter mounts never duplicate the run request.
 const local=useSluggerMotionResource(enabled&&runCandidate===undefined);
 const candidate=runCandidate===undefined?local:runCandidate;
 const [active,setActive]=useState(()=>enabled&&deciding?candidate:null);
 useEffect(()=>{if(!enabled)setActive(null);else if(deciding)setActive(candidate);},[enabled,candidate,deciding]);
 return enabled?active:null;
}
