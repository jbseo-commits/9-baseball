// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import WelcomeGuide,{WELCOME_SEEN_KEY,WELCOME_CHAPTERS} from '../src/duel/WelcomeGuide.jsx';
import * as E from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear();window.history.replaceState({},'','/');});
afterEach(cleanup);

it('starts with three essential chapters while the explicit rulebook keeps all nine',()=>{
  render(<WelcomeGuide mode="intro"/>);
  expect(document.querySelector('.wg-eyebrow').textContent).toContain('1 / 3');
  expect(document.querySelector('.wg-page').textContent).toContain('다음 상대로 이어집니다');
  fireEvent.click(screen.getByRole('button',{name:'다음',exact:true}));
  expect(document.querySelector('.wg-page').textContent).toContain('카드 없이 실행하면 지켜봅니다');
  expect(document.querySelector('.wg-page').textContent).toContain('공을 쓰지 않고');
  expect(document.querySelector('.wg-page').textContent).toContain('다시 누르면');
  fireEvent.click(screen.getByRole('button',{name:'다음',exact:true}));
  expect(document.querySelector('.wg-eyebrow').textContent).toContain('3 / 3');
  expect(document.querySelector('.wg-page').textContent).toContain('희생 번트');
  expect(screen.queryByRole('button',{name:'다음',exact:true})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'플레이 시작'}));
  expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('seen');
  cleanup();render(<WelcomeGuide/>);
  expect(document.querySelector('.wg-eyebrow').textContent).toContain('1 / 9');
  expect(WELCOME_CHAPTERS).toHaveLength(9);
});

it('uses the short guide only on an unseen new run and retains the existing seen key',()=>{
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));
  fireEvent.click(screen.getAllByTestId('start-pack')[0]);fireEvent.click(screen.getByTestId('start-pack-go'));
  expect(document.querySelector('.wg-eyebrow').textContent).toContain('1 / 3');
  fireEvent.click(screen.getByRole('button',{name:'다음',exact:true}));fireEvent.click(screen.getByRole('button',{name:'다음',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'플레이 시작'}));
  expect(screen.queryByRole('dialog',{name:'게임 방법'})).toBeNull();
  expect(E.readV10Duel(localStorage).phase).toBe('map');
  cleanup();
  // A previous player's existing seen flag must not be migrated/reset.
  localStorage.clear();localStorage.setItem(WELCOME_SEEN_KEY,'seen');
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));
  fireEvent.click(screen.getAllByTestId('start-pack')[0]);fireEvent.click(screen.getByTestId('start-pack-go'));
  expect(screen.queryByRole('dialog',{name:'게임 방법'})).toBeNull();
});

it('opens all nine chapters from settings after an intro has been seen',()=>{
  localStorage.setItem(WELCOME_SEEN_KEY,'seen');render(<Duel/>);
  fireEvent.click(screen.getByRole('button',{name:'설정',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'게임 방법',exact:true}));
  expect(document.querySelector('.wg-eyebrow').textContent).toContain('1 / 9');
});

function beginBudget(lab=false){
  let s=lab?E.createDefenseLabState({seed:914,pack:'hold',scenario:'crisis'}):E.enterV10Node(E.createV10Duel(90211),'a1-entry');
  if(lab){
    const first=['place','fightOff'].map(kind=>s.deck.find(c=>c.kind===kind).id);
    const rest=s.deck.map(c=>c.id).filter(id=>!first.includes(id));
    s.battle.hand=[...first,...rest.slice(0,3)];s.battle.draw=rest.slice(3);s.battle.discard=[];
  }else{
    const ids=[...s.battle.hand];
    s.deck.find(c=>c.id===ids[0]).kind='place';s.deck.find(c=>c.id===ids[1]).kind='laser';
  }
  s.battle.energy=1;
  if(lab){E.saveDefenseLabState(localStorage,s);window.history.replaceState({},'','/?experiment=defense');}
  else E.saveV10Duel(localStorage,s);
  render(<Duel/>);if(!lab)fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  return s;
}

for(const lab of [false,true])it(`marks a support budget limit without blocking a legal main replacement (${lab?'defense':'normal'})`,()=>{
  const s=beginBudget(lab);
  fireEvent.click(document.querySelector('[data-card-kind="place"]'));
  const candidate=document.querySelector(`[data-card-kind="${lab?'fightOff':'laser'}"]`);
  expect(candidate.getAttribute('aria-label')).toContain('지원 비용 초과');
  expect(candidate.querySelector('.bp-card-warning')).toBeNull();
  expect(candidate.querySelector('.bp-card-support-limit')).not.toBeNull();
  expect(candidate.getAttribute('data-support-over-budget')).toBe('true');
  expect(candidate.disabled).toBe(false);expect(candidate.classList.contains('off')).toBe(false);
  fireEvent.click(candidate);
  expect(candidate.getAttribute('aria-pressed')).toBe('true');
  expect(candidate.getAttribute('aria-label')).not.toContain('지원 비용 초과');
  expect(document.querySelector('.bp-compact-summary').textContent).not.toContain('지원 비용 초과');
  const go=screen.getByTestId('bp-swing');expect(go.disabled).toBe(false);
  const read=()=>lab?E.readDefenseLabState(localStorage):E.readV10Duel(localStorage);
  expect(read().stats.pitches).toBe(s.stats.pitches);
  fireEvent.click(go);expect(read().stats.pitches).toBe(s.stats.pitches+1);
});
