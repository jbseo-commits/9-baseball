import {describe,expect,it} from 'vitest';
import {createV10Duel,enterV10Node,createDuel,startBattle} from '../src/duel/engine.js';

// Regression (found in the V12 full-flow smoke): after the locker room removed c0,
// the next battle still dealt c0 — a card no longer in the deck — and the battle
// screen crashed (hand entry undefined). Hands are dealt from the live deck now
// (P1, 2026-10-09 analysis), so the invariant is membership, not fixed ids.
describe('opening hand after the deck was trimmed',()=>{
  it('never deals a card that is not in the deck',()=>{
    for(const removed of [['c0'],['c2','c4'],['c0','c1','c2','c3','c4']]){
      let s=createV10Duel(1);s.deck=s.deck.filter(c=>!removed.includes(c.id));
      s=enterV10Node(s,'a1-entry');
      const ids=new Set(s.deck.map(c=>c.id)),b=s.battle;
      expect(b.hand.every(id=>ids.has(id))).toBe(true);
      expect(b.hand.length).toBe(Math.min(5,s.deck.length));
      const all=[...b.hand,...b.draw,...b.discard];
      expect(new Set(all).size).toBe(all.length);
      expect(all.sort()).toEqual([...ids].sort());
    }
  });
  it('deals five deck cards when the deck is intact',()=>{
    const a=enterV10Node(createV10Duel(1),'a1-entry');
    const b=enterV10Node(createV10Duel(1),'a1-entry');
    expect(a.battle.hand).toEqual(b.battle.hand);
    expect(a.battle.hand).toHaveLength(5);
    const ids=new Set(a.deck.map(c=>c.id));
    for(const id of a.battle.hand)expect(ids.has(id)).toBe(true);
    const legacy=startBattle(createDuel(1,'away'));
    expect(legacy.battle.hand).toHaveLength(5);
    const legacyIds=new Set(legacy.deck.map(c=>c.id));
    for(const id of legacy.battle.hand)expect(legacyIds.has(id)).toBe(true);
  });
});
