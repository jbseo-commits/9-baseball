// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createDuel,startBattle,saveDuel,readLevel} from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear();localStorage.setItem('9zone-zones-tour-v5','done');});
afterEach(()=>{cleanup();});

function levelZeroBattle(){
  let s=createDuel(1);
  // strip observation so reading stays level 0 (same length, no validation drift)
  s.deck=s.deck.map(c=>c.kind==='scout'?{...c,kind:'strike'}:c);
  s=startBattle(s);
  expect(readLevel(s)).toBe(0);
  return s;
}

describe('V9 tutorial zone legend respects reading level',()=>{
  it('shows no exact ball digits at level 0',()=>{
    // Regression: the legend printed the raw out-of-zone share while the cells
    // and the ball-read beside it honored the readLevel contract.
    saveDuel(localStorage,levelZeroBattle());
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    expect(document.querySelector('.zone-panel')).not.toBeNull();
    expect(document.querySelector('.zone-legend').textContent).not.toMatch(/\d+%/);
  });
});
