// @vitest-environment happy-dom
import React from 'react';
import {act} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel,V10_SAVE_KEY} from '../src/duel/engine.js';
import {PREVIEW_IMPACT_MS} from '../src/duel/ZoneFirstPreview.jsx';
const enter=async()=>{fireEvent.click(screen.getByRole('button',{name:'첫 타격 연습',exact:true}));await screen.findByRole('heading',{name:'밝은 코스를 눌러보세요',level:1});};
const swing=()=>{fireEvent.click(document.querySelectorAll('.zf-zone')[5]);fireEvent.click(screen.getByRole('button',{name:'타격!',exact:true}));};
const impact=()=>act(()=>vi.advanceTimersByTime(PREVIEW_IMPACT_MS));
const next=()=>fireEvent.click(document.querySelector('[data-zf-next]'));
afterEach(()=>{cleanup();localStorage.clear();vi.useRealTimers();});

it('completes practice into real starter selection, a saved run and its first battle',async()=>{
  render(<Duel/>);await enter();vi.useFakeTimers();
  swing();impact();next();swing();impact();next();
  fireEvent.click(document.querySelector('[data-kind="setup"]'));fireEvent.click(screen.getByRole('button',{name:'준비 사용',exact:true}));
  swing();impact();expect(localStorage.getItem(V10_SAVE_KEY)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/시작 덱 고르기/}));
  expect(screen.getByRole('dialog',{name:'시작 팩 선택'})).toBeTruthy();
  fireEvent.click(screen.getAllByTestId('start-pack')[0]);fireEvent.click(screen.getByTestId('start-pack-go'));
  expect(readV10Duel(localStorage).phase).toBe('map');expect(readV10Duel(localStorage).deck.length).toBe(9);
  const guide=screen.queryByRole('dialog',{name:'게임 방법'});
  if(guide)fireEvent.click([...guide.querySelectorAll('button')].find(b=>b.textContent==='건너뛰기'));
  fireEvent.click(screen.getByTestId('bp-map-go'));
  expect(screen.getByRole('list',{name:'이번 공 진행'})).toBeTruthy();
  expect(readV10Duel(localStorage).phase).toBe('battle');expect(document.querySelectorAll('.bp-cell')).toHaveLength(9);
  expect(document.querySelector('.zf-preview')).toBeNull();
});

it('leaves a saved run intact when exiting a flying practice and resumes it when skipping',async()=>{
  const saved=enterV10Node(createV10Duel(31),'a1-entry');saveV10Duel(localStorage,saved);
  const raw=localStorage.getItem(V10_SAVE_KEY);render(<Duel/>);
  fireEvent.click(screen.getByRole('button',{name:'설정',exact:true}));await enter();vi.useFakeTimers();
  swing();fireEvent.click(screen.getByRole('button',{name:'타이틀로 돌아가기'}));impact();
  expect(localStorage.getItem(V10_SAVE_KEY)).toBe(raw);expect(screen.getByRole('button',{name:'이어하기',exact:true})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'설정',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'첫 타격 연습',exact:true}));
  await act(async()=>{});fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));impact();
  expect(screen.getByTestId('bp-swing')).toBeTruthy();expect(readV10Duel(localStorage)).toEqual(saved);
  expect(screen.queryByRole('dialog',{name:'시작 팩 선택'})).toBeNull();
});

it('skips without an existing run into starter selection and allows cancellation back to title',async()=>{
  render(<Duel/>);await enter();fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));
  expect(screen.getByRole('dialog',{name:'시작 팩 선택'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'닫기',exact:true}));
  expect(screen.getByRole('button',{name:'첫 타격 연습',exact:true})).toBeTruthy();
  expect(localStorage.getItem(V10_SAVE_KEY)).toBeNull();
});

it('does not carry the disposable autobattle flag back into a saved main run',async()=>{
  const saved=enterV10Node(createV10Duel(31),'a1-entry');saveV10Duel(localStorage,saved);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'설정',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'전략 → 자동전투 체험'}));
  expect(screen.getByTestId('bp-auto-lesson')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'설정 및 도움말'}));await enter();
  fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));
  expect(screen.queryByTestId('bp-auto-lesson')).toBeNull();
  vi.useFakeTimers();fireEvent.click(screen.getByTestId('bp-take'));
  expect(readV10Duel(localStorage).stats.pitches).toBe(saved.stats.pitches+1);
});

it('isolates practice Escape from hidden main-run shortcuts and tutorial preferences',async()=>{
  const saved=enterV10Node(createV10Duel(31),'a1-entry');saveV10Duel(localStorage,saved);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'설정',exact:true}));await enter();
  const before=JSON.stringify({...localStorage});
  fireEvent.keyDown(window,{key:'Escape'});
  expect(JSON.stringify({...localStorage})).toBe(before);
  expect(document.querySelector('.zf-preview').dataset.lesson).toBe('0');
  fireEvent.click(screen.getByRole('button',{name:'타이틀로 돌아가기'}));
  expect(screen.getByRole('button',{name:'이어하기',exact:true})).toBeTruthy();
});
