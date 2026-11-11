import React from 'react';
// Cell-local optical registration; the command board itself never moves/scales.
export default function CourseLockFx({age}){
 if(!Number.isFinite(age)||age<0||age>520)return null;
 const settle=1-Math.min(1,age/120),fade=Math.max(0,1-age/520),gap=3+settle*15;
 return <svg className="bv-course-lock-fx" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-lock-age={Math.round(age)}>
  <rect x="2" y="2" width="96" height="96" fill="#fff0ac" stroke="none" opacity={.3*Math.max(0,1-age/110)}/>
  <g fill="none" stroke="#fff2bd" strokeWidth="2.5" opacity={Math.max(.18,fade)}>
   <path d={`M${gap+15} ${gap}H${gap}V${gap+15}M${100-gap-15} ${gap}H${100-gap}V${gap+15}M${gap} ${100-gap-15}V${100-gap}H${gap+15}M${100-gap-15} ${100-gap}H${100-gap}V${100-gap-15}`}/>
  </g>
  <g stroke="#ffda7d" strokeWidth="1.8" opacity={fade}>
   {[0,1,2,3].map(n=>{const a=n*Math.PI/2+Math.PI/4,r=34+Math.min(1,age/330)*23;return <path key={n} d={`M${50+Math.cos(a)*r} ${50+Math.sin(a)*r}l${Math.cos(a)*7} ${Math.sin(a)*7}`}/>;})}
  </g>
 </svg>;
}
