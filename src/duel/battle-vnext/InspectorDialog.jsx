import React,{useEffect,useRef} from 'react';
export default function InspectorDialog({children,onClose}){
 const root=useRef(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const el=root.current;
  el?.querySelector('button')?.focus({preventScroll:true});
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current?.();}
   if(e.key==='Tab'){const all=[...el.querySelectorAll('button:not(:disabled),[href],[tabindex="0"]')].filter(x=>x.getClientRects().length);const first=all[0],last=all.at(-1);if(e.shiftKey&&(document.activeElement===first||!el.contains(document.activeElement))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||!el.contains(document.activeElement))){e.preventDefault();first?.focus();}}};
  document.addEventListener('keydown',key,true);return()=>{document.removeEventListener('keydown',key,true);};
 },[]);
 return <div className="bv-pitcher-dialog-backdrop" onClick={e=>{if(e.target===e.currentTarget){e.preventDefault();e.stopPropagation();onClose?.();}}}>
  <div ref={root} className="bv-inspector-area" role="dialog" aria-modal="true" aria-label="경기 정보" onClick={e=>e.stopPropagation()}>{children}</div>
 </div>;
}
