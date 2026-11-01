// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {captureExecution,resultSequence} from '../src/duel/presentation-snapshot.js';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {playV10Action,setAimZone} from '../src/duel/engine.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {presentationFor} from '../src/duel/presentation.js';
import ResultSequence from '../src/duel/battle-vnext/ResultSequence.jsx';
import BattleHud from '../src/duel/battle-vnext/BattleHud.jsx';
afterEach(cleanup);
describe('accepted action snapshot and truthful consequence sequence',()=>{
 it('captures the consumed main card before the UI clears the selection',()=>{
  const f=buildFixture('swing-main'),before=setAimZone(f.s,2),after=playV10Action(before,{type:'card',id:f.selected});
  expect(after.battle.hand).not.toContain(f.selected);
  const trace=captureExecution(before,after,{selected:f.selected});
  expect(trace.cards).toHaveLength(1);expect(trace.cards[0].id).toBe(f.selected);expect(trace.cards[0].role).toBe('main');
  const result=buildBattleViewModel({s:after,fxStage:'impact',shot:presentationFor(after)}).result;
  expect(resultSequence(result,trace)[0].text).toContain(trace.cards[0].name);
 });
 it('never reconstructs cards from later selection or labels every consumed support as activated',()=>{
  const result={kind:'hit',actualZone:2,primaryCoverage:[2],supportCoverages:[{id:'b',coverage:[2]}],damage:12,precisionBonus:0};
  const trace={cards:[{id:'a',name:'메인',role:'main'},{id:'b',name:'지원',role:'support'}]};
  expect(resultSequence(result,trace).map(x=>x.kind)).toEqual(['main','hp']);
  expect(resultSequence({...result,primaryCoverage:[1]},trace)[0].text).toContain('지원');
  expect(resultSequence({...result,damage:0},null)).toEqual([]);
 });
 it('shows pressure from an actual watched/failed pitch without phantom contact or bonus',()=>{
  const steps=resultSequence({kind:'whiff',damage:3,precisionBonus:0},{cards:[{name:'사용 카드',role:'main'}]});
  expect(steps).toEqual([{kind:'hp',text:'압박 −3'}]);
  expect(resultSequence({kind:'ball',damage:0},null)).toEqual([]);
 });
 it('keeps a preparation an effect without a new pitch or HP result',()=>{
  const f=buildFixture('prepare'),after=playV10Action(f.s,{type:'card',id:f.selected}),trace=captureExecution(f.s,after,{selected:f.selected});
  expect(trace.action).toBe('prepare');expect(trace.pitch).toBe(0);expect(trace.preparation.name).toBe(trace.cards[0].name);expect(resultSequence(null,trace)).toEqual([]);
 });
 it('uses actual HP endpoints and omits damage trail before the landed result',()=>{
  const f=buildFixture('result-hit'),vm=buildBattleViewModel({...f,fxStage:'impact',shot:presentationFor(f.s)});
  const v=render(<BattleHud hud={vm.hud} result={vm.result} playback={{token:1}} phase="result"/>);
  expect(screen.getByLabelText(new RegExp('투수 HP '+vm.result.hpAfter))).not.toBeNull();
  expect(document.querySelector('.bv-hud-hp-ghost').style.width).toBe(vm.result.hpBefore/vm.hud.pitcher.maxHp*100+'%');
  v.rerender(<BattleHud hud={vm.hud} result={null} playback={{token:1}} phase="flight"/>);expect(document.querySelector('.bv-hud-hp-ghost')).toBeNull();
 });
 it('keeps sequence readable with actual bonus only',()=>{
  render(<ResultSequence result={{kind:'hit',damage:12,precisionBonus:4,primaryCoverage:[2],actualZone:2}} execution={{cards:[{name:'정타 노림',role:'main'}]}}/>);
  expect(screen.getByTestId('bv-result-sequence').textContent).toContain('정확 적중 +4 HP');
  expect(screen.getByTestId('bv-result-sequence').textContent).toContain('투수 HP −12');
 });
});
