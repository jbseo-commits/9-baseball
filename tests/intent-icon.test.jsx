// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';
import {classifyIntent,intentMatches,pitcherIntentIcon,INTENT_OPACITY,INTENTS} from '../src/duel/intent-icon.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

const P=(cells,ball=0)=>{const p=[...cells,ball];const t=p.reduce((a,x)=>a+x,0);return p.map(x=>x/t);};

describe('P2 pitcher intent icon',()=>{
  it('classifies the five intents from the distribution',()=>{
    expect(classifyIntent(P([1,1,1,1,1,1,1,1,1],5))).toBe('lure');
    expect(classifyIntent(P([5,0,0,5,1,0,5,0,1],1))).toBe('inside');
    expect(classifyIntent(P([0,0,5,1,0,5,0,1,5],1))).toBe('outside');
    expect(classifyIntent(P([0,0,0,0,8,1,0,1,1],1))).toBe('strike');
    expect(classifyIntent(P([1,1,1,1,1,1,1,1,1],1.5))).toBe('unclear');
    for(const k of Object.keys(INTENTS))expect(INTENTS[k].icon).toBeTruthy();
  });

  it('measures how often the icon matches the real pitch at each read (eye) level',()=>{
    const rows=[];
    for(const [name,relics] of [['읽기 낮음',[]],['읽기 중간',['scope']],['읽기 높음',['scope','hawkEye']]]){
      const tally={};let judged=0,right=0,level=null;
      for(let seed=1;seed<=24;seed++)for(const style of [undefined,'sinker','deep','closer'])for(const act of [1,2]){
        let s=E.enterV10Node(E.createV10Duel(seed),'a1-entry');
        s.relics=relics;s.v10.opponent={...s.v10.opponent,act,...(style?{style}:{})};
        if(style==='closer')s.battle.history=[{zone:4,label:'볼',aimZone:seed%3,turn:1,balls:0,strikes:0}];
        for(const [balls,strikes] of [[0,0],[1,0],[0,2],[3,1],[2,2]]){
          s.battle.balls=balls;s.battle.strikes=strikes;
          const base=E.redealPitch(s,seed*977+balls*31+strikes);
          const icon=pitcherIntentIcon(base);level=icon.level;
          for(let i=0;i<12;i++){
            const zone=E.redealPitch(base,(seed*7919+i*104729+balls*13+strikes*17)>>>0).battle.pending.zone;
            const m=intentMatches(icon.kind,zone);
            const t=tally[icon.kind]||(tally[icon.kind]={n:0,ok:0});t.n++;
            if(m!==null){judged++;if(m){right++;t.ok++;}}
          }
        }
      }
      rows.push(`${name}(lv${level}, 선명도 ${INTENT_OPACITY[level]}): 적중 ${(right/judged*100).toFixed(1)}% (${right}/${judged}) · `+
        Object.entries(tally).map(([k,v])=>`${INTENTS[k].icon}${v.n}${k==='unclear'?'':' '+(v.ok/v.n*100).toFixed(0)+'%'}`).join(' '));
      expect(right/judged).toBeGreaterThan(.5);
    }
    console.log('[P2 intent accuracy]\n'+rows.join('\n'));
  },60000);

  it('shows one icon above the pitcher while deciding, faded by read level, and keeps the probability board',()=>{
    let s=E.enterV10Node(E.createV10Duel(1),'a1-entry');
    E.saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    const icon=screen.getByTestId('bp-intent-icon');
    expect(icon.closest('.bp-pitcher')).toBeTruthy();
    const level=Number(icon.dataset.read);
    expect(Number(icon.style.opacity)).toBe(INTENT_OPACITY[level]);
    expect(icon.style.pointerEvents).toBe('none');
    expect(icon.textContent).toContain(INTENTS[icon.dataset.intent].label);
    expect(document.querySelectorAll('.bp-cell .bp-pct').length).toBeGreaterThan(0);
  });
});
