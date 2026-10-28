// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {describe,it,expect,afterEach} from 'vitest';
import SceneEffects from '../src/duel/battle-vnext/SceneEffects.jsx';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {nearCoverage,MOTION_CONTACT} from '../src/duel/battle-vnext/motion-timeline.js';
const playback={action:'swing',timeline:{impactAt:240,freeze:60,releaseAt:370,settleAt:720,duration:1040}};
const hit={kind:'hit',exact:true,actualZone:2,coverage:[2],call:'안타'};
const near={kind:'whiff',actualZone:2,coverage:[1],call:'헛스윙'};
afterEach(cleanup);
describe('landscape ball/contact/near separation',()=>{
 it('reveals identical generic flight for exact, miss and homer before impact',()=>{
  const frame=result=>sceneEffectAt({elapsed:220,playback,result,phase:'flight'});
  expect(frame(hit)).toEqual(frame(near));expect(frame(hit)).toEqual(frame({...hit,call:'홈런',knockedOut:true}));
  expect(frame(hit).kind).toBe('flight');expect(frame(hit).flash).toBe(0);
 });
 it('pins exact contact to the authored barrel, then sends the ball into the field',()=>{
  const f=sceneEffectAt({elapsed:245,playback,result:hit,phase:'result'});
  expect(f.kind).toBe('exact');expect(f.ball).toEqual(MOTION_CONTACT);expect(f.flash).toBeGreaterThan(0);
  const later=sceneEffectAt({elapsed:600,playback,result:hit,phase:'result'});expect(later.ball.y).toBeLessThan(MOTION_CONTACT.y);expect(later.radius).toBeLessThan(f.radius);
 });
 it('uses actual full coverage (including support and diagonals) for one-cell misses',()=>{
  expect(nearCoverage({actualZone:8,coverage:[0,4]})).toEqual({from:4,to:8,distance:1});
  expect(nearCoverage({actualZone:8,coverage:[0]})).toBeNull();
  expect(nearCoverage({actualZone:9,coverage:[8]})).toBeNull();
  expect(nearCoverage({actualZone:2,coverage:[1,2]})).toBeNull();
 });
 it('has no contact flash or positive camera beat for a near miss',()=>{
  const f=sceneEffectAt({elapsed:245,playback,result:near,phase:'result'});
  expect(f.kind).toBe('near');expect(f.flash).toBe(0);expect(f.camera).toBe(0);expect(f.ball).not.toEqual(MOTION_CONTACT);
  render(<SceneEffects effect={f}/>);expect(screen.getByTestId('bv-scene-effects').dataset.effect).toBe('near');expect(document.querySelector('.bv-contact-burst')).toBeNull();
 });
 it('watch and preparation never produce a bat-contact burst; reduced motion draws no flight',()=>{
  const watch={...playback,action:'take'};expect(sceneEffectAt({elapsed:245,playback:watch,result:{kind:'ball',actualZone:9},phase:'result'}).kind).toBe('pass');
  expect(sceneEffectAt({elapsed:245,playback:{...playback,action:'prepare'},phase:'committing'})).toBeNull();
  expect(sceneEffectAt({elapsed:20,playback:{...playback,timeline:{...playback.timeline,duration:60}},phase:'result',result:hit})).toBeNull();
 });
});
