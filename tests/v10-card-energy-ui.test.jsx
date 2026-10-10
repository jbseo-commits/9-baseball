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
import {lessonFor} from '../src/duel/DecisionDebrief.jsx';

/* the opening hand is a seeded deal since autodev P1; these contracts address c0-c4, so pin them */
function pinHand(s,ids=['c0','c1','c2','c3','c4']){const b=s.battle,pool=[...b.hand,...b.draw,...b.discard].filter(id=>!ids.includes(id));b.hand=[...ids];b.draw=pool;b.discard=[];return s;}
describe('V10 ballpark energy UI',()=>{
  it('shows remaining energy, a numeric prep cost, the selected stack total, and preserves support removal',()=>{
    let s=pinHand(enterV10Node(createV10Duel(441),'a1-entry'));
    const hand=[...s.battle.hand,'c6'].map(id=>({id,entry:s.deck.find(c=>c.id===id),preview:previewCard(s,id)}));
    const supports=[{id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2}];
    const choice=previewV10Stack(s,'c4',supports);
    const onStack=vi.fn();
    const {container,rerender}=render(<BallparkBattle s={s} hand={hand} selected="c4" swingStack={supports} choice={choice}
      pitcher={s.pitcher} onStack={onStack} onSelect={()=>{}} onAim={()=>{}} onSwing={()=>{}} onTake={()=>{}}/>);
    expect(screen.getByTestId('bp-energy').getAttribute('aria-label')).toBe('에너지 3/3');
    expect(screen.getByTestId('bp-take').textContent).toContain('다음 공 +1');
    expect(container.querySelector('.bp-card-cost.prep').textContent).toBe(String(cardCost('setup')));
    expect(container.querySelector('.bp-verbs .bp-verb.go').disabled).toBe(true);
    fireEvent.click(container.querySelector('.bp-card[data-card-kind="place"]'));
    expect(onStack).toHaveBeenCalledWith([{id:'c1',aimZone:7},{id:'c2',aimZone:2}]);
    const twoStrike=structuredClone(s);twoStrike.battle.strikes=2;
    rerender(<BallparkBattle s={twoStrike} hand={hand} selected="c4" swingStack={supports} choice={choice}
      pitcher={twoStrike.pitcher} onStack={onStack} onSelect={()=>{}} onAim={()=>{}} onSwing={()=>{}} onTake={()=>{}}/>);
    expect(screen.getByTestId('bp-take').textContent).toContain('볼 +1 · 삼진 0');
    const boosted=structuredClone(s);boosted.battle.energy=0;boosted.battle.energyCap=4;
    rerender(<BallparkBattle s={boosted} hand={hand} selected="c4" swingStack={supports} choice={choice}
      pitcher={boosted.pitcher} onStack={onStack} onSelect={()=>{}} onAim={()=>{}} onSwing={()=>{}} onTake={()=>{}}/>);
    expect(screen.getByTestId('bp-energy').getAttribute('aria-label')).toBe('에너지 0/4');
    boosted.phase='pitch';boosted.battle.takeEnergyBonus=1;
    rerender(<BallparkBattle s={boosted} hand={hand} selected="c4" swingStack={supports} choice={choice}
      pitcher={boosted.pitcher} onStack={onStack} onSelect={()=>{}} onAim={()=>{}} onSwing={()=>{}} onTake={()=>{}}/>);
    expect(screen.getByTestId('bp-energy').textContent).toContain('다음 공 4 · 카드+1');
  });

  it('reports only the actual result-phase card outcome and keeps pre-action hints generic',()=>{
    let s=enterV10Node(createV10Duel(442),'a1-entry');
    const hand=s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id),preview:previewCard(s,id)}));
    const props={hand,selected:null,swingStack:[],choice:null,pitcher:s.pitcher,onStack:()=>{},onSelect:()=>{},onAim:()=>{},onSwing:()=>{},onTake:()=>{}};
    const {container,rerender}=render(<BallparkBattle s={s} {...props}/>);
    expect([...container.querySelectorAll('[data-testid="bp-take"]')].every(x=>x.textContent.includes('다음 공 +1'))).toBe(true);
    const result=structuredClone(s);result.phase='pitch';result.battle.takeEnergyBonus=1;
    rerender(<BallparkBattle s={result} {...props}/>);
    expect(container.querySelector('[data-testid="bp-energy"]').textContent).toContain('다음 공 4 · 카드+1');
    const full=structuredClone(result);full.battle.hand=[...full.battle.hand,...full.deck.slice(5,6).map(c=>c.id)];
    rerender(<BallparkBattle s={full} {...props}/>);
    expect(container.querySelector('[data-testid="bp-energy"]').textContent).toContain('6장 한도');
    const empty=structuredClone(result);empty.battle.hand=empty.battle.hand.slice(0,3);empty.battle.draw=[];empty.battle.discard=[];
    rerender(<BallparkBattle s={empty} {...props}/>);
    expect(container.querySelector('[data-testid="bp-energy"]').textContent).toContain('추가 0');
    const between=structuredClone(result);between.phase='between';
    rerender(<BallparkBattle s={between} {...props}/>);
    expect(container.querySelector('[data-testid="bp-energy"]').textContent).toContain('다음 타자 4 · 카드+1');
  });

  it('does not promise a card in debrief for old metadata or a blocked draw',()=>{
    const combat={choice:'take',verdict:'볼',takeEnergyBonus:1,hpAfter:20};
    const ball=lessonFor(combat,{zone:9,primaryCoverage:[],label:'볼'});
    const walk=lessonFor({...combat,verdict:'볼넷',takeDrawBonus:1},{zone:9,primaryCoverage:[],label:'볼넷'});
    const full=lessonFor({...combat,takeDrawBonus:0,takeDrawReason:'full'},{zone:4,primaryCoverage:[],label:'루킹 스트라이크'});
    expect(ball.title).not.toContain('카드 +1');
    expect(walk.title).toContain('다음 타자 첫 공 4');expect(walk.title).toContain('카드 +1');
    expect(full.title).toContain('6장 한도');
  });

  it('keeps MAIN RUN energy details on a real App long-press after fresh V10 begins from a non-V10 menu',()=>{
    localStorage.clear();localStorage.setItem(WELCOME_SEEN_KEY,'seen');localStorage.setItem(COACH_KEY,'done');
    vi.useFakeTimers();
    try{
      render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));
      fireEvent.click(screen.getAllByTestId('start-pack')[0]);
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
