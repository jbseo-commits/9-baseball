import {describe,it,expect} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {
  createV10Duel,enterV10Node,setAimZone,previewV10Stack,playV10Action,selectV10Combat,
} from '../src/duel/engine.js';

function armed(aimZone=0){
  let s=createV10Duel(20260919);
  s=enterV10Node(s,'a1-entry');
  // Starter-identity mechanics address c0/c1; the opening deal is seeded
  // since P1, so pin them here instead of assuming the old fixed hand.
  const b=s.battle,pool=[...b.hand,...b.draw,...b.discard].filter(id=>id!=='c0'&&id!=='c1');
  b.hand=['c0','c1',...pool.slice(0,3)];b.draw=pool.slice(3);b.discard=[];
  s=setAimZone(s,aimZone);
  return s;
}

describe('V11 starter identity — 정타 노림 vs 밀어치기',()=>{
  it('gives the one-zone starter a precision identity instead of lower power',()=>{
    expect(CARDS.place.name).toBe('정타 노림');
    expect(CARDS.place.shape).toBe('point');
    expect(CARDS.place.power).toBe(0);
    expect(CARDS.place.pressure).toBe(.50);
    expect(CARDS.place.role).toBe('정타');
    expect(CARDS.strike.shape).toBe('column');
    expect(CARDS.strike.power).toBe(0);
  });

  it('exposes precision pressure only when place is the MAIN card',()=>{
    const s=armed(0);
    // c0=place(2) as main, no support -> valid
    expect(previewV10Stack(s,'c0',[]).precisionPressure).toBe(.5);
    // c1=place(2) as main with c0(place) upgraded to cost 1 = 3 total
    const s1=armed(0);
    const upgraded=Object.assign({},s1.deck.find(e=>e.id==='c0'),{plus:true});
    s1.deck=s1.deck.map(e=>e.id==='c0'?upgraded:e);
    expect(previewV10Stack(s1,'c1',[{id:'c0',aimZone:8}]).precisionPressure).toBe(.5);
    // place as main with upgraded place as support = 3
    const s2=armed(0);
    const upgraded2=Object.assign({},s2.deck.find(e=>e.id==='c1'),{plus:true});
    s2.deck=s2.deck.map(e=>e.id==='c1'?upgraded2:e);
    expect(previewV10Stack(s2,'c0',[{id:'c1',aimZone:8}]).precisionPressure).toBe(.5);
  });

  it('adds 50% pitcher pressure on an exact MAIN-card hit',()=>{
    let s=armed(0);
    const hp=s.pitcher.hp;
    s.battle.pending={...s.battle.pending,zone:0,roll:0,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:'c0'});
    const combat=selectV10Combat(s);
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.battle.revealed.assistOnly).toBe(false);
    expect(combat.precisionRate).toBe(.5);
    expect(combat.precisionBonus).toBe(Math.round(combat.baseDamage*combat.damageRate*.5));
    expect(combat.damage).toBe(combat.baseDamage+combat.precisionBonus);
    expect(hp-s.pitcher.hp).toBe(combat.damage);
    expect(s.last.events.some(e=>e.includes('정타 노림 · 정확 적중'))).toBe(true);
  });

  it('never grants precision pressure to support-only contact',()=>{
    let s=armed(2);
    // strike as main alone (cost 3) - no support possible under energy 3
    s.battle.pending={...s.battle.pending,zone:2,roll:.999,powerRoll:.999};
    s=playV10Action(s,{type:'card',id:'c4'});
    const combat=selectV10Combat(s);
    expect(s.battle.revealed.kind).toBe('hit');
    // strike as main gives no precision pressure
    expect(combat.precisionRate).toBe(0);
    expect(combat.precisionBonus).toBe(0);
  });

  it('keeps the stack damage multiplier separate from precision pressure',()=>{
    let s=armed(0);
    // place(2) + upgraded place(1) = 3, valid
    const upgraded=Object.assign({},s.deck.find(e=>e.id==='c1'),{plus:true});
    s.deck=s.deck.map(e=>e.id==='c1'?upgraded:e);
    s.battle.pending={...s.battle.pending,zone:0,roll:0,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:'c0',supports:[{id:'c1',aimZone:4}]});
    const combat=selectV10Combat(s);
    expect(combat.connectCount).toBe(1);
    expect(combat.damageRate).toBeCloseTo(.87);
    expect(combat.precisionRate).toBe(.5);
    expect(combat.precisionBonus).toBe(Math.round(combat.baseDamage*combat.damageRate*.5));
  });
});