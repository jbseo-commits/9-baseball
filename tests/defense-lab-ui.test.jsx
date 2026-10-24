// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createDefenseLabState,saveDefenseLabState,readDefenseLabState,DEFENSE_LAB_SAVE_KEY} from '../src/duel/engine.js';
import {SAVE_KEY} from '../src/duel/cards.js';
import {V10_SAVE_KEY} from '../src/duel/v10-storage.js';

beforeEach(()=>{localStorage.clear();window.history.replaceState({},'','/?experiment=defense&seed=914');});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState({},'','/');});
function isolatedStorage(){
  const spy={get:vi.spyOn(Object.getPrototypeOf(localStorage),'getItem'),
    set:vi.spyOn(Object.getPrototypeOf(localStorage),'setItem'),remove:vi.spyOn(Object.getPrototypeOf(localStorage),'removeItem')};
  return ()=>{
    for(const calls of Object.values(spy).map(v=>v.mock.calls)){
      expect(calls.some(([key])=>[V10_SAVE_KEY,SAVE_KEY].includes(key))).toBe(false);
    }
  };
}
function conditions(){
  fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
  fireEvent.click(screen.getByRole('tab',{name:'메뉴',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'실험 조건 변경'}));
}
it('starts, returns to conditions and resumes without accessing production run storage',()=>{
  const assertIsolated=isolatedStorage();render(<Duel/>);
  expect(screen.getByRole('main',{name:'3아웃 공방 실험'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/^버티기 메인 실제 파울/}));
  fireEvent.click(screen.getByRole('button',{name:'레드 러시와 승부 시작'}));
  expect(document.querySelector('.defense-lab-battle')).toBeTruthy();
  expect(document.querySelector('.bp-hand .bp-lab-card-note')).toBeTruthy();
  expect(readDefenseLabState(localStorage).defenseLab.pack).toBe('hold');
  conditions();
  expect(screen.getByRole('main',{name:'3아웃 공방 실험'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'진행 중인 실험 이어하기'}));
  expect(document.querySelector('.defense-lab-battle')).toBeTruthy();assertIsolated();
  cleanup();render(<Duel/>);expect(document.querySelector('.defense-lab-battle')).toBeTruthy();assertIsolated();
});
it('recovers a corrupt lab save through the lab lobby without production fallback',()=>{
  const s=createDefenseLabState({seed:914,pack:'power'});delete s.battle.hand;
  localStorage.setItem(DEFENSE_LAB_SAVE_KEY,JSON.stringify(s));
  const assertIsolated=isolatedStorage();render(<Duel/>);
  expect(screen.getByText(/실험 저장이 손상됐습니다/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'레드 러시와 승부 시작'}));
  expect(document.querySelector('.defense-lab-battle')).toBeTruthy();assertIsolated();
});
it('resumes a saved lab with both exhausted protection and the earned next-hit counter visible',()=>{
  const s=createDefenseLabState({seed:914,pack:'hold'});
  s.defenseLab.protectionUsed=true;s.defenseLab.counterReady=true;
  saveDefenseLabState(localStorage,s);render(<Duel/>);
  expect(screen.getByLabelText('현재 제약과 다음 예고').textContent).toContain('보호 소진');
  expect(screen.getByLabelText('현재 제약과 다음 예고').textContent).toContain('다음 안타 +8');
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('shows the experiment role on both a strong attack and its preparation card',()=>{
  saveDefenseLabState(localStorage,createDefenseLabState({seed:914,pack:'power'}));render(<Duel/>);
  expect(document.querySelector('.bp-hand [data-card-kind="slug"] .bp-lab-card-note')?.textContent).toBe('힘 투자 후 봉쇄');
  expect(document.querySelector('.bp-hand [data-card-kind="loadPower"] .bp-lab-card-note')?.textContent).toBe('힘 투자 · 봉쇄 준비');
});
it('explains the lab energy budget without substituting the main-run budget',()=>{
  saveDefenseLabState(localStorage,createDefenseLabState({seed:914,pack:'power'}));render(<Duel/>);
  expect(screen.getByTestId('bp-energy').getAttribute('aria-label')).toBe('에너지 3/3');
  fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
  fireEvent.click(screen.getByRole('tab',{name:'메뉴',exact:true}));
  const help=screen.getByTestId('bp-inspect').textContent;
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(help).toContain('기본은 다음 실제 공마다 3을 충전');
  expect(help).toContain('다음 실제 공에 +1(최대 4)');
  expect(help).not.toContain('기본은 다음 실제 공마다 2을 충전');
});
it('keeps the saved pack, scenario and seed when returning to conditions after reload',()=>{
  saveDefenseLabState(localStorage,createDefenseLabState({seed:13,pack:'hold',scenario:'crisis'}));render(<Duel/>);
  conditions();
  expect(screen.getByRole('button',{name:/^버티기 메인 실제 파울/}).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button',{name:'위기 연습 · 2아웃 2스트라이크'}).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('textbox',{name:'실험 시드'}).value).toBe('13');
});
