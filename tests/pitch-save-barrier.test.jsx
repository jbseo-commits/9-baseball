// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel,playV10Action,V10_SAVE_KEY,previewV10Stack} from '../src/duel/engine.js';
import {STACK_COMMIT_MS} from '../src/duel/BallparkBattle.jsx';
import {stackResolveDuration} from '../src/duel/StackResolve.jsx';

beforeEach(()=>{vi.useFakeTimers();localStorage.clear();window.history.replaceState({},'','/?battleUi=vnext');});
afterEach(()=>{cleanup();vi.useRealTimers();});
function begin({legacy=false,stack=false,ko=false,strikeout=false}={}){
  if(legacy)window.history.replaceState({},'','/?battleUi=legacy');
  const values=new Map(),writes=[];
  let denied=false;
  const storage={getItem:k=>values.get(k)??null,setItem(k,v){
    if(k===V10_SAVE_KEY){writes.push(v);if(denied)throw Error('quota');}
    values.set(k,String(v));
  }};
  const before=enterV10Node(createV10Duel(3),'a1-entry');
  if(stack)for(const id of before.battle.hand.slice(0,2))before.deck.find(c=>c.id===id).kind='place';
  if(ko){before.pitcher.hp=1;before.pitcher.phase='critical';before.battle.pending={zone:4,roll:.5,powerRoll:.5};before.battle.aimZone=4;}
  if(strikeout){before.battle.strikes=2;before.battle.outs=2;before.runOuts=2;before.battle.pending={zone:4,roll:.5,powerRoll:.5};}
  saveV10Duel(storage,before);
  const view=render(<Duel storage={storage} startInRun/>);
  denied=true;writes.length=0;
  return {storage,before,writes,view,allow:()=>{denied=false;}};
}
it('keeps the old hand, HP and result private when an accepted pitch cannot be saved',()=>{
  const f=begin(),old=f.storage.getItem(V10_SAVE_KEY);
  const hand=document.querySelector('[data-testid=bv-hand]').textContent;
  fireEvent.click(screen.getByTestId('bp-swing'));
  expect(screen.getByRole('alert').textContent).toContain('저장');
  expect(f.storage.getItem(V10_SAVE_KEY)).toBe(old);
  expect(document.querySelector('.bv-scene').dataset.fxStage).toBeFalsy();
  expect(document.querySelector('[data-testid=bv-hand]').textContent).toBe(hand);
  expect(document.querySelector('.bv-result')).toBeNull();
  expect(screen.getByTestId('bp-swing').disabled).toBe(true);
  expect(screen.getByRole('button',{name:'경기 정보 및 메뉴'}).disabled).toBe(true);
  fireEvent.keyDown(window,{key:'Escape'});
  fireEvent.click(screen.getByTestId('bp-swing'));
  act(()=>vi.advanceTimersByTime(15000));
  expect(f.writes).toHaveLength(1);
  expect(f.storage.getItem(V10_SAVE_KEY)).toBe(old);
  expect(document.querySelector('.bv-scene').dataset.fxStage).toBeFalsy();
});
it('retries the same accepted state, including engine RNG, and presents only after save succeeds',()=>{
  const f=begin(),expected=playV10Action(f.before,{type:'take'});
  fireEvent.click(screen.getByTestId('bp-swing'));
  fireEvent.click(screen.getByRole('button',{name:'저장 재시도'}));
  expect(f.writes).toHaveLength(2);expect(f.writes[1]).toBe(f.writes[0]);
  expect(readV10Duel(f.storage)).toEqual(f.before);
  f.allow();fireEvent.click(screen.getByRole('button',{name:'저장 재시도'}));
  expect(f.writes).toHaveLength(3);expect(f.writes[2]).toBe(f.writes[0]);
  expect(readV10Duel(f.storage)).toEqual(expected);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(document.querySelector('.bv-scene').dataset.fxStage).toBe('windup');
  fireEvent.click(screen.getByTestId('bp-swing'));
  expect(f.writes).toHaveLength(3);
});
it('reloads the undisclosed old decision after a failed save, and the committed result after successful retry',()=>{
  const f=begin(),expected=playV10Action(f.before,{type:'take'});
  fireEvent.click(screen.getByTestId('bp-swing'));f.view.unmount();
  const second=render(<Duel storage={f.storage} startInRun/>);
  expect(readV10Duel(f.storage)).toEqual(f.before);
  expect(screen.getByTestId('bp-swing').disabled).toBe(false);
  fireEvent.click(screen.getByTestId('bp-swing'));f.allow();
  fireEvent.click(screen.getByRole('button',{name:'저장 재시도'}));second.unmount();
  render(<Duel storage={f.storage} startInRun/>);
  expect(readV10Duel(f.storage)).toEqual(expected);
  expect(document.querySelector('.bv-scene').dataset.fxStage).toBeFalsy();
  expect(screen.queryByTestId('bp-swing')).toBeNull();
});
it('keeps a legacy two-card KO private through the entire saved stack resolve beat',()=>{
  const f=begin({legacy:true,stack:true,ko:true}),ids=f.before.battle.hand.slice(0,2);
  const supports=[{id:ids[1],aimZone:4}],expected=playV10Action(f.before,{type:'card',id:ids[0],supports});
  expect(expected.phase).toBe('reward');
  const cards=[...document.querySelectorAll('.bp-card:not(.basic):not(.prep-card)')];
  fireEvent.click(cards[0]);fireEvent.click(cards[1]);fireEvent.click(document.querySelector('[data-zone="4"]'));
  fireEvent.click(screen.getByTestId('bp-swing'));act(()=>vi.advanceTimersByTime(STACK_COMMIT_MS));
  expect(screen.getByRole('alert')).toBeTruthy();expect(f.writes).toHaveLength(1);
  expect(readV10Duel(f.storage)).toEqual(f.before);
  f.allow();fireEvent.click(screen.getByRole('button',{name:'저장 재시도'}));
  expect(readV10Duel(f.storage)).toEqual(expected);
  expect(document.querySelector('.stack-resolving')).not.toBeNull();
  expect(document.querySelector('.bp-battle')).not.toBeNull();
  expect(document.querySelector('.bp-stop')).toBeNull();
  expect(document.querySelector('.presentation-stage-windup')).toBeNull();
  const duration=stackResolveDuration(previewV10Stack(f.before,ids[0],supports).stackPlan);
  act(()=>vi.advanceTimersByTime(duration-1));
  expect(document.querySelector('.bp-battle')).not.toBeNull();
  expect(document.querySelector('.presentation-stage-windup')).toBeNull();
  act(()=>vi.advanceTimersByTime(1));
  expect(document.querySelector('.presentation-stage-windup')).not.toBeNull();
  expect(document.querySelector('.stack-resolving')).toBeNull();
  expect(f.writes).toHaveLength(2);
});
it('does not disclose a terminal strikeout when its save fails',()=>{
  const f=begin({strikeout:true}),expected=playV10Action(f.before,{type:'take'});
  expect(expected.phase).toBe('lost');
  fireEvent.click(screen.getByTestId('bp-swing'));
  expect(document.querySelector('.battle-vnext')).not.toBeNull();
  expect(document.querySelector('.bv-scene').dataset.fxStage).toBeFalsy();
  expect(readV10Duel(f.storage)).toEqual(f.before);
  f.allow();fireEvent.click(screen.getByRole('button',{name:'저장 재시도'}));
  expect(readV10Duel(f.storage)).toEqual(expected);
  expect(document.querySelector('.bv-scene').dataset.fxStage).toBe('windup');
});
it('preserves a selected free basic attack through failed storage and Escape',()=>{
  const f=begin();fireEvent.click(screen.getByTestId('bv-basic-chip'));
  const expected=playV10Action(f.before,{type:'card',id:'basic'});
  fireEvent.click(screen.getByTestId('bp-swing'));
  expect(screen.getByTestId('bv-basic-chip').getAttribute('aria-pressed')).toBe('true');
  fireEvent.keyDown(window,{key:'Escape'});
  expect(screen.getByTestId('bv-basic-chip').getAttribute('aria-pressed')).toBe('true');
  f.allow();fireEvent.click(screen.getByRole('button',{name:'저장 재시도'}));
  expect(readV10Duel(f.storage)).toEqual(expected);
});
