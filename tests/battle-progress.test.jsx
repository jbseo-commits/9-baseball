// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import {createLessonBattle,resultExplanation} from '../src/duel/zone-first-model.js';
import {setAimZone,playV10Action,previewCard} from '../src/duel/engine.js';
const park=(s,fxStage=null,extra={})=><BallparkBattle s={s} hand={s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id),preview:previewCard(s,id)}))} selected={null} swingStack={[]} choice={null} pitcher={s.pitcher} label="1막" fxStage={fxStage} onSelect={vi.fn()} onAim={vi.fn()} onStack={vi.fn()} {...extra}/>;
const current=()=>document.querySelector('.bp-progress [aria-current="step"]').textContent;
afterEach(()=>{cleanup();localStorage.clear();});
it('keeps preparation in planning and reveals explanation/exact feedback only once impact lands',()=>{
  const initial=createLessonBattle();const view=render(park(initial));
  expect(current()).toContain('코스 노리기');expect(screen.queryByTestId('bp-result-explanation')).toBeNull();
  const prepared=playV10Action(initial,{type:'card',id:'lesson-setup'});view.rerender(park(prepared,'settle'));
  expect(current()).toContain('코스 노리기');expect(screen.queryByTestId('bp-result-explanation')).toBeNull();
  const hit=playV10Action(setAimZone(prepared,5),{type:'card',id:'basic'});view.rerender(park(hit,'windup'));
  expect(current()).toContain('공 날아옴');expect(document.querySelector('.bp-exact-read')).toBeNull();
  expect(screen.queryByTestId('bp-result-explanation')).toBeNull();
  view.rerender(park(hit,'impact'));
  expect(current()).toContain('결과');expect(screen.getByTestId('bp-result-explanation').textContent).toBe(resultExplanation(hit));
  expect(document.querySelector('.bp-exact-read')).not.toBeNull();
});
it('distinguishes misses and leaves the existing experiment HUDs alone',()=>{
  const miss=playV10Action(setAimZone(createLessonBattle(),4),{type:'card',id:'basic'});
  const view=render(park(miss));expect(screen.getByTestId('bp-result-explanation').textContent).toContain('범위 밖');
  expect(document.querySelector('.bp-exact-read')).toBeNull();
  view.rerender(park(miss,null,{autoLesson:true}));
  expect(document.querySelector('.bp-progress')).toBeNull();expect(screen.getByTestId('bp-auto-lesson')).toBeTruthy();
});
