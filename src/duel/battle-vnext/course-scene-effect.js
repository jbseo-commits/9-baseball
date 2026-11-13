import {courseTarget} from './course-presentation.js';
import {sceneEffectAt} from './scene-effects.js';
/* Exactly one ball. Outgoing curves begin at the same registered incoming T. */
export function courseSceneEffectAt({courseModel,playback,elapsed,result,phase,composition}={}){
 const c=courseModel?.course;if(!c||!playback||!Number.isInteger(c.targetZone))return null;
 const target=courseTarget(c.targetZone),t=playback.timeline;
 if(courseModel.phase!=='landed'){
  if(!c.ball)return null;
  return {kind:'flight',ball:c.ball,previous:c.ball,radius:8,age:Math.max(0,elapsed-t.pitchReleaseAt),spinAge:Math.max(0,elapsed-t.pitchReleaseAt),flash:0,camera:0,trail:0};
 }
 if(courseModel.outcome?.contact==='registered'){
  const effect=sceneEffectAt({elapsed,playback,result,phase,composition:{...composition,mound:composition?.mound||{x:832,y:580},contact:target}});
  return effect?{...effect,radius:effect.radius*2/3,camera:0,contactPoint:target}:null;
 }
 const age=Math.max(0,elapsed-t.impactAt),p=Math.min(1,age/310),origin=composition?.release||target;
 const end={x:target.x+(target.x-origin.x)*.5,y:target.y+330};
 const at=k=>({x:target.x+(end.x-target.x)*k,y:target.y+(end.y-target.y)*k});
 return {kind:'pass',ball:at(p),previous:at(Math.max(0,p-.1)),radius:8+6*p,age,spinAge:age,flash:0,camera:0,trail:0,hidden:p>=1};
}
