import {it,expect} from 'vitest';
import {foxFlightAt} from '../src/duel/battle-vnext/fox-flight.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import registration from '../src/duel/battle-vnext/roster-registration.json';
const R={x:947.21564,y:384.46522},C={x:818.75,y:450.104167};
const playback={action:'swing',pitchReleaseAt:950,timeline:{duration:2200,impactAt:1250,freeze:80,settleAt:1830}};
const composition={release:R,contact:C,mound:{x:834,y:536},flightProfile:'fox-depth'};
const effect=(elapsed,phase,result,action='swing',comp=composition)=>sceneEffectAt({elapsed,phase,result,playback:{...playback,action},composition:comp});
it('starts at the hand, moves immediately along a straight depth ray, grows and reaches the real contact exactly',()=>{
 const samples=[950,950+1000/60,950+2000/60,1250].map(t=>foxFlightAt(t,950,1250,R,C));
 expect(samples[0].ball).toEqual(R);expect(samples[0].radius).toBe(6);expect(samples.at(-1).ball).toEqual(C);expect(samples.at(-1).radius).toBe(12);
 for(let i=1;i<samples.length;i++){expect(samples[i].ball.x).toBeLessThan(samples[i-1].ball.x);expect(samples[i].radius).toBeGreaterThan(samples[i-1].radius);const b=samples[i].ball;expect((b.x-R.x)*(C.y-R.y)-(b.y-R.y)*(C.x-R.x)).toBeCloseTo(0,7)}
 expect(R.x-samples[1].ball.x).toBeGreaterThan(3);
});
it('has identical position, diameter and velocity across take/miss impact without consulting hidden results',()=>{
 for(const action of ['take','swing'])for(const result of [{kind:'ball',actualZone:9},{kind:'strike',actualZone:2},{kind:'whiff',actualZone:2,coverage:[1]}]){
  const before=effect(1250,'flight',null,action),at=effect(1250,'result',result,action),left=effect(1249.99,'flight',null,action),right=effect(1250.01,'result',result,action);
  expect(at.ball).toEqual(before.ball);expect(at.radius).toBe(before.radius);expect(at.radius).toBe(12);expect(at.flash).toBe(0);expect(at.camera).toBe(0);
  expect((at.ball.x-left.ball.x)/.01).toBeCloseTo((right.ball.x-at.ball.x)/.01,3);expect((at.radius-left.radius)/.01).toBeCloseTo((right.radius-at.radius)/.01,3);
 }
 const secret=new Proxy({}, {get(){throw new Error('preimpact result read')}});expect(()=>effect(1100,'flight',secret)).not.toThrow();
});
it('preserves true contact response, reduced-motion behavior, and clips the noncontact ray before the camera plane',()=>{
 const hit=effect(1250,'result',{kind:'hit',exact:true,actualZone:2,call:'안타'});expect(hit.ball).toEqual(C);expect(hit.radius).toBe(12);expect(hit.flash).toBe(1);
 expect(foxFlightAt(1429,950,1250,R,C).hidden).toBe(false);const clipped=foxFlightAt(1550,950,1250,R,C);expect(clipped.hidden).toBe(true);expect(Number.isFinite(clipped.ball.x)).toBe(true);
 expect(sceneEffectAt({elapsed:20,phase:'result',result:{kind:'whiff'},composition,playback:{...playback,timeline:{duration:60}}})).toBeNull();
});
it('keeps every other registered pitcher on the literal original squared-flight and pass contract',()=>{
 for(const r of Object.values(registration).filter(r=>r.id!=='regular-07-red-fox')){
  const k=r.visibleWorldHeight/r.visibleHeight||300/r.visibleHeight;const release={x:834+(r.release.x-r.anchor.x)*k,y:536+(r.release.y-r.anchor.y)*k};
  const comp={release,contact:C,mound:{x:834,y:536}};
  const f=effect(1100,'flight',null,'swing',comp);expect(f.ball).toEqual({x:release.x+(C.x-release.x)*.25,y:release.y+(C.y-release.y)*.25});expect(f.radius).toBe(5.25);
  const pass=effect(1250,'result',{kind:'strike',actualZone:2},'take',comp);expect(pass.ball).toEqual({x:C.x+60,y:C.y-3});expect(pass.radius).toBe(7);
 }
});

import {sceneEffectAt as baselineEffect} from '../docs/qa/fox-depth-continuity-20261120/baseline-scene-effects.js';
it('deep-compares every other roster output against the unchanged baseline across actions, events and outcomes',()=>{
 for(const r of Object.values(registration).filter(r=>r.id!=='regular-07-red-fox'))for(const action of ['swing','take','prepare'])for(const phase of ['flight','result'])for(const elapsed of [0,950,966.667,1100,1249.99,1250,1250.01,1400,1800])for(const result of [{kind:'hit',exact:true,actualZone:2,call:'안타'},{kind:'hit',actualZone:2,call:'홈런'},{kind:'whiff',actualZone:2,coverage:[1]},{kind:'ball',actualZone:9}]){
  const k=(r.visibleWorldHeight||300)/r.visibleHeight,release={x:834+(r.release.x-r.anchor.x)*k,y:536+(r.release.y-r.anchor.y)*k};const args={elapsed,phase,result,playback:{...playback,action},composition:{release,contact:C,mound:{x:834,y:536}}};expect(sceneEffectAt(args)).toEqual(baselineEffect(args));
 }
});

it('uses one action-independent Fox incoming ray and a continuous shared pass endpoint',()=>{
 for(const elapsed of [950,966.667,1000,1100,1249.99,1250]){
  const swing=effect(elapsed,'flight',null,'swing'),take=effect(elapsed,'flight',null,'take');expect(take.ball).toEqual(swing.ball);expect(take.radius).toBe(swing.radius);
 }
 for(const elapsed of [1250,1250.01,1300]){
  const swing=effect(elapsed,'result',{kind:'whiff',actualZone:2,coverage:[6]},'swing'),take=effect(elapsed,'result',{kind:'strike',actualZone:2},'take');expect(take.ball).toEqual(swing.ball);expect(take.radius).toBe(swing.radius);
 }
});
