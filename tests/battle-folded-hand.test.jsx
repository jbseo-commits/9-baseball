// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';

beforeEach(()=>window.history.replaceState({},'','/?battleUi=vnext'));
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();window.history.replaceState({},'','/');});
const card=kind=>document.querySelector(`.bv-card[data-card-kind=${kind}]`);
const zone=z=>document.querySelector(`.bv-cell[data-zone="${z}"]`);
const unfold=()=>fireEvent.click(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
const root=()=>document.querySelector('.battle-vnext');

it('touch release opens immediately without a browser click; a late compatibility click never toggles twice',()=>{
  render(<IntegrationPreview fixture="watch-read0"/>);const handle=screen.getByRole('button',{name:'손패 펼치기',exact:true});
  fireEvent.pointerDown(handle,{pointerId:9,pointerType:'touch',clientX:800,clientY:200});
  fireEvent.pointerUp(handle,{pointerId:9,pointerType:'touch',clientX:800,clientY:200});
  expect(root().dataset.handOpen).toBe('true');fireEvent.click(handle);expect(root().dataset.handOpen).toBe('true');
  fireEvent.keyDown(handle,{key:'Enter'});fireEvent.click(handle);expect(root().dataset.handOpen).toBe('false');
});

it('starts folded with inert hidden cards, while course and execution stay accessible; Escape returns focus',()=>{
  render(<IntegrationPreview fixture="watch-read0"/>);
  const panel=document.getElementById('bv-folding-hand');
  expect(panel.hasAttribute('inert')).toBe(true);expect(panel.getAttribute('aria-hidden')).toBe('true');
  expect(screen.queryByRole('button',{name:/릴리스 간파 ·/})).toBeNull();
  expect(screen.getByTestId('bp-swing').disabled).toBe(false);expect(zone(4).disabled).toBe(false);
  const before=document.querySelector('.bv-stage');unfold();expect(document.querySelector('.bv-stage')).toBe(before);
  expect(panel.hasAttribute('inert')).toBe(false);
  card('strike').focus();fireEvent.keyDown(card('strike'),{key:'Escape'});
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
  expect(panel.hasAttribute('inert')).toBe(true);
});

it('tap card then course inserts exactly the chosen engine coverage and folds without consuming the card or pitching',()=>{
  vi.useFakeTimers();render(<IntegrationPreview fixture="watch-read0"/>);unfold();fireEvent.click(card('strike'));fireEvent.click(zone(2));
  expect(root().dataset.handOpen).toBe('false');
  expect([...document.querySelectorAll('[data-insert-zone]')].map(e=>Number(e.dataset.insertZone))).toEqual([2,5,8]);
  expect(screen.getByTestId('bv-coverage-insert').parentElement).toBe(root());
  expect(card('strike').classList.contains('is-main')).toBe(true);
  expect(screen.getByTestId('bp-swing').disabled).toBe(false);expect(screen.queryByTestId('bv-pitch-mark')).toBeNull();
  expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
  fireEvent.pointerEnter(zone(1),{pointerType:'mouse'});
  expect(document.querySelectorAll('[data-insert-zone]')).toHaveLength(3);
});

it('rapid replacement and clear cancel the old insertion; selecting the old card again cannot replay its old drop',()=>{
  vi.useFakeTimers();render(<IntegrationPreview fixture="watch-read0"/>);unfold();fireEvent.click(card('strike'));fireEvent.click(zone(2));
  expect(screen.queryByTestId('bv-coverage-insert')).not.toBeNull();
  unfold();fireEvent.click(card('place'));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
  fireEvent.click(card('strike'));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
  fireEvent.click(zone(8));expect(screen.queryByTestId('bv-coverage-insert')).not.toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'선택 해제 · 지켜보기로 전환'}));
  expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
  act(()=>vi.advanceTimersByTime(1000));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
});

it('does not fold or invent coverage for a preparation card or an unaffordable plan',()=>{
  render(<IntegrationPreview fixture="watch-read0"/>);unfold();fireEvent.click(card('scout'));fireEvent.click(zone(8));
  expect(root().dataset.handOpen).toBe('true');expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
  cleanup();render(<IntegrationPreview fixture="cost-short"/>);unfold();fireEvent.click(zone(2));
  expect(root().dataset.handOpen).toBe('true');expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
  expect(document.querySelector('.bv-plan-problem').textContent).toBe('에너지 부족');
});

it('a drag onto a course selects and places once; a cancelled/outside drop never selects or pitches',()=>{
  render(<IntegrationPreview fixture="watch-read0"/>);unfold();
  document.elementFromPoint=vi.fn(()=>zone(8));
  const c=card('strike');
  fireEvent.pointerDown(c,{pointerId:1,clientX:600,clientY:200});
  fireEvent.pointerMove(c,{pointerId:1,clientX:450,clientY:220});
  fireEvent.pointerUp(c,{pointerId:1,clientX:450,clientY:220});fireEvent.click(c);
  expect(c.classList.contains('is-main')).toBe(true);expect(zone(8).classList.contains('is-aim')).toBe(true);
  expect([...document.querySelectorAll('[data-insert-zone]')].map(e=>Number(e.dataset.insertZone))).toEqual([2,5,8]);
  expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
  unfold();const basic=screen.getByTestId('bv-basic-chip');
  fireEvent.pointerDown(basic,{pointerId:3,clientX:600,clientY:80});fireEvent.pointerUp(basic,{pointerId:3});fireEvent.click(basic);
  expect(basic.getAttribute('aria-pressed')).toBe('true');
  cleanup();render(<IntegrationPreview fixture="watch-read0"/>);unfold();document.elementFromPoint=vi.fn(()=>document.body);
  const other=card('place');fireEvent.pointerDown(other,{pointerId:2,clientX:600,clientY:200});fireEvent.pointerMove(other,{pointerId:2,clientX:400,clientY:210});fireEvent.pointerCancel(other,{pointerId:2});
  expect(document.querySelector('.bv-card.is-main')).toBeNull();expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
});

it('support pieces retain each authored aim, and flight contains no revealed actual pitch',()=>{
  const f=buildFixture('support-stacked'),m=buildBattleViewModel(f);
  expect(m.zones.pieces[0].coverage).toEqual(f.choice.primaryCoverage);
  expect(m.zones.pieces[1].coverage).toEqual(f.choice.supportCoverages[0].coverage);
  const flight=buildBattleViewModel(buildFixture('flight'));
  expect(flight.result).toBeNull();expect(flight.zones.cells.some(c=>c.actual)).toBe(false);
});

it('a steep vertical touch flick with slight sideways drift scrolls instead of dragging or selecting',()=>{
  render(<IntegrationPreview fixture="watch-read0"/>);unfold();const c=card('strike'),row=screen.getByTestId('bv-hand');row.scrollTop=100;
  fireEvent.pointerDown(c,{pointerId:5,pointerType:'touch',clientX:600,clientY:200});
  fireEvent.pointerMove(c,{pointerId:5,pointerType:'touch',clientX:585,clientY:100});
  fireEvent.pointerUp(c,{pointerId:5,pointerType:'touch',clientX:585,clientY:100});fireEvent.click(c);
  expect(row.scrollTop).toBe(200);expect(document.querySelector('.bv-card.is-main')).toBeNull();
  expect(document.querySelector('.bv-drag-face')).toBeNull();expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
});
