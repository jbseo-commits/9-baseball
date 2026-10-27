// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import BallparkBattle,{AUTO_NEXT_MS,STACK_COMMIT_MS} from '../src/duel/BallparkBattle.jsx';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {buildFixture,appInputs} from '../src/duel/battle-vnext/fixtures.js';
import {battleUiMode} from '../src/duel/battle-ui-mode.js';
import {LONG_PRESS_MS} from '../src/duel/CardDetailSheet.jsx';
import {layoutMode,watchLayoutMode,landscapeMedia} from '../src/duel/layout-mode.js';
const approval=vi.hoisted(()=>({enabled:false}));
vi.mock('../src/duel/battle-vnext/BattleScene.jsx',async original=>{
  const mod=await original();return {...mod,approvedPitcherArt:id=>approval.enabled&&id?mod.SAMPLE_ACTORS.pitcher:null};
});
beforeEach(()=>{approval.enabled=false;window.history.replaceState({},'', '/?battleUi=vnext');localStorage.clear();});
afterEach(()=>{cleanup();vi.useRealTimers();window.history.replaceState({},'','/');});
function open(id='support-stacked',overrides={}){
  const f=buildFixture(id),onSelect=vi.fn(),onStack=vi.fn(),onAim=vi.fn(),onSwing=vi.fn(),onTake=vi.fn(),onNext=vi.fn();
  const props={...f,pitcher:f.s.pitcher,vnextReview:f,onSelect,onStack,onAim,onSwing,onTake,onNext,...overrides};
  const view=render(<BallparkBattle {...props}/>);return {...view,props,onSelect,onStack,onAim,onSwing,onTake,onNext};
}
const card=kind=>document.querySelector(`.bv-card[data-card-kind=${kind}]`);
describe('C05 isolated query and view gate',()=>{
  it('requires exact explicit query and ignores fixture without vnext',()=>{
    expect(battleUiMode('?battleUi=vnext&battleFixture=read1')).toEqual({vnext:true,fixture:'read1'});
    expect(battleUiMode('?battleFixture=read1')).toEqual({vnext:false,fixture:null});
    expect(battleUiMode('?battleUi=other')).toEqual({vnext:false,fixture:null});
  });
  it('bypasses portrait reload only for opt-in and leaves old landscape sidecars off',()=>{
    const on=vi.fn(),reload=vi.fn(),win={location:{search:'?battleUi=vnext',reload},matchMedia:q=>({matches:q==='(orientation: landscape)',addEventListener:on})};
    win.self=win;win.top=win;
    expect(layoutMode(win)).toBe('app');watchLayoutMode(win);expect(on).not.toHaveBeenCalled();
    win.location.search='';expect(layoutMode(win)).toBe('frame');expect(landscapeMedia().matches).toBe(false);
  });
  it('renders exactly one complete legacy view for a real unapproved opponent',()=>{
    open('swing-main',{vnextReview:null});
    expect(document.querySelectorAll('.bp-battle')).toHaveLength(1);
    expect(document.querySelector('.battle-vnext')).toBeNull();
    expect(document.querySelector('.bv-legacy-fallback')).not.toBeNull();
    expect(screen.getByTestId('bp-swing')).not.toBeNull();
  });
  it('uses the same controller for an approved real art seam (test only)',()=>{
    approval.enabled=true;open('swing-main',{vnextReview:null,artId:'test-only-approved'});
    expect(document.querySelector('.battle-vnext')).not.toBeNull();expect(document.querySelector('.bp-battle')).toBeNull();
    expect(document.querySelector('.bv-review-notice')).toBeNull();
  });
  it('leaves the default route unchanged even when review data is supplied',()=>{
    window.history.replaceState({},'','/');open();
    expect(document.querySelector('.bp-battle')).not.toBeNull();expect(document.querySelector('.battle-vnext')).toBeNull();
  });
});
describe('C05 existing controller on new view',()=>{
  it('cancels an armed support on re-tap, places it on a zone, preserves selection',()=>{
    const v=open('support-armed');
    expect(screen.getByTestId('bp-swing').disabled).toBe(true);
    fireEvent.click(card('strike'));expect(screen.getByTestId('bp-swing').disabled).toBe(false);
    expect(v.onSelect).not.toHaveBeenCalled();expect(v.onStack).not.toHaveBeenCalled();
    fireEvent.click(card('strike'));expect(screen.getByTestId('bp-swing').disabled).toBe(true);
    fireEvent.click(document.querySelector('.bv-cell[data-zone="8"]'));
    expect(v.onStack).toHaveBeenCalledWith([{id:v.props.armed,aimZone:8}]);
    expect(screen.getByTestId('bp-swing').disabled).toBe(false);
  });
  it('keeps the support commit beat and suppresses repeated execute',()=>{
    vi.useFakeTimers();const v=open();
    fireEvent.click(screen.getByTestId('bp-swing'));fireEvent.click(screen.getByTestId('bp-swing'));
    expect(v.onSwing).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(STACK_COMMIT_MS));
    expect(v.onSwing).toHaveBeenCalledTimes(1);
  });
  it('opens details without changing selection; preserves hand scroll/focus and execution lock',()=>{
    const v=open('swing-main'),row=screen.getByTestId('bv-hand');row.scrollLeft=68;
    const button=screen.getByRole('button',{name:'경기 정보 및 메뉴'});button.focus();fireEvent.click(button);
    expect(document.querySelector('.bv-stage').hasAttribute('inert')).toBe(true);
    expect(screen.getByTestId('bp-swing').disabled).toBe(true);
    fireEvent.click(card('scout'));expect(v.onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('tab',{name:'카드',exact:true}));
    expect(screen.getByTestId('bp-inspect').textContent).toContain('간파');
    row.scrollLeft=0;fireEvent.click(screen.getByTestId('bp-inspect-back'));
    expect(row.scrollLeft).toBe(68);expect(document.activeElement).toBe(button);
    expect(document.querySelector('.bv-stage').hasAttribute('inert')).toBe(false);
    expect(screen.getByTestId('bp-swing').disabled).toBe(false);
  });
  it('pauses auto-next for inspector, resumes after close, and manual next executes once',()=>{
    vi.useFakeTimers();const v=open('result-take');
    fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
    act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS*2));expect(v.onNext).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('bp-inspect-back'));act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS));expect(v.onNext).toHaveBeenCalledTimes(1);
  });
  it('never auto-advances during windup and exposes no landed result',()=>{
    vi.useFakeTimers();const v=open('flight');act(()=>vi.advanceTimersByTime(3000));
    expect(v.onNext).not.toHaveBeenCalled();expect(screen.queryByTestId('bv-pitch-mark')).toBeNull();
    expect(screen.queryByTestId('bv-result-line')).toBeNull();
  });
  it('executes preparation through the existing callback without a new turn',()=>{
    const v=open('prepare');fireEvent.click(screen.getByTestId('bp-swing'));
    expect(v.onSwing).toHaveBeenCalledTimes(1);expect(v.onTake).not.toHaveBeenCalled();
  });
});
describe('memory-only sandbox uses engine and preserves production save',()=>{
  it('long press opens detail, swallows the release click, and keeps the selected plan',()=>{
    vi.useFakeTimers();render(<IntegrationPreview fixture="swing-main"/>);
    const target=card('scout');
    fireEvent.pointerDown(target,{pointerId:7,pointerType:'touch',clientX:20,clientY:20});
    act(()=>vi.advanceTimersByTime(LONG_PRESS_MS));
    fireEvent.pointerUp(target,{pointerId:7,pointerType:'touch'});fireEvent.click(target);
    expect(screen.getByTestId('bp-inspect').textContent).toContain('간파');
    expect(card('strike').classList.contains('is-main')).toBe(true);
    expect(card('scout').classList.contains('is-main')).toBe(false);
  });
  it('keeps long-press and keyboard detail locked during flight',()=>{
    vi.useFakeTimers();render(<IntegrationPreview fixture="flight"/>);
    const target=card('scout');
    fireEvent.pointerDown(target,{pointerId:8,pointerType:'touch',clientX:20,clientY:20});
    act(()=>vi.advanceTimersByTime(LONG_PRESS_MS));fireEvent.keyDown(target,{key:'i'});
    expect(screen.queryByTestId('bp-inspect')).toBeNull();expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('spends preparation energy without a pitch, then advances actual pitch and refills',()=>{
    vi.useFakeTimers();localStorage.setItem('9zone-v10-run','production-sentinel');
    render(<IntegrationPreview fixture="prepare"/>);
    expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');
    fireEvent.click(screen.getByTestId('bp-swing'));
    expect(screen.getByTestId('bv-energy').dataset.energy).toBe('1');
    expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
    fireEvent.click(screen.getByTestId('bp-swing')); // unselected = take
    expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
    act(()=>vi.advanceTimersByTime(950));act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS));
    expect(screen.getByTestId('bv-energy').dataset.energy).toBe('3');
    expect(screen.getByTestId('bv-result-recent').textContent).toMatch(/실제|노림|지켜/);
    fireEvent.click(card('place'));
    expect(screen.queryByTestId('bv-result-recent')).toBeNull();
    expect(localStorage.getItem('9zone-v10-run')).toBe('production-sentinel');
    expect(localStorage.getItem('9zone-hint-chase')).toBeNull();
  });
});
