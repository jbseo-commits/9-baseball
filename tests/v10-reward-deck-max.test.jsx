// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {DECK_MAX} from '../src/duel/cards.js';
import {createV10Duel,enterV10Node,saveV10Duel,readV10Duel,playV10Action,setAimZone,claimV10Reward,v10RewardOptions} from '../src/duel/engine.js';

/* found by a full-run fuzz (2026-09-30): battle rewards kept adding past DECK_MAX (19, 20 …)
   while the shop and the rules text stop at 18. */
beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

function wonWithDeck(size){
  let s=createV10Duel(0);
  const extra=Array.from({length:size-s.deck.length},(_,i)=>({id:'x'+i,kind:s.deck[0].kind}));
  s={...s,deck:[...s.deck,...extra]};
  s=enterV10Node(s,'a1-entry');
  s={...s,pitcher:{...s.pitcher,hp:1,phase:'critical'}};s=setAimZone(s,s.battle.aimZone);
  return playV10Action(s,{type:'card',id:'basic'});
}

describe('V10 reward respects the deck limit',()=>{
  it('below the limit the reward still adds a card',()=>{
    const s=wonWithDeck(DECK_MAX-1);expect(s.phase).toBe('reward');
    const kinds=v10RewardOptions(s);expect(kinds.length).toBeGreaterThan(0);
    expect(claimV10Reward(s,{type:'add',kind:kinds[0]}).deck.length).toBe(DECK_MAX);
  });
  it('at the limit: no card offers, add is refused, skip still leaves for the map',()=>{
    const s=wonWithDeck(DECK_MAX);expect(s.phase).toBe('reward');
    expect(v10RewardOptions(s)).toEqual([]);
    const kind=s.v10.rewardChoices[0];
    expect(claimV10Reward(s,{type:'add',kind})).toBe(s);
    const t=claimV10Reward(s,{type:'skip'});
    expect(t.phase).toBe('map');expect(t.deck.length).toBe(DECK_MAX);
  });
  it('the reward screen says the deck is full and only offers the way out',()=>{
    const s=wonWithDeck(DECK_MAX);saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    expect(document.querySelectorAll('.bp-offer').length).toBe(0);
    expect(document.querySelector('.bp-stitle p').textContent).toContain(String(DECK_MAX));
    fireEvent.click(screen.getByTestId('bp-stop-skip'));
    expect(readV10Duel(localStorage).phase).toBe('map');
  });
});
