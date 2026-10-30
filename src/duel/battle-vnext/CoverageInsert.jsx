import React,{useLayoutEffect,useEffect,useState} from 'react';
import {placementTimeline,placementGeometry} from './placement-motion.js';
import {playPlacementSound} from './placement-audio.js';
import {animationRate as validRate} from '../animation-speed.js';
import {haptic} from '../haptics.js';
import './placement.css';

/* A receipt of the player's actual placement, never a second coverage judge.
   All covered cells ride and seat as one object; only surface light staggers. */
export default function CoverageInsert({request,pieces,rootRef,phase,sound=false,menuOpen=false,onFinish=null,animationRate=1}){
  const [effect,setEffect]=useState(null);
  const shape=pieces?.find(p=>p.id===request?.id),shapeKey=shape?shape.role+':'+shape.coverage.join(','):'';
  useLayoutEffect(()=>{
    if(!request||phase!=='deciding'||menuOpen||document.hidden){setEffect(null);return;}
    const root=rootRef.current,piece=pieces?.find(p=>p.id===request.id);
    if(!root||!piece?.coverage.length){setEffect(null);return;}
    const box=root.getBoundingClientRect(),source={...request.source,x:request.source.x-box.left,y:request.source.y-box.top};
    const cells=piece.coverage.flatMap(z=>{
      const el=root.querySelector(`.bv-cell[data-zone="${z}"]`);if(!el)return [];
      const b=el.getBoundingClientRect();return [{z,x:b.left-box.left,y:b.top-box.top,w:b.width,h:b.height}];
    });
    const view={left:Math.max(8,8-box.left),top:Math.max(52,8-box.top),right:Math.min(box.width-8,window.innerWidth-box.left-8),bottom:Math.min(box.height-8,window.innerHeight-box.top-8)};
    const geometry=placementGeometry(cells,source,view);if(!geometry){setEffect(null);return;}
    const rate=validRate(animationRate),timing=placementTimeline(cells.length);
    setEffect({...geometry,rate,timing,seq:request.seq,role:piece.role,order:piece.order||1,name:request.name,cost:request.cost,summary:request.summary,art:request.art,source,startedAt:performance.now()});
    const clear=()=>{setEffect(null);onFinish?.(request.seq);};
    const timer=setTimeout(clear,timing.duration/rate);window.addEventListener('resize',clear);document.addEventListener('visibilitychange',clear);
    return ()=>{clearTimeout(timer);window.removeEventListener('resize',clear);document.removeEventListener('visibilitychange',clear);};
  },[request,shapeKey,phase,rootRef,menuOpen,onFinish,animationRate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(!effect||!sound||menuOpen||phase!=='deciding'||document.hidden)return;
    const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return playPlacementSound({elapsed:(performance.now()-effect.startedAt)*effect.rate,rate:effect.rate,timing:effect.timing,reduced,pan:Math.max(-.4,Math.min(.4,effect.from.x/1200))});
  },[effect,sound,menuOpen,phase]);
  useEffect(()=>{
    if(!effect||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const timer=setTimeout(()=>haptic(8),Math.max(0,effect.timing.lockAt/effect.rate-(performance.now()-effect.startedAt)));return()=>clearTimeout(timer);
  },[effect]);
  if(!effect||phase!=='deciding'||menuOpen)return null;
  const e={...effect,order:shape?.order||effect.order},b=e.bounds,s=e.source,t=e.timing,wide=e.cells.length>1;
  const vars={'--place-duration':t.duration+'ms','--place-lock':t.lockAt+'ms','--place-stagger':t.stagger+'ms',
    '--stage-x':e.stage.x+'px','--stage-y':e.stage.y+'px','--read-scale':e.readScale,'--from-x':e.from.x+'px','--from-y':e.from.y+'px','--mid-x':e.mid.x+'px','--mid-y':e.mid.y+'px','--start-scale':e.scale,'--start-angle':(s.angle||0)+'deg',
    '--source-art':(s.artFraction||.4)*100+'%','--source-copy-x':((s.w||190)*(s.artFraction||.4)+12)/e.scale+'px','--source-w':(s.w||190)/e.scale+'px','--source-h':(s.h||76)/e.scale+'px','--source-font':(s.font||18)/e.scale+'px','--source-small':(s.small||12)/e.scale+'px'};
  const card=<span className="bv-insert-card"><span className="bv-insert-card-art" style={{backgroundImage:e.art?`url(${e.art})`:undefined}}/>
    <b>{e.cost}</b><strong>{e.name}</strong><small>{e.summary}</small><i/></span>;
  return <div key={e.seq} className={'bv-insert-fx'+(wide?' is-wide':'')+' r-'+e.role+' q-'+e.order} style={vars} aria-hidden="true" data-testid="bv-coverage-insert" data-card-name={e.name} data-card-id={request.id} data-insert-order={e.order} data-insert-seq={e.seq} data-animation-rate={e.rate} data-art-side={s.artSide||'left'} data-cell-count={e.cells.length} data-lock-at={t.lockAt}>
    <div className="bv-insert-receiver" style={{left:b.x,top:b.y,width:b.w,height:b.h}}>
      <svg viewBox={`-40 -40 ${b.w+80} ${b.h+80}`} width={b.w+80} height={b.h+80} className="bv-insert-outline"><path d={e.outline}/></svg>
      {e.cells.map(c=><span key={c.z} className="bv-insert-socket" style={{left:c.x,top:c.y,width:c.w,height:c.h}}/>)}
      <i className="bv-insert-ground"/>
      <svg className="bv-insert-impact" viewBox="-60 -60 120 120" preserveAspectRatio="none">
        <ellipse rx="42" ry="27"/>{Array.from({length:10},(_,i)=>{const a=i*Math.PI/5,x=Math.cos(a),y=Math.sin(a);return <path key={i} d={`M${x*30},${y*20}l${x*(i%2?15:27)},${y*(i%2?10:18)}`}/>;})}
      </svg>
    </div>
    {wide&&<div className="bv-insert-source" style={{left:s.x,top:s.y,rotate:(s.angle||0)+'deg','--source-w':s.w+'px','--source-h':s.h+'px','--source-font':(s.font||18)+'px','--source-small':(s.small||12)+'px','--source-copy-x':((s.w||190)*(s.artFraction||.4)+12)+'px'}}>{card}</div>}
    <div className="bv-insert-flight" data-testid="bv-insert-flight" style={{left:b.x,top:b.y,width:b.w,height:b.h}}>
      {!wide&&card}
      {e.cells.map(c=><span key={c.z} className="bv-insert-block" data-insert-zone={c.z} style={{left:c.x,top:c.y,width:c.w,height:c.h,'--seat-delay':c.rank*t.stagger+'ms','--tile-art':e.art?`url(${e.art})`:'none','--tile-art-x':(c.z%3)*50+'%','--tile-art-y':Math.floor(c.z/3)*50+'%'}}><i className="bv-insert-material"/><i className="bv-insert-bevel"/><b className="bv-insert-catch"/><em className="bv-insert-seam"/></span>)}
      {wide&&<svg className="bv-insert-piece-edge" viewBox={`-8 -8 ${b.w+16} ${b.h+16}`} width={b.w+16} height={b.h+16}><path className="edge-shadow" d={e.outline}/><path className="edge-light" d={e.outline}/></svg>}
    </div>
  </div>;
}
