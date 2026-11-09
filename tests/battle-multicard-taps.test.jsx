// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {it,expect,beforeEach,afterEach} from 'vitest';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import {buildFixture,appInputs} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {setAimZone} from '../src/duel/engine.js';
const cards=()=>[...document.querySelectorAll('.bv-card[data-card-kind=place]')];
const id=c=>c.closest('[data-card-id]').dataset.cardId;
const zone=z=>document.querySelector(`.bv-cell[data-zone="${z}"]`);
const board=()=>[...document.querySelectorAll('[data-board-card-id]')].map(p=>({id:p.dataset.boardCardId,aim:+p.dataset.boardAim}));
function put(card,z){const open=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(open)fireEvent.click(open);fireEvent.click(card);fireEvent.click(zone(z));}
beforeEach(()=>window.history.replaceState({},'','/?battleUi=vnext'));
afterEach(()=>{cleanup();window.history.replaceState({},'','/');});
it('places two cards by ordinary card→zone taps at base energy2 without an extra stacking toggle',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);const hand=cards();put(hand[0],0);put(hand[1],4);
 expect(board()).toEqual([{id:id(hand[0]),aim:0},{id:id(hand[1]),aim:4}]);
 expect(screen.getByTestId('bv-stack-tray').dataset.totalCost).toBe('2');
 expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');
 expect(screen.getAllByTestId('bv-coverage-insert')).toHaveLength(2);
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
});
it('continues the same tap flow to three independently aimed cards after a real take refills energy3',()=>{
 render(<IntegrationPreview fixture="stack-three-ready"/>);const hand=cards();hand.forEach((c,i)=>put(c,i*4));
 expect(board()).toEqual(hand.map((c,i)=>({id:id(c),aim:i*4})));
 expect(screen.getByTestId('bv-stack-tray').dataset.totalCost).toBe('3');
 expect(screen.getAllByTestId('bv-coverage-insert')).toHaveLength(3);
});
it('retains the single-card tray and explains energy shortage instead of hiding multiple-card play',()=>{
 render(<IntegrationPreview fixture="watch-read0"/>);
 put(document.querySelector('.bv-card[data-card-kind=strike]'),2);
 const add=screen.getByRole('button',{name:'+ 카드 추가',exact:true});expect(add.disabled).toBe(true);
 expect(screen.getByTestId('bv-stack-tray').textContent).toContain('에너지 1 부족');
 expect(board()).toHaveLength(1);expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');
});
it('offers explicit main replacement after placing, while denied support taps preserve the whole plan',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);const hand=cards();put(hand[0],0);put(hand[1],4);
 const open=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(open)fireEvent.click(open);
 const before=board();const costly=document.querySelector('.bv-card[data-card-kind=strike]');
 expect(costly).not.toBeNull();fireEvent.click(costly);expect(board()).toEqual(before);expect(document.querySelector('.bv-card.is-armed')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'메인 교체',exact:true}));fireEvent.click(hand[1]);
 expect(board()).toHaveLength(1);expect(board()[0].id).toBe(id(hand[1]));
 expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');
});
it('also adds the second card when the player chooses a zone before the first card',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);const hand=cards();fireEvent.click(zone(0));
 const open=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(open)fireEvent.click(open);
 fireEvent.click(hand[0]);put(hand[1],4);
 expect(board()).toEqual([{id:id(hand[0]),aim:0},{id:id(hand[1]),aim:4}]);
});
it('the enabled free swing explicitly replaces a stacked plan without spending any cards or energy',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);const hand=cards();put(hand[0],0);put(hand[1],4);
 const open=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(open)fireEvent.click(open);
 fireEvent.click(screen.getByTestId('bv-basic-chip'));
 expect(board()).toHaveLength(1);expect(board()[0].id).toBe('basic');
 expect(document.querySelector('.bv-card.is-support')).toBeNull();
 expect(screen.getByTestId('bv-basic-chip').getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
});

function RestrictedBattle({mode}){
 const[s,setS]=React.useState(()=>{const s=buildFixture('stack-two-ready').s;if(mode==='bunt')s.deck.find(c=>c.id==='c2').kind='bunt';else s.battle.growthMode='patience';return s;});
 const[selected,onSelect]=React.useState(null),[swingStack,onStack]=React.useState([]);
 return <BallparkBattle {...appInputs(s,{selected,swingStack})} {...{s,selected,swingStack,onSelect,onStack}} pitcher={s.pitcher} vnextReview={{}} onAim={z=>setS(x=>setAimZone(x,z))} onSwing={()=>{}} onTake={()=>{}}/>;
}
for(const mode of ['bunt','patience'])it(`a ${mode} main drop cannot trap later card taps in a forbidden support mode`,()=>{
 render(<RestrictedBattle mode={mode}/>);const h=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(h)fireEvent.click(h);
 const first=document.querySelector(`.bv-card[data-card-kind=${mode==='bunt'?'bunt':'place'}]`),target=zone(4),area=document.querySelector('.bv-hand-area');
 const before=document.elementFromPoint;document.elementFromPoint=()=>target;
 fireEvent.pointerDown(first,{pointerId:10,pointerType:'touch',clientX:700,clientY:180});fireEvent.pointerMove(area,{pointerId:10,pointerType:'touch',clientX:450,clientY:250});fireEvent.pointerUp(area,{pointerId:10,pointerType:'touch',clientX:450,clientY:250});fireEvent.click(first);document.elementFromPoint=before;
 expect(board()[0].id).toBe(id(first));expect(screen.queryByRole('button',{name:'메인 교체',exact:true})).toBeNull();
 const reopen=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(reopen)fireEvent.click(reopen);
 const other=document.querySelector(`.bv-card[data-card-kind=${mode==='bunt'?'place':'strike'}]`);fireEvent.click(other);
 expect(board()).toHaveLength(1);expect(board()[0].id).toBe(id(other));
 expect(document.querySelector('.bv-card.is-armed')).toBeNull();
});
it('distinguishes a real two-card constraint and an empty candidate hand from energy shortage',()=>{
 const f=buildFixture('stack-three-ready'),s=f.s,ids=f.hand.filter(x=>x.entry.kind==='place').map(x=>x.id);
 const limited={...s,defenseLab:{schema:1,activeConstraint:{key:'stack'}}},stack=[{id:ids[1],aimZone:4}];
 const max=buildBattleViewModel({...f,...appInputs(limited,{selected:ids[0],swingStack:stack}),s:limited,selected:ids[0],swingStack:stack});
 expect(max.energy.remainingIfExecuted).toBe(1);expect(max.selection.canAddSupport).toBe(false);expect(max.selection.supportBlockReason).toBe('이번 공 최대 2장');
 const one={...s,battle:{...s.battle,hand:[ids[0]]}},empty=buildBattleViewModel({...f,...appInputs(one,{selected:ids[0],swingStack:[]}),s:one,selected:ids[0],swingStack:[]});
 expect(empty.selection.canStack).toBe(true);expect(empty.selection.canAddSupport).toBe(false);expect(empty.selection.supportBlockReason).toBe('추가 타격 카드 없음');
});
it('an opening touch compatibility click retargeted onto a card cannot select or cancel it',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);fireEvent.click(screen.getByRole('button',{name:'손패 접기',exact:true}));const handle=screen.getByRole('button',{name:'손패 펼치기',exact:true});
 fireEvent.pointerDown(handle,{pointerId:21,pointerType:'touch',clientX:820,clientY:180});
 fireEvent.pointerUp(handle,{pointerId:21,pointerType:'touch',clientX:820,clientY:180});
 // The moving handle can expose this card beneath the old touch coordinate.
 fireEvent.click(cards()[0]);expect(board()).toHaveLength(0);
 const first=cards()[0];fireEvent.pointerDown(first,{pointerId:22,pointerType:'touch',clientX:700,clientY:180});fireEvent.pointerUp(first,{pointerId:22,pointerType:'touch',clientX:700,clientY:180});fireEvent.click(first);
 expect(board()).toHaveLength(1);expect(board()[0].id).toBe(id(first));
});
it('a fresh keyboard gesture remains usable when the handle emitted no compatibility click',()=>{
 render(<IntegrationPreview fixture="stack-two-ready"/>);fireEvent.click(screen.getByRole('button',{name:'손패 접기',exact:true}));const handle=screen.getByRole('button',{name:'손패 펼치기',exact:true});
 fireEvent.pointerDown(handle,{pointerId:23,pointerType:'touch',clientX:820,clientY:180});fireEvent.pointerUp(handle,{pointerId:23,pointerType:'touch',clientX:820,clientY:180});
 const first=cards()[0];fireEvent.keyDown(first,{key:'Enter'});fireEvent.click(first);
 expect(board()).toHaveLength(1);expect(board()[0].id).toBe(id(first));
});
