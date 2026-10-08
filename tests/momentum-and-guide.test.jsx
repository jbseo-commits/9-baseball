// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,playV10Action,V10_MOMENTUM,v10Momentum,v10MomentumRate,v10MomentumAfter,
  V10_SWING_DAMAGE_RATES} from '../src/duel/engine.js';
import {applyPitcherOutcome,createPitcherHp} from '../src/duel/pitcher-hp.js';
import WelcomeGuide,{WELCOME_CHAPTERS,WELCOME_SEEN_KEY} from '../src/duel/WelcomeGuide.jsx';
import {COACH_KEY,COACH_STEPS} from '../src/duel/BallparkCoach.jsx';

/* 2026-09-28: the damage rate could only fall (stacking); 기세 lifts it. And the rules finally have a home:
   a 게임 방법 guide before the first run and coach marks on the first battle. */
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});

describe('기세 (momentum) — the way up for the damage rate',()=>{
  it('builds on hits and walks, more on extra-base hits, caps at max, and a strikeout puts it out',()=>{
    expect(v10MomentumAfter(0,{kind:'hit',label:'중전 안타',bases:1})).toBe(V10_MOMENTUM.hit);
    expect(v10MomentumAfter(1,{kind:'hit',label:'2루타',bases:2})).toBe(1+V10_MOMENTUM.xbh);
    expect(v10MomentumAfter(2,{kind:'ball',label:'볼넷'})).toBe(2+V10_MOMENTUM.walk);
    expect(v10MomentumAfter(V10_MOMENTUM.max,{kind:'hit',label:'홈런',bases:4})).toBe(V10_MOMENTUM.max);
    expect(v10MomentumAfter(4,{kind:'whiff',label:'헛스윙 삼진'})).toBe(0);
    expect(v10MomentumAfter(3,{kind:'called',label:'루킹 삼진'})).toBe(0);
    expect(v10MomentumAfter(3,{kind:'foul',label:'파울'})).toBe(3);
    expect(v10MomentumAfter(3,{kind:'ball',label:'볼'})).toBe(3);
  });
  it('each step adds +10% to HP damage, up to ×1.5 — above the ×1 cap the pitcher HP math used to force',()=>{
    expect(v10MomentumRate(0)).toBe(1);
    expect(v10MomentumRate(3)).toBeCloseTo(1.3);
    expect(v10MomentumRate(99)).toBeCloseTo(1+V10_MOMENTUM.step*V10_MOMENTUM.max);
    const p=createPitcherHp({name:'t',maxHp:60,seed:1});
    const single={kind:'hit',bases:1,label:'중전 안타'};
    expect(applyPitcherOutcome(p,single,{damageMultiplier:1}).result.damage).toBe(12);
    expect(applyPitcherOutcome(p,single,{damageMultiplier:1.5}).result.damage).toBe(18);
    expect(applyPitcherOutcome(p,single,{damageMultiplier:V10_SWING_DAMAGE_RATES[2]*1.3}).result.damage).toBe(Math.round(12*V10_SWING_DAMAGE_RATES[2]*1.3));
  });
  it('the engine applies the momentum built before the pitch, then updates it, and records both',()=>{
    let s=enterV10Node(createV10Duel(21),'a1-entry');s.battle.momentum=2;
    const next=playV10Action(s,{type:'card',id:'basic'});   // 맨손 스윙: always a pitch
    const c=next.v10.lastCombat;
    expect(c.momentumBefore).toBe(2);
    expect(c.momentumRate).toBeCloseTo(1.2);
    expect(c.damageRate).toBeCloseTo(c.stackRate*1.2);
    expect(next.battle.momentum).toBe(v10MomentumAfter(2,{kind:next.battle.revealed.kind,label:next.battle.revealed.label,bases:next.battle.revealed.kind==='hit'?(/홈런/.test(next.battle.revealed.label)?4:/2루타/.test(next.battle.revealed.label)?2:1):0}));
    expect(v10Momentum(next)).toBe(next.battle.momentum);
  });
  it('a fresh battle starts cold; the gauge and the swing hint show the live multiplier',()=>{
    let s=enterV10Node(createV10Duel(11),'a1-entry');
    expect(v10Momentum(s)).toBe(0);
    s.battle.momentum=3;saveV10Duel(localStorage,s);localStorage.setItem(COACH_KEY,'done');
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    const gauge=screen.getByTestId('bp-momentum');
    expect(gauge.dataset.momentum).toBe('3');
    expect(gauge.querySelectorAll('.bp-momentum-pips i.on')).toHaveLength(3);
    expect(gauge.textContent).toContain('×1.3');
    fireEvent.click(document.querySelector('.bp-hand .bp-card:not(.basic)'));
    expect(screen.getByTestId('bp-swing').textContent).toContain('피해 ×1.3');
  });
});

describe('게임 방법 guide',()=>{
  it('covers the rules a new player trips on, with the engine numbers',()=>{
    expect(WELCOME_CHAPTERS.map(c=>c.key)).toEqual(['goal','flow','zone','cover','stack','momentum','count','road','words']);
    render(<WelcomeGuide/>);
    expect(screen.getByRole('dialog',{name:'게임 방법'}).textContent).toMatch(/3아웃이 되기 전에 투수 HP를 0/);
    for(let k=0;k<4;k++)fireEvent.click(screen.getByRole('button',{name:'다음'}));
    expect(document.querySelector('.wg-page').textContent).toContain(V10_SWING_DAMAGE_RATES.slice(0,3).map((r,i)=>(i+1)+'장 '+Math.round(r*100)+'%').join(' · '));
    expect(document.querySelector('.wg-page').textContent).toMatch(/합산 에너지 비용이 남은 에너지보다 크면 실행할 수 없습니다/);
    fireEvent.click(screen.getByRole('button',{name:'다음'}));
    expect(document.querySelector('.wg-page').textContent).toMatch(/삼진을 당하면 기세가 꺼집니다/);
  });
  it('opens by itself before the first main run, once, and from 설정 any time',()=>{
    render(<Duel/>);
    fireEvent.click(screen.getByRole('button',{name:'새로운 게임'}));
    expect(screen.getByRole('dialog',{name:'게임 방법'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));
    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('seen');
    expect(screen.queryByRole('dialog',{name:'게임 방법'})).toBeNull();
  });
  it('settings offers 게임 방법',()=>{
    render(<Duel/>);
    fireEvent.click(screen.getByRole('button',{name:'설정'}));
    fireEvent.click(screen.getByRole('button',{name:'게임 방법'}));
    expect(screen.getByRole('dialog',{name:'게임 방법'})).toBeTruthy();
  });
});

describe('first-battle coach marks',()=>{
  it('walk the real battle pieces once and remember it',()=>{
    let s=enterV10Node(createV10Duel(11),'a1-entry');saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    const layer=screen.getByRole('dialog',{name:'전투 가이드'});
    for(const step of COACH_STEPS)expect(document.querySelector('.bp-battle '+step.sel),step.sel).toBeTruthy();
    for(let k=0;k<COACH_STEPS.length-1;k++)fireEvent.click(screen.getByRole('button',{name:'다음 설명'}));
    fireEvent.click(screen.getByRole('button',{name:'첫 공 승부!'}));
    expect(localStorage.getItem(COACH_KEY)).toBe('done');
    expect(layer.isConnected).toBe(false);
  });
  it('the dim layer never blocks the game under it',()=>{
    const css=fs.readFileSync('src/duel/ballpark-coach.css','utf8');
    expect(css).toMatch(/\.bp-coach-layer\{position:fixed;inset:0;z-index:60;pointer-events:none\}/);
  });
});
