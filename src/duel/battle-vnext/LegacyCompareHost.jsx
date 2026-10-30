import React,{useLayoutEffect,useRef,useState} from 'react';
import {legacySceneGeometry,legacySceneVars} from './legacy-scene-geometry.js';
import './legacy-comparison.css';
export default function LegacyCompareHost({hasAtlas=false,children}){
  const root=useRef(null),[width,setWidth]=useState(440);
  useLayoutEffect(()=>{const e=root.current;if(!e)return;const scene=e.querySelector('.bp-scene');const measure=()=>{const w=scene?.clientWidth||e.clientWidth;if(w>0)setWidth(Math.min(440,w));};measure();
    const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;ro?.observe(e);if(scene)ro?.observe(scene);window.addEventListener('resize',measure);return()=>{ro?.disconnect();window.removeEventListener('resize',measure);};},[]);
  return <div ref={root} className="duel-app v14-battle-portrait bc-legacy-host" data-pitcher-source={hasAtlas?'atlas':'fallback'} style={legacySceneVars(legacySceneGeometry(width))}>{children}</div>;
}
