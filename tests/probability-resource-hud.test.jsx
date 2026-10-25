// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import {courseHeat} from '../src/duel/BattleArt.jsx';
import * as E from '../src/duel/engine.js';

afterEach(()=>{cleanup();localStorage.clear();});
function state(level=0){
  let s=E.createV10Duel(1);
  s.deck=Array.from({length:9},(_,i)=>({id:'r'+i,kind:i<level*2?'scout':'place'}));
  s.nextId=9;return E.enterV10Node(s,'a1-entry');
}
function props(s,more={}){return {s,hand:s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id),preview:E.previewCard(s,id)})),selected:null,swingStack:[],choice:null,pitcher:s.pitcher,label:'1막',onAim:vi.fn(),onSelect:vi.fn(),onStack:vi.fn(),...more};}
const colors=()=>[...document.querySelectorAll('[data-zone]')].map(e=>({face:e.getAttribute('aria-description'),tone:e.getAttribute('data-prob-tone'),paint:e.style.getPropertyValue('--heat')}));

it('distinguishes a possible low interval, rounded zero, closed and undisclosed courses',()=>{
  expect(courseHeat('0~5%')).not.toBe(courseHeat('0%'));
  expect(courseHeat('0%')).not.toBe(courseHeat('안 던짐'));
  expect(courseHeat('단서 밖')).not.toBe(courseHeat('안 던짐'));
  expect(courseHeat('안 씀')).toBe(courseHeat('안 던짐'));
  expect(courseHeat('확정')).not.toBe(courseHeat('100%'));
});
it('quantizes only public words and integer percentages, rejecting finer hidden values',()=>{
  expect(courseHeat('8%')).toBe(courseHeat('9%'));
  expect(courseHeat('드묾')).not.toBe(courseHeat('자주'));
  for(const hidden of ['12.34%','0.004','-1%','101%','5~120%','toString',null])expect(courseHeat(hidden)).toBe(courseHeat('단서 밖'));
});
it('uses identical paint for identical public faces despite finer probability changes and a different hidden ball',()=>{
  const s=state();const view=render(<BallparkBattle {...props(s)}/>);const before=colors();
  expect(before.some(c=>c.tone&&c.tone!=='closed')).toBe(true);
  const altered=structuredClone(s),live=s.battle.intent.repertoire;
  altered.battle.intent.probabilities[live[0]]+=.0001;altered.battle.intent.probabilities[live[1]]-=.0001;
  altered.battle.pending={...altered.battle.pending,zone:9,roll:.999};
  view.rerender(<BallparkBattle {...props(altered)}/>);
  expect(colors().map(x=>x.face)).toEqual(before.map(x=>x.face));expect(colors()).toEqual(before);
});
it('keeps probability color present after range and exact reading are earned',()=>{
  for(const level of [1,2]){
    const s=state(level);render(<BallparkBattle {...props(s)}/>);
    const cells=colors().filter(c=>c.face?.includes('%'));
    expect(cells.length).toBeGreaterThan(0);expect(cells.every(c=>c.tone&&c.tone!=='unknown')).toBe(true);
    expect(cells.some(c=>level===1?c.face.includes('~'):/^\d+%$/.test(c.face))).toBe(true);cleanup();
  }
});
it('keeps ledger accuracy at the ball band without promoting the nine course colors',()=>{
  const s=state();s.relics=['ledger'];render(<BallparkBattle {...props(s)}/>);
  expect(screen.getByTestId('bp-band').textContent).toMatch(/\d+%/);
  expect(colors().some(c=>c.face?.includes('%'))).toBe(false);
  expect(colors().some(c=>c.tone==='1'||c.tone==='3'||c.tone==='5')).toBe(true);
});
it('shows clue certainty separately from undisclosed courses',()=>{
  const s=state();s.battle.scouted=true;s.battle.scoutPlus=true;
  const zone=s.battle.pending.zone=s.battle.intent.repertoire[0];
  render(<BallparkBattle {...props(s)}/>);const cells=colors();
  expect(cells[zone].face).toBe('확정');expect(cells[zone].tone).toBe('certain');
  for(const c of cells.filter(c=>c.face==='단서 밖'))expect(c.tone).toBe('unknown');
});
it('removes new probability paint during flight and reveals remaining outs only on landing',()=>{
  const initial=state();initial.battle.outs=1;initial.battle.strikes=2;
  initial.battle.pending={zone:4,roll:.99,powerRoll:.5};
  const result=E.playV10Action(initial,{type:'take'});expect(result.battle.outs).toBe(2);
  // A post-pitch reading bonus must never be exposed through a new color.
  result.battle.shaken=1;
  const view=render(<BallparkBattle {...props(result,{fxStage:'windup',shot:{kind:'called',grade:'miss',title:'삼진'}})}/>);
  expect(colors().every(c=>!c.tone&&Number(c.paint)===0)).toBe(true);
  expect(screen.getByTestId('bp-outs-left').getAttribute('aria-label')).toBe('남은 아웃 2/3');
  view.rerender(<BallparkBattle {...props(result,{fxStage:'impact',shot:{kind:'called',grade:'miss',title:'삼진'}})}/>);
  expect(screen.getByTestId('bp-outs-left').getAttribute('aria-label')).toBe('남은 아웃 1/3');
});
it('shows all three remaining-out states and zero without changing the consumed count',()=>{
  const s=state();const view=render(<BallparkBattle {...props(s)}/>);
  for(const outs of [0,1,2,3]){
    const next=structuredClone(s);next.battle.outs=outs;
    view.rerender(<BallparkBattle {...props(next)}/>);
    const meter=screen.getByTestId('bp-outs-left');expect(meter.getAttribute('data-outs-left')).toBe(String(3-outs));
    expect(meter.getAttribute('aria-label')).toBe(`남은 아웃 ${3-outs}/3`);
    expect(document.querySelector('.bp-bso-strip').getAttribute('aria-label')).toContain(`아웃 ${outs}`);
  }
});
it('keeps real energy zero and bonus capacity, with the same single execution control',()=>{
  const s=state();s.battle.energy=0;s.battle.energyCap=3;
  const view=render(<BallparkBattle {...props(s)}/>);
  expect(screen.getByTestId('bp-energy').getAttribute('aria-label')).toBe('에너지 0/3');
  expect(document.querySelectorAll('.bp-energy-leds i')).toHaveLength(3);
  expect(document.querySelectorAll('.bp-energy-leds i.on')).toHaveLength(0);
  expect(document.querySelectorAll('.bp-verbs button')).toHaveLength(1);
  expect(screen.queryByRole('dialog')).toBeNull();
  const legacy=structuredClone(s);legacy.battle.energy=4;legacy.battle.energyCap=4;
  view.rerender(<BallparkBattle {...props(legacy)}/>);
  expect(screen.getByTestId('bp-energy').getAttribute('aria-label')).toBe('에너지 4/4');
  expect(document.querySelectorAll('.bp-energy-leds i.on')).toHaveLength(4);
});
it('uses the same remaining-out and color gates in the defense battle',()=>{
  const s=E.createDefenseLabState({seed:914,pack:'hold',scenario:'crisis'});
  render(<BallparkBattle {...props(s)}/>);
  expect(screen.getByTestId('bp-outs-left').getAttribute('aria-label')).toBe('남은 아웃 1/3');
  expect(colors().some(c=>c.tone)).toBe(true);
});
