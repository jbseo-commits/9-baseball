import {describe,it,expect} from 'vitest';
import {CARDS,cardCost} from '../src/duel/cards.js';
import {validateV10State} from '../src/duel/v10-storage.js';
import * as E from '../src/duel/engine.js';

/* the opening hand is a seeded deal since autodev P1; these contracts address c0-c4, so pin them */
function pinHand(s,ids=['c0','c1','c2','c3','c4']){const b=s.battle,pool=[...b.hand,...b.draw,...b.discard].filter(id=>!ids.includes(id));b.hand=[...ids];b.draw=pool;b.discard=[];return s;}
function battle(seed=2201){return pinHand(E.enterV10Node(E.createV10Duel(seed),'a1-entry'));}
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

describe('V10 MAIN RUN energy',()=>{
  it('assigns one explicit card cost to every playable card and preserves setup zero',()=>{
    expect(Object.keys(CARDS).length).toBe(151);
    for(const [kind,def] of Object.entries(CARDS)){expect(Number.isInteger(def.cost),kind).toBe(true);expect(def.cost).toBeGreaterThanOrEqual(0);expect(def.cost).toBeLessThanOrEqual(2);}
    expect(cardCost('setup')).toBe(0);expect(cardCost({kind:'setup',plus:true})).toBe(0);expect(cardCost('strike')).toBe(2);expect(cardCost('laser')).toBe(1);expect(cardCost('commit')).toBe(1);expect(cardCost('wall')).toBe(2);expect(cardCost('thunder')).toBe(2);expect(cardCost('slug')).toBe(2);
    for(const [kind,shape] of Object.entries(CARDS))if(shape.type==='attack'&&['row','column','diag','cross','x','box','corners','all'].includes(shape.shape)&&!shape.bunt&&shape.rarity!=='signature')expect(cardCost(kind),kind).toBe(2);
    for(const kind of ['laser','commit'])expect(cardCost(kind),kind).toBe(1);
    for(const kind of ['wall','thunder'])expect(cardCost(kind),kind).toBe(2);
  });

  it('requires the summed main plus support cost and leaves a rejected over-budget action untouched',()=>{
    let s=battle();
    expect(E.v10Energy(s)).toBe(2);
    expect(s.battle.energy).toBe(E.V10_ENERGY_BASE);
    expect(s.battle.energyCap).toBe(2);expect(s.battle.takeEnergyBonus).toBe(0);
    s.deck.find(c=>c.id==='c4').kind='laser'; // signature 1-cost main + two 1-cost support cards = 3 on an actual boosted pitch
    const took=E.playV10Action(s,{type:'take'});const boosted=E.advanceV10Pitch(took);
    expect(boosted.battle.energy).toBe(3);expect(boosted.battle.energyCap).toBe(3);
    expect(E.v10ActionCost(boosted,'c4',[{id:'c0',aimZone:8},{id:'c1',aimZone:7}])).toBe(3);
    const exact=E.previewV10Stack(boosted,'c4',[{id:'c0',aimZone:8},{id:'c1',aimZone:7}]);
    expect(exact.energy).toBe(3);expect(exact.cost).toBe(3);expect(exact.problem).toBeUndefined();
    const result=E.playV10Action(boosted,{type:'card',id:'c4',supports:[{id:'c0',aimZone:8},{id:'c1',aimZone:7}]});
    expect(result).not.toBe(boosted);expect(result.battle.energy).toBe(0);expect(result.stats.cards-boosted.stats.cards).toBe(3);

    s.deck.find(c=>c.id==='c4').kind='strike';
    const beforeRejected=JSON.stringify(s);
    const over=E.playV10Action(s,{type:'card',id:'c4',supports:[{id:'c0',aimZone:8}]}); // 2-cost ordinary 3-zone card + support exceeds base 2
    expect(over).toBe(s);
    expect(JSON.stringify(s)).toBe(beforeRejected);
    expect(E.previewV10Stack(s,'c4',[{id:'c0',aimZone:8}]).problem).toMatch(/에너지가 부족/);
    const duplicate=E.playV10Action(s,{type:'card',id:'c4',supports:[{id:'c0',aimZone:8},{id:'c0',aimZone:7}]});
    expect(duplicate).toBe(s);
    expect(JSON.stringify(s)).toBe(beforeRejected);
  });

  it('setup spends zero, paid preparations retain the two-use cap, and actual pitch/batter boundaries refill',()=>{
    let s=battle();
    s.battle.hand=['c6','c7','c8','c0','c1']; // A real five-card hand: three preparations and two attacks.
    s.battle.draw=s.deck.filter(c=>!s.battle.hand.includes(c.id)).map(c=>c.id);
    const setup=E.playV10Action(s,{type:'card',id:'c6'});
    expect(setup.battle.energy).toBe(2);expect(setup.battle.preparations).toBe(1);expect(setup.phase).toBe('battle');
    const prepared=E.playV10Action(setup,{type:'card',id:'c7'});
    expect(prepared.battle.energy).toBe(1);expect(prepared.battle.preparations).toBe(2);
    expect(E.previewV10Stack(prepared,'c0',[{id:'c1',aimZone:8}]).problem).toMatch(/에너지가 부족/);
    expect(E.playV10Action(prepared,{type:'card',id:'c0',supports:[{id:'c1',aimZone:8}]})).toBe(prepared);
    const denied=E.playV10Action(prepared,{type:'card',id:'c8'});
    expect(denied).toBe(prepared); // the third preparation is denied by the unchanged plate cap
    const took=E.playV10Action(prepared,{type:'take'});
    expect(took.battle.energy).toBe(1);expect(took.phase).toBe('pitch');
    const nextPitch=E.advanceV10Pitch(took);
    expect(nextPitch.battle.energy).toBe(3);expect(nextPitch.battle.energyCap).toBe(3);expect(nextPitch.battle.preparations).toBe(2);

    nextPitch.battle.energy=0;nextPitch.battle.balls=3;nextPitch.battle.pending={...nextPitch.battle.pending,zone:9};
    const walked=E.playV10Action(nextPitch,{type:'take'});
    expect(walked.phase).toBe('between');expect(walked.battle.energy).toBe(0);
    const nextBatter=E.advanceV10Batter(walked);
    expect(nextBatter.battle.energy).toBe(3);expect(nextBatter.battle.energyCap).toBe(3);expect(nextBatter.battle.preparations).toBe(0);
  });

  it('reserves one energy after a ball or called strike, transfers walks to the next batter, and never stacks',()=>{
    let s=battle(2601);s.battle.pending.zone=9;
    let took=E.playV10Action(s,{type:'take'});
    expect(took.battle.energy).toBe(2);expect(took.battle.energyCap).toBe(2);expect(took.battle.takeEnergyBonus).toBe(1);
    expect(took.v10.lastCombat.takeEnergyBonus).toBe(1);expect(took.battle.revealed.takeEnergyBonus).toBe(1);
    let next=E.advanceV10Pitch(took);
    expect(next.battle.energy).toBe(3);expect(next.battle.energyCap).toBe(3);expect(next.battle.takeEnergyBonus).toBe(0);
    expect(E.advanceV10Pitch(next)).toBe(next); // duplicate/invalid phase transition cannot recharge or consume twice
    expect(E.advanceV10Batter(next)).toBe(next);
    next.battle.pending.zone=0;
    took=E.playV10Action(next,{type:'take'});
    expect(took.battle.takeEnergyBonus).toBe(1); // a second TAKE replaces the pending 1
    const consecutive=E.advanceV10Pitch(took);
    expect(consecutive.battle.energy).toBe(3);expect(consecutive.battle.energyCap).toBe(3);
    consecutive.battle.pending.zone=9;
    const swung=E.playV10Action(consecutive,{type:'card',id:'basic'});
    const afterSwing=E.advanceV10Pitch(swung);
    expect(afterSwing.battle.energy).toBe(2);expect(afterSwing.battle.energyCap).toBe(2);

    for(const strikes of [0,1]){
      const called=battle(2603+strikes);called.battle.pending.zone=0;called.battle.strikes=strikes;
      const calledTake=E.playV10Action(called,{type:'take'});
      expect(calledTake.battle.revealed.kind).toBe('called');expect(calledTake.battle.takeEnergyBonus).toBe(1);
      expect(calledTake.v10.lastCombat.takeEnergyBonus).toBe(1);
    }

    let walk=battle(2602);walk.battle.pending.zone=9;walk.battle.balls=3;walk.battle.energy=0;
    const walked=E.playV10Action(walk,{type:'take'});
    expect(walked.phase).toBe('between');expect(walked.battle.takeEnergyBonus).toBe(1);
    expect(walked.v10.lastCombat.takeEnergyBonus).toBe(1);
    const nextBatter=E.advanceV10Batter(walked);
    expect(nextBatter.battle.energy).toBe(3);expect(nextBatter.battle.energyCap).toBe(3);expect(nextBatter.battle.takeEnergyBonus).toBe(0);
  });

  it('does not reserve energy for a strikeout or pitcher HP 0 and resets each new battle to 2',()=>{
    let strikeout=battle(2611);strikeout.battle.pending.zone=0;strikeout.battle.strikes=2;
    strikeout=E.playV10Action(strikeout,{type:'take'});
    expect(strikeout.phase).toBe('between');expect(strikeout.battle.takeEnergyBonus).toBe(0);
    expect(strikeout.v10.lastCombat.takeEnergyBonus).toBe(0);
    expect(strikeout.v10.lastCombat.takeDrawBonus).toBe(0);expect(strikeout.battle.revealed.takeDrawBonus).toBe(0);
    const afterStrikeout=E.advanceV10Batter(strikeout);
    expect(afterStrikeout.battle.energy).toBe(2);expect(afterStrikeout.battle.energyCap).toBe(2);
    expect(afterStrikeout.battle.hand).toHaveLength(5);expect(afterStrikeout.last.takeDrawn).toBeUndefined();
    const lastOut=battle(888);lastOut.battle.pending.zone=0;lastOut.battle.strikes=2;lastOut.battle.outs=2;
    const lost=E.playV10Action(lastOut,{type:'take'});
    expect(lost.phase).toBe('lost');expect(lost.battle.takeEnergyBonus).toBe(0);
    expect(lost.v10.lastCombat.takeDrawBonus).toBe(0);
    expect(E.advanceV10Batter(lost)).toBe(lost);
    let hpZero=battle(889);hpZero.battle.pending.zone=9;hpZero.battle.balls=3;hpZero.pitcher.hp=1;
    hpZero=E.playV10Action(hpZero,{type:'take'});
    expect(hpZero.pitcher.hp).toBe(0);expect(hpZero.phase).toBe('reward');expect(hpZero.battle.takeEnergyBonus).toBe(0);
    expect(hpZero.v10.lastCombat.takeEnergyBonus).toBe(0);
    expect(hpZero.v10.lastCombat.takeDrawBonus).toBe(0);expect(hpZero.battle.revealed.takeDrawBonus).toBe(0);
    expect(E.advanceV10Batter(hpZero)).toBe(hpZero);
    expect(hpZero.last.events).not.toContain('지켜보기 보상 · 다음 실제 공 에너지 +1');
    expect(hpZero.battle.log).not.toContain('지켜보기 보상 · 다음 실제 공 에너지 +1');
    const map=E.claimV10Reward(hpZero,{type:'skip'});
    const node=map.runMap.reachableIds.map(id=>map.runMap.nodes.find(n=>n.id===id)).find(n=>['battle','elite','boss'].includes(n.type));
    expect(node).toBeTruthy();
    const newBattle=E.enterV10Node(map,node.id);
    expect(newBattle.phase).toBe('battle');
    expect(newBattle.battle.energy).toBe(2);expect(newBattle.battle.energyCap).toBe(2);expect(newBattle.battle.takeEnergyBonus).toBe(0);
    expect(newBattle.battle.hand).toHaveLength(5);
  });

  it('preserves an old 4-cap pitch and rejects a five-cost action without mutation',()=>{
    let s=battle(2621);s.battle.energy=4;s.battle.energyCap=4;
    const four=[{id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2}];
    s.deck.find(c=>c.id==='c4').kind='laser';
    expect(E.v10ActionCost(s,'c4',four)).toBe(4);
    const accepted=E.playV10Action(s,{type:'card',id:'c4',supports:four});
    expect(accepted).not.toBe(s);expect(accepted.battle.energy).toBe(0);
    const costly=battle(2622);costly.deck.push({id:'heavy',kind:'slug'});costly.battle.hand=[...costly.battle.hand.slice(0,4),'heavy'];
    costly.battle.energy=4;costly.battle.energyCap=4;
    const supports=[{id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2}];
    expect(E.v10ActionCost(costly,'heavy',supports)).toBe(5);
    const before=JSON.stringify(costly),denied=E.playV10Action(costly,{type:'card',id:'heavy',supports});
    expect(denied).toBe(costly);expect(JSON.stringify(costly)).toBe(before);
  });

  it('does not add V10 energy to V9 battles or change their card-action behavior',()=>{
    let s=E.startBattle(E.createDuel(2526,'away'));
    expect(s.version).toBe(9);expect(s.battle.energy).toBeUndefined();
    const before=s.battle.preparations;
    const next=E.playCard(s,'c4'); // V9 starter card c4 is a preparation card
    expect(next.battle.energy).toBeUndefined();expect(next.battle.preparations).toBe(before+1);
    expect(E.endTurn(s).battle.revealed.takeEnergyBonus).toBeUndefined();
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
    for(const amount of [0,2,3,4]){
      const s=battle(2300+amount);s.battle.energy=amount;s.battle.energyCap=amount<=2?2:amount;
      if(amount>=3)s.battle.takeEnergyBonus=1;
      const store=memory();E.saveV10Duel(store,s);const loaded=E.readV10Duel(store);
      expect(loaded.battle.energy).toBe(amount);expect(loaded.battle.energyCap).toBe(s.battle.energyCap);expect(loaded.battle.takeEnergyBonus).toBe(s.battle.takeEnergyBonus);
    }
    const legacy=battle(2401);delete legacy.battle.energy;delete legacy.battle.energyCap;delete legacy.battle.takeEnergyBonus;
    expect(validateV10State(legacy)).toBe(true);
    const store=memory();store.setItem(E.V10_SAVE_KEY,JSON.stringify(legacy));
    expect(E.readV10Duel(store).battle.energy).toBe(2);
    const legacyZero=battle(2402);legacyZero.battle.energy=0;delete legacyZero.battle.energyCap;delete legacyZero.battle.takeEnergyBonus;
    store.setItem(E.V10_SAVE_KEY,JSON.stringify(legacyZero));expect(E.readV10Duel(store).battle.energy).toBe(0);
    for(const bad of [-1,5,1.5]){const s=battle(2500);s.battle.energy=bad;expect(validateV10State(s)).toBe(false);}
    for(const [key,value] of [['energyCap',1],['energyCap',5],['takeEnergyBonus',-1],['takeEnergyBonus',2]]){const s=battle(2501);s.battle[key]=value;expect(validateV10State(s)).toBe(false);}
    const overCap=battle(2502);overCap.battle.energy=4;expect(validateV10State(overCap)).toBe(false);
  });

  it('round trips a reserved result and a spent boosted pitch with the correct denominator',()=>{
    const pending=battle(2701);pending.battle.pending.zone=9;pending.battle.energy=0;
    const result=E.playV10Action(pending,{type:'take'});
    expect(result.phase).toBe('pitch');expect(result.battle.energy).toBe(0);expect(result.battle.energyCap).toBe(2);
    expect(result.battle.takeEnergyBonus).toBe(1);expect(result.v10.lastCombat.takeEnergyBonus).toBe(1);
    const storage=memory();E.saveV10Duel(storage,result);
    const restored=E.readV10Duel(storage);
    expect(restored.battle.energy).toBe(0);expect(E.v10EnergyCap(restored)).toBe(2);
    expect(restored.battle.takeEnergyBonus).toBe(1);expect(restored.v10.lastCombat.takeEnergyBonus).toBe(1);
    const boosted=E.advanceV10Pitch(restored);boosted.battle.energy=0;
    const boostedStorage=memory();E.saveV10Duel(boostedStorage,boosted);
    const boostedRestored=E.readV10Duel(boostedStorage);
    expect(boostedRestored.battle.energy).toBe(0);expect(E.v10EnergyCap(boostedRestored)).toBe(3);
  });

  it('normalizes incomplete legacy energy pairs and preserves old live pitch caps until transition',()=>{
    for(const [amount,cap] of [[3,3],[4,4]]){
      const s=battle(2800+amount);s.battle.energy=amount;s.battle.energyCap=cap;
      const storage=memory();E.saveV10Duel(storage,s);const loaded=E.readV10Duel(storage);
      expect(loaded.battle.energy).toBe(amount);expect(E.v10EnergyCap(loaded)).toBe(cap);
      loaded.phase='pitch';loaded.battle.takeEnergyBonus=0;
      const next=E.advanceV10Pitch(loaded);
      expect(next.battle.energy).toBe(2);expect(next.battle.energyCap).toBe(2);
    }
    const missingBoth=battle(2810);delete missingBoth.battle.energy;delete missingBoth.battle.energyCap;
    const storage=memory();E.saveV10Duel(storage,missingBoth);const normalized=E.readV10Duel(storage);
    expect(normalized.battle.energy).toBe(2);expect(E.v10EnergyCap(normalized)).toBe(2);
    const energyOnly=battle(2811);energyOnly.battle.energy=3;delete energyOnly.battle.energyCap;
    storage.setItem(E.V10_SAVE_KEY,JSON.stringify(energyOnly));
    expect(E.readV10Duel(storage).battle.energy).toBe(3);expect(E.v10EnergyCap(E.readV10Duel(storage))).toBe(3);
  });
});
