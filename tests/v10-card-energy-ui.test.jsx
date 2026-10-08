// @vitest-environment happy-dom
import React from 'react';
import {act} from 'react';
import {describe,it,expect,vi} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {CARDS,cardCost} from '../src/duel/cards.js';
import {enterV10Node,createV10Duel,previewCard,previewV10Stack,saveV10Duel} from '../src/duel/engine.js';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import Duel from '../src/duel/App.jsx';
import {WELCOME_SEEN_KEY} from '../src/duel/WelcomeGuide.jsx';
import {COACH_KEY} from '../src/duel/BallparkCoach.jsx';
import {LONG_PRESS_MS} from '../src/duel/CardDetailSheet.jsx';

describe('V10 ballpark energy UI',()=>{
  it('shows remaining energy, a numeric prep cost, the selected stack total, and preserves support removal',()=>{
    let s=enterV10Node(createV10Duel(441),'a1-entry');
    const hand=[...s.battle.hand,'c6'].map(id=>({id,entry:s.deck.find(c=>c.id===id),preview:previewCard(s,id)}));
    const supports=[{id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2}];
    const choice=previewV10Stack(s,'c4',supports);
    const onStack=vi.fn();
    const {container}=render(<BallparkBattle s={s} hand={hand} selected="c4" swingStack={supports} choice={choice}
      pitcher={s.pitcher} onStack={onStack} onSelect={()=>{}} onAim={()=>{}} onSwing={()=>{}} onTake={()=>{}}/>);
    expect(screen.getByTestId('bp-energy').getAttribute('aria-label')).toBe('에너지 3/3');
    expect(container.querySelector('.bp-card-cost.prep').textContent).toBe(String(cardCost('setup')));
    expect(container.querySelector('.bp-verbs .bp-verb.go').disabled).toBe(true);
    fireEvent.click(container.querySelector('.bp-card[data-card-kind="place"]'));
    expect(onStack).toHaveBeenCalledWith([{id:'c1',aimZone:7},{id:'c2',aimZone:2}]);
  });

  it('keeps MAIN RUN energy details on a real App long-press after fresh V10 begins from a non-V10 menu',()=>{
    localStorage.clear();localStorage.setItem(WELCOME_SEEN_KEY,'seen');localStorage.setItem(COACH_KEY,'done');
    vi.useFakeTimers();
    try{
      render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));
      fireEvent.click(screen.getByTestId('bp-map-go'));
      const card=document.querySelector('.bp-hand [data-card-kind]:not([data-card-kind="basic"])');
      expect(card).toBeTruthy();
      card.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:1,clientX:10,clientY:10}));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      act(()=>vi.advanceTimersByTime(LONG_PRESS_MS));
      expect(screen.getByRole('dialog',{name:CARDS[card.dataset.cardKind].name+' 카드 설명'}).textContent).toMatch(/MAIN RUN 에너지 비용 · ⚡ [12]/);
    }finally{vi.useRealTimers();}
  });
});
