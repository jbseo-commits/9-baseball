import React from 'react';
import {publicIntentBadge} from './public-intent-badge.js';
import './public-intent-badge.css';
export default function PublicIntentBadge({faces,phase,point,confirmedOutside=false}){
 const badge=publicIntentBadge(faces,phase,confirmedOutside);
 if(!badge||!point||point.x<24||point.y<52)return null;
 return <div className="bv-public-intent" role="img" aria-label={badge.label} data-certain={badge.certain?'true':'false'} style={{left:point.x,top:point.y-6}}>
  {badge.outside?<span className="bv-intent-outside" aria-hidden="true">볼</span>:<span className="bv-intent-nine" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} data-active={badge.zones.includes(i)?'true':undefined}>{badge.certain&&badge.zones.includes(i)?'•':''}</i>)}</span>}
  <b aria-hidden="true">{badge.certain?'!':'?'}</b>
 </div>;
}
