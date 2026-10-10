// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {START_PACKS} from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear();localStorage.setItem('9zone-bp-coach-v1','done');});
afterEach(()=>{cleanup();});

const packs=()=>[...screen.getAllByTestId('start-pack')];
function newGame(){fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));}
function pickFirst(){
  const first=packs()[0],name=first.getAttribute('aria-label');
  fireEvent.click(first);
  return START_PACKS.find(p=>p.name===name);
}

describe('V10 start-pack pick',()=>{
  it('a fresh run starts with the picked direction in deck and record',()=>{
    render(<Duel/>);newGame();
    expect(packs()).toHaveLength(3);
    const pack=pickFirst();
    const s=readV10Duel(localStorage);
    expect(s.deck).toHaveLength(9);
    for(const kind of pack.kinds)expect(s.deck.map(c=>c.kind)).toContain(kind);
    expect(s.v10.startPack.pack).toBe(pack.id);
    expect(s.phase).toBe('map');
  });

  it('overwriting a run goes through pack pick, cancelling keeps the old run',()=>{
    let s=createV10Duel(3);s=enterV10Node(s,'a1-entry');saveV10Duel(localStorage,s);
    render(<Duel/>);newGame();
    fireEvent.click(screen.getByRole('button',{name:'처음부터 시작'}));
    expect(packs()).toHaveLength(3);
    fireEvent.click(screen.getByRole('button',{name:'닫기'}));
    const kept=readV10Duel(localStorage);
    expect(kept.battle).toBeTruthy();
    newGame();
    fireEvent.click(screen.getByRole('button',{name:'처음부터 시작'}));
    const pack=pickFirst();
    const fresh=readV10Duel(localStorage);
    expect(fresh.v10.startPack.pack).toBe(pack.id);
    expect(fresh.rewards).toEqual([]);
  });
});
