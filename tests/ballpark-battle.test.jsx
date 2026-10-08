// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {act} from 'react';
import fs from 'node:fs';
import path from 'node:path';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {BUILDS,CARDS,LINEUP} from '../src/duel/cards.js';
import {intentLines,hpTicks} from '../src/duel/ballpark-copy.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

function begin(ng=true){
  let s=createV10Duel(1);
  s.build='away';s.deck=['place','place','strike','rally','strike','bunt','place','place','place','place','place','place'].map((kind,i)=>({id:'c'+i,kind}));
  s.deck[1]=Object.assign({},s.deck[1],{plus:true});
  s.deck[3]=Object.assign({},s.deck[3],{plus:true});
  s.deck[6]=Object.assign({},s.deck[6],{plus:true});
  s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  return s;
}
const swingBtn=()=>screen.getByTestId('bp-swing');
const cells=()=>[...document.querySelectorAll('.bp-cell')];
const cards=()=>[...document.querySelectorAll('.bp-hand .bp-card:not(.basic)')];

describe('V13 BALLPARK battle',()=>{
  it('the main run always plays on the ballpark; there is no legacy switch left',()=>{
    localStorage.setItem('9zone-park','0');
    begin();
    expect(document.querySelector('.bp-battle')).not.toBeNull();
    expect(document.querySelector('.duel-combat')).toBeNull();
    const app=fs.readFileSync(path.resolve('src/duel/App.jsx'),'utf8');
    expect(app).not.toMatch(/parkOn|9zone-park/);
  });
  it('opens on the scene: nine zones, the hand, two verbs, and nothing to swing yet',()=>{
    begin();
    expect(document.querySelector('.bp-battle')).not.toBeNull();
    expect(document.querySelector('.duel-combat')).toBeNull();
    expect(cells()).toHaveLength(9);
    expect(cards().length).toBeGreaterThan(0);
    expect(swingBtn().disabled).toBe(true);
    expect(screen.getByTestId('bp-take').textContent).toMatch(/^지켜본다/);
  });
  it('speaks in short lines, not rules',()=>{
    const s=begin();
    const lines=intentLines(s.battle.intent);
    expect(document.querySelector('.bp-coach-text').textContent).toBe(lines.coach);
    expect(lines.coach.length).toBeLessThan(30);
  });
  it('card then zone aims the swing through the engine and saves it',()=>{
    begin();
    fireEvent.click(cards()[0]);
    fireEvent.click(cells()[5]);
    expect(readV10Duel(localStorage).battle.aimZone).toBe(5);
    expect(swingBtn().disabled).toBe(false);
    // Level-0 reading (no observation cards): the board shows the public range,
    // never exact digits — same contract as the legacy ZoneBoard (App.jsx) and
    // information.js coverageText. The old /적중권 \d+%/ assertion encoded the leak.
    expect(swingBtn().textContent).toMatch(/^휘두른다적중권 \d+–\d+% · 피해 ×/);
    expect(cells()[5].classList.contains('aim')).toBe(true);
  });

  it('a second card waits for its own zone and joins as support ②',()=>{
    begin();
    fireEvent.click(cards()[0]);fireEvent.click(cells()[4]);
    fireEvent.click(cards()[1]);
    expect(cards()[1].classList.contains('armed')).toBe(true);
    fireEvent.click(cells()[2]);
    expect(cards()[1].classList.contains('support')).toBe(true);
    expect([...cells()[2].querySelectorAll('.bp-token')].map(t=>t.textContent)).toEqual(['2']);
    expect(readV10Duel(localStorage).battle.aimZone).toBe(4);
    expect(swingBtn().textContent).toMatch(/피해 ×0\.\d/);
  });
  it('locks a multi-card plan before the pitch actually resolves',()=>{
    vi.useFakeTimers();
    const before=begin().stats.pitches;
    fireEvent.click(cards()[0]);fireEvent.click(cells()[4]);
    fireEvent.click(cards()[1]);fireEvent.click(cells()[2]);
    fireEvent.click(swingBtn());
    const beat=screen.getByTestId('bp-commit');
    expect(beat.textContent).toContain('2장 STACK');
    expect(beat.textContent).toContain('적중권');
    expect(beat.textContent).toContain('HP 효율');
    expect(beat.textContent).toContain('CONNECT');
    expect(readV10Duel(localStorage).stats.pitches).toBe(before);
    act(()=>{vi.advanceTimersByTime(719)});
    expect(readV10Duel(localStorage).stats.pitches).toBe(before);
    act(()=>{vi.advanceTimersByTime(1)});
    expect(screen.queryByTestId('bp-commit')).toBeNull();
    act(()=>{vi.advanceTimersByTime(5000)});
    expect(readV10Duel(localStorage).stats.pitches).toBe(before+1);
    vi.useRealTimers();
  });

  it('the coach speaks in short lines, not rules',()=>{
    const s=begin();
    const lines=intentLines(s.battle.intent);
    expect(document.querySelector('.bp-coach-text').textContent).toBe(lines.coach);
    expect(lines.coach.length).toBeLessThan(30);
  });

  it('the swing button shows hit rate and damage multiplier',()=>{
    begin();
    fireEvent.click(cards()[0]);fireEvent.click(cells()[4]);
    const txt=swingBtn().textContent;
    // Level-0 deck: gated range, not the exact digit the old assertion pinned.
    expect(txt).toMatch(/적중권 \d+–\d+%/);
    expect(txt).toMatch(/피해 ×/);
  });

  it('the take button is always available',()=>{
    begin();
    expect(screen.getByTestId('bp-take')).not.toBeNull();
    expect(screen.getByTestId('bp-take').disabled).toBe(false);
  });
});