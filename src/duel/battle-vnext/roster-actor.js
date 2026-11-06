import {ATBAT_COMPOSITION} from './atbat-composition.js';
import registration from './roster-registration.json';
import {redRushFrameAt,PITCH_FLIGHT_MS} from '../pitcher-sd.js';
/* Reviewed character-specific drawings, held on the existing 120-tick timeline. */
export function rosterPitcherActor(artId,url){
 const registered=registration[artId];if(!url||!registered)return null;
 const meta={sourceWidth:256,sourceHeight:256,columns:registered.columns||10,rows:registered.rows||12,drawingAtTick:registered.drawingAtTick,worldFoot:registered.worldFoot||ATBAT_COMPOSITION.pitcher.worldFoot,worldHeight:(registered.visibleWorldHeight||300)*256/registered.visibleHeight,anchor:registered.anchor};
 const k=meta.worldHeight/meta.sourceHeight;
 const world=p=>({x:meta.worldFoot.x+(p.x-meta.anchor.x)*k,y:meta.worldFoot.y+(p.y-meta.anchor.y)*k});
 return {kind:'roster-atlas',artId,url,meta,release:world(registered.release),releaseFrame:registered.releaseFrame,releaseAt:Math.round(registered.releaseFrame*1000/60),
   landing:registered.landing?world(registered.landing):null,landingAt:registered.landingFrame==null?null:Math.round(registered.landingFrame*1000/60)};
}
export function rosterFrame(playback,elapsed,actor=null){
 const timeline=playback?.timeline,delivery=timeline?.delivery;
 let sample=elapsed;
 if(delivery&&timeline?.freeze>0&&elapsed>timeline.impactAt)sample-=Math.min(timeline.freeze,elapsed-timeline.impactAt);
 const tick=!playback||timeline?.duration<=60||playback.action==='prepare'?0:redRushFrameAt(sample);
 return delivery?.drawingAtTick?.[tick]??actor?.meta.drawingAtTick?.[tick]??tick;
}

function deliveryFrames(actor,releaseTick){
 const source=actor.meta.drawingAtTick,releaseFrame=source[actor.releaseFrame],before=[0,1,2,3,4,5],after=[6,7,8,9,10,11];
 const desired=[7,7,10,10,10,11],sum=desired.reduce((a,b)=>a+b,0),lengths=desired.map(n=>Math.max(1,Math.round(n*releaseTick/sum)));
 while(lengths.reduce((a,b)=>a+b,0)>releaseTick)lengths[lengths.indexOf(Math.max(...lengths))]--;
 while(lengths.reduce((a,b)=>a+b,0)<releaseTick)lengths[lengths.indexOf(Math.min(...lengths))]++;
 const result=[];before.forEach((frame,i)=>result.push(...Array(lengths[i]).fill(frame)));
 result.push(releaseFrame);
 // The whip is quick; recovery takes the spare time, rather than holding the release arm.
 const sourceRuns=[4,4,8,10,10,18],remaining=120-result.length,total=sourceRuns.reduce((a,b)=>a+b,0);
 const post=sourceRuns.map(n=>Math.max(1,Math.round(n*remaining/total)));
 while(post.reduce((a,b)=>a+b,0)>remaining)post[post.indexOf(Math.max(...post))]--;
 while(post.reduce((a,b)=>a+b,0)<remaining)post[post.indexOf(Math.min(...post))]++;
 after.forEach((frame,i)=>result.push(...Array(post[i]).fill(frame)));
 return result.slice(0,120);
}
export function rosterTimeline(base,actor,reduced=false,{delivery=false,contactHold=0}={}){
 if(!actor||reduced)return base;
 const releaseTick=delivery?Math.round(actor.releaseFrame*.72):actor.releaseFrame,pitchReleaseAt=delivery?Math.round(releaseTick*1000/60):actor.releaseAt;
 const impactAt=pitchReleaseAt+PITCH_FLIGHT_MS,freeze=Math.max(base.freeze||0,delivery?contactHold:0),releaseAt=impactAt+freeze+(base.slowmo||0),settleAt=Math.max(1830,releaseAt+80,impactAt+500);
 const drawingAtTick=delivery?deliveryFrames(actor,releaseTick):null,landingAt=delivery?drawingAtTick.indexOf(4)*1000/60:actor.landingAt;
 return {...base,impactAt,releaseAt,settleAt,freeze,duration:Math.max(2000+(delivery?freeze:0),base.duration,settleAt+170),...(delivery?{pitchReleaseAt,delivery:{drawingAtTick,contactHold,landingAt,pitchReleaseAt}}:{})};
}
