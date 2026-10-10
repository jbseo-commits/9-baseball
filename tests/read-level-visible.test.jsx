// @vitest-environment happy-dom
import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {act} from 'react';
import {createV10Duel,enterV10Node,readLevel,readSources} from '../src/duel/engine.js';
import {BUILDS,CARDS} from '../src/duel/cards.js';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';

afterEach(()=>{cleanup();vi.useRealTimers();});

function battle(){
  let s=createV10Duel(1);
  s.build='away';s.deck=BUILDS.away.cards.filter(k=>CARDS[k].type!=='skill').map((kind,i)=>({id:'c'+i,kind}));
  s.nextId=s.deck.length;
  return enterV10Node(s,'a1-entry');
}
const props=s=>({s,hand:[],pitcher:s.pitcher,onSelect:()=>{},onAim:()=>{},onSwing:()=>{},onTake:()=>{},onStack:()=>{}});

describe('reading level is never a silent switch',()=>{
  it('readSources names exactly what readLevel adds up',()=>{
    const s=battle();
    expect(readLevel(s)).toBe(0);
    expect(readSources(s)).toEqual([]);
    const shaken={...s,battle:{...s.battle,shaken:1}};
    expect(readLevel(shaken)).toBe(1);
    expect(readSources(shaken).map(x=>x.key)).toEqual(['shaken']);
    const scoped={...shaken,relics:['scope']};
    expect(readLevel(scoped)).toBe(2);
    expect(readSources(scoped).reduce((a,x)=>a+x.amount,0)).toBe(2);
  });

  it('the board wears its read level, and a mid-battle rise says why for a beat',()=>{
    vi.useFakeTimers();
    const s=battle();
    const {rerender}=render(<BallparkBattle {...props(s)}/>);
    const badge=document.querySelector('[data-testid="bp-read"]');
    expect(badge.getAttribute('aria-label')).toBe('읽기 0/2');
    expect(document.querySelector('[data-testid="bp-read-up"]')).toBeNull();
    const shaken={...s,battle:{...s.battle,shaken:1}};
    rerender(<BallparkBattle {...props(shaken)}/>);
    expect(document.querySelector('[data-testid="bp-read"]').getAttribute('aria-label')).toBe('읽기 1/2 · 흔들림');
    expect(document.querySelector('[data-testid="bp-read"]').textContent).toContain('흔들림');
    const up=document.querySelector('[data-testid="bp-read-up"]');
    expect(up.textContent).toContain('투수가 읽힌다');
    expect(up.textContent).toContain('흔들림 → 확률 구간 공개');
    act(()=>{vi.advanceTimersByTime(2700)});
    expect(document.querySelector('[data-testid="bp-read-up"]')).toBeNull();
  });

  it('a new battle starting at a higher level does not fire the rise beat',()=>{
    const s=battle();
    const {rerender}=render(<BallparkBattle {...props(s)}/>);
    const other={...s,pitcher:{...s.pitcher,name:s.pitcher.name+'2'},relics:['scope']};
    rerender(<BallparkBattle {...props(other)}/>);
    expect(document.querySelector('[data-testid="bp-read-up"]')).toBeNull();
  });
});
