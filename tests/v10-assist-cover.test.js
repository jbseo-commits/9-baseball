import {describe,it,expect} from 'vitest';
import {
  createV10Duel,enterV10Node,setAimZone,previewCard,previewV10Stack,playV10Action,selectV10Combat,
  v10SwingDamageRate,V10_SWING_STACK_MAX,
} from '../src/duel/engine.js';
import {validateV10State} from '../src/duel/v10-storage.js';

function armed(aimZone=0){
  let s=createV10Duel(20260917);
  s=enterV10Node(s,'a1-entry');
  s=setAimZone(s,aimZone);
  // Stack/assist mechanics under test need c0/c1 in hand; the opening deal
  // is seeded since P1, so pin them here instead of assuming the old fixed hand.
  const b=s.battle,pool=[...b.hand,...b.draw,...b.discard].filter(id=>id!=='c0'&&id!=='c1');
  b.hand=['c0','c1',...pool.slice(0,3)];b.draw=pool.slice(3);b.discard=[];
  return s;
}

describe('V10 스윙 스택',()=>{
  it('카드를 더 겹칠수록 HP 피해 효율이 명확하게 내려간다',()=>{
    expect(V10_SWING_STACK_MAX).toBe(4);
    expect([1,2,3,4].map(v10SwingDamageRate)).toEqual([1,.8,.65,.5]);
  });

  it('에너지 3 한도에서 두 장 스택으로 커버를 넓히면 장타 페널티가 커진다',()=>{
    const s=armed();
    // place(2) + upgraded place(1) = 3, valid
    const upgraded=Object.assign({},s.deck.find(e=>e.id==='c1'),{plus:true});
    s.deck=s.deck.map(e=>e.id==='c1'?upgraded:e);
    const main=previewCard(s,'c0');
    const stack=previewV10Stack(s,'c0',[{id:'c1',aimZone:1}]);
    expect(main.coverage).toEqual([0]);
    expect(stack.primaryCoverage).toEqual([0]);
    // place shape is point -> covers only aimZone
    expect(stack.supportCoverages.map(x=>x.coverage)).toEqual([[1]]);
    expect(stack.coverage).toEqual([0,1]);
    expect(stack.cardCount).toBe(2);
    expect(stack.damageRate).toBeCloseTo(.87);
    expect(stack.connectCount).toBe(1); // zones 0 and 1 are adjacent
    expect(stack.connectBonus).toBeCloseTo(.07);
  });

  it('추가 카드 범위에만 맞으면 어시스트 단타가 되고 두 장을 모두 소비하며 HP 피해는 절반만 준다',()=>{
    let s=armed();
    const upgraded=Object.assign({},s.deck.find(e=>e.id==='c1'),{plus:true});
    s.deck=s.deck.map(e=>e.id==='c1'?upgraded:e);
    const hp=s.pitcher.hp,cards=s.stats.cards,pitches=s.stats.pitches;
    s.battle.pending={...s.battle.pending,zone:1,roll:.99,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:'c0',supports:[{id:'c1',aimZone:1}]});
    expect(s.battle.revealed.label).toBe('겹친 카드 단타');
    expect(s.battle.revealed.assistOnly).toBe(true);
    expect(s.battle.revealed.stackCardCount).toBe(2);
    expect(s.battle.revealed.coverage).toEqual([0,1]);
    expect(s.battle.hand).not.toEqual(expect.arrayContaining(['c0','c1']));
    expect(s.battle.discard).toEqual(expect.arrayContaining(['c0','c1']));
    expect(s.stats.cards-cards).toBe(2);
    expect(s.stats.pitches-pitches).toBe(1);
    const combat=selectV10Combat(s);
    expect(combat.damageRate).toBeCloseTo(.87);
    expect(combat.connectCount).toBe(1);
    expect(combat.cardCount).toBe(2);
    expect(validateV10State(s)).toBe(true);
  });

  it('메인 커버 적중은 메인 카드 판정을 유지하되 스택 HP 효율은 그대로 적용한다',()=>{
    let s=armed();
    const hp=s.pitcher.hp;
    const upgraded=Object.assign({},s.deck.find(e=>e.id==='c1'),{plus:true});
    s.deck=s.deck.map(e=>e.id==='c1'?upgraded:e);
    s.battle.pending={...s.battle.pending,zone:0,roll:0,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:'c0',supports:[{id:'c1',aimZone:1}]});
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.battle.revealed.assistOnly).toBe(false);
    expect(s.battle.revealed.label).not.toBe('겹친 카드 단타');
    expect(s.battle.discard).toEqual(expect.arrayContaining(['c0','c1']));
    expect(selectV10Combat(s).damageRate).toBeCloseTo(.87);
    expect(selectV10Combat(s).connectCount).toBe(1);
    expect(hp-s.pitcher.hp).toBe(selectV10Combat(s).damage);
  });

  it('다섯 장 이상을 한 공에 밀어 넣는 입력은 거부한다',()=>{
    const s=armed();
    const illegal=playV10Action(s,{type:'card',id:'c4',supports:[
      {id:'c0',aimZone:8},{id:'c1',aimZone:7},{id:'c2',aimZone:2},{id:'c3',aimZone:1},
    ]});
    expect(illegal).toBe(s);
  });
});
