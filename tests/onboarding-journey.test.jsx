// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
import WelcomeGuide,{WELCOME_SEEN_KEY} from '../src/duel/WelcomeGuide.jsx';
import {firstPitchLesson} from '../src/duel/battle-vnext/first-pitch-lesson.js';
afterEach(cleanup);
it('keeps three intro steps and scoped seen/skip behavior',()=>{
 const storage={setItem:(k,v)=>{expect(k).toBe(WELCOME_SEEN_KEY);expect(v).toBe('seen');}},closed=[];
 const v=render(<WelcomeGuide mode="intro" storage={storage} onClose={()=>closed.push(1)}/>);
 expect(v.container.textContent).toContain('동료가 기다립니다');
 fireEvent.click(v.getByText('다음'));expect(v.container.textContent).toContain('머리 위 9칸은 의도');expect(v.container.textContent).toContain('아래 노릴 칸');
 fireEvent.click(v.getByText('다음'));expect(v.container.textContent).toContain('투수 HP 0이 승리 조건입니다');
 fireEvent.click(v.getByText('플레이 시작'));expect(closed).toEqual([1]);
});
it('describes only the first three actual take outcomes without implying an extra pitch',()=>{
 const s={version:10,stats:{pitches:1},phase:'pitch',battle:{revealed:{action:'take',kind:'ball'}}};
 expect(firstPitchLesson(s)).toBe('볼 +1 · 같은 타자 계속');
 s.battle.revealed.kind='called';expect(firstPitchLesson(s)).toBe('스트라이크 +1 · 같은 타자 계속');
 s.phase='reward';expect(firstPitchLesson(s)).toBe('스트라이크 +1');s.battle.revealed.label='루킹 삼진';expect(firstPitchLesson(s)).toBe('삼진 · 아웃');
 s.battle.revealed.kind='ball';s.battle.revealed.label='볼';expect(firstPitchLesson(s)).toBe('볼 +1');s.battle.revealed.label='볼넷';expect(firstPitchLesson(s)).toBe('4볼 · 진루');
 s.battle.revealed.action='swing';expect(firstPitchLesson(s)).toBe('');
 s.battle.revealed.action='take';s.stats.pitches=4;expect(firstPitchLesson(s)).toBe('');
 s.stats.pitches=0;expect(firstPitchLesson(s)).toBe('');s.stats.pitches=1;s.battle.revealed=null;expect(firstPitchLesson(s)).toBe('');
});
