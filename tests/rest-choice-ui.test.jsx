// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect} from 'vitest';
import App from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel,v10UtilityOptions} from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear();for(const k of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(k,'done');});
afterEach(cleanup);
function open(outs=2,upgraded=false){
  let s=createV10Duel(19),n=s.runMap.nodes.find(n=>n.type==='rest');
  s=enterV10Node({...s,runOuts:outs,runMap:{...s.runMap,reachableIds:[n.id]}},n.id);
  if(upgraded)s.deck=s.deck.map(c=>({...c,plus:true}));
  saveV10Duel(localStorage,s);render(<App/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));return s;
}
it('rest shows two choices and spends nothing on selection or cancellation',()=>{
  const s=open();expect(screen.getByTestId('bp-rest-recover').textContent).toContain('2→1');
  fireEvent.click(screen.getByTestId('bp-rest-recover'));expect(readV10Duel(localStorage)).toEqual(s);
  fireEvent.click(screen.getByTestId('bp-rest-recover'));expect(screen.getByTestId('bp-stop-go').disabled).toBe(true);
  fireEvent.click(screen.getByTestId('bp-rest-upgrade'));
  fireEvent.click(document.querySelector('.bp-offer'));expect(readV10Duel(localStorage)).toEqual(s);
  fireEvent.click(screen.getByTestId('bp-rest-back'));expect(readV10Duel(localStorage)).toEqual(s);
  expect(screen.getByTestId('bp-stop-go').disabled).toBe(true);
});
it('rest recovery confirms one out and never gives a new +8 bonus',()=>{
  open();fireEvent.click(screen.getByTestId('bp-rest-recover'));fireEvent.click(screen.getByTestId('bp-stop-go'));
  const t=readV10Duel(localStorage);expect(t.phase).toBe('map');expect(t.runOuts).toBe(1);expect(t.v10.nextBattleBonus).toBeFalsy();
});
it('rest upgrade confirms the chosen card ID and preserves outs/deck count',()=>{
  const s=open(),upgrade=v10UtilityOptions(s).filter(a=>a.type==='upgrade')[1];
  fireEvent.click(screen.getByTestId('bp-rest-upgrade'));fireEvent.click(document.querySelectorAll('.bp-offer')[1]);
  fireEvent.click(screen.getByTestId('bp-stop-go'));const t=readV10Duel(localStorage);
  expect(t.deck.filter(c=>c.plus).map(c=>c.id)).toEqual([upgrade.id]);expect(t.runOuts).toBe(2);expect(t.deck.length).toBe(s.deck.length);
});
it('no-effect choices are visibly disabled and passing stays available',()=>{
  const s=open(0,true);expect(screen.getByTestId('bp-rest-recover').disabled).toBe(true);expect(screen.getByTestId('bp-rest-upgrade').disabled).toBe(true);
  expect(screen.queryByTestId('bp-stop-go')).toBeNull();fireEvent.click(screen.getByTestId('bp-stop-skip'));
  const t=readV10Duel(localStorage);expect(t.phase).toBe('map');expect(t.deck).toEqual(s.deck);expect(t.runOuts).toBe(0);
});
