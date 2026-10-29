// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import BattleView from '../src/duel/battle-vnext/BattleView.jsx';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {buildFixture,VNEXT_FIXTURES} from '../src/duel/battle-vnext/fixtures.js';
import {presentationFor} from '../src/duel/presentation.js';
const fixture=id=>{const f=buildFixture(id);return buildBattleViewModel({...f,shot:f.s.battle.revealed?presentationFor(f.s):null});};
function hitAt(zone){const f=VNEXT_FIXTURES.find(f=>f.id==='result-hit');const inputs=buildFixture({...f,steps:f.steps.map(st=>st.op==='aim'?{...st,zone}:st)});return buildBattleViewModel({...inputs,shot:presentationFor(inputs.s)});}
afterEach(cleanup);
describe('landscape contextual action, direct watch and readable outcome',()=>{
  it('mounts the same sole action outside scroll content and preserves duplicate-click guard',()=>{
    const onSwing=vi.fn();render(<BattleView model={fixture('swing-main')} actors={{}} onSwing={onSwing}/>);
    const button=screen.getByTestId('bp-swing');
    expect(document.querySelectorAll('.bv-action')).toHaveLength(2);
    expect(button.closest('.bv-action-dock')).not.toBeNull();
    expect(button.closest('.bv-decision-area')).toBeNull();
    fireEvent.click(button);fireEvent.click(button);expect(onSwing).toHaveBeenCalledTimes(1);
  });
  it('changes label and callback on the same action when the selected plan changes',()=>{
    const onTake=vi.fn(),onSwing=vi.fn();const v=render(<BattleView model={fixture('watch-read0')} actors={{}} onTake={onTake} onSwing={onSwing}/>);
    fireEvent.click(screen.getByTestId('bp-swing'));expect(onTake).toHaveBeenCalledTimes(1);
    v.rerender(<BattleView model={fixture('prepare')} actors={{}} onTake={onTake} onSwing={onSwing}/>);
    expect(screen.getByTestId('bp-swing').textContent).toContain('준비 사용');
    fireEvent.click(screen.getByTestId('bp-swing'));expect(onSwing).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('.bv-action')).toHaveLength(2);
  });
  it('keeps the action locked while support targeting or inspector is open',()=>{
    const onSwing=vi.fn();const v=render(<BattleView model={fixture('support-armed')} actors={{}} onSwing={onSwing}/>);
    fireEvent.click(screen.getByTestId('bp-swing'));expect(onSwing).not.toHaveBeenCalled();
    v.rerender(<BattleView model={fixture('inspector-open')} actors={{}} menuOpen inspector={<p>정보</p>} onSwing={onSwing}/>);
    expect(screen.getByTestId('bp-swing').disabled).toBe(true);
  });
  it('does not reveal a large call or actual marker during flight, then shows the actual result',()=>{
    const f=buildFixture('flight');const v=render(<BattleView model={buildBattleViewModel(f)} actors={{}}/>);
    expect(screen.queryByTestId('bv-result-spotlight')).toBeNull();expect(screen.queryByTestId('bv-pitch-mark')).toBeNull();
    v.rerender(<BattleView model={buildBattleViewModel({...f,fxStage:'impact',shot:presentationFor(f.s)})} actors={{}}/>);
    expect(screen.getByTestId('bv-result-spotlight').textContent).toContain(buildBattleViewModel({...f,fxStage:'impact'}).result.call);
  });
  it('celebrates a genuine exact read without repeating damage or explanation in the scene',()=>{
    const model=fixture('result-hit');expect(model.result.exact).toBe(true);
    render(<BattleView model={model} actors={{}}/>);
    const spot=screen.getByTestId('bv-result-spotlight');expect(spot.textContent).toContain('읽었다!');
    expect(spot.textContent).toContain(model.result.call);
    expect(spot.getAttribute('aria-hidden')).toBe('true');expect(spot.getAttribute('role')).toBeNull();
    expect(spot.textContent).not.toContain(model.result.explanation);expect(spot.textContent).not.toContain('HP');
    expect(screen.getByTestId('bv-result-line').textContent).toContain(model.result.explanation);
  });
  it('distinguishes an actual one-cell miss from range coverage',()=>{
    const near=hitAt(1);expect(near.scene.shotGrade).toMatch(/near-miss/);
    const v=render(<BattleView model={near} actors={{}}/>);expect(screen.getByTestId('bv-result-spotlight').textContent).toContain('한 칸 차이');
    const covered=hitAt(5);expect(covered.result.kind).toBe('hit');expect(covered.result.exact).toBe(false);
    v.rerender(<BattleView model={covered} actors={{}}/>);
    expect(screen.getByTestId('bv-result-spotlight').textContent).toContain('범위 적중');
    expect(screen.getByTestId('bv-result-spotlight').textContent).not.toContain('읽었다!');
  });
});
