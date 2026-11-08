// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,afterEach,vi} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {createV10Duel,enterV10Node,playV10Action,setAimZone} from '../src/duel/engine.js';
import {PITCHER_ENCOUNTERS} from '../src/duel/pitcher-encounters.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import BattleHud from '../src/duel/battle-vnext/BattleHud.jsx';
import {resultSequence} from '../src/duel/presentation-snapshot.js';
afterEach(cleanup);
const fight=id=>{
 for(let seed=1;seed<120;seed++){
  const run=createV10Duel(seed,{tutorial:id==='regular-01-red-rush'}),node=run.runMap.nodes.find(n=>n.opponent?.artId===id);
  if(node){run.runMap.reachableIds=[node.id];return enterV10Node(run,node.id);}
 }
 throw Error('missing actual roster node '+id);
};
describe('public pitcher encounter UI in the actual battle model',()=>{
 it('carries every actual opponent signature from map into the battle HUD without a second permanent panel',()=>{
  for(const [id,e] of Object.entries(PITCHER_ENCOUNTERS)){
   const s=fight(id),vm=buildBattleViewModel({s});
   expect(s.v10.opponent.encounter.label).toBe(e.label);
   expect(vm.hud.encounter.label).toBe(e.label);
   expect(vm.hud.encounter.current).not.toBe('');
   const view=render(<BattleHud hud={vm.hud} refined/>);
   expect(screen.getAllByTestId('bv-encounter')).toHaveLength(1);
   expect(screen.getByTestId('bv-encounter').textContent).toContain(e.label);
   view.unmount();
  }
 });
 it('keeps the dealt trigger fixed through flight and exposes actual encounter feedback only after impact',()=>{
  const s=fight('vulcan-blaze'),before=buildBattleViewModel({s}),next=playV10Action(s,{type:'take'});
  const flight=buildBattleViewModel({s:next,fxStage:'windup'});
  expect(flight.hud.encounter).toEqual(before.hud.encounter);expect(flight.result).toBeNull();
  const aimed=setAimZone(s,8);expect(buildBattleViewModel({s:aimed}).hud.encounter).toEqual(before.hud.encounter);
 });
 it('explains the signature without dropping the final actual HP loss from the result sequence',()=>{
  const steps=resultSequence({kind:'hit',primaryCoverage:[4],actualZone:4,precisionBonus:6,hpBefore:20,hpAfter:2,
   encounterEvents:['방패 돌파 · 추가 피해 +8 HP']},{cards:[{id:'x',role:'main',name:'정타 노림'}]});
  expect(steps).toHaveLength(3);expect(steps.some(s=>s.text.includes('방패 돌파'))).toBe(true);
  expect(steps.at(-1)).toEqual({kind:'hp',text:'투수 HP −18'});
 });
});

describe('direct public pitcher information entry',()=>{
 it('supports touch click and Space only during planning without changing visible HUD text',()=>{
  const s=fight('regular-02-teal-mirage'),vm=buildBattleViewModel({s}),open=vi.fn();
  const view=render(<BattleHud hud={vm.hud} refined onPitcherInfo={open}/>);
  const button=screen.getByRole('button',{name:/투수 HP.*투수 정보 열기/});
  expect(button.getAttribute('aria-label')).toContain(vm.hud.encounter.label);expect(button.getAttribute('aria-label')).toContain(vm.hud.encounter.current);
  const text=button.textContent;fireEvent.keyDown(button,{key:' '});fireEvent.click(button);expect(open).toHaveBeenCalledTimes(2);
  for(const phase of ['flight','committing','result']){
   view.rerender(<BattleHud hud={vm.hud} refined phase={phase} onPitcherInfo={open}/>);
   fireEvent.click(button);fireEvent.keyDown(button,{key:'Enter'});expect(open).toHaveBeenCalledTimes(2);
  }
  view.rerender(<BattleHud hud={vm.hud} refined menuOpen onPitcherInfo={open}/>);
  fireEvent.click(button);expect(open).toHaveBeenCalledTimes(2);
  expect(text).toContain(vm.hud.encounter.label);
 });
});
