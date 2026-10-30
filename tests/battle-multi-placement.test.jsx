// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {setAimZone,playV10Action} from '../src/duel/engine.js';
import {STACK_COMMIT_MS} from '../src/duel/BallparkBattle.jsx';
import {PLACEMENT} from '../src/duel/battle-vnext/placement-motion.js';
import {cardDropIntent} from '../src/duel/battle-vnext/placement-intent.js';
import {playPlacementSound} from '../src/duel/battle-vnext/placement-audio.js';
vi.mock('../src/duel/battle-vnext/placement-audio.js',()=>({playPlacementSound:vi.fn()}));
import {stackFootprint} from '../src/duel/battle-vnext/StackPlacement.jsx';
const zone=z=>document.querySelector(`.bv-cell[data-zone="${z}"]`);
const attacks=()=>[...document.querySelectorAll('.bv-card[data-card-kind=place]')];
const idOf=card=>card.closest('[data-card-id]').dataset.cardId;
const main=()=>document.querySelector('.bv-card.is-main')?.closest('[data-card-id]').dataset.cardId;
const board=()=>[...document.querySelectorAll('[data-board-card-id]')].map(p=>({id:p.dataset.boardCardId,order:+p.dataset.boardOrder,aim:+p.dataset.boardAim}));
const tap=card=>{fireEvent.pointerDown(card,{pointerId:8,pointerType:'touch',clientX:700,clientY:200});fireEvent.pointerUp(card,{pointerId:8,pointerType:'touch',clientX:700,clientY:200});fireEvent.click(card);};
const open=()=>{const b=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(b)fireEvent.click(b);};
function drop(card,z){open();document.elementFromPoint=vi.fn(()=>zone(z));fireEvent.pointerDown(card,{pointerId:7,pointerType:'touch',clientX:700,clientY:200});fireEvent.pointerMove(card,{pointerId:7,pointerType:'touch',clientX:450,clientY:240});fireEvent.pointerUp(card,{pointerId:7,pointerType:'touch',clientX:450,clientY:240});fireEvent.click(card);}
beforeEach(()=>{playPlacementSound.mockReset().mockImplementation(()=>vi.fn());vi.useFakeTimers();window.history.replaceState({},'','/?battleUi=vnext');});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();window.history.replaceState({},'','/');});
it('places two distinct 1-cost cards with ordinary base energy2; the second drag cannot replace the main',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);const cards=attacks(),ids=cards.map(idOf);
 expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');drop(cards[0],0);drop(cards[1],4);
 expect(main()).toBe(ids[0]);expect(board()).toEqual([{id:ids[0],order:1,aim:0},{id:ids[1],order:2,aim:4}]);
 expect(screen.getByTestId('bv-stack-tray').dataset.totalCost).toBe('2');expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');
 expect(screen.getAllByTestId('bv-coverage-insert')).toHaveLength(2);
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
});
it('three rapid placements retain three concurrent receipts then settle exactly the actual board',()=>{
 const f=buildFixture('stack-three-ready');expect(f.s.battle.energy).toBe(3);expect(f.s.stats.pitches).toBe(1);
 render(<IntegrationPreview fixture="stack-three-ready"/>);const cards=attacks(),ids=cards.map(idOf);expect(ids).toHaveLength(3);
 cards.forEach((c,i)=>drop(c,i*4));expect(board().map(p=>p.id)).toEqual(ids);
 expect(screen.getAllByTestId('bv-coverage-insert')).toHaveLength(3);
 expect([...document.querySelectorAll('[data-insert-order]')].map(e=>+e.dataset.insertOrder)).toEqual([1,2,3]);
 expect(screen.getByTestId('bv-stack-tray').dataset.totalCost).toBe('3');expect(document.querySelectorAll('.bv-stack-join.is-connected')).toHaveLength(2);
 act(()=>vi.advanceTimersByTime(PLACEMENT.duration+20));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(board().map(p=>p.id)).toEqual(ids);
});
it('uses actual overlap and engine ordered links separately; removing a middle support renumbers and recalculates',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);const cards=attacks(),ids=cards.map(idOf);drop(cards[0],0);drop(cards[1],0);drop(cards[2],8);
 expect(screen.getByTestId('bv-stack-board').dataset.overlapCount).toBe('1');expect([...document.querySelectorAll('[data-link-connected]')].map(p=>p.dataset.linkConnected)).toEqual(['true','false']);
 fireEvent.click(screen.getByRole('button',{name:'2번 정타 노림 지원 빼기'}));
 expect(board()).toEqual([{id:ids[0],order:1,aim:0},{id:ids[2],order:2,aim:8}]);expect(screen.getByTestId('bv-stack-tray').dataset.totalCost).toBe('2');
 expect(screen.getByTestId('bv-stack-board').dataset.overlapCount).toBe('0');expect(document.querySelector('[data-link-connected]').dataset.linkConnected).toBe('false');
 expect(document.querySelector(`[data-testid=bv-coverage-insert][data-card-id="${ids[1]}"]`)).toBeNull();
 expect(document.querySelector(`[data-testid=bv-coverage-insert][data-card-id="${ids[2]}"]`).dataset.insertOrder).toBe('2');
});
it('re-aims an existing support instead of adding or moving the main, and preserves other support aims',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);const cards=attacks(),ids=cards.map(idOf);cards.forEach((c,i)=>drop(c,i*4));
 drop(cards[1],2);expect(board()).toEqual([{id:ids[0],order:1,aim:0},{id:ids[1],order:2,aim:2},{id:ids[2],order:3,aim:8}]);
 fireEvent.click(zone(6));expect(board().map(p=>p.aim)).toEqual([6,2,8]);
});
it('refuses an unaffordable extra drop without replacing the main or inventing a receipt',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));const before=board(),id=main();
 const extra=document.querySelector('.bv-card[data-card-kind=strike]');drop(extra,1);
 expect(main()).toBe(id);expect(board()).toEqual(before); expect(document.querySelector('.bv-drop-problem').textContent).toContain('에너지');
 expect([...document.querySelectorAll('[data-testid=bv-coverage-insert]')].some(e=>e.dataset.cardId===idOf(extra))).toBe(false);
});
it('add card opens the real hand in support mode; tap placement works for the second and third cards',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);const cards=attacks();drop(cards[0],0);const id=main();
 fireEvent.click(screen.getByRole('button',{name:'+ 카드 추가'}));tap(cards[1]);fireEvent.click(zone(4));
 fireEvent.click(screen.getByRole('button',{name:'+ 카드 추가'}));tap(cards[2]);fireEvent.click(zone(8));
 expect(main()).toBe(id);expect(board().map(p=>p.aim)).toEqual([0,4,8]);expect(screen.getByTestId('bv-stack-tray').dataset.totalCost).toBe('3');
});
it('assembles inside the existing commit beat, then consumes all three cards once using the actual engine result',()=>{
 const f=buildFixture('stack-three-ready'),ids=f.hand.filter(c=>c.entry.kind==='place').map(c=>c.id);
 const aimed=setAimZone(f.s,0),expected=playV10Action(aimed,{type:'card',id:ids[0],supports:[{id:ids[1],aimZone:4},{id:ids[2],aimZone:8}]});
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));fireEvent.click(screen.getByTestId('bp-swing'));fireEvent.click(screen.getByTestId('bp-swing'));
 expect(document.querySelector('.battle-vnext').dataset.phase).toBe('committing');expect(document.querySelector('.bv-stack-board.is-assembling')).not.toBeNull();expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
 act(()=>vi.advanceTimersByTime(STACK_COMMIT_MS-1));expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
 act(()=>vi.advanceTimersByTime(1));expect(document.querySelector('.bv-scene').dataset.playToken).toBe(String(expected.stats.pitches));expect(attacks()).toHaveLength(0);
 expect(screen.getByTestId('bv-energy').dataset.energy).toBe(String(expected.battle.energy));
 act(()=>vi.advanceTimersByTime(2200));expect(document.querySelector('.bv-hud-opponent').getAttribute('aria-label')).toContain(`${expected.pitcher.hp} / ${expected.pitcher.maxHp}`);
});
it('watch cancels a three-card plan without spending it and duplicate mixed clicks cannot throw twice',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));fireEvent.click(screen.getByTestId('bp-other-action'));fireEvent.click(screen.getByTestId('bp-swing'));
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('2');expect(attacks()).toHaveLength(3);expect(screen.getByTestId('bv-energy').dataset.energy).toBe('3');expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
});
it('clear and main replacement remove settled supports; overlap alone cannot turn a broken ordered link into CONNECT',()=>{
 expect(stackFootprint([{order:1,coverage:[0,3,6]},{order:2,coverage:[6,7,8]}]).overlaps.map(c=>c.zone)).toEqual([6]);
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));
 open();fireEvent.click(screen.getByRole('button',{name:'카드 겹치기'}));tap(document.querySelector('.bv-card[data-card-kind=strike]'));
 expect(board()).toHaveLength(1);expect(screen.getByTestId('bv-stack-tray').dataset.cardCount).toBe('1');
 fireEvent.click(screen.getByRole('button',{name:'선택 해제 · 지켜보기로 전환'}));expect(screen.queryByTestId('bv-stack-board')).toBeNull();
});
it('explicit drop intent rejects basic/prepare/bunt/patience/invalid or duplicate shapes through the engine boundary',()=>{
 const {s}=buildFixture('stack-three-ready'),ids=s.battle.hand.filter(id=>s.deck.find(c=>c.id===id).kind==='place');
 expect(cardDropIntent(s,'basic',[],ids[0],0).ok).toBe(false);
 expect(cardDropIntent(s,ids[0],[],s.battle.hand.find(id=>s.deck.find(c=>c.id===id).kind==='watch'),0).ok).toBe(false);
 expect(cardDropIntent({...s,battle:{...s.battle,growthMode:'patience'}},ids[0],[],ids[1],0).ok).toBe(false);
 expect(cardDropIntent(s,ids[0],[],ids[1],9).ok).toBe(false);
 const aimed=cardDropIntent(s,ids[0],[{id:ids[1],aimZone:0}],ids[1],8);expect(aimed.stack).toEqual([{id:ids[1],aimZone:8}]);
});

it('muting or inspecting cancels every concurrent receipt bus, preserves the actual board and never replays old placements',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);fireEvent.click(screen.getByRole('button',{name:'효과음 켜기'}));
 attacks().forEach((c,i)=>drop(c,i*4));expect(playPlacementSound).toHaveBeenCalledTimes(3);
 const stops=playPlacementSound.mock.results.map(r=>r.value);fireEvent.click(screen.getByRole('button',{name:'효과음 끄기'}));
 stops.forEach(stop=>expect(stop).toHaveBeenCalledTimes(1));expect(board()).toHaveLength(3);
 fireEvent.click(screen.getByRole('button',{name:'효과음 켜기'}));const nextStops=playPlacementSound.mock.results.slice(3).map(r=>r.value);
 fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));nextStops.forEach(stop=>expect(stop).toHaveBeenCalledTimes(1));
 expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();fireEvent.click(screen.getByTestId('bp-inspect-back'));
 expect(board()).toHaveLength(3);expect(playPlacementSound).toHaveBeenCalledTimes(6);
});

for(const via of ['tray','hand'])it(`removes the ${via} receipt from parent state so immediate re-drop cannot replay its old source/sound`,()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);fireEvent.click(screen.getByRole('button',{name:'효과음 켜기'}));const cards=attacks(),ids=cards.map(idOf);cards.forEach((c,i)=>drop(c,i*4));
 const oldSeq=+document.querySelector(`[data-testid=bv-coverage-insert][data-card-id="${ids[1]}"]`).dataset.insertSeq;
 if(via==='tray')fireEvent.click(screen.getByRole('button',{name:'2번 정타 노림 지원 빼기'}));else{open();tap(cards[1]);}
 expect(document.querySelector(`[data-testid=bv-coverage-insert][data-card-id="${ids[1]}"]`)).toBeNull();expect(playPlacementSound).toHaveBeenCalledTimes(3);
 drop(cards[1],2);expect(board().map(p=>p.id)).toEqual([ids[0],ids[2],ids[1]]);
 expect(+document.querySelector(`[data-testid=bv-coverage-insert][data-card-id="${ids[1]}"]`).dataset.insertSeq).toBeGreaterThan(oldSeq);
 expect(playPlacementSound).toHaveBeenCalledTimes(4);
});

it('a support touch release removes immediately without compatibility click, and a retargeted late click cannot remove the next card',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));
 const button=screen.getByRole('button',{name:'2번 정타 노림 지원 빼기'});
 fireEvent.pointerDown(button,{pointerId:31,pointerType:'touch',clientX:600,clientY:240});fireEvent.pointerUp(button,{pointerId:31,pointerType:'touch',clientX:600,clientY:240});expect(board()).toHaveLength(2);
 const next=screen.getByRole('button',{name:'2번 정타 노림 지원 빼기'});fireEvent.click(next);expect(board()).toHaveLength(2);
 fireEvent.keyDown(next,{key:'Enter'});fireEvent.click(next);expect(board()).toHaveLength(1);
});
it('a fresh second touch remains usable while the previous touch compatibility click is still suppressed',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));
 for(let i=0;i<2;i++){const button=screen.getByRole('button',{name:'2번 정타 노림 지원 빼기'});fireEvent.pointerDown(button,{pointerId:40+i,pointerType:'touch',clientX:600,clientY:240});fireEvent.pointerUp(button,{pointerId:40+i,pointerType:'touch',clientX:600,clientY:240});}
 expect(board()).toHaveLength(1);
});
it('restores hand scroll after Inspector layout returns, rather than clamping it against the larger inspector-open hand',()=>{
 render(<IntegrationPreview fixture="support-armed"/>);open();fireEvent.click(zone(8));open();const row=screen.getByTestId('bv-hand');let scroll=0;
 Object.defineProperty(row,'scrollTop',{configurable:true,get:()=>scroll,set:v=>{scroll=document.querySelector('.bv-inspector-area')?Math.min(40,v):v;}});
 row.scrollTop=100;fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));row.scrollTop=40;
 fireEvent.click(screen.getByTestId('bp-inspect-back'));expect(row.scrollTop).toBe(100);
});

it('clears on touch release immediately after three drops even when Chromium omits its compatibility click',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);attacks().forEach((c,i)=>drop(c,i*4));const clear=screen.getByRole('button',{name:'선택 해제 · 지켜보기로 전환'});
 fireEvent.pointerDown(clear,{pointerId:51,pointerType:'touch',clientX:500,clientY:320});fireEvent.pointerUp(clear,{pointerId:51,pointerType:'touch',clientX:500,clientY:320});
 expect(main()).toBeUndefined();expect(board()).toHaveLength(0);expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
});
it('executes on touch release and rejects a delayed compatibility click even after preparation ends and the action changes',()=>{
 render(<IntegrationPreview fixture="prepare"/>);let button=screen.getByTestId('bp-swing');
 fireEvent.pointerDown(button,{pointerId:52,pointerType:'touch',clientX:600,clientY:320});fireEvent.pointerUp(button,{pointerId:52,pointerType:'touch',clientX:600,clientY:320});
 expect(screen.getByTestId('bv-energy').dataset.energy).toBe('1');act(()=>vi.advanceTimersByTime(1100));button=screen.getByTestId('bp-swing');
 fireEvent.click(button);expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
 fireEvent.pointerDown(button,{pointerId:53,pointerType:'touch',clientX:600,clientY:320});fireEvent.pointerUp(button,{pointerId:53,pointerType:'touch',clientX:600,clientY:320});expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
});
