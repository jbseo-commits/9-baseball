import React from 'react';
import {FIELD,groundPolygon} from './landscape-camera.js';
export default function LandscapeField({width,height}){
  if(!width||!height)return null;
  const poly=points=>groundPolygon(width,height,points),p=FIELD.plate/2;
  const rect=(x0,x1,z0,z1,y=0)=>poly([[x0,z0,y],[x1,z0,y],[x1,z1,y],[x0,z1,y]]);
  const box=side=>{const inner=side*(p+FIELD.boxGap),outer=inner+side*FIELD.boxWidth;return rect(inner,outer,-FIELD.boxDepth/2,FIELD.boxDepth/2);};
  const circle=(radius,y=0)=>poly(Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return [Math.cos(a)*radius,FIELD.rubberDistance-.4572+Math.sin(a)*radius,y];}));
  return <svg className="bp-camera-ground" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" data-testid="camera-ground">
    <polygon points={circle(FIELD.moundRadius)} fill="#75452e" stroke="#b38354" strokeWidth="1"/>
    <polygon points={circle(FIELD.moundRadius*.7,.13)} fill="#9d6840" opacity=".5"/>
    <polygon data-testid="camera-rubber" points={rect(-.3048,.3048,FIELD.rubberDistance-.0762,FIELD.rubberDistance+.0762,.254)} fill="#e7d8b5"/>
    <g fill="none" stroke="#ead9b4" strokeWidth={Math.max(.7,height*.007)} strokeLinejoin="round" opacity=".75">
      <polygon data-testid="camera-box-left" points={box(-1)}/><polygon points={box(1)}/>
      <polyline points={poly([[-22,22],[-2.1,2.1]])}/><polyline points={poly([[22,22],[2.1,2.1]])}/>
    </g>
    <polygon data-testid="camera-plate" points={poly([[-p,p],[p,p],[p,0],[0,-p],[-p,0]])} fill="#f3dfb7" stroke="#5a3928" strokeWidth="1"/>
  </svg>;
}
