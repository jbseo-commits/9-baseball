import {describe,it,expect} from 'vitest';
import {CARDS,cardCost} from '../src/duel/cards.js';
import {validateV10State} from '../src/duel/v10-storage.js';
import * as E from '../src/duel/engine.js';

function battle(seed=2201){return E.enterV10Node(E.createV10Duel(seed),'a1-entry');}
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

describe('V10 MAIN RUN energy',()=>{
  it('assigns one explicit card cost to every playable card and preserves setup zero',()=>{
    expect(Object.keys(CARDS).length).toBe(151);
    for(const [kind,def] of Object.entries(CARDS)){expect(Number.isInteger(def.cost),kind).toBe(true);expect(def.cost).toBeGreaterThanOrEqual(0);expect(def.cost).toBeLessThanOrEqual(2);}
    expect(cardCost('setup')).toBe(0);expect(cardCost({kind:'setup',plus:true})).toBe(0);expect(cardCost('strike')).toBe(1);expect(cardCost('slug')).toBe(2);
  });

  it('requires the summed main plus support cost and leaves a rejected over-budget action untouched',()=>{
    let s=battle();
    expect(E.v10Energy(s)).toBe(3);
    expect(s.battle.energy).toBe(E.V10_ENERGY_MAX);
    expect(E.v10ActionCost(s,'c4',[{id:'c0',aimZone:8},{id:'c1',aimZone:7}])).toBe(3);
    const exact=E.previewV10Stack(s,'c4',[{id:'c0',aimZone:8},{id:'c1',aimZone:7}]);
    expect(exact.energy).toBe(3);expect(exact.cost).toBe(3);expect(exact.problem).toBeUndefined();
    const result=E.playV10Action(s,{type:'card',id:'c4',supports:[{id:'c0',aimZone:8},{id:'c1',aimZone:7}]});
    expect(result).not.toBe(s);expect(result.battle.energy).toBe(0);expect(result.stats.cards-s.stats.cards).toBe(3);

    const beforeRejected=JSON.stringify(s);
    const over=E.playV10Action(s,{type:'card',id:'c4',supports:[{id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2}]});
    expect(over).toBe(s);
    expect(JSON.stringify(s)).toBe(beforeRejected);
    expect(E.previewV10Stack(s,'c4',[{id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2}]).problem).toMatch(/에너지가 부족/);
    const duplicate=E.playV10Action(s,{type:'card',id:'c4',supports:[{id:'c0',aimZone:8},{id:'c0',aimZone:7}]});
    expect(duplicate).toBe(s);
    expect(JSON.stringify(s)).toBe(beforeRejected); // Compare with the snapshot before either rejected action.
  });

  it('setup spends zero, paid preparations retain the two-use cap, and actual pitch/batter boundaries refill',()=>{
    let s=battle();
    s.battle.hand=['c6','c7','c8','c0','c1']; // A real five-card hand: three preparations and two attacks.
    s.battle.draw=s.deck.filter(c=>!s.battle.hand.includes(c.id)).map(c=>c.id);
    s.battle.energy=1;
    const setup=E.playV10Action(s,{type:'card',id:'c6'});
    expect(setup.battle.energy).toBe(1);expect(setup.battle.preparations).toBe(1);expect(setup.phase).toBe('battle');
    expect(E.previewV10Stack(setup,'c0',[{id:'c1',aimZone:8}]).problem).toMatch(/에너지가 부족/);
    expect(E.playV10Action(setup,{type:'card',id:'c0',supports:[{id:'c1',aimZone:8}]})).toBe(setup);
    const prepared=E.playV10Action(setup,{type:'card',id:'c7'});
    expect(prepared.battle.energy).toBe(0);expect(prepared.battle.preparations).toBe(2);
    const denied=E.playV10Action(prepared,{type:'card',id:'c8'});
    expect(denied).toBe(prepared); // the third preparation is denied by the unchanged plate cap
    const took=E.playV10Action(prepared,{type:'take'});
    expect(took.battle.energy).toBe(0);expect(took.phase).toBe('pitch');
    const nextPitch=E.advanceV10Pitch(took);
    expect(nextPitch.battle.energy).toBe(3);expect(nextPitch.battle.preparations).toBe(2);

    nextPitch.battle.energy=0;nextPitch.battle.balls=3;nextPitch.battle.pending={...nextPitch.battle.pending,zone:9};
    const walked=E.playV10Action(nextPitch,{type:'take'});
    expect(walked.phase).toBe('between');expect(walked.battle.energy).toBe(0);
    const nextBatter=E.advanceV10Batter(walked);
    expect(nextBatter.battle.energy).toBe(3);expect(nextBatter.battle.preparations).toBe(0);
  });

  it('does not add V10 energy to V9 battles or change their card-action behavior',()=>{
    let s=E.startBattle(E.createDuel(2526,'away'));
    expect(s.version).toBe(9);expect(s.battle.energy).toBeUndefined();
    const before=s.battle.preparations;
    const next=E.playCard(s,'c4'); // V9 starter card c4 is a preparation card
    expect(next.battle.energy).toBeUndefined();expect(next.battle.preparations).toBe(before+1);
  });

  it('keeps free basic swings and watching usable at zero energy',()=>{
    let s=battle();s.battle.energy=0;
    const basic=E.playV10Action(s,{type:'card',id:'basic'});
    expect(basic).not.toBe(s);expect(basic.battle.energy).toBe(0);
    let t=battle(2202);t.battle.energy=0;
    const take=E.playV10Action(t,{type:'take'});
    expect(take).not.toBe(t);expect(take.battle.energy).toBe(0);
  });

  it('round trips zero and mid-pitch energy, initializes only missing legacy energy, and rejects invalid values',()=>{
    for(const amount of [0,2]){
      const s=battle(2300+amount);s.battle.energy=amount;
      const store=memory();E.saveV10Duel(store,s);expect(E.readV10Duel(store).battle.energy).toBe(amount);
    }
    const legacy=battle(2401);delete legacy.battle.energy;
    expect(validateV10State(legacy)).toBe(true);
    const store=memory();store.setItem(E.V10_SAVE_KEY,JSON.stringify(legacy));
    expect(E.readV10Duel(store).battle.energy).toBe(3);
    for(const bad of [-1,4,1.5]){const s=battle(2500);s.battle.energy=bad;expect(validateV10State(s)).toBe(false);}
  });
});
