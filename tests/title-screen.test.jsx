// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import TitleScreen,{TITLE_CAST} from '../src/duel/TitleScreen.jsx';
import {createV10Duel,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {pitcherFigures} from '../src/duel/pitcher-visuals.js';

/* game entry screen (docs/art/benchmark/target/title.png), 2026-09-28 */
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});
const item=k=>document.querySelector(`.ts-item[data-item="${k}"]`);

describe('title screen',()=>{
  it('is the target menu: 새로운 게임 · 이어하기 · 덱 관리 · 도감 · 설정, with the app header hidden',()=>{
    render(<Duel/>);
    expect([...document.querySelectorAll('.ts-item b')].map(b=>b.textContent)).toEqual(['새로운 게임','이어하기','덱 관리','도감','설정']);
    expect(document.querySelector('.duel-app').classList.contains('title-mode')).toBe(true);
    expect(fs.readFileSync('src/duel/title-screen.css','utf8')).toContain('.duel-app.title-mode>.duel-header{display:none}');
  });
  it('without a run: new game is lit, continue and deck say why they are closed',()=>{
    render(<Duel/>);
    expect(item('new').classList.contains('lead')).toBe(true);
    expect(item('continue').disabled).toBe(true);
    expect(screen.getByText('진행 중인 런 없음')).toBeTruthy();
    expect(item('deck').disabled).toBe(true);
  });
  it('with a run: continue is lit and shows the act and deck; new game asks before replacing it',()=>{
    const s=createV10Duel(3);saveV10Duel(localStorage,s);
    render(<Duel/>);
    expect(item('continue').classList.contains('lead')).toBe(true);
    expect(item('continue').textContent).toContain(`1막 · 덱 ${s.deck.length}장`);
    fireEvent.click(item('new'));
    expect(screen.getByRole('dialog',{name:'새로운 게임'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'취소'}));
    expect(readV10Duel(localStorage).initialSeed).toBe(s.initialSeed);
  });
  it('continue reads the live save, not the snapshot taken when the app opened',()=>{
    saveV10Duel(localStorage,createV10Duel(3));
    render(<Duel/>);
    const newer=createV10Duel(9);saveV10Duel(localStorage,newer);   // progress written after mount
    fireEvent.click(screen.getByRole('button',{name:'설정'}));fireEvent.click(document.querySelector('.modal-close'));   // any re-render of the title
    fireEvent.click(item('continue'));
    expect(readV10Duel(localStorage).initialSeed).toBe(newer.initialSeed);
  });
  it('settings holds sound, help and the tutorials that left the title',()=>{
    render(<Duel/>);
    fireEvent.click(screen.getByRole('button',{name:'설정'}));
    const sheet=screen.getByRole('dialog',{name:'설정'});
    for(const name of ['BGM 음악 주크박스','기존 튜토리얼','전략 → 자동전투 체험'])expect(sheet.querySelector(`[aria-label="${name}"]`)||[...sheet.querySelectorAll('button')].find(b=>b.textContent===name)).toBeTruthy();
    expect(sheet.querySelector('input[aria-label="비교용 시드"]')).toBeTruthy();
  });
  it('arrow keys walk the enabled rows',()=>{
    render(<TitleScreen run={null}/>);
    item('new').focus();
    fireEvent.keyDown(document.querySelector('.ts-menu'),{key:'ArrowDown'});
    expect(document.activeElement).toBe(item('dex'));   // continue and deck are closed without a run
    fireEvent.keyDown(document.querySelector('.ts-menu'),{key:'ArrowUp'});
    expect(document.activeElement).toBe(item('new'));
  });
  it('the key visual is the female pitcher cast, Red Rush in front',()=>{
    render(<TitleScreen run={null}/>);
    expect(TITLE_CAST.at(-1)).toEqual({id:'regular-01-red-rush',slot:'hero'});
    for(const c of TITLE_CAST)expect(pitcherFigures[c.id],c.id).toBeTruthy();
    expect(document.querySelectorAll('.ts-cast .ts-fig')).toHaveLength(TITLE_CAST.length);
    expect(document.querySelector('.ts-fig.hero').getAttribute('src')).toBe(pitcherFigures['regular-01-red-rush']);
  });
});
