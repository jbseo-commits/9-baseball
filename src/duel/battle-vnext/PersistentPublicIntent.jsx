import React,{useLayoutEffect,useState} from 'react';
import PublicIntentBadge from './PublicIntentBadge.jsx';
import {pitcherOverheadPosition} from './public-intent-badge.js';

// Only already-public face text enters this component. Never pass execution,
// rolled course, aim, probabilities or an engine state. Remount per opponent.
export default function PersistentPublicIntent({faces=[],confirmedOutside=false,deciding,head,bounds}){
 const key=JSON.stringify([faces.slice(0,9),confirmedOutside===true]);
 const [last,setLast]=useState(()=>deciding?JSON.parse(key):[[],false]);
 useLayoutEffect(()=>{if(deciding)setLast(JSON.parse(key));},[key,deciding]);
 const shown=deciding?JSON.parse(key):last;
 const hp=pitcherOverheadPosition(head,bounds);
 if(!hp)return null;
 return <PublicIntentBadge faces={shown[0]} confirmedOutside={shown[1]} phase="deciding" bounds={bounds}
  position={{left:hp.left+36,top:hp.top-4}}/>;
}
