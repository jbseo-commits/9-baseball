// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {cue} from '../src/duel/audio.js';
vi.mock('../src/duel/audio.js',()=>({audio:vi.fn(),cue:vi.fn(),getAudioContext:vi.fn(),getMasterNode:vi.fn()}));
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {ANIMATION_RATE_KEY,animationRate,readAnimationRate,rememberAnimationRate,presentationElapsed} from '../src/duel/animation-speed.js';
import {WIDE_PLACEMENT as PLACEMENT} from '../src/duel/battle-vnext/placement-motion.js';
import {STACK_COMMIT_MS} from '../src/duel/BallparkBattle.jsx';
const speed=()=>screen.getByRole('combobox',{name:'애니메이션 배속'});
const open=()=>{const b=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(b)fireEvent.click(b);};
const zone=z=>document.querySelector(`.bv-cell[data-zone="${z}"]`);
beforeEach(()=>{vi.useFakeTimers();window.sessionStorage.clear();window.history.replaceState({},'','/?battleUi=vnext');});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();window.sessionStorage.clear();window.history.replaceState({},'','/');});
it('only accepts supported rates and keeps virtual time clamped',()=>{
 for(const v of [0,-1,NaN,Infinity,'oops',null,'',.6,8])expect(animationRate(v)).toBe(1);
 for(const v of [.25,.5,.75,1,1.5,2])expect(animationRate(String(v))).toBe(v);
 expect(presentationElapsed({startedAt:10,rate:.25,timeline:{duration:700}},1010)).toBe(250);
 expect(presentationElapsed({startedAt:10,rate:2,timeline:{duration:700}},1010)).toBe(700);
});
it('shares the selection through URL/session only, never touching the production game save',()=>{
 window.localStorage.setItem('9zone-v10-run','speed-sentinel');window.history.replaceState({},'','/?battleUi=vnext&battleFixture=watch-read0&battleSpeed=0.5');
 const view=render(<IntegrationPreview fixture="watch-read0"/>);expect(speed().value).toBe('0.5');fireEvent.change(speed(),{target:{value:'0.25'}});
 expect(new URLSearchParams(window.location.search).get('battleSpeed')).toBe('0.25');expect(window.sessionStorage.getItem(ANIMATION_RATE_KEY)).toBe('0.25');expect(window.localStorage.getItem('9zone-v10-run')).toBe('speed-sentinel');
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');view.unmount();render(<IntegrationPreview fixture="watch-read0"/>);expect(speed().value).toBe('0.25');
});
it('invalid query wins over stale preferences and blocked preference storage is harmless',()=>{
 rememberAnimationRate(2);window.history.replaceState({},'','/?battleSpeed=bad');expect(readAnimationRate()).toBe(1);
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked')});expect(()=>rememberAnimationRate(.5)).not.toThrow();
});
for(const rate of [.25,2])it(`${rate}x keeps receipt expiry and speed lock on its own rate`,()=>{
 render(<IntegrationPreview fixture="watch-read0"/>);fireEvent.change(speed(),{target:{value:String(rate)}});open();fireEvent.click(document.querySelector('.bv-card[data-card-kind=strike]'));fireEvent.click(zone(2));
 expect(speed().disabled).toBe(true);expect(screen.getByTestId('bv-coverage-insert').dataset.animationRate).toBe(String(rate));
 act(()=>vi.advanceTimersByTime(PLACEMENT.duration/rate-1));expect(screen.queryByTestId('bv-coverage-insert')).not.toBeNull();expect(speed().disabled).toBe(true);
 act(()=>vi.advanceTimersByTime(1));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(speed().disabled).toBe(false);
});
it('scales the existing stack commit without changing costs or starting a second pitch',()=>{
 render(<IntegrationPreview fixture="support-stacked"/>);fireEvent.change(speed(),{target:{value:'0.5'}});fireEvent.click(screen.getByTestId('bp-swing'));expect(speed().disabled).toBe(true);
 act(()=>vi.advanceTimersByTime(STACK_COMMIT_MS/.5-1));expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
 act(()=>vi.advanceTimersByTime(1));expect(document.querySelector('.bv-scene').dataset.playToken).toBe('2');expect(screen.getByTestId('bv-energy').dataset.energy).toBe('0');
 act(()=>vi.advanceTimersByTime(10000));expect(speed().disabled).toBe(false);
});
it('reduced motion keeps the existing short result path even with a slow selection',()=>{
 vi.spyOn(window,'matchMedia').mockReturnValue({matches:true});render(<IntegrationPreview fixture="swing-main"/>);fireEvent.change(speed(),{target:{value:'0.25'}});fireEvent.click(screen.getByTestId('bp-swing'));
 act(()=>vi.advanceTimersByTime(60));expect(speed().disabled).toBe(false);expect(document.querySelector('.bv-bat-ribbon')).toBeNull();
});
it('embedded and legacy comparisons stay on normal time and expose no preference controls',()=>{
 const v=render(<IntegrationPreview fixture="watch-read0" embedded/>);expect(screen.queryByRole('combobox',{name:'애니메이션 배속'})).toBeNull();v.unmount();
 render(<IntegrationPreview fixture="watch-read0" variant="legacy"/>);expect(screen.queryByRole('combobox',{name:'애니메이션 배속'})).toBeNull();
});

it('cancels slow scheduled judgement audio on mute, fixture reset and unmount',()=>{
 const v=render(<IntegrationPreview fixture="swing-main"/>);fireEvent.change(speed(),{target:{value:'0.25'}});
 const sound=()=>screen.getByRole('button',{name:/효과음 (켜기|끄기)/});
 fireEvent.click(sound());fireEvent.click(screen.getByTestId('bp-swing'));
 const signal=cue.mock.calls.findLast(c=>c[1]?.signal)?.[1].signal;expect(signal).toBeDefined();expect(signal.aborted).toBe(false);
 fireEvent.click(sound());expect(signal.aborted).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'다시 시작',exact:true}));fireEvent.click(sound());fireEvent.click(screen.getByTestId('bp-swing'));
 const reset=cue.mock.calls.findLast(c=>c[1]?.signal)[1].signal;expect(reset.aborted).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'다시 시작',exact:true}));expect(reset.aborted).toBe(true);
 fireEvent.click(screen.getByTestId('bp-swing'));const last=cue.mock.calls.findLast(c=>c[1]?.signal)[1].signal;expect(last.aborted).toBe(false);v.unmount();expect(last.aborted).toBe(true);
});
