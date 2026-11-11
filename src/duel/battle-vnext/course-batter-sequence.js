/* Authored drawing order, sampled solely from the existing host epoch. */
const pose=(atlas,frame,phase)=>({atlas,frame,phase});
export function courseBatterSampleAt({course,playback,elapsed=0,outcome}={}){
 if(!course||!playback||playback.action!=='swing'||!Number.isFinite(elapsed))return null;
 const t=playback.timeline,preStart=Math.max(280,t.courseLockAt+110);
 if(elapsed<preStart||!Number.isInteger(course.targetZone))return pose('original',Math.min(4,Math.floor(Math.max(0,elapsed)/Math.max(1,preStart/5))),'load');
 const zone=course.targetZone,row=zone===9?1:Math.floor(zone/3),pre=()=>pose('course',elapsed-preStart>=160&&row===2?6:elapsed-preStart>=80&&row>=1?3:0,'pre');
 if(course.phase!=='landed'||!outcome)return pre();
 const whiff=outcome.type==='whiff';
 if(!whiff&&outcome.contact!=='registered')return pose('original',elapsed<t.duration-240?4:elapsed<t.duration-160?11:elapsed<t.duration-80?12:13,'unregistered-hold');
 const at=t.impactAt+(whiff?100:0),hold=Math.max(150,t.freeze||0),postStart=at+hold,postEnd=t.duration-240;
 if(elapsed<at)return pre();
 if(elapsed<postStart)return pose('course',zone===9?10:row*3+1,whiff?'late-swing':'contact');
 const keys=[];if(zone===9)keys.push(pose('course',11,'outside-extension'));for(let r=row;r>=0;r--)keys.push(pose('course',r*3+2,'extension'));
 keys.push(pose('course',9,'late-follow'),pose('original',10,'follow'));
 const budget=postEnd-postStart;
 // Short legacy whiff tails keep the first extension and final follow. Omit a
 // near-identical raised pose instead of shortening each drawing below56ms.
 if(budget<keys.length*56&&keys.length>3){const redundant=keys.findIndex(k=>k.atlas==='course'&&k.frame===2);if(redundant>=0)keys.splice(redundant,1);}
 const min=keys.length*56;
 if(budget<min)return pose('original',4,'unregistered-hold');
 if(elapsed<postEnd){let cursor=postStart;const extra=(budget-min)/(keys.length+1);for(let i=0;i<keys.length;i++){cursor+=56+extra*(i===keys.length-1?2:1);if(elapsed<cursor)return keys[i];}}
 if(elapsed<t.duration-160)return pose('original',13,'recover');
 if(elapsed<t.duration-80)return pose('original',12,'recover');
 if(elapsed<t.duration)return pose('original',0,'recover');
 return pose('original',0,'ready');
}
export const COURSE_BATTER_FRAMES=Object.freeze({outsideContact:10,outsidePost:11,reservedEmpty:Object.freeze([12,13,14,15])});
export function courseBatterFrameAt(input){const s=courseBatterSampleAt(input);return s?.atlas==='course'?s.frame:null;}
