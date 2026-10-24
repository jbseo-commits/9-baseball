// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear();window.history.replaceState({},'','/');});
afterEach(cleanup);
function begin({strikes=0,energy=2}={}){
  let s=E.enterV10Node(E.createV10Duel(90211),'a1-entry');
  s.battle.strikes=strikes;s.battle.energy=energy;
  E.saveV10Duel(localStorage,s);render(<Duel/>);
  fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));return s;
}
it('has one auxiliary entry and two actions, keeping hand and nine zones',()=>{
  begin();
  expect(document.querySelector('.bp-battle').classList.contains('bp-compact')).toBe(true);
  expect(document.querySelectorAll('.bp-bar button')).toHaveLength(1);
  expect(document.querySelectorAll('.bp-verbs button')).toHaveLength(2);
  expect(document.querySelector('.bp-ptag button')).toBeNull();
  expect(document.querySelectorAll('.bp-cell')).toHaveLength(9);
  expect(document.querySelector('.bp-card.basic .bp-card-art').style.backgroundImage).toContain('url(');
});
it('consolidates piles, card, pitcher and help without opening a popup or altering a pitch',()=>{
  const s=begin(),before=JSON.stringify(E.readV10Duel(localStorage));
  fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
  expect(screen.getByTestId('bp-inspect')).toBeTruthy();expect(screen.queryByRole('dialog')).toBeNull();
  for(const name of ['카드','투수','읽기','이번 공','더미','메뉴'])expect(screen.getByRole('tab',{name,exact:true})).toBeTruthy();
  fireEvent.click(screen.getByRole('tab',{name:'더미',exact:true}));
  expect(screen.getByTestId('bp-inspect').textContent).toContain('순서 비공개');
  fireEvent.click(screen.getByRole('tab',{name:'메뉴',exact:true}));
  expect(screen.getByTestId('bp-inspect').textContent).toContain('카드');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(JSON.stringify(E.readV10Duel(localStorage))).toBe(before);
  expect(E.readV10Duel(localStorage).stats.pitches).toBe(s.stats.pitches);
});
it('keeps execution locked while inspecting and returns focus to its single opener',()=>{
  begin();const c=document.querySelector('.bp-card:not(.basic)');fireEvent.click(c);
  const opener=screen.getByRole('button',{name:'경기 정보 및 메뉴'});opener.focus();fireEvent.click(opener);
  expect(screen.getByTestId('bp-swing').disabled).toBe(true);
  fireEvent.click(screen.getByRole('tab',{name:'카드',exact:true}));
  expect(screen.getByTestId('bp-inspect').textContent).toContain(c.querySelector('strong').textContent);
  fireEvent.keyDown(window,{key:'Escape'});
  expect(screen.queryByTestId('bp-inspect')).toBeNull();expect(document.activeElement).toBe(opener);
  expect(c.classList.contains('main')).toBe(true);
});
it('keeps the free swing and the lethal two-strike take warning available',()=>{
  begin({strikes:2,energy:0});fireEvent.click(document.querySelector('.bp-card.basic'));
  expect(screen.getByTestId('bp-swing').disabled).toBe(false);
  expect(screen.getByTestId('bp-take').textContent).toMatch(/삼진/);
});
it('changes sound inline without altering game state or opening settings',()=>{
  begin();const before=JSON.stringify(E.readV10Duel(localStorage));
  fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
  fireEvent.click(screen.getByRole('tab',{name:'메뉴',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'소리 켜기',exact:true}));
  expect(screen.getByRole('button',{name:'소리 끄기',exact:true})).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();expect(JSON.stringify(E.readV10Duel(localStorage))).toBe(before);
});
it('reaches first practice through the inline menu and preserves the running save',async()=>{
  begin();const before=JSON.stringify(E.readV10Duel(localStorage));
  fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
  fireEvent.click(screen.getByRole('tab',{name:'메뉴',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'첫 타격 연습',exact:true}));
  await screen.findByRole('heading',{name:'밝은 코스를 눌러보세요',level:1});
  expect(screen.queryByRole('dialog')).toBeNull();expect(JSON.stringify(E.readV10Duel(localStorage))).toBe(before);
});
