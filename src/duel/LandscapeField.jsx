import React from 'react';
import {FIELD,groundPolygon,projectField,cameraLens,moundHeight,castShadowEnd} from './landscape-camera.js';
import turf from '../../assets/landscape-ballpark-v4/turf.webp';
import clay from '../../assets/landscape-ballpark-v4/clay.webp';
export default function LandscapeField({width,height}){
  if(!width||!height)return null;
  const poly=points=>groundPolygon(width,height,points),p=FIELD.plate/2;
  const rect=(x0,x1,z0,z1,y=0)=>poly([[x0,z0,y],[x1,z0,y],[x1,z1,y],[x0,z1,y]]);
  const box=side=>{const inner=side*(p+FIELD.boxGap),outer=inner+side*FIELD.boxWidth;return rect(inner,outer,-FIELD.boxDepth/2,FIELD.boxDepth/2);};
  const ring=(radius,cx=0,cz=0,y=0)=>Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return [cx+Math.cos(a)*radius,cz+Math.sin(a)*radius,y];});
  const moundZ=FIELD.rubberDistance-.4572,horizon=cameraLens(width,height).y;
  const shadow=(x,z,bodyHeight,rx,rz,y,id)=>{
    const [ex,ez]=castShadowEnd(x,z,bodyHeight),foot=projectField(width,height,x,z,y);
    const dx=ex-x,dz=ez-z,length=Math.hypot(dx,dz)||1;
    const cast=Array.from({length:48},(_,i)=>{const a=i*Math.PI/24,t=(1-Math.cos(a))/2,w=Math.sin(a)*rx*.7;return [x+dx*t-dz/length*w,z+dz*t+dx/length*w,y];});
    return <g data-testid={'ground-shadow-'+id} data-foot={`${foot.x},${foot.y}`}>
      <polygon points={poly(cast)} fill="url(#wide-cast)"/>
      <polygon points={poly(ring(1).map(([px,pz])=>[x+px*rx,z+pz*rz,y]))} fill="url(#wide-contact)"/>
    </g>;
  };
  return <svg className="bp-camera-ground" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" data-testid="camera-ground">
    <defs>
      <linearGradient id="wide-turf" x2="0" y2="1"><stop stopColor="#173e38"/><stop offset="1" stopColor="#38513d"/></linearGradient>
      <linearGradient id="wide-dirt" x2="1" y2="1"><stop stopColor="#a17b52"/><stop offset=".5" stopColor="#73583e"/><stop offset="1" stopColor="#493f36"/></linearGradient>
      <radialGradient id="wide-cast"><stop stopColor="#061722" stopOpacity=".28"/><stop offset=".45" stopColor="#061722" stopOpacity=".17"/><stop offset="1" stopColor="#061722" stopOpacity="0"/></radialGradient>
      <radialGradient id="wide-contact"><stop stopColor="#071b23" stopOpacity=".48"/><stop offset=".55" stopColor="#071b23" stopOpacity=".25"/><stop offset="1" stopColor="#071b23" stopOpacity="0"/></radialGradient>
      <pattern id="wide-grain" width="31" height="23" patternUnits="userSpaceOnUse"><path d="M3 5h2v1H3z M17 13h3v1h-3z M26 2h1v2h-1z" fill="#f4dcab" opacity=".08"/><path d="M9 17h3v1H9z M22 9h2v2h-2z" fill="#061f26" opacity=".2"/></pattern>
      <clipPath id="wide-dirt-clip"><polygon points={poly(ring(4.3))}/></clipPath>
      <clipPath id="wide-mound-clip"><polygon points={poly(ring(FIELD.moundRadius,0,moundZ))}/></clipPath>
    </defs>
    <rect x="0" y={horizon+height*.012} width={width} height={height} fill="url(#wide-turf)"/>
    <image href={turf} x="0" y={horizon+height*.012} width={width} height={height-horizon} preserveAspectRatio="none" opacity=".57"/>
    <polygon points={poly(ring(4.3))} fill="url(#wide-dirt)"/>
    <image href={clay} width={width} height={height} preserveAspectRatio="none" clipPath="url(#wide-dirt-clip)" opacity=".48"/>
    <rect width={width} height={height} fill="url(#wide-grain)" clipPath="url(#wide-dirt-clip)"/>
    {/* Sloping radial faces meet the flat .254m rubber plateau. */}
    <g data-testid="camera-mound">{Array.from({length:16},(_,i)=>{
      const a=i*Math.PI/8,b=(i+1)*Math.PI/8,verts=[[Math.cos(a)*FIELD.moundRadius,moundZ+Math.sin(a)*FIELD.moundRadius,0],[Math.cos(b)*FIELD.moundRadius,moundZ+Math.sin(b)*FIELD.moundRadius,0],[Math.cos(b)*.9,moundZ+Math.sin(b)*.9,.254],[Math.cos(a)*.9,moundZ+Math.sin(a)*.9,.254]];
      return <polygon key={i} points={poly(verts)} fill={['#90704d','#8a6c4b','#806346','#765c42','#6c5640','#65523e','#5c4c3b','#584b3b','#5c503e','#665a44','#756449','#826c4d','#957a53','#a38358','#aa895b','#a18156'][i]}/>;
    })}<polygon points={poly(ring(.9,0,moundZ,.254))} fill="#a17e53"/></g>
    <image href={clay} width={width} height={height} preserveAspectRatio="none" clipPath="url(#wide-mound-clip)" opacity=".28"/>
    {shadow(0,FIELD.rubberDistance,1.7,.28,.16,moundHeight(0,FIELD.rubberDistance),'pitcher')}
    <polygon data-testid="camera-rubber" points={rect(-.3048,.3048,FIELD.rubberDistance-.0762,FIELD.rubberDistance+.0762,.254)} fill="#d7d2b4" stroke="#675b43" strokeWidth=".6"/>
    {shadow(-.96,-.25,1.8,.87,.22,0,'batter')}
    <g fill="none" stroke="#dfd6b8" strokeWidth={Math.max(.7,height*.005)} strokeLinejoin="round" opacity=".73">
      <polygon data-testid="camera-box-left" points={box(-1)}/><polygon points={box(1)}/>
      <polyline points={poly([[-22,22],[-2.1,2.1]])}/><polyline points={poly([[22,22],[2.1,2.1]])}/>
    </g>
    <polygon data-testid="camera-plate" points={poly([[-p,p],[p,p],[p,0],[0,-p],[-p,0]])} fill="#f3dfb7" stroke="#5a3928" strokeWidth="1"/>
  </svg>;
}
