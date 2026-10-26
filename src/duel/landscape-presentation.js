import {BATTER_MOTION_V3_HIT_GRADES,BATTER_MOTION_V3_MISS_GRADES} from './batterMotionV3.js';
import {hasPitchVisual} from './pitcher-sd.js';

export const WIDE_CONTACT_GRADES=new Set([...BATTER_MOTION_V3_HIT_GRADES,'foul','battle-foul','out','sacrifice','sacrifice-run']);
export const WIDE_SWING_GRADES=new Set([...WIDE_CONTACT_GRADES,...BATTER_MOTION_V3_MISS_GRADES]);
export const WIDE_RECOVERY_END=1040;
/* A presentation contract, never an engine delay or another roll. The pitch
   arrival is unchanged. Authored recovery gets real screen time on one clock;
   ordinary misses no longer slow the actor clock and race the result clock. */
export function landscapePresentationTimeline(base,shot,reduced=false){
  if(!base||reduced)return base;
  if(!hasPitchVisual(shot))return {...base,duration:Math.min(base.duration,620),slowmo:0,releaseAt:base.impactAt+(base.freeze||0)};
  const swing=WIDE_SWING_GRADES.has(shot?.grade),impactAt=base.impactAt;
  return {...base,slowmo:0,releaseAt:impactAt+(base.freeze||0),
    settleAt:impactAt+(swing?470:160),duration:Math.max(impactAt+WIDE_RECOVERY_END+80,base.duration>3000?base.duration:0)};
}
export function timelinePoseAt(timeline,elapsed){
  let pose=timeline[0]?.pose||'ready';for(const key of timeline){if(key.at>elapsed)break;pose=key.pose;}return pose;
}
export function wideBallExit(grade,t,scale,x,y){
  if(grade==='foul'||grade==='battle-foul')return {x:x-t*scale*1.5,y:y-t*scale*.75+t*t*scale*.45};
  if(grade==='out'||grade==='sacrifice'||grade==='sacrifice-run')return {x:x+t*scale*1.6,y:y-t*scale*.15+t*t*scale*.5};
  return null;
}
export function presentationElapsed(now,startedAt,fallback){
  return Math.max(0,now-(Number.isFinite(startedAt)&&startedAt>0?startedAt:fallback));
}
