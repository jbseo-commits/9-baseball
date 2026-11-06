// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {captureExecution,resultSequence} from '../src/duel/presentation-snapshot.js';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {createV10Duel,enterV10Node,playV10Action,setAimZone,applyStartPack,coverage as cardCoverage,v10PrepMax} from '../src/duel/engine.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {presentationFor} from '../src/duel/presentation.js';
import {cardFaceOf} from '../src/duel/card-face.js';
import {preparationDrawPreview} from '../src/duel/preparation-feedback.js';
import {CARDS} from '../src/duel/cards.js';
import {appInputs} from '../src/duel/battle-vnext/fixtures.js';
import ResultSequence from '../src/duel/battle-vnext/ResultSequence.jsx';
import BattleHud from '../src/duel/battle-vnext/BattleHud.jsx';
import HandDock from '../src/duel/battle-vnext/HandDock.jsx';
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

describe('G-016 pre-impact hand disclosure snapshot',()=>{
 const actualSwing=(seed)=>{
   let before=enterV10Node(applyStartPack(createV10Duel(seed),'link'),'a1-entry');
   const entry=before.deck.find(c=>c.kind==='tableSetter'&&before.battle.hand.includes(c.id));
   expect(entry,`seed ${seed} tableSetter`).toBeTruthy();
   before=setAimZone(before,4);
   const beforeCapture=structuredClone(before);
   const after=playV10Action(before,{type:'card',id:entry.id});
   const execution=captureExecution(before,after,{selected:entry.id});
   expect(before).toEqual(beforeCapture);
   const flight=buildBattleViewModel({s:after,...appInputs(after),execution,fxStage:'windup',locked:true});
   const impact=buildBattleViewModel({s:after,...appInputs(after),execution,fxStage:'impact',locked:true});
   return {before,after,entry,execution,flight,impact};
 };

 it.each([[1,'whiff',4],[4,'hit',5]])('freezes seed %i %s hand, face, coverage, prep warning and piles until impact',(_seed,kind,postCount)=>{
   const seed=_seed,{before,after,execution,flight,impact}=actualSwing(seed);
   expect(after.battle.revealed.kind).toBe(kind);
   expect(after.battle.hand).toHaveLength(postCount);
   expect(flight.phase).toBe('flight');
   expect(flight.handKnown).toBe(true);
   expect(Object.keys(execution.handSnapshot).sort()).toEqual(['basicCoverage','cards','piles','prepLeft']);
   expect(Object.keys(execution.handSnapshot.cards[0]).sort()).toEqual(['coverage','face','id','kind','plus','warning']);
   expect(execution.handSnapshot).not.toHaveProperty('drawOrder');
   expect(flight.handCount).toBe(before.battle.hand.length);
   expect(flight.piles).toEqual({draw:before.battle.draw.length,discard:before.battle.discard.length});
   const actualHand=flight.hand.filter(c=>c.type!=='basic');
   expect(actualHand.map(c=>c.id).sort()).toEqual([...before.battle.hand].sort());
   for(const shown of actualHand){
     const entry=before.deck.find(c=>c.id===shown.id);
     const face=cardFaceOf(entry,{strikes:before.battle.strikes,drawPreview:preparationDrawPreview(before,shown.id)});
     expect(shown).toMatchObject({kind:entry.kind,plus:!!entry.plus,summary:face.summary,condition:face.condition,drawNote:face.drawNote||''});
     expect(shown.coverage).toEqual(CARDS[entry.kind].type==='skill'?null:cardCoverage(before,shown.id));
   }
   expect(flight.prepLeft).toBe(Math.max(0,v10PrepMax(before)-before.battle.preparations));
   expect(impact.phase).toBe('result');
   expect(impact.handKnown).toBe(true);
   expect(impact.handCount).toBe(after.battle.hand.length);
   expect(impact.hand.filter(c=>c.type!=='basic').map(c=>c.id).sort()).toEqual([...after.battle.hand].sort());
   expect(impact.piles).toEqual({draw:after.battle.draw.length,discard:after.battle.discard.length});
 });

 it('never falls through to post-action cards for a missing or stale flight snapshot',()=>{
   const {after,execution}=actualSwing(4);
   for(const stale of [null,{...execution,pitch:execution.pitch-1},{...execution,nodeId:'old-node'}]){
     const vm=buildBattleViewModel({s:after,...appInputs(after),execution:stale,fxStage:'windup',locked:true});
     expect(vm.phase).toBe('flight');
     expect(vm.handKnown).toBe(false);expect(vm.handCount).toBeNull();
     expect(vm.piles).toEqual({draw:'—',discard:'—'});
     expect(vm.hand.filter(c=>c.type!=='basic')).toEqual([]);
     expect(vm.hand[0].id).toBe('basic');
   }
 });

 it('freezes a public watch face across a whiff draw',()=>{
   let before=enterV10Node(applyStartPack(createV10Duel(5),'link'),'a1-entry');
   const main=before.deck.find(c=>c.kind==='tableSetter'&&before.battle.hand.includes(c.id));
   const watch=before.deck.find(c=>c.kind==='watch'&&before.battle.hand.includes(c.id));
   expect(main).toBeTruthy();expect(watch).toBeTruthy();
   before=setAimZone(before,4);
   const after=playV10Action(before,{type:'card',id:main.id});
   expect(after.battle.revealed.kind).toBe('whiff');
   expect(cardFaceOf(watch,{strikes:before.battle.strikes,drawPreview:preparationDrawPreview(before,watch.id)}).summary).toBe('뽑기 1장');
   expect(cardFaceOf(watch,{strikes:after.battle.strikes,drawPreview:preparationDrawPreview(after,watch.id)}).summary).toBe('뽑기 2장');
   const execution=captureExecution(before,after,{selected:main.id});
   const flight=buildBattleViewModel({s:after,...appInputs(after),execution,fxStage:'windup',locked:true});
   const impact=buildBattleViewModel({s:after,...appInputs(after),execution,fxStage:'impact',locked:true});
   expect(flight.hand.find(c=>c.id===watch.id).summary).toBe('뽑기 1장');
   expect(impact.hand.find(c=>c.id===watch.id).summary).toBe('뽑기 2장');
 });

 it('keeps exhausted preparation warnings and applied preparation effects current',()=>{
   let before=enterV10Node(applyStartPack(createV10Duel(1),'link'),'a1-entry');
   const prep=before.deck.find(c=>c.kind==='scout'&&before.battle.hand.includes(c.id));
   expect(prep).toBeTruthy();
   before=setAimZone(before,4);
   before={...before,battle:{...before.battle,preparations:v10PrepMax(before)}};
   const exhaustedMain=before.deck.find(c=>c.kind==='tableSetter'&&before.battle.hand.includes(c.id));
   const exhaustedAction=playV10Action(before,{type:'card',id:exhaustedMain.id});
   const exhaustedTrace=captureExecution(before,exhaustedAction,{selected:exhaustedMain.id});
   const exhaustedFlight=buildBattleViewModel({s:exhaustedAction,...appInputs(exhaustedAction),execution:exhaustedTrace,fxStage:'windup',locked:true});
   expect(exhaustedFlight.hand.find(c=>c.id===prep.id).warning).toBe('준비 횟수 소진');

   const normal=enterV10Node(applyStartPack(createV10Duel(1),'link'),'a1-entry');
   const scout=normal.deck.find(c=>c.kind==='scout'&&normal.battle.hand.includes(c.id));
   const after=playV10Action(normal,{type:'card',id:scout.id});
   expect(after.stats.pitches).toBe(normal.stats.pitches);
   expect(after.battle.preparations).toBe(normal.battle.preparations+1);
   const vm=buildBattleViewModel({s:after,...appInputs(after)});
   expect(vm.phase).toBe('deciding');
   expect(vm.prepLeft).toBe(v10PrepMax(after)-after.battle.preparations);
   expect(vm.effects).toContain('이번 공 간파: 높이·볼');
 });

 it('holds a real drawPlay card until impact while retaining the engine draw',()=>{
   let before=enterV10Node(applyStartPack(createV10Duel(1),'link'),'a1-entry');
   const id='qa-draw-play',entry={id,kind:'tempoSwing'};
   const displaced=before.battle.hand.at(-1);
   before={...before,deck:[...before.deck,entry],battle:{...before.battle,
     hand:[...before.battle.hand.slice(0,-1),id],draw:[...before.battle.draw,displaced]}};
   before=setAimZone(before,4);
   const after=playV10Action(before,{type:'card',id});
   expect(after.stats.pitches).toBe(before.stats.pitches+1);
   expect(after.battle.revealed.kind).toBe('whiff');
   expect(after.battle.hand).not.toContain(id);
   expect(after.battle.hand.length).toBe(before.battle.hand.length);
   const execution=captureExecution(before,after,{selected:id});
   const flight=buildBattleViewModel({s:after,...appInputs(after),execution,fxStage:'windup',locked:true});
   const impact=buildBattleViewModel({s:after,...appInputs(after),execution,fxStage:'impact',locked:true});
   expect(flight.hand.map(c=>c.id)).toContain(id);
   expect(flight.piles).toEqual({draw:before.battle.draw.length,discard:before.battle.discard.length});
   expect(impact.hand.map(c=>c.id)).not.toContain(id);
   expect(impact.handCount).toBe(after.battle.hand.length);
   expect(impact.piles).toEqual({draw:after.battle.draw.length,discard:after.battle.discard.length});
   expect(after.battle.draw.length).toBe(before.battle.draw.length-1);
 });

 it('does not claim an unknown flight hand is empty',()=>{
   render(<HandDock hand={[{id:'basic',type:'basic'}]} handKnown={false} handCount={null} piles={{draw:'—',discard:'—'}} phase="flight"/>);
   expect(screen.getByTestId('bv-hand').getAttribute('aria-label')).toBe('손패 수량을 확인할 수 없음');
   expect(screen.queryByText(/손패 없음/)).toBeNull();
   expect(screen.getByText('손패').parentElement.textContent).toContain('—');
 });
});
