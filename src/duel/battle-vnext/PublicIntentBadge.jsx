import React from 'react';
import {publicIntentBadge,intentBadgePosition} from './public-intent-badge.js';
import './public-intent-badge.css';
export default function PublicIntentBadge({faces,phase,point,bounds,confirmedOutside=false}){
 const badge=publicIntentBadge(faces,phase,confirmedOutside);
 const position=intentBadgePosition(point,bounds);
 if(!badge||!position)return null;
 return <div className="bv-public-intent" role="img" aria-label={badge.label} data-certain={badge.certain?'true':'false'} data-knowledge={badge.certain?'exact':badge.zones.length?'range':'unknown'} style={position}>
  {badge.outside?<span className="bv-intent-outside" aria-hidden="true">볼</span>:<span className="bv-intent-nine" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} data-active={badge.zones.includes(i)?'true':undefined}>{badge.certain&&badge.zones.includes(i)?'•':''}</i>)}</span>}
  <b aria-hidden="true">{badge.certain?'!':'?'}</b>
 </div>;
}
