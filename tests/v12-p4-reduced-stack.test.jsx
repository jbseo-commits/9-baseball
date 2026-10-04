// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {CARDS,ZONES} from '../src/duel/cards.js';

// INBOX 6 넷째 줄: reduced-motion에서 스택 해소 오버레이를 건너뛰되
// 최종 공개 결과는 모션 허용 시와 동일해야 한다. 정보 소실 금지.
function begin(supports=2,reduced=false){
  if(reduced)vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
  let s=createV10Duel(1);
  s.build='away';s.deck=['strike','place','strike','place','place','strike','place','place'].map((kind,i)=>({id:'c'+i,kind}));s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'MAIN RUN 이어하기',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'스윙하기',exact:true}));
  fireEvent.click(screen.getAllByRole('button',{name:CARDS.strike.name,exact:true})[0]);
  fireEvent.click(screen.getByRole('button',{name:ZONES[2],exact:true}));
  for(let i=0;i<supports;i++){
    const add=[...document.querySelectorAll('.stack-candidates > button')].find(b=>!b.disabled&&!b.classList.contains('picked'));
    fireEvent.click(add);
  }
}
beforeEach(()=>{localStorage.clear();vi.useFakeTimers()});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals()});
const finish=()=>act(()=>vi.runAllTimers());

describe('reduced-motion stack resolve',()=>{
  it('shows the resolve overlay when motion is allowed',()=>{
    begin(2,false);
    fireEvent.click(screen.getByTestId('execute-action'));
    expect(document.querySelector('.duel-app.stack-resolving')).toBeTruthy();
    finish();
    expect(readV10Duel(localStorage).battle.revealed).toBeTruthy();
    expect(screen.getByRole('list',{name:'판정 이유'})).toBeTruthy();
  });
  it('skips the resolve overlay under reduced motion but reaches the same reveal',()=>{
    begin(2,true);
    fireEvent.click(screen.getByTestId('execute-action'));
    expect(document.querySelector('.duel-app.stack-resolving')).toBeNull();
    finish();
    expect(document.querySelector('.duel-app.stack-resolving')).toBeNull();
    expect(readV10Duel(localStorage).battle.revealed).toBeTruthy();
    expect(screen.getByRole('list',{name:'판정 이유'})).toBeTruthy();
  });
});
