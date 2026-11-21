import {useEffect,useState} from 'react';
import {loadSluggerMotion,disposeSluggerActor} from './slugger-motion.js';
export default function useSluggerMotion(enabled,deciding){
 const [candidate,setCandidate]=useState(null),[active,setActive]=useState(null);
 useEffect(()=>{
  const controller=new AbortController();let owned=null;setCandidate(null);setActive(null);
  if(enabled)loadSluggerMotion({enabled,base:import.meta.env.BASE_URL,signal:controller.signal}).then(actor=>{
   if(controller.signal.aborted){disposeSluggerActor(actor);return;}owned=actor;setCandidate(actor);
  });
  return ()=>{controller.abort();disposeSluggerActor(owned);};
 },[enabled]);
 useEffect(()=>{if(deciding)setActive(candidate);},[candidate,deciding]);
 return enabled?active:null;
}
