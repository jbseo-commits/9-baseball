import {describe,it,expect} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {START_PACK_COMMON,START_PACKS,applyStartPack,createV10Duel,enterV10Node,advanceBatter,playCard,playV10Action,swingOdds,hitProfile,matchup} from '../src/duel/engine.js';

const roleGroups={
  power:[['slug','soloShot'],['loadPower','setup']],
  link:[['tableSetter'],['rally','hitAndRun','relayBat']],
  hold:[['cutMaster','foulTip','fightOff'],['wearDown','benchCheer']],
};
const firstBattle=(seed,pack)=>{
  let s=createV10Duel(seed);s=applyStartPack(s,pack);
  return enterV10Node(s,s.runMap.nodes.find(n=>n.type==='battle').id);
};
const kinds=(s,ids)=>ids.map(id=>s.deck.find(c=>c.id===id)?.kind);
const pinDeckKind=(s,kind)=>{
  const id=s.deck.find(c=>c.kind===kind&&!s.battle.hand.includes(c.id))?.id
    ||s.deck.find(c=>c.kind===kind)?.id;
  if(!id)throw new Error(`missing ${kind} in starter deck`);
  if(s.battle.hand.includes(id))return id;
  const pile=s.battle.draw.includes(id)?s.battle.draw:s.battle.discard;
  const index=pile.indexOf(id);if(index<0)throw new Error(`${kind} is outside battle piles`);
  const displaced=s.battle.hand.pop();pile.push(displaced);pile.splice(index,1);s.battle.hand.push(id);
  return id;
};

describe('starter deck variety',()=>{
  it('defines two shared cards and seven direction cards with at most three-way overlap',()=>{
    expect(START_PACK_COMMON).toEqual(['place','scout']);
    expect(START_PACKS.map(p=>p.id)).toEqual(['power','link','hold']);
    for(const p of START_PACKS){
      expect(p.kinds).toHaveLength(7);expect(p.featured).toHaveLength(3);
      const all=[...START_PACK_COMMON,...p.kinds];expect(all).toHaveLength(9);
      expect(all.every(k=>CARDS[k])).toBe(true);
      expect(all.filter(k=>k==='place')).toHaveLength(1);expect(all.filter(k=>k==='scout')).toHaveLength(1);
    }
    for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
      const A=[...START_PACK_COMMON,...START_PACKS[a].kinds],B=[...START_PACK_COMMON,...START_PACKS[b].kinds];
      const overlap=[...new Set(A)].reduce((n,k)=>n+Math.min(A.filter(x=>x===k).length,B.filter(x=>x===k).length),0);
      expect(overlap).toBeLessThanOrEqual(3);
    }
  });
  it('preserves nine card IDs while applying exactly the common two plus direction seven',()=>{
    for(const p of START_PACKS){
      const source=createV10Duel(104),before=JSON.stringify(source),next=applyStartPack(source,p.id);
      expect(JSON.stringify(source)).toBe(before);
      expect(next.deck.map(c=>c.id)).toEqual(source.deck.map(c=>c.id));
      expect(next.deck).toHaveLength(9);expect(next.nextId).toBe(source.nextId);
      expect(next.deck.map(c=>c.kind).sort()).toEqual([...START_PACK_COMMON,...p.kinds].sort());
      expect(next.v10.startPack).toMatchObject({pack:p.id,ids:expect.any(Array)});
      expect(next.v10.startPack.ids).toHaveLength(7);
      expect(kinds(next,next.v10.startPack.ids).sort()).toEqual([...p.kinds].sort());
    }
  });
  it('guarantees both role groups while retaining five cards and all nine IDs across seeds',()=>{
    for(const p of START_PACKS)for(let seed=31;seed<61;seed++){
      const s=firstBattle(seed,p.id),handKinds=kinds(s,s.battle.hand),roles=roleGroups[p.id];
      for(const group of roles)expect(handKinds.some(k=>group.includes(k)),`${p.id} seed ${seed} ${group}`).toBe(true);
      expect(s.battle.hand).toHaveLength(5);
      expect([...s.battle.hand,...s.battle.draw,...s.battle.discard].sort()).toEqual(s.deck.map(c=>c.id).sort());
      expect(new Set(s.battle.hand).size).toBe(5);
    }
  });
  it('keeps pack assignment deterministic by run seed and leaves the first pitch stream untouched',()=>{
    for(const pack of ['power','link','hold']){
      const a=firstBattle(813,pack),b=firstBattle(813,pack),plain=createV10Duel(813);
      const node=plain.runMap.nodes.find(n=>n.type==='battle');
      const baseline=enterV10Node(plain,node.id);
      expect(a.deck).toEqual(b.deck);expect(a.battle.hand).toEqual(b.battle.hand);
      expect(a.battle.pending).toEqual(baseline.battle.pending);
      expect(a.pitchSeed).toBe(baseline.pitchSeed);
    }
  });
  it('retains the original three-ID pack deal and RNG on a loaded run',()=>{
    for(const [pack,replacements] of Object.entries({power:['slug','place','strike'],link:['rally','flow','strike'],hold:['defend','calm','strike']})){
      const saved=createV10Duel(21),drop=['place','place','strike'],ids=[];
      for(const entry of saved.deck){const at=drop.indexOf(entry.kind);if(at>=0){drop.splice(at,1);ids.push(entry.id);}if(ids.length===3)break;}
      ids.forEach((id,i)=>{saved.deck.find(c=>c.id===id).kind=replacements[i];});
      saved.v10.startPack={pack,ids};
      const before=JSON.stringify(saved),old=enterV10Node(saved,saved.runMap.nodes.find(n=>n.type==='battle').id);
      expect(JSON.stringify(saved)).toBe(before);expect(old.deck).toEqual(saved.deck);
      expect(old.v10.startPack).toEqual(saved.v10.startPack);
      // Golden result captured with origin/main 2f4890d, including the original taste swap.
      expect(old.battle.hand).toEqual(['c1','c7','c8','c6','c4']);
      expect(old.battle.draw).toEqual(['c0','c5','c3','c2']);
      expect(old.seed).toBe(819462168);expect(old.pitchSeed).toBe(1491304453);
    }
  });
  it('preserves an already satisfied deal and keeps remaining first-hand variety',()=>{
    for(const pack of ['power','link','hold']){
      const hands=new Set();let untouched=0;
      for(let seed=31;seed<61;seed++){
        const fresh=applyStartPack(createV10Duel(seed),pack),plain=JSON.parse(JSON.stringify(fresh));
        delete plain.v10.startPack;
        const node=fresh.runMap.nodes.find(n=>n.type==='battle').id;
        const normal=enterV10Node(plain,node),next=enterV10Node(fresh,node);
        const handKinds=kinds(normal,normal.battle.hand);
        if(roleGroups[pack].every(group=>handKinds.some(k=>group.includes(k)))){
          expect(next.battle.hand).toEqual(normal.battle.hand);expect(next.battle.draw).toEqual(normal.battle.draw);expect(next.seed).toBe(normal.seed);untouched++;
        }
        hands.add(kinds(next,next.battle.hand).sort().join('|'));
      }
      expect(untouched).toBeGreaterThan(0);expect(hands.size).toBeGreaterThan(5);
    }
  });
  it('plays the link route from a table-setter hit into runner-conditioned flow and rally',()=>{
    let s=firstBattle(1001,'link');
    const table=pinDeckKind(s,'tableSetter');
    s.battle.aimZone=4;s.battle.pending={zone:4,roll:.1,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:table});
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.battle.bases[0]).toBeTruthy();
    expect(s.battle.hand).toHaveLength(5); // the successful table setter replaces itself with its draw
    s=advanceBatter(s);
    const flow=pinDeckKind(s,'flow'),rally=pinDeckKind(s,'rally');
    expect(swingOdds(s,rally,4).hit).toBe(1);
    s=playCard(s,flow);
    expect(s.battle.runSignal).toBe(true);
    s.battle.aimZone=4;s.battle.pending={zone:4,roll:.1,powerRoll:.99};
    const runsBefore=s.battle.runs;
    s=playV10Action(s,{type:'card',id:rally});
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.battle.runs).toBe(runsBefore+1); // rally's +2 plus flow's +1 sends the first batter home
  });
  it('turns a prepared early miss into a surviving foul that deals added pitcher damage',()=>{
    let s=firstBattle(1002,'hold');
    const wear=pinDeckKind(s,'wearDown'),cut=pinDeckKind(s,'cutMaster');
    s.battle.aimZone=8;s.battle.pending={zone:0,roll:.55,powerRoll:.5};
    expect(swingOdds(s,cut,0).foul).toBeCloseTo(.50,6);
    s=playCard(s,wear);
    expect(s.battle.patient).toBe(true);
    expect(swingOdds(s,cut,0).foul).toBeCloseTo(.62,6);
    const hpBefore=s.pitcher.hp;
    s=playV10Action(s,{type:'card',id:cut});
    expect(s.battle.revealed.kind).toBe('foul');
    expect(s.phase).toBe('pitch'); // one strike only; the batter survives to see another pitch
    expect(s.pitcher.hp).toBeLessThan(hpBefore);
    expect(s.v10.lastCombat.cardFxBonus).toBe(5); // cutMaster's foul effect + wearDown's added damage
  });
  it('keeps slug narrow while power preparation changes the hit profile and controlled result',()=>{
    let plain=firstBattle(1003,'power');
    const load=pinDeckKind(plain,'loadPower'),slug=pinDeckKind(plain,'slug');
    plain.battle.aimZone=4;plain.battle.pending={zone:4,roll:.1,powerRoll:.99};
    const prepared=playCard(plain,load);
    const baseEdge=matchup(plain,slug,4).powerEdge,preparedEdge=matchup(prepared,slug,4).powerEdge;
    expect(preparedEdge-baseEdge).toBe(18);
    expect(hitProfile(prepared,slug,4)[0].p).toBeGreaterThan(hitProfile(plain,slug,4)[0].p);
    expect(swingOdds(prepared,slug,4).hit).toBe(1);
    expect(swingOdds(prepared,slug,0).hit).toBe(0); // preparation adds power, not coverage
    const cutoff=(hitProfile(plain,slug,4)[0].p+hitProfile(prepared,slug,4)[0].p)/2;
    plain.battle.pending={zone:4,roll:.1,powerRoll:cutoff};prepared.battle.pending={zone:4,roll:.1,powerRoll:cutoff};
    const plainResult=playV10Action(plain,{type:'card',id:slug}),preparedResult=playV10Action(prepared,{type:'card',id:slug});
    expect(plainResult.battle.revealed.kind).toBe('hit');expect(preparedResult.battle.revealed.kind).toBe('hit');
    expect(preparedResult.battle.revealed.label).toBe('홈런');
    expect(plainResult.battle.revealed.label).not.toBe('홈런');
  });
});
