// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {act} from 'react';
import fs from 'node:fs';
import path from 'node:path';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel} from '../src/duel/engine.js';
import {BUILDS,CARDS} from '../src/duel/cards.js';
import {nextHint} from '../src/duel/BallparkBattle.jsx';

// Portrait battle clarity pass (phone playtest 2026-09-29): nothing covers what the player reads.
beforeEach(()=>{localStorage.clear();localStorage.setItem('9zone-bp-coach-v1','done');});
afterEach(()=>{cleanup();vi.useRealTimers();});

function begin(){
  let s=createV10Duel(1);
  s.build='away';s.deck=BUILDS.away.cards.filter(k=>CARDS[k].type!=='skill').map((kind,i)=>({id:'c'+i,kind}));
  s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  return s;
}
const cells=()=>[...document.querySelectorAll('.bp-cell')];
const cards=()=>[...document.querySelectorAll('.bp-hand .bp-card:not(.basic)')];

describe('battle clarity',()=>{
  it('the next button says the pitch is still being judged while the scene plays',()=>{
    expect(nextHint('between',true)).toBe('판정 중…');
    expect(nextHint('pitch',true)).toBe('판정 중…');
    expect(nextHint('between')).toContain('다음 타자');
  });

  it('while the pitch resolves the hand shows no engine "finish the result first" text on the cards',()=>{
    vi.useFakeTimers();
    begin();
    fireEvent.click(cards()[0]);fireEvent.click(cells()[4]);
    fireEvent.click(screen.getByTestId('bp-swing'));
    act(()=>{vi.advanceTimersByTime(400)});
    const hand=document.querySelector('.bp-hand');
    if(hand){
      expect(hand.textContent).not.toMatch(/먼저 투구 결과를 확인/);
      expect(document.querySelectorAll('.bp-hand .bp-card.off')).toHaveLength(0);
    }
  });

  it('a live cell with a 0% share is marked so it recedes',()=>{
    begin();
    for(const pct of document.querySelectorAll('.bp-cell .bp-pct')){
      expect(pct.classList.contains('zero')).toBe(pct.textContent==='0%');
    }
  });

  it('the pitcher speaking wears her face; the coach keeps the badge otherwise',()=>{
    begin();
    const col=document.querySelector('.bp-coach-avatar-col');
    const speaking=!!document.querySelector('.bp-voice-strip');
    expect(col.classList.contains('speaker-pitcher')).toBe(speaking);
    expect(col.querySelector('.bp-coach-pill').textContent).toBe(speaking?'투수':'COACH');
    if(speaking)expect(col.querySelector('.bp-coach-badge').style.backgroundImage).toMatch(/url\(/);
  });

  it('a second card lights its own cell: the board sets .assist and the portrait layer styles .assist (it styled .support)',()=>{
    begin();
    fireEvent.click(cards()[0]);fireEvent.click(cells()[4]);
    fireEvent.click(cards()[1]);fireEvent.click(cells()[2]);
    expect(cells()[4].classList.contains('cover')).toBe(true);
    expect(cells()[2].classList.contains('assist')).toBe(true);
    expect(cells()[2].querySelector('.bp-token')?.dataset.boardOrder).toBe('2');
    const css=fs.readFileSync(path.resolve('src/duel/battle-clarity.css'),'utf8');
    expect(css).toMatch(/\.bp-cell\.assist\{[^}]*background:rgba\(100,190,255/);
    expect(css).toMatch(/\.bp-token:not\(\[data-board-order="1"\]\)/);
  });

  it('the clarity layer is portrait-only, scoped to the ballpark battle, and loads before the title layer',()=>{
    const css=fs.readFileSync(path.resolve('src/duel/battle-clarity.css'),'utf8');
    expect(css).toMatch(/@media \(orientation:portrait\)/);
    const rules=css.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+(?=\{)/g).map(x=>x.trim()).filter(x=>x&&!x.startsWith('@'));
    for(const sel of rules)for(const one of sel.split(','))expect(one.trim()).toMatch(/^\.v14-battle-portrait /);
    const main=fs.readFileSync(path.resolve('src/main.jsx'),'utf8');
    expect(main.indexOf('battle-clarity.css')).toBeGreaterThan(main.indexOf('v14-portrait-master.css'));
    expect(main.indexOf('battle-clarity.css')).toBeLessThan(main.indexOf('title-pixel.css'));
  });
});
