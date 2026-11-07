// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {it,expect,vi,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import pack from '../assets/pitcher-inbetweens-v1/manifest.json';
import original from '../assets/pitcher-inbetweens-v1/base-registration.json';
import reg from '../src/duel/battle-vnext/roster-registration.json';
import selection from '../assets/pitcher-inbetweens-v1/selection.json';
import {pitcherAtlases} from '../src/duel/pitcher-visuals.js';
import {rosterPitcherActor,rosterTimeline,rosterFrame} from '../src/duel/battle-vnext/roster-actor.js';
import BattleScene,{SAMPLE_ACTORS} from '../src/duel/battle-vnext/BattleScene.jsx';
import {atbatCamera,toScreen} from '../src/duel/battle-vnext/scene-geometry.js';
import {FX_ATLASES} from '../src/duel/battle-vnext/ContactPixelFx.jsx';
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
afterEach(()=>{cleanup();vi.restoreAllMocks();});

it('renders each low-slot release cell and first ball at the same projected hand point',()=>{
 const clock=vi.spyOn(performance,'now');
 for(const id of ['regular-03-amber-sinker','regular-05-violet-sting','tide-vesper']){
  const actor=rosterPitcherActor(id,pitcherAtlases[id]),r=reg[id];
  const timeline=rosterTimeline({duration:2000,freeze:0},actor,false,{delivery:true});
  const props={size:{width:844,height:390},framing:'atbat',phase:'flight',actors:{pitcher:actor},playback:{action:'swing',startedAt:0,rate:1,timeline,pitchReleaseAt:timeline.pitchReleaseAt}};
  clock.mockReturnValue(timeline.pitchReleaseAt-1);
  const view=render(<BattleScene {...props}/>);
  expect(view.container.querySelector('.bv-ball-sprite')).toBeNull();
  clock.mockReturnValue(timeline.pitchReleaseAt);view.rerender(<BattleScene {...props}/>);
  const pitcher=view.container.querySelector('.bv-actor-pitcher');
  expect(pitcher.dataset.pose).toBe('frame-'+r.releaseDrawing);
  const ball=view.container.querySelector('.bv-ball-sprite .fx-ball');expect(ball).not.toBeNull();
  const expected=toScreen(atbatCamera(844,390),actor.release),scale=parseFloat(ball.style.width)/FX_ATLASES.ball.frameSize[0];
  // CSS serializes fractional pixels; sub-0.0001px rounding is immaterial.
  expect(parseFloat(ball.style.left)+FX_ATLASES.ball.contactPivot[0]*scale).toBeCloseTo(expected.x,4);
  expect(parseFloat(ball.style.top)+FX_ATLASES.ball.contactPivot[1]*scale).toBeCloseTo(expected.y,4);
  const crop=pitcher.querySelector('.bv-motion-crop img');
  expect(crop.style.left).toBe(-(r.releaseDrawing%r.columns)*100+'%');
  expect(crop.style.top).toBe(-Math.floor(r.releaseDrawing/r.columns)*100+'%');view.unmount();
 }
});

it('connects all20 sheets, retains original keys except explicit low-slot revisions, and preserves event times',()=>{
 expect(pack.characters).toHaveLength(20);expect(pack.totalNewPitcherDrawings).toBe(86);expect(pack.totalRevisedKeys).toBe(16);
 for(const c of pack.characters){
  const r=reg[c.id],old=original[c.id],actor=rosterPitcherActor(c.id,pitcherAtlases[c.id]);
  expect(String(actor.url)).toContain(c.runtimeFile);
  expect(sha(c.runtimeFile)).toBe(c.runtimeSHA256);expect(sha(c.originalRuntimeFile)).toBe(c.originalRuntimeSHA256);
  const revision=selection.characters[c.id],replaced=revision.keyReplacements||[];
  expect(c.drawings.filter(d=>['original-key','authored-key-replacement'].includes(d.kind)).map(d=>d.originalIndex)).toEqual(Array.from({length:12},(_,i)=>i));
  expect(c.drawings.filter(d=>d.kind==='authored-key-replacement').map(d=>d.originalIndex)).toEqual(replaced.map(d=>d.originalIndex));
  expect(c.preservedOriginalDrawings).toBe(12-replaced.length);
  expect(c.drawings.filter(d=>d.kind==='authored-inbetween')).toHaveLength(c.newInbetweenDrawings);
  for(const k of ['anchor','worldFoot','release','releaseFrame','landing','landingFrame','visibleHeight','throwingHand'])expect(r[k]).toEqual(revision.registrationOverrides?.[k]??old[k]);
  const t=rosterTimeline({duration:2000,freeze:0,slowmo:0},actor,false,{delivery:true});
  expect(new Set(r.drawingAtTick)).toEqual(new Set(c.drawings.map((_,i)=>i)));
  expect(new Set(t.delivery.drawingAtTick)).toEqual(new Set(c.drawings.map((_,i)=>i)));
  expect(r.drawingAtTick.at(-1)).toBe(0);expect(t.delivery.drawingAtTick.at(-1)).toBe(0);
  expect(r.recoveryDrawings[0]).toBe(r.keyDrawings[11]);expect(r.recoveryDrawings.at(-1)).toBe(0);
  const sourceRecovery=r.drawingAtTick.slice(r.drawingAtTick.lastIndexOf(r.keyDrawings[10])+1);
  for(const frame of r.recoveryDrawings)expect(sourceRecovery.filter(d=>d===frame).length).toBeGreaterThanOrEqual(3);
  expect(rosterFrame({timeline:t,action:'swing'},t.duration-1,actor,{knockedOut:true})).toBe(r.keyDrawings[11]);
  expect(rosterFrame({timeline:t,action:'swing'},t.pitchReleaseAt,actor)).toBe(r.keyDrawings[6]);
  expect(Math.max(...t.delivery.drawingAtTick.slice(0,Math.round(t.pitchReleaseAt*60/1000)))).toBeLessThan(r.releaseDrawing);
  const view=render(<BattleScene actors={{pitcher:actor}} size={{width:844,height:390}} framing="atbat"/>);
  const im=view.container.querySelector('.bv-actor-pitcher .bv-motion-crop img');
  expect(im.style.width).toBe(r.columns*100+'%');expect(im.style.height).toBe(r.rows*100+'%');
  expect(im.getAttribute('width')).toBe(String(r.columns*256));expect(im.getAttribute('height')).toBe(String(r.rows*256));view.unmount();
 }
});
it('preloads and renders the one authored bat bridge without changing world scale or contact8',()=>{
 vi.spyOn(performance,'now').mockReturnValue(1150);
 const timeline={duration:2100,impactAt:1200,freeze:95,releaseAt:1400,settleAt:1800,delivery:{pitchReleaseAt:900}};
 const props={size:{width:844,height:390},framing:'atbat',actors:{batter:SAMPLE_ACTORS.batter},playback:{action:'swing',startedAt:0,timeline}};
 const view=render(<BattleScene {...props}/>),actor=view.container.querySelector('.bv-actor-batter');
 expect(view.container.querySelector('img[hidden]').getAttribute('src')).toBe(SAMPLE_ACTORS.batterTween);
 expect(actor.dataset.pose).toBe('swing-bridge');
 expect(actor.querySelector('img').style.width).toBe('100%');expect(actor.querySelector('img').style.height).toBe('100%');
 expect(actor.querySelector('.bv-ready-drawing')).toBeNull();
 const box=actor.getAttribute('style');
 vi.mocked(performance.now).mockReturnValue(1200);view.rerender(<BattleScene {...props} phase="result"/>);
 expect(actor.getAttribute('style')).toBe(box);
 expect(actor.dataset.pose).not.toBe('swing-bridge');
 expect(actor.querySelector('.bv-motion-crop img').getAttribute('src')).toBe(SAMPLE_ACTORS.batter);
 expect(actor.querySelector('.bv-motion-crop img').style.top).toBe('-200%');
});
