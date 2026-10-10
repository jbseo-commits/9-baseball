import {describe,expect,it} from 'vitest';
import {createV10Duel,enterV10Node} from '../src/duel/engine.js';

// Analysis P1 (2026-10-09): the stage-0 opening hand was fixed to c0–c4 every run,
// so Act 1 always opened place×4 + strike and earned cards never appeared first.
// Hands are dealt from the live deck now.
function firstBattle(seed,extra=[]){
  let s=createV10Duel(seed);
  for(const kind of extra)s.deck.push({id:'c'+s.nextId++,kind});
  const id=s.runMap.nodes.find(n=>n.type==='battle').id;
  return enterV10Node(s,id);
}

describe('V10 opening hand is dealt, not fixed',()=>{
  it('is deterministic per seed',()=>{
    const a=firstBattle(7).battle.hand.join(),b=firstBattle(7).battle.hand.join();
    expect(a).toBe(b);
  });
  it('draws only ids that are in the deck',()=>{
    const s=firstBattle(7,['slug','finisher','lure']);
    const ids=new Set(s.deck.map(c=>c.id));
    expect(s.battle.hand).toHaveLength(5);
    for(const id of s.battle.hand)expect(ids.has(id)).toBe(true);
  });
  it('varies across seeds (no two fixed openers alike)',()=>{
    const hands=new Set([1,2,3,4,5].map(seed=>firstBattle(seed).battle.hand.join()));
    expect(hands.size).toBeGreaterThan(1);
  });
  it('can include earned cards from the first fight',()=>{
    const seen=Array.from({length:50},(_,i)=>firstBattle(i+1,['slug','finisher','lure']).battle.hand).flat();
    expect(seen.some(id=>Number(id.slice(1))>=9)).toBe(true);
  });
});
