// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

function begin(shotMode){
  for(let seed=1;seed<300;seed++){
    let s=E.createV10Duel(seed);
    s.deck=['pinpoint','pinpoint','pinpoint','place','place','place','place','place','place','place','place','place'].map((kind,i)=>({id:'c'+i,kind}));
    s.nextId=s.deck.length;s=E.enterV10Node(s,'a1-entry');
    if(s.battle.pending.zone===9)continue;
    const pool=[...s.battle.hand,...s.battle.draw,...s.battle.discard].filter(id=>!['c0','c1','c2'].includes(id));
    s.battle.hand=['c0','c1','c2',...pool.slice(0,2)];s.battle.draw=pool.slice(2);s.battle.discard=[];
    s.v10={...s.v10,shotMode};
    if(shotMode)localStorage.setItem('ninezone.shotMode.v1','1');
    E.saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    return s;
  }
}
const shootAway=s=>{
  const z=s.battle.intent.repertoire.find(x=>x!==s.battle.pending.zone&&!E.coverageAt(s,'c0',x).includes(s.battle.pending.zone));
  fireEvent.click(document.querySelector(`.bp-cell[data-zone="${z}"]`));
  fireEvent.click(document.querySelector('.bp-hand .bp-card[data-card-kind="pinpoint"]'));
  fireEvent.click(screen.getByTestId('bp-swing'));
  return z;
};

describe('사격 모드 화면',()=>{
  it('a missed shot punches the cell, keeps the same pitch and names the next shot rate',()=>{
    const s=begin(true);
    const z=shootAway(s);
    const saved=E.readV10Duel(localStorage);
    expect(saved.battle.strikes).toBe(1);expect(saved.battle.pending.zone).toBe(s.battle.pending.zone);
    expect(document.querySelector(`.bp-cell[data-zone="${z}"]`).classList.contains('shot-hole')).toBe(true);
    expect(screen.getByTestId('bp-shot-hole')).toBeTruthy();
    expect(screen.getByTestId('bp-shot-count').textContent).toContain('1발 빗나감');
    expect(screen.getByTestId('bp-shot-count').textContent).toContain('×1');
    expect(screen.queryByTestId('bp-next')).toBeNull(); // still deciding: no result screen
  });

  it('with the setting off the same press resolves the pitch as before',()=>{
    const s=begin(false);
    shootAway(s);
    expect(E.readV10Duel(localStorage).stats.pitches).toBe(s.stats.pitches+1);
    expect(screen.queryByTestId('bp-shot-hole')).toBeNull();
  });
});

describe('사격 연출 · pixelfx',()=>{
  it('vendors pixelfx with its MIT license and notice, and draws on a layer that never takes touches',async()=>{
    const fs=await import('node:fs');
    expect(fs.readFileSync('src/vendor/pixelfx/LICENSE','utf8')).toMatch(/MIT License/);
    expect(fs.readFileSync('src/vendor/pixelfx/NOTICE.md','utf8')).toMatch(/patch-gg\/pixelfx/);
    const {SHOT_PIXEL_LOOKS,playPixelShot}=await import('../src/duel/shot-pixelfx.js');
    for(const look of Object.values(SHOT_PIXEL_LOOKS)){expect(look.max).toBeLessThanOrEqual(.9);expect(Number.isInteger(look.scale)).toBe(true);}
    document.body.innerHTML='<div class="bp-zone"><button data-zone="4"></button></div>';
    const played=playPixelShot([4],null);
    const layer=document.getElementById('shot-pixelfx-layer');
    if(played)expect(layer.style.pointerEvents).toBe('none');
    else expect(layer).toBeNull(); // no 2D canvas here: nothing is drawn, nothing is left behind
  });

  it('the setting switches between the pixel effect and the old flash and is remembered',()=>{
    localStorage.setItem('ninezone.shotMode.v1','1');
    render(<Duel/>);
    fireEvent.click(screen.getAllByRole('button',{name:/설정/})[0]);
    const t=screen.getByTestId('shot-fx-toggle');
    expect(t.textContent).toContain('픽셀 이펙트');
    fireEvent.click(t);
    expect(screen.getByTestId('shot-fx-toggle').textContent).toContain('기존 섬광');
    expect(localStorage.getItem('ninezone.shotFx.v1')).toBe('css');
  });
});
