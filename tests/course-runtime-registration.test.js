import {describe,it,expect} from 'vitest';
import fs from 'node:fs';import crypto from 'node:crypto';
import {COURSE_BATTER_ATLAS_URL,COURSE_BATTER_META,registeredCourseContact} from '../src/duel/battle-vnext/course-batter-atlas.js';
import registry from '../assets/production-art/batter-course-v2/contact-registry.json';
import {courseBatterSampleAt} from '../src/duel/battle-vnext/course-batter-sequence.js';
import {courseSceneEffectAt} from '../src/duel/battle-vnext/course-scene-effect.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import roster from '../src/duel/battle-vnext/roster-registration.json';
import {presentationFor,presentationTimeline} from '../src/duel/presentation.js';
import {createV10Duel,enterV10Node,playV10Action} from '../src/duel/engine.js';
import {courseTarget} from '../src/duel/battle-vnext/course-presentation.js';
const atlas={url:COURSE_BATTER_ATLAS_URL,meta:COURSE_BATTER_META};
const timeline={courseLockAt:900,pitchReleaseAt:1160,impactAt:1460,freeze:70,settleAt:2100,releaseAt:1530,duration:2600};
const pb={timeline,action:'swing'};
describe('source-bound course renderer',()=>{
 it('binds only the decoded-reviewed lossless source, fixed mapping, frame and semantic mask',()=>{
  const bytes=fs.readFileSync(new URL('../assets/production-art/batter-course-v2/batter-course-4x4.webp',import.meta.url));
  expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(registry.atlasSha256);
  for(let zone=0;zone<10;zone++){const c=registeredCourseContact(atlas,zone);expect(c?.frame).toBe(zone===9?10:Math.floor(zone/3)*3+1);expect(c?.point).toEqual(courseTarget(zone));expect(courseBatterSampleAt({course:{phase:'landed',targetZone:zone},playback:pb,elapsed:timeline.impactAt,outcome:{type:'in-zone-contact',contact:'registered'}})).toMatchObject({atlas:'course',frame:c.frame,phase:'contact'});expect(c?.maskSha256).toMatch(/^[0-9a-f]{64}$/);}
  expect(registeredCourseContact({...atlas,url:'different'},4)).toBeNull();
  for(const patch of [{frameCount:10},{frameCount:13},{sourceWidth:768},{worldHeight:1201},{anchor:{x:211,y:700}},{atlasSha256:'wrong'},{worldFoot:{x:201,y:960}}])expect(registeredCourseContact({...atlas,meta:{...atlas.meta,...patch}},4)).toBeNull();
 });
 it('keeps decorative scan separate from source PRE, late whiff and take',()=>{
  const scan={phase:'scan',targetZone:null,scanZone:8};
  expect(courseBatterSampleAt({course:scan,playback:pb,elapsed:500}).atlas).toBe('original');
  const c={phase:'landed',targetZone:9};
  expect(courseBatterSampleAt({course:c,playback:pb,elapsed:1559,outcome:{type:'whiff'}}).phase).toBe('pre');
  expect(courseBatterSampleAt({course:c,playback:pb,elapsed:1560,outcome:{type:'whiff'}})).toMatchObject({atlas:'course',frame:10,phase:'late-swing'});
  expect(courseBatterSampleAt({course:c,playback:{...pb,action:'take'},elapsed:1460})).toBeNull();
  expect(courseBatterSampleAt({course:c,playback:pb,elapsed:1460,outcome:{type:'outside-foul',contact:'nominal-overlap'}})).toMatchObject({atlas:'original',frame:4,phase:'unregistered-hold'});
 });
 it('has a complete contact, extension, follow and three recovery drawings for every row and outside foul',()=>{
  for(const zone of [1,4,7,9]){const phases=new Set(),frames=[];for(let e=1460;e<=2600;e++){const s=courseBatterSampleAt({course:{phase:'landed',targetZone:zone},playback:pb,elapsed:e,outcome:{type:'in-zone-contact',contact:'registered'}});phases.add(s?.phase);if(s?.atlas==='original')frames.push(s.frame);expect(s?.frame).toBeLessThan(s?.atlas==='course'?12:14);}expect([...phases]).toEqual(expect.arrayContaining(['contact','extension','late-follow','follow','recover','ready']));for(const n of [0,12,13])expect(frames).toContain(n);}
 });

 it('fits every roster delivery whiff tail without returning to legacy contact or shortening the minimum holds',()=>{
  let state=enterV10Node(createV10Duel(1),'a1-entry');state.battle.pending={zone:9,roll:.5,powerRoll:.1};const shot=presentationFor(playV10Action(state,{type:'card',id:'basic'}));
  for(const id of Object.keys(roster)){const timeline=rosterTimeline(presentationTimeline(shot),rosterPitcherActor(id,'atlas'),false,{delivery:true});timeline.courseLockAt=timeline.pitchReleaseAt-260;
   for(const zone of [1,4,7,9]){const runs=[];for(let elapsed=timeline.impactAt;elapsed<=timeline.duration;elapsed++){const sample=courseBatterSampleAt({course:{phase:'landed',targetZone:zone},playback:{action:'swing',timeline},elapsed,outcome:{type:'whiff'}});expect(sample).not.toBeNull();expect(sample.phase).not.toBe('unregistered-hold');const key=sample.atlas+'/'+sample.frame+'/'+sample.phase;if(runs.at(-1)?.key===key)runs.at(-1).end=elapsed;else runs.push({key,phase:sample.phase,start:elapsed,end:elapsed});}for(const run of runs){if(['extension','outside-extension','late-follow','follow'].includes(run.phase))expect(run.end-run.start+1).toBeGreaterThanOrEqual(56);if(run.phase==='late-swing')expect(run.end-run.start+1).toBeGreaterThanOrEqual(150);}}
  }
 });
 it('joins registered incoming and outgoing balls at exactly T, and never sparks on take/whiff/nominal diagnostics',()=>{
  for(let zone=0;zone<10;zone++){const T=courseTarget(zone),course={targetZone:zone,ball:T},result={kind:zone===9?'foul':'hit',label:'안타',actualZone:zone};
   const arrival=courseSceneEffectAt({courseModel:{phase:'arrival',course},playback:pb,elapsed:1460,result,phase:'flight'});expect(arrival.ball).toEqual(T);expect(arrival.radius).toBe(8);
   const contact=courseSceneEffectAt({courseModel:{phase:'landed',course,outcome:{contact:'registered'}},playback:pb,elapsed:1460,result,phase:'result'});expect(contact.ball).toEqual({x:T.x,y:T.y});expect(contact.radius).toBe(8);expect(contact.kind).toBe(zone===9?'foul':'contact');
   for(const outcome of [{type:'whiff',contact:'not-applicable'},{type:'take-ball',contact:'not-applicable'},{type:'outside-foul',contact:'nominal-overlap'}]){const pass=courseSceneEffectAt({courseModel:{phase:'landed',course,outcome},playback:pb,elapsed:1460,result,phase:'result'});expect(pass.ball).toEqual({x:T.x,y:T.y});expect(pass.kind).toBe('pass');expect(pass.flash).toBe(0);}
  }
 });
});
