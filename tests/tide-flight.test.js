import {it,expect} from 'vitest';
import {tideFlightAt} from '../src/duel/battle-vnext/tide-flight.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import {ATBAT_COMPOSITION} from '../src/duel/battle-vnext/atbat-composition.js';
const actor=rosterPitcherActor('tide-vesper','tide.webp'),timeline=rosterTimeline({duration:2000,freeze:0},actor,false,{delivery:true}),R=actor.release,C=ATBAT_COMPOSITION.contact;
const composition={...ATBAT_COMPOSITION,release:R,flightProfile:'tide-drop'},playback={action:'swing',pitchReleaseAt:timeline.pitchReleaseAt,timeline};
it('keeps917/1217 events and has gravity sag returning exactly to real contact',()=>{
 expect(timeline.pitchReleaseAt).toBe(917);expect(timeline.impactAt).toBe(1217);
 const a=tideFlightAt(917,917,1217,R,C),z=tideFlightAt(1217,917,1217,R,C);
 expect(a.ball).toEqual(R);expect(a.radius).toBe(6);expect(z.ball).toEqual(C);expect(z.radius).toBe(12);
 const middle=tideFlightAt(1067,917,1217,R,C);expect(middle.ball.y).toBeLessThan(R.y+(C.y-R.y)/3);
 const sample=t=>tideFlightAt(t,917,1217,R,C).ball.y;
 expect(sample(1217)-sample(1200)).toBeGreaterThan(sample(1000)-sample(983));
});
it('uses a common action-independent incoming for hit/take/whiff/outside, never reads a private result precommit',()=>{
 const secret=new Proxy({},{get(){throw Error('secret preimpact access')}});
 for(const elapsed of [916,917,934,1000,1100,1217]){
  const swing=sceneEffectAt({elapsed,playback,composition,phase:'flight',result:secret});
  const take=sceneEffectAt({elapsed,playback:{...playback,action:'take'},composition,phase:'flight',result:secret});
  expect(take?.ball).toEqual(swing?.ball);expect(take?.radius).toBe(swing?.radius);
 }
});
it('keeps position, radius and tangent continuous through noncontact; real hits begin at C',()=>{
 for(const result of [{kind:'ball',actualZone:9},{kind:'called',actualZone:1},{kind:'whiff',actualZone:8,coverage:[0]}]){
  const f=t=>sceneEffectAt({elapsed:t,playback,composition,phase:t<1217?'flight':'result',result});
  const l=f(1216.999),at=f(1217),r=f(1217.001);expect(at.ball).toEqual(C);expect(at.radius).toBe(12);
  for(const axis of ['x','y'])expect((at.ball[axis]-l.ball[axis])/.001).toBeCloseTo((r.ball[axis]-at.ball[axis])/.001,3);
  expect((at.radius-l.radius)/.001).toBeCloseTo((r.radius-at.radius)/.001,3);
 }
 expect(sceneEffectAt({elapsed:1217,playback,composition,phase:'result',result:{kind:'hit',call:'안타'}}).ball).toEqual(C);
 expect(sceneEffectAt({elapsed:20,playback:{...playback,timeline:{duration:60}},composition})).toBeNull();
 expect(tideFlightAt(1397,917,1217,R,C).hidden).toBe(true);
});
