import {useEffect,useState} from 'react';
import {presentationElapsed} from '../animation-speed.js';

/* Render-only RAF samples the existing host epoch. It owns no stage/audio/
   completion timers. Hidden tabs simply paint the current moment on return. */
export default function useSceneClock(playback,enabled=true){
  const [,paint]=useState(0);
  useEffect(()=>{
    if(!playback||!enabled)return undefined;
    let id,stopped=false;
    const tick=()=>{if(stopped)return;paint(n=>n+1);if(presentationElapsed(playback,performance.now())<playback.timeline.duration)id=requestAnimationFrame(tick);};
    id=requestAnimationFrame(tick);
    return ()=>{stopped=true;cancelAnimationFrame(id);};
  },[playback,enabled]);
  return presentationElapsed(playback,performance.now());
}
