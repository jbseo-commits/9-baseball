import React,{useEffect} from 'react';
import manifest from '../../../assets/production-art/pitch-juice-v1/manifest.json';
import spark from '../../../assets/production-art/pitch-juice-v1/spark.png';
import critical from '../../../assets/production-art/pitch-juice-v1/critical.png';
import glance from '../../../assets/production-art/pitch-juice-v1/glance.png';
import impact from '../../../assets/production-art/pitch-juice-v1/impact.png';
import plant from '../../../assets/production-art/pitch-juice-v1/plant.png';
import wake from '../../../assets/production-art/pitch-juice-v1/wake.png';
import ball from '../../../assets/production-art/pitch-juice-v1/ball.png';
const images={spark,critical,glance,impact,plant,wake,ball};
export const FX_ATLASES=manifest.effects;

// A baked PixelFX atlas is sampled by the host clock. There is no second RAF,
// wall-clock timeout or particle simulation to drift at .25x/2x or after a skip.
export function fxFrameAt(key,age){
  const m=FX_ATLASES[key];
  if(!m||!Number.isFinite(age)||age<0)return null;
  const tick=Math.floor(age*m.fps/1000),frame=m.loop?tick%m.frames:tick;
  return frame<m.frames?{frame,column:frame%m.columns,row:Math.floor(frame/m.columns)}:null;
}
export function contactAtlasPlan(grade){
  switch(grade){
    case 'grand-slam':return [{key:'impact',full:true},{key:'critical',delay:105,size:3.2}];
    case 'homer':return [{key:'impact',full:true},{key:'critical',delay:95,size:2.8}];
    case 'extra':return [{key:'critical',size:2.7}];
    case 'dead-center':return [{key:'critical',size:2.3}];
    case 'solid':case 'hit':return [{key:'spark',size:2.3}];
    case 'lucky':return [{key:'spark',size:1.65}];
    case 'jammed':case 'out':case 'sacrifice':case 'sacrifice-run':return [{key:'glance',size:1.6}];
    case 'battle-foul':case 'foul':return [{key:'spark',size:1.25,angle:-34}];
    default:return [];
  }
}
export function FxSprite({kind,age,point={x:0,y:0},scale=1,size=1,full=false,bounds=null,angle=0,opacity=1}){
  const f=fxFrameAt(kind,age),m=FX_ATLASES[kind];if(!f)return null;
  const [w,h]=m.frameSize,[px,py]=kind==='plant'?m.pivot:m.contactPivot;
  const cover=full&&bounds?.width>0&&bounds?.height>0;
  const s=cover?Math.max(point.x/px,(bounds.width-point.x)/(w-px),point.y/py,(bounds.height-point.y)/(h-py)):Math.max(.01,scale*size);
  const box=full&&!cover?{inset:0,width:'100%',height:'100%'}:{left:point.x-px*s,top:point.y-py*s,width:w*s,height:h*s,transform:angle?`rotate(${angle}deg)`:undefined,transformOrigin:`${px*s}px ${py*s}px`};
  return <div className={'bv-pixel-sprite fx-'+kind} data-fx-frame={f.frame} data-fx-kind={kind} style={{position:'absolute',overflow:'hidden',pointerEvents:'none',opacity,...box}}>
    <img src={images[kind]} alt="" draggable="false" decoding="async" style={{position:'absolute',maxWidth:'none',width:m.columns*100+'%',height:Math.ceil(m.frames/m.columns)*100+'%',left:-f.column*100+'%',top:-f.row*100+'%',imageRendering:'pixelated'}}/>
  </div>;
}
export default function ContactPixelFx({active=false,grade=null,token=0,contact=null,sceneRef,age=0,scale=1,cameraOffset=null,freeze=0}){
  const reduced=!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const visible=active&&!reduced&&!!contact;
  const holding=visible&&age>=0&&age<freeze;
  useEffect(()=>{const el=sceneRef?.current;if(!el)return;el.classList.toggle('bv-hitstop',holding);return()=>el.classList.remove('bv-hitstop');},[holding,sceneRef,token]);
  const plan=visible?contactAtlasPlan(grade):[];
  return <div className="bv-contact-pixelfx" aria-hidden="true" data-testid="bv-contact-pixelfx" data-fx-token={visible?token:undefined} style={{transform:cameraOffset?`translate(${cameraOffset.x}px,${cameraOffset.y}px)`:undefined}}>
    {!reduced&&Object.entries(images).map(([key,url])=><img key={key} src={url} alt="" decoding="async" style={{display:'none'}}/>)}
    {plan.map((p,i)=><FxSprite key={token+'-'+i} kind={p.key} age={age-(p.delay||0)} point={contact} scale={scale} size={p.size} full={p.full} bounds={sceneRef?.current?{width:sceneRef.current.clientWidth,height:sceneRef.current.clientHeight}:null} angle={p.angle}/>)}
  </div>;
}
