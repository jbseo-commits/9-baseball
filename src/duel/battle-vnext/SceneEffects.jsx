import React from 'react';
import ballUrl from '../../../assets/production-art/asset-led-battle-v1/ball.svg';
import {MOTION_CONTACT as DEFAULT_CONTACT} from './motion-timeline.js';

/* Painted actors and world remain on the shared camera; these few local shapes
   explain contact, direction and release without adding a UI panel. */
export default function SceneEffects({effect=null,finale=null,composition=null}){
  if(!effect&&!finale)return null;
  const C=composition?.contact||DEFAULT_CONTACT,mound=composition?.mound||{x:832,y:580};
  const e=effect||{kind:finale,hidden:true,flash:0,radius:0},warm=['exact','contact','homer','foul'].includes(e.kind),r=e.radius;
  return <svg className={'bv-world-effects e-'+e.kind} viewBox="0 0 1672 941" width="1672" height="941" aria-hidden="true" data-testid="bv-scene-effects" data-effect={e.kind}>
    {finale==='homer'&&<g className="bv-homer-rays" opacity=".35">
      {[0,1,2,3,4].map(i=><path key={i} d={`M${640+i*95} 0L${830+i*50} 480L${720+i*95} 0Z`} fill="#ffdba0" opacity={i%2?'.18':'.3'}/>)}
      <path d="M640 400Q920 160 1200 110" fill="none" stroke="#ffe2a3" strokeWidth="2" strokeDasharray="2 18"/>
    </g>}
    {finale==='knockout'&&<g className="bv-mound-resolve"><ellipse cx={mound.x} cy={mound.y} rx="108" ry="29" fill="#e5c092" opacity=".1"/><ellipse cx={mound.x} cy={mound.y} rx="108" ry="29" fill="none" stroke="#f4d6a0" strokeWidth="2" opacity=".6"/></g>}
    {!e.hidden&&<g opacity={e.opacity??1}>
      <path d={`M${e.previous.x},${e.previous.y}L${e.ball.x},${e.ball.y}`} fill="none" stroke={warm?'#ffd386':'#c5eff1'} strokeWidth={warm?5:3} strokeLinecap="round" opacity=".7"/>
      <image href={ballUrl} x={e.ball.x-r} y={e.ball.y-r} width={r*2} height={r*2}/>
    </g>}
    {e.flash>0&&<g className="bv-contact-burst" opacity={e.flash}>
      <ellipse cx={C.x} cy={C.y} rx={24+(1-e.flash)*65} ry={13+(1-e.flash)*35} fill="none" stroke={e.kind==='exact'?'#ffd590':'#f2e3bd'} strokeWidth={1+e.flash*2}/>
      <circle cx={C.x} cy={C.y} r={5+e.flash*9} fill="#fff3cd"/>
      {[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4,len=(i%2?45:70)*(1.4-e.flash*.5);return <path key={i} d={`M${C.x+Math.cos(a)*18},${C.y+Math.sin(a)*10}l${Math.cos(a)*len},${Math.sin(a)*len*.6}`} stroke={i%2?'#fff6d6':'#f7ad65'} strokeWidth={e.flash*3} strokeLinecap="round"/>;})}
    </g>}
    {e.kind==='near'&&e.age<380&&<g opacity={Math.max(0,1-e.age/380)}>
      <path d={`M${C.x-18},${C.y-8}q30 15 58 8`} fill="none" stroke="#adcdd0" strokeWidth="2" strokeDasharray="4 7"/>
      <circle cx={C.x} cy={C.y} r="18" fill="none" stroke="#f0cf96" strokeWidth="1.5" strokeDasharray="4 5"/>
    </g>}
  </svg>;
}
