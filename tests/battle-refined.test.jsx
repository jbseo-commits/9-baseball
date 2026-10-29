// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import HandDock from '../src/duel/battle-vnext/HandDock.jsx';
import BattleView from '../src/duel/battle-vnext/BattleView.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
const vm=id=>buildBattleViewModel(buildFixture(id));
afterEach(cleanup);

it('the strip separates the real cost, illustration and coverage, while details never select a card',()=>{
  const model=vm('swing-main'),tap=vi.fn(),detail=vi.fn();
  render(<HandDock grid="orbit" hand={model.hand} energy={model.energy} input={model.input} onCardTap={tap} onCardDetail={detail}/>);
  for(const item of model.hand.filter(x=>x.type!=='basic')){
    const button=document.querySelector(`[data-card-id="${item.id}"] .bv-card`);
    expect(button.querySelector('.bv-card-cost').textContent).toBe(String(item.cost));
    expect(button.querySelector('.bv-card-art .bv-card-cost')).toBeNull();
    expect(button.querySelector('.bv-card-art .bv-card-range')).toBeNull();
    if(item.type!=='prepare')expect([...button.querySelectorAll('.bv-glyph i')].flatMap((el,i)=>el.classList.contains('on')?[i]:[])).toEqual(item.coverage);
  }
  const main=model.hand.find(x=>x.selectionRole==='main');fireEvent.click(screen.getAllByRole('button',{name:main.name+' 자세히'})[0]);
  expect(detail).toHaveBeenCalledTimes(1);expect(tap).not.toHaveBeenCalled();
});

it('the quiet watch state has one reward hint and keeps the real action accessible',()=>{
  const model=vm('watch-read0'),take=vi.fn();render(<BattleView model={model} actors={{}} onTake={take}/>);
  expect(screen.getByTestId('bv-plan').textContent).toBe('');
  expect(document.querySelector('.bv-action small').textContent).toBe(model.energy.nextTakeHint.replaceAll('⚡',''));
  fireEvent.click(screen.getByTestId('bp-swing'));expect(take).toHaveBeenCalledTimes(1);
});

it('keeps visible and accessible dead-course information and cost shortage reasons',()=>{
  render(<BattleView model={vm('cost-short')} actors={{}}/>);
  for(const cell of document.querySelectorAll('.bv-cell.is-dead')){
    expect(cell.querySelector('.bv-cell-face').textContent).toBe('안 던짐');
    expect(cell.getAttribute('aria-label')).toContain('던지지 않는 코스');
  }
  expect(document.querySelector('.bv-plan-problem').textContent).toBe('에너지 부족');
  expect(screen.getByTestId('bp-swing').disabled).toBe(true);
});
