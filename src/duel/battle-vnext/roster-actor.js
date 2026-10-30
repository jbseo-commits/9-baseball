import {ATBAT_COMPOSITION} from './atbat-composition.js';
import registration from './roster-registration.json';
import {redRushFrameAt,PITCH_FLIGHT_MS} from '../pitcher-sd.js';
/* Existing production 10x12 atlases, never a shared sample wearing another name. */
export function rosterPitcherActor(artId,url){
 const registered=registration[artId];if(!url||!registered)return null;
 const meta={sourceWidth:256,sourceHeight:256,columns:10,rows:12,worldFoot:ATBAT_COMPOSITION.pitcher.worldFoot,worldHeight:300*256/registered.visibleHeight,anchor:registered.anchor};
 const k=meta.worldHeight/meta.sourceHeight;
 return {kind:'roster-atlas',artId,url,meta,release:{x:meta.worldFoot.x+(registered.release.x-meta.anchor.x)*k,y:meta.worldFoot.y+(registered.release.y-meta.anchor.y)*k},releaseAt:Math.round(registered.releaseFrame*1000/60)};
}
export function rosterFrame(playback,elapsed){return !playback||playback.timeline.duration<=60||playback.action==='prepare'?0:redRushFrameAt(elapsed);}

export function rosterTimeline(base,actor,reduced=false){
 if(!actor||reduced)return base;
 const impactAt=actor.releaseAt+PITCH_FLIGHT_MS,releaseAt=impactAt+(base.freeze||0)+(base.slowmo||0),settleAt=Math.max(1830,releaseAt+80,impactAt+500);
 return {...base,impactAt,releaseAt,settleAt,duration:Math.max(2000,base.duration,settleAt+170)};
}
