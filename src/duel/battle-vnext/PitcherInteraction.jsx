import React,{useEffect,useRef} from 'react';
import './pitcher-interaction.css';
import {pitcherOverheadPosition} from './public-intent-badge.js';

// Public presentation only: screen-projected authored head/foot + frozen HUD HP.
export default function PitcherInteraction({head,foot,bounds,pitcher,enabled,onOpen}){
 const gesture=useRef(null),timer=useRef(null),latest=useRef({enabled,onOpen});latest.current={enabled,onOpen};
 const cancel=()=>{clearTimeout(timer.current);timer.current=null;gesture.current=null;};
 useEffect(()=>{if(!enabled)cancel();},[enabled]);
 useEffect(()=>{const stop=()=>cancel();window.addEventListener('blur',stop);window.addEventListener('resize',stop);window.addEventListener('scroll',stop,true);return()=>{cancel();window.removeEventListener('blur',stop);window.removeEventListener('resize',stop);window.removeEventListener('scroll',stop,true);};},[]);
 if(!head||!foot||!pitcher||!(bounds?.width>0))return null;
 const {left,top}=pitcherOverheadPosition(head,bounds);
 const height=Math.max(44,foot.y-head.y),width=Math.max(44,Math.min(80,height*.62));
 const open=el=>{if(!latest.current.enabled)return;el.focus({preventScroll:true});latest.current.onOpen?.();};
 return <>
  <div className="bv-pitcher-health" data-testid="pitcher-health" role="meter" aria-label={`${pitcher.name} HP`} aria-valuemin={0} aria-valuemax={pitcher.maxHp} aria-valuenow={pitcher.hp} style={{left,top}}><i style={{width:Math.max(0,Math.min(100,pitcher.hp/pitcher.maxHp*100))+'%'}}/></div>
  <button type="button" className="bv-pitcher-touch" data-testid="pitcher-details-target" aria-label={`${pitcher.name} 투수 정보 · 길게 누르기 또는 Enter`} aria-haspopup="dialog" aria-disabled={!enabled} tabIndex={enabled?0:-1}
   style={{left:head.x-width/2,top:head.y,width,height}}
   onContextMenu={e=>e.preventDefault()} onDragStart={e=>e.preventDefault()}
   onPointerDown={e=>{e.stopPropagation();cancel();if(!enabled||e.button!==0||e.isPrimary===false)return;e.preventDefault();const el=e.currentTarget;el.setPointerCapture?.(e.pointerId);gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{if(gesture.current?.id===e.pointerId){cancel();open(el);}},450);}}
   onPointerMove={e=>{const g=gesture.current;if(g&&(g.id!==e.pointerId||Math.hypot(e.clientX-g.x,e.clientY-g.y)>8))cancel();}}
   onPointerUp={e=>{e.preventDefault();e.stopPropagation();cancel();if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
   onPointerCancel={cancel} onLostPointerCapture={cancel}
   onClick={e=>{e.preventDefault();e.stopPropagation();if(e.detail===0)open(e.currentTarget);}}
   onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();if(!e.repeat)open(e.currentTarget);}if(e.key==='Escape')cancel();}}/>
 </>;
}
