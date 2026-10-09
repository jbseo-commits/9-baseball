// @vitest-environment happy-dom
import React from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {BUILDS,CARDS,LINEUP} from '../src/duel/cards.js';

beforeEach(()=>{
  localStorage.clear();vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});

function begin({grand=false,ko=false,powerRoll=.001,reduced=false}={}){
  if(reduced)vi.spyOn(window,'matchMedia').mockImplementation(q=>({matches:q.includes('prefers-reduced-motion'),addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  let s=createV10Duel(1);s.build='away';
  s.deck=BUILDS.away.cards.filter(k=>CARDS[k].type!=='skill').map((kind,i)=>({id:'c'+i,kind:i===0?'slug':kind}));s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  s.battle.hand=['c0'];s.battle.draw=s.deck.slice(1).map(c=>c.id);s.battle.discard=[];
  s.battle.pending={zone:4,roll:.05,powerRoll};
  if(grand)s.battle.bases=LINEUP.slice(1,4).map(x=>x.id);
  if(ko){s.pitcher.hp=1;s.pitcher.phase='critical';}
  saveV10Duel(localStorage,s);
  localStorage.setItem('9zone-bp-coach-v1','done');
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  fireEvent.click(document.querySelector('.bp-card[data-card-kind="slug"]'));
  fireEvent.click(document.querySelectorAll('.bp-cell')[4]);
  const save=vi.spyOn(localStorage,'setItem');
  fireEvent.click(screen.getByTestId('bp-swing'));
  act(()=>vi.advanceTimersByTime(800)); // finish existing commit beat
  return save;
}

const movie=()=>document.querySelector('.bp-homer-video video');
const runWrites=spy=>spy.mock.calls.filter(([key])=>key==='9zone-v10-run');

describe('home-run movie in actual gameplay',()=>{
  it('holds next after ordinary FX expire, persists one result, then advances one batter',()=>{
    const writes=begin();expect(movie()).not.toBeNull();expect(movie().muted).toBe(true);
    const judged=localStorage.getItem('9zone-v10-run');
    expect(readV10Duel(localStorage).battle.revealed.label).toBe('홈런');
    expect(runWrites(writes)).toHaveLength(1);
    act(()=>vi.advanceTimersByTime(5500));
    expect(screen.getByTestId('bp-next').disabled).toBe(true);
    fireEvent.click(screen.getByTestId('bp-next'));
    expect(localStorage.getItem('9zone-v10-run')).toBe(judged);
    fireEvent.ended(movie());
    expect(movie()).toBeNull();expect(screen.getByTestId('bp-next').disabled).toBe(false);
    expect(runWrites(writes)).toHaveLength(1);
    fireEvent.click(screen.getByTestId('bp-next'));
    expect(readV10Duel(localStorage).phase).toBe('battle');
    expect(readV10Duel(localStorage).stats.pitches).toBe(1);
    expect(runWrites(writes)).toHaveLength(2);
  });

  it('plays a grand slam and Escape releases without writing tutorial state or resaving',()=>{
    const writes=begin({grand:true});expect(movie()).not.toBeNull();
    expect(readV10Duel(localStorage).last.runs).toBe(4);
    act(()=>vi.advanceTimersByTime(5500));
    const snapshot=JSON.stringify({...localStorage});writes.mockClear();
    fireEvent.keyDown(window,{key:'Escape'});
    expect(movie()).toBeNull();expect(writes).not.toHaveBeenCalled();
    expect(JSON.stringify({...localStorage})).toBe(snapshot);
    expect(screen.getByTestId('bp-next').disabled).toBe(false);
  });

  it('stays mounted through a knockout reward transition and errors release without changing reward',()=>{
    const writes=begin({ko:true});expect(movie()).not.toBeNull();
    act(()=>vi.advanceTimersByTime(5500));
    expect(readV10Duel(localStorage).phase).toBe('reward');
    const saved=localStorage.getItem('9zone-v10-run');
    fireEvent.error(movie());
    expect(movie()).toBeNull();expect(document.querySelector('.bp-stop')).not.toBeNull();
    expect(localStorage.getItem('9zone-v10-run')).toBe(saved);expect(runWrites(writes)).toHaveLength(1);
  });

  it('an early skip keeps the original short FX guard until it completes',()=>{
    begin();expect(movie()).not.toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));
    expect(screen.getByTestId('bp-next').disabled).toBe(true);
    act(()=>vi.advanceTimersByTime(5500));
    expect(screen.getByTestId('bp-next').disabled).toBe(false);
  });

  it('reduced motion skips the movie, and ordinary hits keep their existing next flow',()=>{
    begin({reduced:true});expect(movie()).toBeNull();
    act(()=>vi.advanceTimersByTime(100));expect(screen.getByTestId('bp-next').disabled).toBe(false);
    cleanup();vi.restoreAllMocks();localStorage.clear();
    begin({powerRoll:.999});expect(movie()).toBeNull();
    act(()=>vi.advanceTimersByTime(5500));expect(screen.getByTestId('bp-next').disabled).toBe(false);
  });
});
