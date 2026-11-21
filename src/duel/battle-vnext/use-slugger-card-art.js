import {useEffect,useState} from 'react';
import {SLUGGER_CARD_KINDS,loadSluggerCardArt,disposeCardArt} from './slugger-card-art.js';
export default function useSluggerCardArt(enabled){
 const [arts,setArts]=useState({});
 useEffect(()=>{
  const controller=new AbortController();let owned=[];setArts({});
  if(enabled)Promise.all(SLUGGER_CARD_KINDS.map(async kind=>[kind,await loadSluggerCardArt(kind,{enabled,base:import.meta.env.BASE_URL,signal:controller.signal})])).then(entries=>{
   owned=entries.map(([,a])=>a);if(controller.signal.aborted){owned.forEach(disposeCardArt);return;}
   setArts(Object.fromEntries(entries.filter(([,a])=>a)));
  });
  return ()=>{controller.abort();owned.forEach(disposeCardArt);};
 },[enabled]);
 return enabled?arts:{};
}
