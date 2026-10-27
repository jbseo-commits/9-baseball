// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import LandscapeSelection from '../src/duel/LandscapeSelection.jsx';
afterEach(cleanup);
it.each([
  ['삼진','지켜봄 → 실제 바깥쪽 낮게 → 스트라이크 · 루킹 삼진','지켜봄 → 바깥쪽 낮게','스트라이크'],
  ['안타','몸쪽 낮게 노림 → 실제 몸쪽 낮게 → 정확 적중 · 중전안타','몸쪽 낮게 → 몸쪽 낮게','정확 적중'],
  ['볼넷','지켜봄 → 실제 존 밖 → 볼 · 볼넷','지켜봄 → 존 밖','볼'],
  ['헛스윙','바깥쪽 높게 노림 → 실제 가운데 낮게 → 범위 밖 · 헛스윙','바깥쪽 높게 → 가운데 낮게','범위 밖'],
])('keeps %s, its public location and cause without repeating the full result underneath',(verdict,review,path,cause)=>{
  render(<LandscapeSelection deciding={false} verdict={verdict} review={review}/>);
  expect(screen.getByText(verdict,{exact:true})).toBeTruthy();
  const result=screen.getByTestId('bp-result-explanation');expect(result.getAttribute('aria-label')).toBe(review);
  expect([...result.children].map(e=>e.textContent)).toEqual([path,cause]);
  expect(result.textContent).not.toContain('루킹 삼진');
});
