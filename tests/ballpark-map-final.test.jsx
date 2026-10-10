// @vitest-environment happy-dom
import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import BallparkMap from '../src/duel/BallparkMap.jsx';

afterEach(()=>{cleanup();});

const boss=(act)=>({id:`a${act}-boss`,act,row:0,lane:0,type:'boss',name:'막 보스',
  opponent:{name:act===3?'최종 결승':'중간 보스',maxHp:120,artId:'red-rush',archetypeKey:'outside'}});
const show=(node)=>render(<BallparkMap nodes={[node]} edges={[]} reachableIds={[node.id]} completedIds={[]} onEnter={()=>{}} onInspect={()=>{}}/>);

describe('final-boss map sheet tells the truth',()=>{
  it('promises a run finish, not a next act and signature',()=>{
    // Before: every boss sheet read '이기면 다음 막 · 시그니처', but beating the
    // act-3 boss ends the run (won, no reward draft). Players could hoard for
    // a next act that never comes.
    show(boss(3));
    const line=document.querySelector('.bp-mrw').textContent;
    expect(line).not.toContain('다음 막');
    expect(line).not.toContain('시그니처');
    expect(line).toContain('런 완주');
  });
  it('keeps the next-act promise on earlier bosses',()=>{
    show(boss(1));
    expect(document.querySelector('.bp-mrw').textContent).toContain('다음 막');
  });
});
