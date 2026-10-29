import React,{useId} from 'react';
import ballUrl from '../../../assets/production-art/asset-led-battle-v1/ball.svg';
import {MOTION_CONTACT as DEFAULT_CONTACT} from './motion-timeline.js';

/* Painted actors and world remain on the shared camera; these few local shapes
   explain contact, direction and release without adding a UI panel. */
export default function SceneEffects({effect=null,finale=null,composition=null}){
  const id=useId().replaceAll(':',''),hot=id+'-hot',trail=id+'-trail';
  if(!effect&&!finale)return null;
  const C=composition?.contact||DEFAULT_CONTACT,mound=composition?.mound||{x:832,y:580};
  const e=effect||{kind:finale,hidden:true,flash:0,radius:0},warm=['exact','contact','homer','foul'].includes(e.kind),r=e.radius;
  return <svg className={'bv-world-effects e-'+e.kind} viewBox="0 0 1672 941" width="1672" height="941" aria-hidden="true" data-testid="bv-scene-effects" data-effect={e.kind}>
    <defs>
      <radialGradient id={hot}><stop offset="0" stopColor="#fffbe6" stopOpacity=".95"/><stop offset=".17" stopColor="#ffe2a0" stopOpacity=".7"/><stop offset=".55" stopColor="#e79544" stopOpacity=".18"/><stop offset="1" stopColor="#e79544" stopOpacity="0"/></radialGradient>
      <linearGradient id={trail} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8f5ff" stopOpacity="0"/><stop offset=".68" stopColor="#e6f6ed" stopOpacity=".42"/><stop offset="1" stopColor="#fff5d5" stopOpacity=".85"/></linearGradient>
    </defs>
    {e.trail>0&&<g className="bv-bat-ribbon" opacity={e.trail}>
      <path d={`M${C.x-210},${C.y-105}Q${C.x-190},${C.y+85} ${C.x+34},${C.y+18}Q${C.x-128},${C.y+50} ${C.x-210},${C.y-105}`} fill={`url(#${trail})`}/>
      <path d={`M${C.x-210},${C.y-105}Q${C.x-190},${C.y+85} ${C.x+34},${C.y+18}`} fill="none" stroke="#fff2cb" strokeWidth="2.5" opacity=".6"/>
    </g>}
    {finale==='homer'&&<g className="bv-homer-rays" opacity=".35">
      {[0,1,2,3,4].map(i=><path key={i} d={`M${640+i*95} 0L${830+i*50} 480L${720+i*95} 0Z`} fill="#ffdba0" opacity={i%2?'.18':'.3'}/>)}
      <path d="M640 400Q920 160 1200 110" fill="none" stroke="#ffe2a3" strokeWidth="2" strokeDasharray="2 18"/>
    </g>}
    {finale==='knockout'&&<g className="bv-mound-resolve"><ellipse cx={mound.x} cy={mound.y} rx="108" ry="29" fill="#e5c092" opacity=".1"/><ellipse cx={mound.x} cy={mound.y} rx="108" ry="29" fill="none" stroke="#f4d6a0" strokeWidth="2" opacity=".6"/></g>}
    {!e.hidden&&<g opacity={e.opacity??1}>
      <path d={`M${e.previous.x},${e.previous.y}L${e.ball.x},${e.ball.y}`} fill="none" stroke={warm?'#ffbd6e':'#a8d9ec'} strokeWidth={warm?15:8} strokeLinecap="round" opacity=".16"/>
      <path d={`M${e.previous.x},${e.previous.y}L${e.ball.x},${e.ball.y}`} fill="none" stroke={warm?'#ffd386':'#c5eff1'} strokeWidth={warm?5:3} strokeLinecap="round" opacity=".7"/>
      <image href={ballUrl} x={e.ball.x-r} y={e.ball.y-r} width={r*2} height={r*2}/>
    </g>}
    {e.flash>0&&<g className="bv-contact-burst" opacity={e.flash}>
      <ellipse cx={C.x} cy={C.y} rx={e.kind==='exact'?115:72} ry={e.kind==='exact'?83:48} fill={`url(#${hot})`}/>
      {e.kind==='exact'&&<g className="bv-exact-cut" transform={`translate(${C.x} ${C.y}) rotate(-24)`}>
        <path d="M-150 0L-16 -3L0 -40L7 -5L155 0L11 4L0 46L-6 5Z" fill="#fff6d7" opacity={Math.max(0,1-e.age/110)}/>
        <ellipse rx={38+(1-e.flash)*125} ry={15+(1-e.flash)*58} fill="none" stroke="#ffe4a8" strokeWidth="2" opacity=".65"/>
      </g>}
      <ellipse cx={C.x} cy={C.y} rx={24+(1-e.flash)*65} ry={13+(1-e.flash)*35} fill="none" stroke={e.kind==='exact'?'#ffd590':'#f2e3bd'} strokeWidth={1+e.flash*2}/>
      <circle cx={C.x} cy={C.y} r={5+e.flash*9} fill="#fff3cd"/>
      {[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4,len=(i%2?45:70)*(1.4-e.flash*.5);return <path key={i} d={`M${C.x+Math.cos(a)*18},${C.y+Math.sin(a)*10}l${Math.cos(a)*len},${Math.sin(a)*len*.6}`} stroke={i%2?'#fff6d6':'#f7ad65'} strokeWidth={e.flash*3} strokeLinecap="round"/>;})}
    </g>}
    {e.kind==='near'&&e.age<380&&<g opacity={Math.max(0,1-e.age/380)}>
      <path d={`M${e.ball.x-26},${e.ball.y-36}q40 5 30 58`} fill="none" stroke="#c2e5e7" strokeWidth="2.5" opacity=".7"/>
      <path d={`M${C.x-18},${C.y-8}q30 15 58 8`} fill="none" stroke="#adcdd0" strokeWidth="2" strokeDasharray="4 7"/>
      <circle cx={C.x} cy={C.y} r="18" fill="none" stroke="#f0cf96" strokeWidth="1.5" strokeDasharray="4 5"/>
    </g>}
  </svg>;
}
