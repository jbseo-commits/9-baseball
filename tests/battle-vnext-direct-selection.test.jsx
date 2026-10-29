// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect} from 'vitest';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
beforeEach(()=>window.history.replaceState({},'','/?battleUi=vnext'));
afterEach(()=>{cleanup();window.history.replaceState({},'','/');});
const card=kind=>document.querySelector(`.bv-card[data-card-kind=${kind}]`);
const zone=z=>document.querySelector(`.bv-cell[data-zone="${z}"]`);
const main=()=>document.querySelector('.bv-card.is-main')?.closest('[data-card-id]').dataset.cardId;
const add=()=>{const handle=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(handle)fireEvent.click(handle);return screen.getByRole('button',{name:'카드 겹치기'});};
const clear=()=>screen.getByRole('button',{name:'선택 해제 · 지켜보기로 전환'});
it('shows a course immediately before choosing cards; either selection order yields the same plan',()=>{
 const open=()=>render(<IntegrationPreview fixture="watch-read0"/>);
 open();fireEvent.click(zone(8));expect(zone(8).classList.contains('is-aim')).toBe(true);expect(zone(8).querySelector('.bv-token')).toBeNull();
 fireEvent.click(card('place'));const a={id:main(),plan:screen.getByTestId('bv-plan').textContent};expect(zone(8).querySelector('.bv-token').textContent).toBe('1');
 cleanup();open();fireEvent.click(card('place'));fireEvent.click(zone(8));expect({id:main(),plan:screen.getByTestId('bv-plan').textContent}).toEqual(a);
});
it('normal card taps replace the main instead of arming a support; retapping is stable',()=>{
 render(<IntegrationPreview fixture="watch-read0"/>);fireEvent.click(card('place'));fireEvent.click(card('strike'));const id=main();
 expect(card('strike').classList.contains('is-main')).toBe(true);expect(document.querySelector('.is-armed')).toBeNull();expect(document.querySelector('.bv-card.is-support')).toBeNull();
 fireEvent.click(card('strike'));expect(main()).toBe(id);expect(screen.getByTestId('bp-swing').dataset.actionKind).toBe('swing');
 expect(screen.queryByRole('button',{name:'카드 겹치기'})).toBeNull(); // no affordable support at energy2
});
it('explicitly clears the plan to watch without executing a pitch or changing the aim',()=>{
 render(<IntegrationPreview fixture="swing-main"/>);fireEvent.click(zone(7));fireEvent.click(clear());
 expect(main()).toBeUndefined();expect(zone(7).classList.contains('is-aim')).toBe(true);expect(screen.getByTestId('bp-swing').dataset.actionKind).toBe('watch');
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
});
it('keeps the chosen course while comparing preparation and swing cards',()=>{
 render(<IntegrationPreview fixture="watch-read0"/>);fireEvent.click(zone(6));fireEvent.click(card('scout'));fireEvent.click(card('scout'));
 expect(zone(6).classList.contains('is-aim')).toBe(true);expect(zone(6).querySelector('.bv-token')).toBeNull();expect(main()).toBeTruthy();
 fireEvent.click(card('place'));expect(zone(6).classList.contains('is-aim')).toBe(true);expect(zone(6).querySelector('.bv-token').textContent).toBe('1');
});
it('adds/removes supports only in explicit mode, and leaving it cancels only the candidate',()=>{
 render(<IntegrationPreview fixture="support-armed"/>);const id=main();fireEvent.click(add());fireEvent.click(add());fireEvent.click(card('place'));
 // Retapping main exits the mode and preserves it.
 expect(main()).toBe(id);expect(add().getAttribute('aria-pressed')).toBe('false');
 cleanup();render(<IntegrationPreview fixture="support-armed"/>);expect(document.querySelector('.bv-card.is-armed')).not.toBeNull();
 fireEvent.click(add());expect(document.querySelector('.bv-card.is-armed')).toBeNull();expect(screen.getByTestId('bp-swing').disabled).toBe(false);
 fireEvent.click(add());fireEvent.click(card('strike'));fireEvent.click(zone(8));expect(document.querySelector('.bv-card.is-support')).not.toBeNull();expect(zone(8).querySelector('.bv-token.n2')).not.toBeNull();
 fireEvent.click(add());expect(document.querySelector('.bv-card.is-support')).not.toBeNull();
 fireEvent.click(add());fireEvent.click(card('strike'));expect(document.querySelector('.bv-card.is-support')).toBeNull();expect(zone(8).querySelector('.bv-token.n2')).toBeNull();
});
it('does not replace the main or add phantom coverage when an unaffordable support is tapped',()=>{
 render(<IntegrationPreview fixture="support-stacked"/>);const id=main(),extra=[...document.querySelectorAll('.bv-card[data-card-kind=strike]')].find(x=>!x.classList.contains('is-support'));
 fireEvent.click(add());fireEvent.click(extra);expect(main()).toBe(id);expect(document.querySelectorAll('.bv-card.is-support')).toHaveLength(1);expect(document.querySelector('.bv-card.is-armed')).toBeNull();
 fireEvent.click(clear());expect(document.querySelector('.bv-card.is-support')).toBeNull();expect(screen.getByTestId('bp-swing').dataset.actionKind).toBe('watch');
});
it('does not mark normal replacement cards as support over budget',()=>{
 const f=buildFixture('swing-main'),normal=buildBattleViewModel(f),mode=buildBattleViewModel({...f,supportMode:true});
 expect(normal.hand.find(x=>x.kind==='place').overBudget).toBe(false);expect(mode.hand.find(x=>x.kind==='place').overBudget).toBe(true);
});
