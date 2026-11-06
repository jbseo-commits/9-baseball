import {describe,it,expect} from 'vitest';
import {rosterFrame,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import {motionAt} from '../src/duel/battle-vnext/motion-timeline.js';

describe('authored in-between delivery sampling',()=>{
 it('inserts the authored bat rotation between6 and7 while keeping every original key and exact contact freeze',()=>{
  const timeline={impactAt:1200,releaseAt:1400,freeze:95,duration:2100,delivery:{pitchReleaseAt:900}};
  const at=(elapsed,extra={})=>motionAt({elapsed,timeline,action:'swing',landed:elapsed>=1200,authoredBatterTweens:true,...extra});
  expect(at(1130)).toMatchObject({batter:6,batterTween:null});
  expect(at(1150)).toMatchObject({batter:6,batterTween:0});
  expect(at(1170)).toMatchObject({batter:7,batterTween:null});
  for(const elapsed of [1200,1230,1294])expect(at(elapsed)).toMatchObject({batter:8,batterTween:null});
  for(const action of ['take','prepare'])expect(at(1150,{action}).batterTween).toBeNull();
  expect(at(1150,{reduced:true}).batterTween).toBeNull();
 });
 const keyDrawings=[0,1,3,5,7,8,10,12,13,14,15,16];
 const actor={releaseFrame:76,releaseAt:1267,landingAt:833,meta:{drawingAtTick:Array(120).fill(0),keyDrawings,releaseDrawing:10,landingDrawing:7}};
 it('actually shows every new drawing without releasing the ball before its event',()=>{
  const timeline=rosterTimeline({duration:2000,freeze:0,slowmo:0},actor,false,{delivery:true});
  const frames=timeline.delivery.drawingAtTick,releaseTick=Math.round(timeline.pitchReleaseAt*60/1000);
  expect(new Set(frames)).toEqual(new Set(Array.from({length:17},(_,i)=>i)));
  expect(frames[releaseTick]).toBe(10);
  expect(Math.max(...frames.slice(0,releaseTick))).toBeLessThan(10);
  expect(timeline.delivery.landingAt).toBe(frames.indexOf(7)*1000/60);
  expect(timeline.impactAt).toBe(timeline.pitchReleaseAt+300);
 });
 it('holds the same authored drawing throughout contact freeze and returns the final key',()=>{
  const timeline=rosterTimeline({duration:2000,freeze:0,slowmo:0},actor,false,{delivery:true,contactHold:95});
  const playback={timeline,action:'swing'},at=t=>rosterFrame(playback,t,actor);
  for(const dt of [1,30,70,94])expect(at(timeline.impactAt+dt)).toBe(at(timeline.impactAt));
  expect(at(timeline.duration-1)).toBe(16);
  expect(rosterTimeline(timeline,actor,true,{delivery:true})).toBe(timeline);
 });
});
