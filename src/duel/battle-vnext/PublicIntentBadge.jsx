import React from 'react';
import {publicIntentBadge,intentBadgePosition} from './public-intent-badge.js';
import './public-intent-badge.css';
export default function PublicIntentBadge({faces,phase,point,bounds,tideCue=null,personality=null,confirmedOutside=false}){
 const badge=publicIntentBadge(faces,phase,confirmedOutside);
 const position=intentBadgePosition(point,bounds);
 if(!badge||!position)return null;
 return <div className="bv-public-intent" role="img" aria-label={badge.label+(personality?' · '+personality.description:'')+(tideCue?' · 낙차형은 궤적 표시 · '+tideCue.detail+' · '+tideCue.text:'')} data-certain={badge.certain?'true':'false'} data-knowledge={badge.certain?'exact':badge.zones.length?'range':'unknown'} style={position}>
  {badge.outside?<span className="bv-intent-outside" aria-hidden="true">볼</span>:<span className="bv-intent-nine" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} data-active={badge.zones.includes(i)?'true':undefined}>{badge.certain&&badge.zones.includes(i)?'•':''}</i>)}</span>}
  {personality&&<span className="bv-pitch-personality" data-profile={personality.id} data-ready={personality.ready?'true':'false'} style={position.left+110<bounds.width?{left:39}:{right:39}} aria-hidden="true"><strong>{personality.glyph}</strong>{personality.label}</span>}
  {!personality&&tideCue&&position.left+100<bounds.width&&<span className="bv-tide-wave" aria-hidden="true" data-ready={tideCue.ready?'true':'false'}><svg viewBox="0 0 18 14" aria-hidden="true"><path d="M0 5h3V2h3v3h3v3h3V5h3V2h3M0 11h3V8h3v3h3v3h3v-3h3V8h3" fill="none" stroke="currentColor" strokeWidth="2"/></svg><span aria-hidden="true">낙차형</span></span>}
  <b aria-hidden="true">{badge.certain?'!':'?'}</b>
 </div>;
}
