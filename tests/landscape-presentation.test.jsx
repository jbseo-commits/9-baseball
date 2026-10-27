// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {landscapePresentationTimeline,presentationElapsed,timelinePoseAt,WIDE_CONTACT_GRADES,wideBallExit} from '../src/duel/landscape-presentation.js';
import {landscapeBatterTimeline} from '../src/duel/landscape-batter-motion.js';
import {redRushBatterShot,redRushTimeline} from '../src/duel/pitcher-sd.js';
import {presentationTimeline} from '../src/duel/presentation.js';
import {isBattlePreview} from '../src/duel/battle-layout.js';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';

afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();localStorage.clear();window.history.replaceState({},'','/');});
it.each(['solid','homer','near-miss','chase','foul','battle-foul','out'])('finishes every wide recovery before unlocking %s without changing pitch contact',grade=>{
  const shot={grade,motion:{impactAt:245,freeze:20,slowmo:380,settleAt:1070,duration:1460}};
  const before=JSON.stringify(shot),base=redRushTimeline(presentationTimeline(shot));
  const result=landscapePresentationTimeline(base,shot),keys=landscapeBatterTimeline(redRushBatterShot(shot));
  expect(result.impactAt).toBe(1567);expect(result.slowmo).toBe(0);
  expect(keys.find(k=>k.pose==='contact'||k.pose==='swing-through').at).toBe(result.impactAt);
  expect(keys.at(-1).at).toBeLessThan(result.duration);
  for(const pose of ['finish','settle','recover-front','recover-raise','recover-ready'])expect(keys.some(k=>k.pose===pose)).toBe(true);
  expect(keys.find(k=>k.pose==='recover-raise').at-keys.find(k=>k.pose==='recover-front').at).toBeGreaterThanOrEqual(60);
  expect(JSON.stringify(shot)).toBe(before);
});
it('preserves reduced motion and uses the shared start even when a renderer initializes late',()=>{
  const base={duration:60,impactAt:8};expect(landscapePresentationTimeline(base,{grade:'solid'},true)).toBe(base);
  expect(presentationElapsed(2400,1000,2200)).toBe(1400);expect(presentationElapsed(2400,null,2200)).toBe(200);
  expect(presentationElapsed(800,1000,0)).toBe(0);
  const keys=landscapeBatterTimeline(redRushBatterShot({grade:'solid',motion:{impactAt:240}}));
  expect(timelinePoseAt(keys,presentationElapsed(2600,1000,2500))).toBe('contact');
  expect(timelinePoseAt(keys,1800)).toBe('follow-through-late');
});
it('separates contact from a safe hit and sends a foul away from the catcher',()=>{
  for(const grade of ['foul','battle-foul','out','sacrifice','sacrifice-run'])expect(WIDE_CONTACT_GRADES.has(grade)).toBe(true);
  expect(WIDE_CONTACT_GRADES.has('near-miss')).toBe(false);
  expect(wideBallExit('foul',.5,100,200,100).y).toBeLessThan(100);
  expect(wideBallExit('out',.5,100,200,100).x).toBeGreaterThan(200);
});
it('requires the inside comparison boundary for a disposable public preview',()=>{
  for(const search of ['?battlePreview=1','?battleLayout=compare&battlePreview=1','?battleLayout=inside','?battleLayout=inside&battlePreview=0'])expect(isBattlePreview({location:{search}})).toBe(false);
  expect(isBattlePreview({location:{search:'?battleLayout=inside&battlePreview=1'}})).toBe(true);
});
it('plays a real preview pitch, freezes public HP until impact, returns through recovery and preserves the normal save',()=>{
  vi.useFakeTimers();window.history.replaceState({},'','/?battleLayout=inside&battlePreview=1&qa=1&renderer=dom');
  vi.spyOn(window,'matchMedia').mockImplementation(q=>({matches:q==='(orientation: landscape)',addEventListener(){},removeEventListener(){}}));
  const existing=E.enterV10Node(E.createV10Duel(90211),'a1-entry');E.saveV10Duel(localStorage,existing);
  const saved=localStorage.getItem(E.V10_SAVE_KEY||'9zone-v10-run');render(<Duel/>);
  expect(document.querySelector('.bp-battle')).toBeTruthy();
  expect(screen.getByLabelText(/타이드 베스퍼 투수 HP 60/)).toBeTruthy();
  const cards=document.querySelectorAll('.bp-hand .bp-card');expect(cards.length).toBeGreaterThan(5);
  fireEvent.click(document.querySelector('.bp-card[data-card-kind="strike"]'));
  fireEvent.click(document.querySelector('[data-zone="8"]'));fireEvent.click(screen.getByTestId('bp-swing'));
  expect(document.querySelector('.bp-battle').classList.contains('fx-windup')).toBe(true);
  expect(screen.getByLabelText(/타이드 베스퍼 투수 HP 60/)).toBeTruthy();
  expect(document.querySelector('.bp-verdict')).toBeNull();expect(document.querySelector('.homer-video')).toBeNull();
  expect(screen.getByTestId('bp-next').disabled).toBe(true);
  expect(screen.getByTestId('bp-next').textContent).toBe('투구 중');
  expect(screen.getByTestId('bp-next').getAttribute('aria-label')).toBe('투구 중');
  act(()=>vi.advanceTimersByTime(1566));expect(screen.getByLabelText(/타이드 베스퍼 투수 HP 60/)).toBeTruthy();
  act(()=>vi.advanceTimersByTime(200));expect(document.querySelector('.bp-battle').classList.contains('fx-windup')).toBe(false);
  act(()=>vi.advanceTimersByTime(1100));expect(document.querySelector('.bp-battle').classList.contains('fx-settle')).toBe(false);
  act(()=>vi.advanceTimersByTime(1200));expect(screen.getByTestId('bp-swing').disabled).toBe(false);
  expect(localStorage.getItem(E.V10_SAVE_KEY||'9zone-v10-run')).toBe(saved);
});
it.each([6,8])('keeps the pending next action neutral for both a hit and miss (aim %s)',zone=>{
  vi.useFakeTimers();window.history.replaceState({},'','/?battleLayout=inside&battlePreview=1&qa=1&renderer=dom');
  vi.spyOn(window,'matchMedia').mockImplementation(q=>({matches:q==='(orientation: landscape)',addEventListener(){},removeEventListener(){}}));
  render(<Duel/>);
  fireEvent.click(document.querySelector('.bp-card[data-card-kind="strike"]'));
  fireEvent.click(document.querySelector(`[data-zone="${zone}"]`));fireEvent.click(screen.getByTestId('bp-swing'));
  const next=screen.getByTestId('bp-next');
  expect(next.textContent).toBe('투구 중');expect(next.getAttribute('aria-label')).toBe('투구 중');expect(next.disabled).toBe(true);
  act(()=>vi.advanceTimersByTime(1566));expect(next.textContent).toBe('투구 중');
  act(()=>vi.advanceTimersByTime(100));
  expect(screen.getByTestId('bp-next').textContent).toBe(zone===6?'다음 타자':'다음 공');
  expect(document.querySelectorAll('[data-testid="bp-result-explanation"]')).toHaveLength(1);
  expect(screen.getByTestId('wide-selection').querySelector('[data-testid="bp-result-explanation"]')).toBeTruthy();
});
it('does not distinguish a knockout from a continuing battle through the pending execution control',()=>{
  vi.useFakeTimers();window.history.replaceState({},'','/?battleLayout=inside&qa=1&renderer=dom');
  vi.spyOn(window,'matchMedia').mockImplementation(q=>({matches:q==='(orientation: landscape)',addEventListener(){},removeEventListener(){}}));
  let s=E.createV10Duel(7);const node=s.runMap.nodes.find(n=>n.opponent?.artId==='tide-vesper');s.runMap.reachableIds=[node.id];s=E.enterV10Node(s,node.id);
  s.pitcher.hp=1;s.pitcher.phase='critical';E.saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:/^이어하기/}));
  fireEvent.click(document.querySelector('.bp-card[data-card-kind="strike"]'));fireEvent.click(document.querySelector('[data-zone="6"]'));fireEvent.click(screen.getByTestId('bp-swing'));
  expect(screen.getByRole('button',{name:'투구 중',exact:true}).textContent).toBe('투구 중');
  expect(screen.getByTestId('bp-next').disabled).toBe(true);expect(screen.getByTestId('bp-next').className).toBe('bp-verb pending');
  act(()=>vi.advanceTimersByTime(1566));expect(screen.getByRole('button',{name:'투구 중',exact:true})).toBeTruthy();
});
