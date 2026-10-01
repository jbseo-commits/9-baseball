// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel} from '../src/duel/engine.js';

// 공이 닿기 전에는 결과(진루·HP·카운트)를 미리 보여주지 않는다. 오버킬이어도 HP 막대가 다시 차 보이지 않는다.
beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

describe('결과 연출 전 스포일러',()=>{
  it('엔진은 던지기 전 HP·아웃을 결과에 적는다',async()=>{
    const {playV10Action,setAimZone}=await import('../src/duel/engine.js');
    let s=createV10Duel(7);s=enterV10Node(s,'a1-entry');
    s={...s,pitcher:{...s.pitcher,hp:3,phase:'critical'}};s=setAimZone(s,s.battle.aimZone);
    const t=playV10Action(s,{type:'card',id:'basic'});
    expect(t.v10.lastCombat.hpBefore).toBe(3);
    expect(t.battle.revealed.outsBefore).toBe(0);
    expect(Array.isArray(t.battle.revealed.basesBefore)).toBe(true);
    expect(t.pitcher.lastDamage).toBeGreaterThanOrEqual(0);
  });
});
