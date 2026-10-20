import {describe,expect,it} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {
  createV10Duel,enterV10Node,playV10Action,
  START_PACKS,startPackOffers,applyStartPack,
} from '../src/duel/engine.js';
import {validateV10State} from '../src/duel/v10-storage.js';

// Starter-deck variety: two shared cards + seven direction cards,
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
      expect(p.kinds).toHaveLength(7);
      expect(p.featured).toHaveLength(3);
      for(const kind of p.kinds)expect(Object.hasOwn(CARDS,kind)).toBe(true);
    }
  });

  it('applies one pack to a fresh run and records it',()=>{
    const s=applyStartPack(createV10Duel(21),'power');
    expect(s.deck).toHaveLength(9);
    expect(s.deck.map(c=>c.kind).sort()).toEqual(['place','scout','slug','slug','soloShot','gapHunter','loadPower','setup','watch'].sort());
    expect(s.v10.startPack.pack).toBe('power');
    expect(s.v10.startPack.ids).toHaveLength(7);
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

  it('holds one card from each role group in the first opening hand',()=>{
    for(const [pack,groups] of Object.entries({power:[['slug','soloShot'],['loadPower','setup']],link:[['tableSetter'],['rally','hitAndRun','relayBat']],hold:[['cutMaster','foulTip','fightOff'],['wearDown','benchCheer']]})){
      const s=packed(21,pack),hand=s.battle.hand.map(id=>s.deck.find(c=>c.id===id).kind);
      expect(groups.every(group=>hand.some(kind=>group.includes(kind)))).toBe(true);
      expect(s.battle.hand).toHaveLength(5);
    }
  });

  it('leaves later battles and pack-less saves to the normal deal',()=>{
    const s=packed(21,'power');
    expect(validateV10State(s)).toBe(true);
    const plain=enterV10Node(createV10Duel(21),createV10Duel(21).runMap.nodes.find(n=>n.type==='battle').id);
    expect(plain.v10.startPack).toBeUndefined();
    expect(plain.battle.hand).toHaveLength(5);
  });
});
