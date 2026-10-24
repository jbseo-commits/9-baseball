// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel} from '../src/duel/engine.js';
import {previewSwing,formatHitChance} from '../src/duel/swing-preview.js';
import {riskColor} from '../src/duel/SwingForecast.jsx';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

function begin({bases=[null,null,null],shaken=0,kinds=['pinpoint','strike','focusBreath','rally','slug']}={}){
  let s=createV10Duel(1);
  s.build='away';s.deck=[...kinds,'place','place','place','place','place','place','place'].map((kind,i)=>({id:'c'+i,kind}));
  s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  const ids=['c0','c1','c2','c3','c4'],pool=[...s.battle.hand,...s.battle.draw,...s.battle.discard].filter(id=>!ids.includes(id));
  s.battle.hand=ids;s.battle.draw=pool;s.battle.discard=[];s.battle.energy=4;s.battle.energyCap=4;
  s.battle.bases=bases;s.battle.shaken=shaken;
  saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  return s;
}
const card=kind=>document.querySelector(`.bp-hand .bp-card[data-card-kind="${kind}"]`);
const cell=z=>document.querySelector(`.bp-cell[data-zone="${z}"]`);

describe('P1 swing forecast UI',()=>{
  it('shows only hit chance and damage once a swing is planned, from the same numbers as the engine',()=>{
    const s=begin();
    expect(screen.queryByTestId('bp-forecast')).toBeNull();
    fireEvent.click(card('pinpoint'));
    const chip=screen.getByTestId('bp-forecast');
    const pv=previewSwing(s,{id:'c0'});
    expect(screen.getByTestId('bp-forecast-hit').textContent).toContain(formatHitChance(pv.hitBounds));
    expect(screen.getByTestId('bp-forecast-dmg').textContent).toMatch(/데미지 (\d+~\d+|\d+|-)/);
    expect(screen.queryByTestId('bp-forecast-runners')).toBeNull();
    expect(screen.queryByTestId('bp-forecast-shaken')).toBeNull();
    expect(chip.style.position).toBe('absolute'); // overlays the board: no new layout height on a 380px phone
  });

  it('a hovered zone updates the forecast live without changing the committed aim',()=>{
    begin();
    fireEvent.click(card('pinpoint'));
    const aimed=[...document.querySelectorAll('.bp-cell')].findIndex(c=>c.getAttribute('aria-pressed')==='true');
    const before=screen.getByTestId('bp-forecast-hit').textContent;
    const target=[0,1,2,3,4,5,6,7,8].find(z=>z!==aimed&&!cell(z).classList.contains('dead'))??(aimed+1)%9;
    fireEvent.pointerEnter(cell(target),{pointerType:'mouse'});
    const tinted=document.querySelectorAll('.bp-risk-tint');
    expect(tinted.length).toBe(1);
    expect(tinted[0].closest('[data-zone]').dataset.zone).toBe(String(target));
    expect(cell(aimed).getAttribute('aria-pressed')).toBe('true');
    fireEvent.pointerLeave(document.querySelector('.bp-zone'),{pointerType:'mouse'});
    expect(screen.getByTestId('bp-forecast-hit').textContent).toBe(before);
  });

  it('narrow ranges glow red/orange, wide ranges blue (inline colour)',()=>{
    expect(riskColor(1)).toBe('#ff4d3d');expect(riskColor(2)).toBe('#ff8a2b');
    expect(riskColor(5)).toBe('#4fc3f7');expect(riskColor(9)).toBe('#3d7bff');
    begin();
    fireEvent.click(card('strike'));
    const tint=document.querySelector('.bp-risk-tint');
    expect(tint).toBeTruthy();
    expect(tint.getAttribute('style')).toMatch(/box-shadow/);
  });

  it('runner and shaken badges appear only when they change the damage picture',()=>{
    begin({bases:['p2','p3',null],shaken:1});
    fireEvent.click(card('pinpoint'));
    expect(screen.getByTestId('bp-forecast-runners').textContent).toBe('×1.2 (주자 2명)');
    expect(screen.getByTestId('bp-forecast-shaken').textContent).toContain('투수 흔들림 1');
  });

  it('draws the expected-damage band on the pitcher HP bar while deciding',()=>{
    begin();
    fireEvent.click(card('pinpoint'));
    const band=screen.getByTestId('bp-hp-forecast');
    expect(band.closest('.bp-hp-gauge-container')).toBeTruthy();
    expect(Number(band.dataset.hpFrom)).toBeLessThanOrEqual(Number(band.dataset.hpTo));
  });

  it('a selected preparation previews before → after for the last planned swing',()=>{
    begin();
    fireEvent.click(card('pinpoint'));
    fireEvent.click(card('focusBreath'));
    const dmg=screen.getByTestId('bp-forecast-dmg');
    expect(dmg.querySelector('s')).toBeTruthy();
    expect(dmg.textContent).toContain('→');
  });

  it('a touch slide across the board previews each cell and commits the last one on release',()=>{
    begin();
    fireEvent.click(card('pinpoint'));
    const live=[0,1,2,3,4,5,6,7,8].filter(z=>!cell(z).classList.contains('dead'));
    const [from,to]=[live[0],live.at(-1)];
    const zone=document.querySelector('.bp-zone');
    const orig=document.elementFromPoint;
    try{
      document.elementFromPoint=(x)=>cell(x===1?from:to);
      fireEvent.pointerDown(cell(from),{pointerType:'touch',pointerId:7,clientX:1,clientY:1});
      fireEvent.pointerMove(zone,{pointerType:'touch',pointerId:7,clientX:2,clientY:2});
      expect(cell(to).querySelector('.bp-risk-tint')).toBeTruthy();
      fireEvent.pointerUp(zone,{pointerType:'touch',pointerId:7,clientX:2,clientY:2});
      fireEvent.click(cell(from)); // the browser's trailing click on the captured cell is swallowed
    }finally{document.elementFromPoint=orig;}
    expect(cell(to).getAttribute('aria-pressed')).toBe('true');
  });

  it('hidden overlays never take touches: every forecast layer has pointer-events none',()=>{
    const src=fs.readFileSync(path.resolve('src/duel/SwingForecast.jsx'),'utf8');
    expect(src.match(/pointerEvents:'none'/g).length).toBeGreaterThanOrEqual(3);
    expect(fs.readFileSync(path.resolve('src/duel/swing-forecast.css'),'utf8')).toMatch(/pointer-events:none/);
  });
});
