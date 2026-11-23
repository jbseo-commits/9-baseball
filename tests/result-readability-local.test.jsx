// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {DecisionSummary} from '../src/duel/battle-vnext/DecisionPanel.jsx';
afterEach(cleanup);
it('only result scroll panel is keyboard reachable, all course text and damage preserved',()=>{
 const explanation='바깥쪽 높게 노림 → 실제 바깥쪽 높게 → 정확 적중';
 for(const kind of ['hit','whiff','foul','called','ball']){
 const result={kind,exact:kind==='hit',explanation,damage:kind==='hit'?18:0,hpBefore:56,hpAfter:38,moves:[]};
 const v=render(<DecisionSummary phase="result" result={result}/>);const p=v.getByRole('region',{name:'투구 결과 · 위아래로 스크롤'});expect(p.tabIndex).toBe(0);expect(v.getByText(explanation)).toBeTruthy();p.focus();expect(document.activeElement).toBe(p);v.rerender(<DecisionSummary phase="flight"/>);expect(v.getByTestId('bv-plan').hasAttribute('tabindex')).toBe(false);expect(v.queryByRole('region')).toBeNull();v.unmount();
 }
});
