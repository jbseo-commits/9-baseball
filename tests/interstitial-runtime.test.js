import {describe,it,expect} from 'vitest';
import {rosterFrame,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import {batterGroundShadows} from '../src/duel/battle-vnext/batter-grounding.js';
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
 it('continues the bat arc through two authored follow drawings without changing contact, watch or recovery',()=>{
  const timeline={impactAt:1200,releaseAt:1400,freeze:95,duration:2100,delivery:{pitchReleaseAt:900}};
  const at=(elapsed,extra={})=>motionAt({elapsed,timeline,action:'swing',landed:elapsed>=1200,authoredBatterTweens:true,...extra});
  expect(at(1294)).toMatchObject({batter:8,batterFollow:null});
  expect(at(1349)).toMatchObject({batter:9,batterFollow:null});
  expect(at(1360).batterFollow).toBe(0);expect(at(1430).batterFollow).toBe(1);
  expect(at(1470)).toMatchObject({batter:10,batterFollow:null});
  expect(at(2100)).toMatchObject({batter:0,batterFollow:null});
  for(const action of ['take','prepare'])expect(at(1360,{action}).batterFollow).toBeNull();
  expect(at(1360,{reduced:true}).batterFollow).toBeNull();
  const before=structuredClone(timeline);for(let t=0;t<=2100;t+=5)at(t);expect(timeline).toEqual(before);
 });
 const keyDrawings=[0,1,3,5,7,8,10,12,13,14,15,16];
 const actor={releaseFrame:76,releaseAt:1267,landingAt:833,meta:{drawingAtTick:Array(120).fill(0),keyDrawings,releaseDrawing:10,landingDrawing:7}};
 it('finishes the authored hand-gather recovery on the exact original ready drawing without replaying the pitch backwards',()=>{
  const returning={...actor,meta:{...actor.meta,recoveryDrawings:[16,17,0]}};
  const timeline=rosterTimeline({duration:2000,freeze:0,slowmo:0},returning,false,{delivery:true,contactHold:95});
  const frames=timeline.delivery.drawingAtTick;
  const tail=frames.slice(frames.indexOf(16));
  expect([...new Set(tail)]).toEqual([16,17,0]);
  for(const drawing of [16,17,0])expect(tail.filter(d=>d===drawing).length).toBeGreaterThanOrEqual(4);
  expect(rosterFrame({timeline,action:'swing'},timeline.duration-1,returning)).toBe(0);
  expect(rosterFrame({timeline,action:'swing'},timeline.duration-1,returning,{knockedOut:true})).toBe(16);
  expect(tail.some(d=>d>0&&d<16)).toBe(false);
  expect(frames[Math.round(timeline.pitchReleaseAt*60/1000)]).toBe(10);
 });
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

describe('batter sole grounding',()=>{
 const meta={sourceHeight:768,worldHeight:1200,worldFoot:{x:200,y:960},anchor:{x:210,y:700}};
 it('keeps rear contact at the actor anchor and moves the lead shadow with the authored stride',()=>{
  const ready=batterGroundShadows(meta,0),contact=batterGroundShadows(meta,8);
  for(const key of [0,8,9,10,'follow-1','follow-2']){
   const [back,front]=batterGroundShadows(meta,key);
   expect(Math.abs(back.x+back.width/2-meta.worldFoot.x)).toBeLessThan(9);
   expect(front.x+front.width/2).toBeGreaterThan(back.x+back.width/2);
  }
  expect(contact[1].y-ready[1].y).toBeGreaterThan(70);
 });
 it('leaves the lifted load-foot shadow on the ground and softer than planted contact',()=>{
  const load=batterGroundShadows(meta,2)[1],planted=batterGroundShadows(meta,1)[1];
  expect(load.y).toBe(planted.y);expect(load.opacity).toBeLessThan(planted.opacity);
 });
});
