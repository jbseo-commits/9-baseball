// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {describe,it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {pitcherAtlases} from '../src/duel/pitcher-visuals.js';
import reg from '../src/duel/battle-vnext/roster-registration.json';
import source from '../assets/pitcher-review-grounding-r2/manifest.json';
import runtime from '../assets/pitcher-grounded-runtime-v1/manifest.json';
import {rosterPitcherActor,rosterFrame,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import {actorBox,atbatCamera,toScreen} from '../src/duel/battle-vnext/scene-geometry.js';
import {pitcherReleaseFrame,pitcherDrawingAt,redRushTimeline,withPitcherTiming} from '../src/duel/pitcher-sd.js';
import {motionAt} from '../src/duel/battle-vnext/motion-timeline.js';
import BattleScene from '../src/duel/battle-vnext/BattleScene.jsx';
import {BattlePitcherSprite} from '../src/duel/App.jsx';
import ZoneFirstPreview from '../src/duel/ZoneFirstPreview.jsx';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const webpSize=file=>{const b=read(file);expect(b.toString('ascii',0,4)).toBe('RIFF');expect(b.toString('ascii',12,16)).toBe('VP8X');return [b.readUIntLE(24,3)+1,b.readUIntLE(27,3)+1];};
afterEach(cleanup);

describe('approved grounded pitcher drawings in actual runtime renderers',()=>{
 it('ships the selected 20 compact atlases and retains the complete source export with verified hashes',()=>{
  expect(Object.keys(pitcherAtlases)).toHaveLength(20);expect(runtime.characters).toHaveLength(20);
  for(const c of runtime.characters){
   expect(String(pitcherAtlases[c.id])).toContain('pitcher-grounded-runtime-v1/runtime/');
   expect(sha(read(c.runtimeFile))).toBe(c.runtimeSHA256);expect(sha(read(c.file))).toBe(c.atlasSHA256);
   expect(webpSize(c.runtimeFile)).toEqual([768,1024]);expect(webpSize(c.file)).toEqual([2560,3072]);
   expect(c.sourceDrawings).toBe(12);expect(c.timelineTicks).toBe(120);expect(c.fps).toBe(60);
   expect(c.sourcePosePixelSHA256).toEqual(source.characters.find(s=>s.slug===c.id).grounding.source_pose_pixel_sha256);
  }
  expect(runtime.totalRuntimeBytes).toBeLessThan(runtime.totalAtlasBytes/5);
 });
 it('maps all 120 timeline ticks onto real drawings and switches to the empty release hand at the registered tick',()=>{
  const playback={timeline:{duration:2000},action:'swing'};
  for(const c of runtime.characters){
   const r=reg[c.id],actor=rosterPitcherActor(c.id,pitcherAtlases[c.id]);
   expect(new Set(c.drawingAtTick).size).toBe(12);
   for(let tick=0;tick<120;tick++){
    expect(pitcherDrawingAt(c.id,tick)).toBe(c.drawingAtTick[tick]);
    expect(rosterFrame(playback,(tick+.01)*1000/60,actor)).toBe(c.drawingAtTick[tick]);
   }
   expect(pitcherDrawingAt(c.id,r.releaseFrame-1)).toBe(5);expect(pitcherDrawingAt(c.id,r.releaseFrame)).toBe(6);
   expect(actor.releaseAt).toBe(Math.round(r.releaseFrame*1000/60));
   const t=rosterTimeline({duration:2000,freeze:25,slowmo:100},actor);
   expect(t.impactAt-actor.releaseAt).toBe(300);
   const legacy=redRushTimeline(withPitcherTiming({motion:{duration:2000}},c.id).motion);
   expect(legacy.impactAt).toBe(t.impactAt);expect(pitcherReleaseFrame(c.id)).toBe(r.releaseFrame);
   expect(rosterFrame({...playback,action:'prepare'},1400,actor)).toBe(0);
  }
 });
 it('retimes only expressive delivery playback, shortening the coil hold without moving the source release contract',()=>{
  const id='regular-02-teal-mirage',actor=rosterPitcherActor(id,pitcherAtlases[id]),base={duration:2000,impactAt:1400,releaseAt:1450,settleAt:1800,freeze:0,slowmo:0};
  const legacy=rosterTimeline(base,actor),delivery=rosterTimeline(base,actor,false,{delivery:true});
  expect(legacy.impactAt).toBe(actor.releaseAt+300);
  expect(legacy.delivery).toBeUndefined();
  expect(delivery.pitchReleaseAt).toBeLessThan(actor.releaseAt);
  expect(delivery.impactAt).toBe(delivery.pitchReleaseAt+300);
  expect(rosterFrame({timeline:delivery,action:'swing'},delivery.pitchReleaseAt,actor)).toBe(6);
  const coilTicks=delivery.delivery.drawingAtTick.filter(frame=>frame===2).length;
  expect(coilTicks).toBeGreaterThanOrEqual(8);
  expect(coilTicks).toBeLessThanOrEqual(11);
  const held=rosterTimeline(base,actor,false,{delivery:true,contactHold:95});
  expect(rosterFrame({timeline:held,action:'swing'},held.impactAt+79,actor)).toBe(rosterFrame({timeline:held,action:'swing'},held.impactAt,actor));
 });
 it('keeps every registered delivery hand, landing, batter anticipation and recovery on one host timeline',()=>{
  for(const id of Object.keys(reg)){
   const actor=rosterPitcherActor(id,pitcherAtlases[id]);
   const t=rosterTimeline({duration:1800,freeze:60,slowmo:70},actor,false,{delivery:true,contactHold:95});
   const play={timeline:t,action:'swing'};
   expect(t.freeze).toBe(95);
   expect(t.delivery.drawingAtTick).toHaveLength(120);
   expect(new Set(t.delivery.drawingAtTick).size).toBe(12);
   expect(rosterFrame(play,t.pitchReleaseAt-1,actor)).toBe(5);
   expect(rosterFrame(play,t.pitchReleaseAt,actor)).toBe(6);
   expect(rosterFrame(play,t.delivery.landingAt,actor)).toBe(4);
   expect(motionAt({elapsed:t.pitchReleaseAt-1,timeline:t,action:'swing'}).batter).toBe(0);
   expect(motionAt({elapsed:t.impactAt-1,timeline:t,action:'swing'}).batter).toBe(7);
   const atContact=rosterFrame(play,t.impactAt,actor);
   for(const dt of [1,30,80,94])expect(rosterFrame(play,t.impactAt+dt,actor)).toBe(atContact);
   expect(rosterFrame(play,t.duration-1,actor)).toBe(11);
  }
 });
 it('scales the reviewed anatomical pivot, hand and landing together, including left-handed Onyx',()=>{
  for(const c of source.characters){
   const actor=rosterPitcherActor(c.slug,pitcherAtlases[c.slug]),r=reg[c.slug],box=actorBox(actor.meta);
   expect(r.anchor).toEqual({x:c.anchor.x/2,y:c.anchor.y/2});
   expect(r.release).toEqual({x:c.release_point.x/2,y:c.release_point.y/2});
   expect(box.x+r.anchor.x*box.scale).toBeCloseTo(r.worldFoot.x,8);
   expect(box.y+r.anchor.y*box.scale).toBeCloseTo(r.worldFoot.y,8);
   expect(actor.landing.x).toBeCloseTo(box.x+r.landing.x*box.scale,8);
   for(const [w,h] of [[1440,810],[844,390],[667,375],[390,844]]){
    const camera=atbatCamera(w,h),p=toScreen(camera,actor.release);
    expect(Number.isFinite(p.x)&&Number.isFinite(p.y)).toBe(true);
   }
  }
  expect(reg['onyx-eclipse'].throwingHand).toBe('left');
  expect(reg['onyx-eclipse'].anchor.x).toBeGreaterThan(128);
 });
 it('renders the compact sheet in the live scene and DOM fallback without treating it as a 10-column sheet',()=>{
  const id='regular-05-violet-sting',actor=rosterPitcherActor(id,pitcherAtlases[id]);
  const {container,unmount}=render(<BattleScene actors={{pitcher:actor}} size={{width:844,height:390}} framing="atbat"/>);
  const im=container.querySelector('.bv-actor-pitcher .bv-motion-crop img');
  expect(im.getAttribute('width')).toBe('768');expect(im.getAttribute('height')).toBe('1024');
  expect(im.style.width).toBe('300%');expect(im.style.height).toBe('400%');
  unmount();
  const legacy=render(<BattlePitcherSprite atlas={pitcherAtlases[id]}/>);
  expect(legacy.container.querySelector('.duel-sprite').style.backgroundSize).toBe('300% 400%');
 });
 it('also slices the compact roster correctly on the actual first-swing practice screen',()=>{
  const view=render(<ZoneFirstPreview lesson={0}/>);
  expect(view.container.querySelector('.zf-pitcher').style.backgroundSize).toBe('300% 400%');
  expect(view.container.querySelector('.zf-pitcher').style.backgroundPosition).toBe('0% 0%');
 });
});
