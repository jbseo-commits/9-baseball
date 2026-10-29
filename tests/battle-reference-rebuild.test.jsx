// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import BattleView from '../src/duel/battle-vnext/BattleView.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
const vm=id=>buildBattleViewModel(buildFixture(id));
afterEach(cleanup);
for(const order of [['bp-swing','bp-other-action'],['bp-other-action','bp-swing']])it(`shares the execution lock across ${order.join(' then ')} before the host updates`,()=>{
  const onSwing=vi.fn(),onTake=vi.fn();
  render(<BattleView model={vm('swing-main')} actors={{}} onSwing={onSwing} onTake={onTake}/>);
  order.forEach(id=>fireEvent.click(screen.getByTestId(id)));
  expect(onSwing.mock.calls.length+onTake.mock.calls.length).toBe(1);
  expect(order[0]==='bp-swing'?onSwing:onTake).toHaveBeenCalledTimes(1);
});
it('direct watch ignores the selected prepare card without applying it',()=>{
  const onSwing=vi.fn(),onTake=vi.fn();render(<BattleView model={vm('prepare')} actors={{}} onSwing={onSwing} onTake={onTake}/>);
  fireEvent.click(screen.getByTestId('bp-other-action'));
  expect(onTake).toHaveBeenCalledTimes(1);expect(onSwing).not.toHaveBeenCalled();
});
it('cost shortage disables the planned swing but leaves direct watch usable',()=>{
  const onTake=vi.fn();render(<BattleView model={vm('cost-short')} actors={{}} onTake={onTake}/>);
  expect(screen.getByTestId('bp-swing').disabled).toBe(true);
  expect(screen.getByTestId('bp-other-action').disabled).toBe(false);
  fireEvent.click(screen.getByTestId('bp-other-action'));expect(onTake).toHaveBeenCalledTimes(1);
});
it('inspector and flight cannot execute either action',()=>{
  const onSwing=vi.fn(),onTake=vi.fn();const view=render(<BattleView model={vm('swing-main')} actors={{}} menuOpen onSwing={onSwing} onTake={onTake}/>);
  for(const id of ['bp-swing','bp-other-action'])fireEvent.click(screen.getByTestId(id));
  view.rerender(<BattleView model={vm('flight')} actors={{}} onSwing={onSwing} onTake={onTake}/>);
  expect(screen.queryByTestId('bp-other-action')).toBeNull();fireEvent.click(screen.getByTestId('bp-swing'));
  expect(onSwing).not.toHaveBeenCalled();expect(onTake).not.toHaveBeenCalled();
});
it('reference fixture uses actual boss limits and real selectable hand costs',()=>{
  const model=vm('reference-boss');
  render(<BattleView model={model} actors={{}}/>);
  expect(document.querySelector('.bv-hud-opponent').getAttribute('aria-label')).toContain('78 / 112');
  expect(model.hand.filter(c=>c.type!=='basic')).toHaveLength(5);
  for(const card of model.hand.filter(c=>c.type!=='basic')){
    expect(document.querySelector(`[data-card-id="${card.id}"] .bv-card-cost`).textContent).toBe(String(card.cost));
  }
});
