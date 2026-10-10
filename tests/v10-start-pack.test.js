import {describe,expect,it} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {
  createV10Duel,enterV10Node,playV10Action,
  START_PACKS,startPackOffers,applyStartPack,
} from '../src/duel/engine.js';
import {validateV10State} from '../src/duel/v10-storage.js';

// Analysis P2 (2026-10-09): common 6 + one seeded 3-card direction pack,
// chosen before the first battle and tasted in its opening hand.
function packed(seed,packId){
  let s=createV10Duel(seed);
  s=applyStartPack(s,packId);
  return enterV10Node(s,s.runMap.nodes.find(n=>n.type==='battle').id);
}

describe('V10 start packs',()=>{
  it('offers the three direction packs in seeded order',()=>{
    const a=startPackOffers(11).map(p=>p.id),b=startPackOffers(11).map(p=>p.id);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(['hold','link','power']);
    for(const p of startPackOffers(11)){
      expect(p.kinds).toHaveLength(3);
      for(const kind of p.kinds)expect(Object.hasOwn(CARDS,kind)).toBe(true);
    }
  });

  it('applies one pack to a fresh run and records it',()=>{
    const s=applyStartPack(createV10Duel(21),'power');
    expect(s.deck).toHaveLength(9);
    for(const kind of ['slug','place','strike'])expect(s.deck.map(c=>c.kind)).toContain(kind);
    expect(s.v10.startPack.pack).toBe('power');
    expect(s.v10.startPack.ids).toHaveLength(3);
    expect(validateV10State(s)).toBe(true);
  });

  it('refuses bad packs, repeats, and played runs',()=>{
    const fresh=createV10Duel(21);
    expect(applyStartPack(fresh,'nope')).toBe(fresh);
    const once=applyStartPack(fresh,'link');
    expect(applyStartPack(once,'power')).toBe(once);
    let played=packed(21,'hold');
    played.battle.pending={...played.battle.pending,zone:4,roll:.5};
    played=playV10Action(played,{type:'take'});
    expect(applyStartPack(played,'power')).toBe(played);
  });

  it('holds a pack card in the first opening hand',()=>{
    const s=packed(21,'power');
    const packIds=new Set(s.v10.startPack.ids);
    expect(s.battle.hand.some(id=>packIds.has(id))).toBe(true);
    expect(s.battle.hand).toHaveLength(5);
  });

  it('leaves later battles and pack-less saves to the normal deal',()=>{
    const s=packed(21,'power');
    expect(validateV10State(s)).toBe(true);
    const plain=enterV10Node(createV10Duel(21),createV10Duel(21).runMap.nodes.find(n=>n.type==='battle').id);
    expect(plain.v10.startPack).toBeUndefined();
    expect(plain.battle.hand).toHaveLength(5);
  });
});
