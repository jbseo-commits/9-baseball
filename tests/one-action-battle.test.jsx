// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';
beforeEach(()=>{localStorage.clear();window.history.replaceState({},'','/');});
afterEach(()=>{cleanup();vi.useRealTimers();});
function begin({strikes=0,energy=2,lab=false}={}){
  let s=lab?E.createDefenseLabState({seed:914,pack:'hold',scenario:'crisis'}):E.enterV10Node(E.createV10Duel(90211),'a1-entry');
  s.battle.strikes=strikes;s.battle.energy=energy;
  if(lab){E.saveDefenseLabState(localStorage,s);window.history.replaceState({},'','/?experiment=defense');}
  else E.saveV10Duel(localStorage,s);
  render(<Duel/>);if(!lab)fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));return s;
}
it('submits a watch with one enabled execute control when no card is selected',()=>{
  const s=begin();expect(document.querySelectorAll('.bp-verbs button')).toHaveLength(1);
  const go=screen.getByTestId('bp-swing');expect(go.disabled).toBe(false);expect(go.textContent).toBe('실행');
  expect(go.getAttribute('data-action-kind')).toBe('watch');
  fireEvent.click(go);const after=E.readV10Duel(localStorage);
  expect(after.stats.pitches).toBe(s.stats.pitches+1);expect(after.v10.lastCombat.choice).toBe('take');
});
it('a second tap clears main and all supports so submitting never swings an old plan',()=>{
  begin();fireEvent.click(document.querySelector('.bp-card:not(.basic):not(.prep-card)'));
  fireEvent.click(document.querySelector('.bp-card.main'));
  expect(document.querySelector('.bp-card.main')).toBeNull();expect(screen.getByTestId('bp-swing').getAttribute('data-action-kind')).toBe('watch');
  fireEvent.click(screen.getByTestId('bp-swing'));expect(E.readV10Duel(localStorage).v10.lastCombat.choice).toBe('take');
});
it('keeps a selected illegal attack blocked instead of silently watching',()=>{
  const s=begin({energy:0});fireEvent.click(document.querySelector('.bp-card:not(.basic):not(.prep-card)'));
  expect(screen.getByTestId('bp-swing').disabled).toBe(true);fireEvent.click(screen.getByTestId('bp-swing'));
  expect(E.readV10Duel(localStorage).stats.pitches).toBe(s.stats.pitches);
  fireEvent.click(document.querySelector('.bp-card.main'));expect(screen.getByTestId('bp-swing').disabled).toBe(false);
});
it('keeps free basic swing as an attack even with zero energy',()=>{
  begin({energy:0});fireEvent.click(document.querySelector('.bp-card.basic'));fireEvent.click(screen.getByTestId('bp-swing'));
  expect(E.readV10Duel(localStorage).v10.lastCombat.choice).not.toBe('take');
});
it('executes preparation without consuming a pitch and shows its selected effect',()=>{
  const s=begin();const card=document.querySelector('.bp-card.prep-card');fireEvent.click(card);
  const summary=document.querySelector('.bp-compact-summary').textContent;expect(summary).toMatch(/뽑기|집중|간파|생존|범위|주자|파울/);
  expect(screen.getByTestId('bp-swing').getAttribute('data-action-kind')).toBe('prepare');fireEvent.click(screen.getByTestId('bp-swing'));
  const after=E.readV10Duel(localStorage);expect(after.stats.pitches).toBe(s.stats.pitches);expect(after.battle.preparations).toBe(s.battle.preparations+1);
});
it('warns about strikeout in the visible empty-plan summary, including lab protection exclusion',()=>{
  begin({strikes:2,lab:true});expect(document.querySelector('.bp-compact-summary').textContent).toMatch(/삼진.*보호 제외/);
  expect(screen.getByTestId('bp-swing').disabled).toBe(false);
});
it('keeps 2S watch risk visible with no selection and a chosen board course',()=>{
  begin({strikes:2});fireEvent.click(document.querySelector('[data-zone="8"]'));
  expect(document.querySelector('.bp-compact-summary').textContent).toContain('스트라이크면 삼진');
  expect(screen.getByTestId('bp-swing').getAttribute('data-action-kind')).toBe('watch');
});
it('blocks repeated Enter and double-clicking preparation from consuming an extra pitch',()=>{
  const s=begin();fireEvent.click(document.querySelector('.bp-card.prep-card'));
  const go=screen.getByTestId('bp-swing');expect(fireEvent.keyDown(go,{key:'Enter',repeat:true})).toBe(false);
  fireEvent.click(go);fireEvent.click(screen.getByTestId('bp-swing'));
  const after=E.readV10Duel(localStorage);expect(after.stats.pitches).toBe(s.stats.pitches);expect(after.battle.preparations).toBe(s.battle.preparations+1);
});
it('uses the same public course marks and watch artwork in the defense battle',()=>{
  begin({lab:true});expect(document.querySelector('.bp-battle').classList.contains('bp-asset-led')).toBe(true);
  expect(document.querySelectorAll('.bp-cell [data-course-mark]').length).toBeGreaterThan(0);
  expect(document.querySelector('.bp-compact-summary .ba-watch')).toBeTruthy();
  expect(document.querySelectorAll('.bp-verbs button')).toHaveLength(1);
});
it('an empty lab submission at 2S really strikes out and never spends swing protection',()=>{
  const s=E.createDefenseLabState({seed:914,pack:'hold',scenario:'crisis'});
  s.battle.pending={zone:4,roll:.99,powerRoll:.5};E.saveDefenseLabState(localStorage,s);window.history.replaceState({},'','/?experiment=defense');render(<Duel/>);
  fireEvent.click(screen.getByTestId('bp-swing'));const after=E.readDefenseLabState(localStorage);
  expect(after.stats.pitches).toBe(s.stats.pitches+1);expect(after.battle.outs).toBe(3);expect(after.defenseLab.protectionUsed).toBe(false);
  expect(E.readV10Duel(localStorage)).toBeNull();
});
it('never shows an attack forecast for an empty watch plan, even while hovering a prep card',()=>{
  begin();const prep=document.querySelector('.bp-card.prep-card');fireEvent.pointerEnter(prep,{pointerType:'mouse'});
  expect(screen.queryByTestId('bp-forecast')).toBeNull();
  fireEvent.click(prep);expect(screen.queryByTestId('bp-forecast')).not.toBeNull();
  fireEvent.click(prep);expect(screen.getByTestId('bp-swing').getAttribute('data-action-kind')).toBe('watch');expect(screen.queryByTestId('bp-forecast')).toBeNull();
});
