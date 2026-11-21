import React from 'react';
export default function SluggerFeedback({feedback,foot}){
 if(!feedback)return null;
 const {kind,progress:p}=feedback,point=feedback.point||{x:foot.x+200,y:foot.y-200};
 return <svg data-testid="slugger-feedback" data-kind={kind} viewBox="0 0 1672 941" width="1672" height="941" style={{position:'absolute',inset:0,pointerEvents:'none'}} aria-hidden="true">
  <g transform={`translate(${point.x} ${point.y}) rotate(${feedback.angle||0})`} opacity={(1-p)*.95} style={{filter:'drop-shadow(2px 2px 0 #101b24)'}} fill="none" stroke="#ffe3a0" strokeWidth={kind==='slug'?7:5} strokeLinejoin="miter">
   {kind==='slug'?<><path d={`M8 12L${140+p*70} ${36+p*25}M8 -12L${140+p*70} ${-36-p*25}`}/><path d={`M-14 -18L-22 0L-14 18`} strokeWidth="4"/></>:kind==='gapHunter'?<><path d={`M12 -9H${120+p*70}M12 9H${120+p*70}`}/></>:<><path d={`M-80 12h${65*p}m20 0h${65*p}M-60 -2h${40*p}m20 0h${40*p}`} strokeWidth="6"/><path d="M-12 -18v-14h24v14"/></>}
  </g>
 </svg>;
}
