import React from 'react';
import wall from '../../../assets/pixel-ui/emerald-low-wall.png';
import './emerald-ground-tell.css';
/* The public personality is the only semantic input. This is a tendency,
   never a course cell, landing point or aim-dependent preview. */
export default function EmeraldGroundTell({profile,foot,scale=1,visible=false}){
 if(profile?.id!=='low-wall'||!foot)return null;
 return <div className="bv-emerald-ground-tell" data-testid="emerald-ground-tell" aria-hidden="true" style={{left:foot.x-78,top:foot.y-26,visibility:visible?'visible':'hidden',transform:`scale(${Math.min(1,.45/Math.max(.01,scale))})`,transformOrigin:'78px 26px'}}>
  <img src={wall} width="52" height="10" alt="" draggable="false"/><span>낮음 선호</span>
 </div>;
}
