// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel,previewV10Stack} from '../src/duel/engine.js';
import {COACH_KEY} from '../src/duel/BallparkCoach.jsx';

beforeEach(()=>{localStorage.clear();localStorage.setItem(COACH_KEY,'done');});
afterEach(cleanup);

function open({kinds=['place','strike','flow','bunt'],strikes=0,preparations=0,energy=null,phase='steady',gimmick=null,problems=null}={}){
  const s=enterV10Node(createV10Duel(90211),'a1-entry');
  s.battle.strikes=strikes;s.battle.preparations=preparations;
  if(Number.isInteger(energy))s.battle.energy=energy;
  if(gimmick)s.v10.opponent.gimmick=gimmick;
  const pitcher={name:'레드 러시',hp:phase==='critical'?10:phase==='pressured'?30:60,maxHp:60,phase};
  const hand=kinds.map((kind,i)=>({id:'c'+i,entry:{kind},preview:{coverage:[4],problem:problems?.[i]||null}}));
  const onSelect=vi.fn(),onStack=vi.fn(),onAim=vi.fn(),onSwing=vi.fn(),onTake=vi.fn();
  const props={s,hand,pitcher,label:'1막',selected:null,swingStack:[],choice:null,
    onSelect,onStack,onAim,onSwing,onTake};
  const result=render(<BallparkBattle {...props}/>);
  return {...result,props,kinds,onSelect,onStack,onAim,onSwing,onTake};
}
const summary=()=>screen.getByTestId('bp-plan').textContent;
/* Taps like a player, then applies the tap the way the parent would
   (selected id + engine choice), so the summary under test is real. */
function choose(view,idx){
  const kind=view.kinds[idx],id='c'+idx;
  fireEvent.click(document.querySelector(`[data-card-kind="${kind}"]`));
  view.rerender(<BallparkBattle {...view.props} selected={id}
    choice={previewV10Stack(view.props.s,id,view.props.swingStack||[])}/>);
  return id;
}

describe('plan summary states',()=>{
  it('unselected names energy and the next step, without stats',()=>{
    open();
    expect(summary()).toContain('카드와 코스를 고르세요');
    expect(screen.getByTestId('bp-energy')).not.toBeNull();
  });
  it('main selection shows cost total, public range and rate in separate fields',()=>{
    const view=open();
    choose(view,0);
    expect(summary()).toMatch(/합계 1\/3/);
    expect(summary()).toMatch(/적중권|피해 ×/);
    expect(summary()).toContain('실행하세요');
  });
  it('armed names the pending join total and waits for a zone',()=>{
    const view=open({kinds:['place','strike']});
    choose(view,0);
    fireEvent.click(document.querySelector('[data-card-kind="strike"]'));
    expect(document.querySelector('[data-card-kind="strike"]').classList.contains('armed')).toBe(true);
    expect(summary()).toContain('지원할 코스 선택');
    expect(summary()).toMatch(/합계 2\/3/);
  });
  it('prep selection shows cost, remaining count and usability',()=>{
    const view=open();
    const id=choose(view,2);
    expect(summary()).toContain('준비');
    expect(view.onSelect).toHaveBeenCalledWith(id);
  });
  it('blocked plans print the engine reason instead of a generic warning',()=>{
    const view=open({kinds:['slug'],energy:1});
    fireEvent.click(document.querySelector('[data-card-kind="slug"]'));
    view.rerender(<BallparkBattle {...view.props} selected="c0"
      choice={{problem:'에너지가 부족합니다 · 2/1 필요',cost:2,energy:1}}/>);
    expect(summary()).toContain('에너지가 부족합니다');
  });
  it('hover never selects and never rewrites the summary',()=>{
    const view=open();
    const before=summary();
    const card=document.querySelector('[data-card-kind="place"]');
    fireEvent.mouseOver(card);fireEvent.focus(card);
    expect(card.classList.contains('main')).toBe(false);
    expect(view.onSelect).not.toHaveBeenCalled();
    expect(summary()).toBe(before);
  });
});

describe('arena inspector',()=>{
  it('opens from the pitcher toggle without touching the plan',()=>{
    const view=open();
    fireEvent.click(document.querySelector('[data-card-kind="place"]'));
    view.rerender(<BallparkBattle {...view.props} selected="c0"/>);
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    expect(screen.getByTestId('bp-inspect')).not.toBeNull();
    expect(view.onSelect).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.bp-scene').getAttribute('inert')).not.toBeNull();
  });
  it('a hand tap while inspecting only changes the inspected card',()=>{
    const view=open();
    fireEvent.click(document.querySelector('[data-card-kind="place"]'));
    view.rerender(<BallparkBattle {...view.props} selected="c0"/>);
    view.onSelect.mockClear();
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    fireEvent.click(document.querySelector('[data-card-kind="strike"]'));
    // Plan untouched: no new selection, main kept.
    expect(view.onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('[data-card-kind="place"]').classList.contains('main')).toBe(true);
    // Inspected card followed the tap.
    fireEvent.click(screen.getByRole('tab',{name:'카드'}));
    expect(screen.getByTestId('bp-inspect').textContent).toContain('밀어치기');
  });
  it('locks execution while open and restores focus and plan on close',()=>{
    const view=open();
    fireEvent.click(document.querySelector('[data-card-kind="place"]'));
    view.rerender(<BallparkBattle {...view.props} selected="c0"/>);
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    expect(screen.getByTestId('bp-swing').disabled).toBe(true);
    expect(screen.getByTestId('bp-take').disabled).toBe(true);
    view.onSwing.mockClear();
    fireEvent.click(screen.getByTestId('bp-swing'));
    expect(view.onSwing).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('bp-inspect-back'));
    expect(screen.queryByTestId('bp-inspect')).toBeNull();
    expect(document.querySelector('[data-card-kind="place"]').classList.contains('main')).toBe(true);
    expect(screen.getByTestId('bp-swing').disabled).toBe(false);
  });
  it('pile entry shows counts and kind groups with the order concealed',()=>{
    open();
    fireEvent.click(screen.getByRole('button',{name:/패 더미 보기/}));
    const body=screen.getByTestId('bp-inspect').textContent;
    expect(body).toContain('순서 비공개');
    expect(body).toMatch(/남은 더미 \d+장/);
    expect(body).toMatch(/버림 더미 \d+장/);
  });
  it('shows one tab body at a time and marks the current gimmick phase',()=>{
    open({phase:'critical',gimmick:{id:'tyrant',label:'낮은 벽',summary:'낮은 3코스 비중 +10%p.',phases:{pressured:'지배: 준비 1회.',critical:'낮은 3코스 +20%p.'}}});
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    const body=screen.getByTestId('bp-inspect').textContent;
    expect(body).toContain('+20%p');
    expect(body).toContain('현재');
    expect(body).not.toContain('순서 비공개');
  });
  it('Escape closes the inspector first and keeps the plan (full app)',()=>{
    let s=createV10Duel(11);s=enterV10Node(s,'a1-entry');
    saveV10Duel(localStorage,s);
    render(<Duel/>);
    fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    const first=document.querySelector('.bp-hand .bp-card:not(.basic)');
    fireEvent.click(first);
    const kind=first.dataset.cardKind;
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    expect(screen.getByTestId('bp-inspect')).not.toBeNull();
    fireEvent.keyDown(window,{key:'Escape'});
    // Inspector closed, plan kept: the card is still the main one.
    expect(screen.queryByTestId('bp-inspect')).toBeNull();
    expect(document.querySelector(`.bp-card[data-card-kind="${kind}"]`).classList.contains('main')).toBe(true);
  });
});

describe('gimmick current values',()=>{
  it('pressure follows the frozen count and never invents a 0S reduction',()=>{
    let view=open({gimmick:{id:'pressure',label:'압박 투구',summary:'x'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('이번 카운트 적용 없음');
    view.unmount();view=open({strikes:1,gimmick:{id:'pressure',label:'압박 투구',summary:'x'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('코스 +1');
    expect(screen.getByTestId('bp-gimmick').textContent).not.toContain('볼 감소');
  });
  it('tyrant critical shows +20%p, never added onto +10%p',()=>{
    open({phase:'critical',gimmick:{id:'tyrant',label:'낮은 벽',summary:'낮은 3코스 비중 +10%p.'}});
    const t=screen.getByTestId('bp-gimmick').textContent;
    expect(t).toContain('+20%p');
    expect(t).not.toContain('+10%p');
  });
});
