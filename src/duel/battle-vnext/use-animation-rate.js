import {useLayoutEffect} from 'react';
import {animationRate} from '../animation-speed.js';

/* Scoped CSS time only. JS field frames and deadlines use the same rate in
   their owners. Never observe per-frame SVG/style attributes or alter inputs. */
export default function useAnimationRate(ref,rate){
  const speed=animationRate(rate);
  useLayoutEffect(()=>{
    const root=ref.current;if(!root)return;
    const apply=()=>{for(const a of root.getAnimations?.({subtree:true})||[])if(a.playbackRate!==speed)a.playbackRate=speed;};
    apply();
    const observer=typeof MutationObserver==='undefined'?null:new MutationObserver(apply);
    observer?.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-hand-open','data-phase','data-fx-stage','data-shot']});
    root.addEventListener('animationstart',apply,true);root.addEventListener('transitionrun',apply,true);
    return()=>{observer?.disconnect();root.removeEventListener('animationstart',apply,true);root.removeEventListener('transitionrun',apply,true);};
  },[ref,speed]);
  useLayoutEffect(()=>{for(const a of ref.current?.getAnimations?.({subtree:true})||[])if(a.playbackRate!==speed)a.playbackRate=speed;});
}
