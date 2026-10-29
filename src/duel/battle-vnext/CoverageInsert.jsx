import React,{useLayoutEffect,useEffect,useState} from 'react';
import {PLACEMENT,placementGeometry} from './placement-motion.js';
import {playPlacementSound} from './placement-audio.js';
import {haptic} from '../haptics.js';
import './placement.css';

/* A receipt of the player's actual placement, never a second coverage judge.
   All tiles ride one transform, then seat independently only after arrival. */
export default function CoverageInsert({request,pieces,rootRef,phase,sound=false,menuOpen=false,onFinish=null}){
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
    const geometry=placementGeometry(cells,source);if(!geometry){setEffect(null);return;}
    setEffect({...geometry,seq:request.seq,role:piece.role,order:piece.order||1,name:request.name,cost:request.cost,summary:request.summary,art:request.art,source,startedAt:performance.now()});
    const clear=()=>{setEffect(null);onFinish?.(request.seq);};
    const timer=setTimeout(clear,PLACEMENT.duration);window.addEventListener('resize',clear);document.addEventListener('visibilitychange',clear);
    return ()=>{clearTimeout(timer);window.removeEventListener('resize',clear);document.removeEventListener('visibilitychange',clear);};
  },[request,shapeKey,phase,rootRef,menuOpen,onFinish]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(!effect||!sound||menuOpen||phase!=='deciding'||document.hidden)return;
    const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return playPlacementSound({elapsed:performance.now()-effect.startedAt,reduced,pan:Math.max(-.4,Math.min(.4,effect.from.x/1200))});
  },[effect,sound,menuOpen,phase]);
  useEffect(()=>{
    if(!effect||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const timer=setTimeout(()=>haptic(8),Math.max(0,PLACEMENT.lockAt-(performance.now()-effect.startedAt)));return()=>clearTimeout(timer);
  },[effect]);
  if(!effect||phase!=='deciding'||menuOpen)return null;
  const e={...effect,order:shape?.order||effect.order},b=e.bounds,s=e.source;
  const vars={'--place-duration':PLACEMENT.duration+'ms','--place-lock':PLACEMENT.lockAt+'ms','--place-stagger':PLACEMENT.stagger+'ms',
    '--from-x':e.from.x+'px','--from-y':e.from.y+'px','--mid-x':e.mid.x+'px','--mid-y':e.mid.y+'px','--start-scale':e.scale,'--start-angle':(s.angle||0)+'deg',
    '--source-art':(s.artFraction||.4)*100+'%','--source-copy-x':((s.w||190)*(s.artFraction||.4)+12)/e.scale+'px','--source-w':(s.w||190)/e.scale+'px','--source-h':(s.h||76)/e.scale+'px','--source-font':(s.font||18)/e.scale+'px','--source-small':(s.small||12)/e.scale+'px'};
  return <div key={e.seq} className={'bv-insert-fx r-'+e.role+' q-'+e.order} style={vars} aria-hidden="true" data-testid="bv-coverage-insert" data-card-name={e.name} data-card-id={request.id} data-insert-order={e.order} data-insert-seq={e.seq}>
    <div className="bv-insert-receiver" style={{left:b.x,top:b.y,width:b.w,height:b.h}}>
      <svg viewBox={`-40 -40 ${b.w+80} ${b.h+80}`} width={b.w+80} height={b.h+80} className="bv-insert-outline"><path d={e.outline}/></svg>
      {e.cells.map(c=><span key={c.z} className="bv-insert-socket" style={{left:c.x,top:c.y,width:c.w,height:c.h}}/>)}
      <i className="bv-insert-ground"/>
      <svg className="bv-insert-impact" viewBox="-60 -60 120 120" preserveAspectRatio="none">
        <ellipse rx="42" ry="27"/>{Array.from({length:10},(_,i)=>{const a=i*Math.PI/5,x=Math.cos(a),y=Math.sin(a);return <path key={i} d={`M${x*30},${y*20}l${x*(i%2?15:27)},${y*(i%2?10:18)}`}/>;})}
      </svg>
    </div>
    <div className="bv-insert-flight" data-testid="bv-insert-flight" style={{left:b.x,top:b.y,width:b.w,height:b.h}}>
      <span className="bv-insert-card"><span className="bv-insert-card-art" style={{backgroundImage:e.art?`url(${e.art})`:undefined}}/>
        <b>{e.cost}</b><strong>{e.name}</strong><small>{e.summary}</small><i/></span>
      {e.cells.map(c=><span key={c.z} className="bv-insert-block" data-insert-zone={c.z} style={{left:c.x,top:c.y,width:c.w,height:c.h,'--seat-delay':c.rank*PLACEMENT.stagger+'ms','--tile-art':e.art?`url(${e.art})`:'none','--tile-art-x':(c.z%3)*50+'%','--tile-art-y':Math.floor(c.z/3)*50+'%'}}><i className="bv-insert-material"/><i className="bv-insert-bevel"/><b className="bv-insert-catch"/><em className="bv-insert-seam"/></span>)}
    </div>
  </div>;
}
