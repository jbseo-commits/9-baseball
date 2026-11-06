import {ATBAT_COMPOSITION} from './atbat-composition.js';
import registration from './roster-registration.json';
import {redRushFrameAt,PITCH_FLIGHT_MS} from '../pitcher-sd.js';
/* Reviewed character-specific drawings, held on the existing 120-tick timeline. */
export function rosterPitcherActor(artId,url){
 const registered=registration[artId];if(!url||!registered)return null;
 const meta={sourceWidth:256,sourceHeight:256,columns:registered.columns||10,rows:registered.rows||12,drawingAtTick:registered.drawingAtTick,worldFoot:registered.worldFoot||ATBAT_COMPOSITION.pitcher.worldFoot,worldHeight:(registered.visibleWorldHeight||300)*256/registered.visibleHeight,anchor:registered.anchor};
 const k=meta.worldHeight/meta.sourceHeight;
 const world=p=>({x:meta.worldFoot.x+(p.x-meta.anchor.x)*k,y:meta.worldFoot.y+(p.y-meta.anchor.y)*k});
 return {kind:'roster-atlas',artId,url,meta,release:world(registered.release),releaseAt:Math.round(registered.releaseFrame*1000/60),
   landing:registered.landing?world(registered.landing):null,landingAt:registered.landingFrame==null?null:Math.round(registered.landingFrame*1000/60)};
}
export function rosterFrame(playback,elapsed,actor=null){
 const tick=!playback||playback.timeline.duration<=60||playback.action==='prepare'?0:redRushFrameAt(elapsed);
 return actor?.meta.drawingAtTick?.[tick]??tick;
}

export function rosterTimeline(base,actor,reduced=false){
 if(!actor||reduced)return base;
 const impactAt=actor.releaseAt+PITCH_FLIGHT_MS,releaseAt=impactAt+(base.freeze||0)+(base.slowmo||0),settleAt=Math.max(1830,releaseAt+80,impactAt+500);
 return {...base,impactAt,releaseAt,settleAt,duration:Math.max(2000,base.duration,settleAt+170)};
}
