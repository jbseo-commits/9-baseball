import {describe,it,expect} from 'vitest';
import {
  createV10Duel,enterV10Node,setAimZone,previewCard,previewV10Stack,playV10Action,selectV10Combat,
  v10SwingDamageRate,V10_SWING_STACK_MAX,
} from '../src/duel/engine.js';
import {validateV10State} from '../src/duel/v10-storage.js';

/* the opening hand is a seeded deal since autodev P1; these contracts address c0-c4, so pin them */
function pinHand(s,ids=['c0','c1','c2','c3','c4']){const b=s.battle,pool=[...b.hand,...b.draw,...b.discard].filter(id=>!ids.includes(id));b.hand=[...ids];b.draw=pool;b.discard=[];return s;}
function armed(){
  let s=createV10Duel(20260917);
  s=pinHand(enterV10Node(s,'a1-entry'));
  s=setAimZone(s,0);
  return s;
}

describe('V10 스윙 스택',()=>{
  it('카드를 더 겹칠수록 HP 피해 효율이 명확하게 내려간다',()=>{
    expect(V10_SWING_STACK_MAX).toBe(4);
    expect([1,2,3,4].map(v10SwingDamageRate)).toEqual([1,.8,.65,.5]);
  });

  it('에너지 예산 안에서 세 장의 커버를 합치고 넓어진 만큼 장타 페널티도 커진다',()=>{
    const s=armed();
    const main=previewCard(s,'c4');
    const stack=previewV10Stack(s,'c4',[
      {id:'c0',aimZone:8},
      {id:'c1',aimZone:7},
    ]);
    expect(main.coverage).toEqual([0,3,6]);
    expect(stack.primaryCoverage).toEqual([0,3,6]);
    expect(stack.supportCoverages.map(x=>x.coverage)).toEqual([[8],[7]]);
    expect(stack.coverage).toEqual([0,3,6,7,8]);
    expect(stack.cardCount).toBe(3);
    expect(stack.cost).toBe(3);
    expect(stack.damageRate).toBeCloseTo(.72);
    expect(stack.connectCount).toBe(1);
    expect(stack.connectBonus).toBeCloseTo(.07);
    expect(stack.matchup.widthPenalty).toBe(main.matchup.widthPenalty+14);
    expect(stack.label).toContain('3장');
  });

  it('추가 카드 범위에만 맞으면 단타가 되고 합산 비용을 내며 스택 피해 효율을 적용한다',()=>{
    let s=armed();
    const hp=s.pitcher.hp,cards=s.stats.cards,pitches=s.stats.pitches;
    s.battle.pending={...s.battle.pending,zone:8,roll:.99,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:'c4',supports:[
      {id:'c0',aimZone:8},
      {id:'c1',aimZone:7},
    ]});
    expect(s.battle.revealed.label).toBe('겹친 카드 단타');
    expect(s.battle.revealed.assistOnly).toBe(true);
    expect(s.battle.revealed.stackCardCount).toBe(3);
    expect(s.battle.revealed.coverage).toEqual([0,3,6,7,8]);
    expect(s.battle.energy).toBe(0);
    expect(s.battle.hand).not.toEqual(expect.arrayContaining(['c4','c0','c1']));
    expect(s.battle.discard).toEqual(expect.arrayContaining(['c4','c0','c1']));
    expect(s.stats.cards-cards).toBe(3);
    expect(s.stats.pitches-pitches).toBe(1);
    expect(hp-s.pitcher.hp).toBe(9);
    const combat=selectV10Combat(s);
    expect(combat.damage).toBe(9);
    expect(combat.baseDamage).toBe(12);
    expect(combat.damageRate).toBeCloseTo(.72);
    expect(combat.connectCount).toBe(1);
    expect(combat.cardCount).toBe(3);
    expect(combat.choiceLabel).toBe('밀어치기 + 정타 노림 + 정타 노림');
    expect(combat.aimLabel).toContain('바깥 낮음');
    expect(validateV10State(s)).toBe(true);
  });

  it('메인 커버 적중은 메인 카드 판정을 유지하되 스택 HP 효율은 그대로 적용한다',()=>{
    let s=armed();
    const hp=s.pitcher.hp;
    s.battle.pending={...s.battle.pending,zone:0,roll:0,powerRoll:.99};
    s=playV10Action(s,{type:'card',id:'c4',supports:[
      {id:'c0',aimZone:8},
      {id:'c1',aimZone:7},
    ]});
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.battle.revealed.assistOnly).toBe(false);
    expect(s.battle.revealed.label).not.toBe('겹친 카드 단타');
    expect(s.battle.discard).toEqual(expect.arrayContaining(['c4','c0','c1']));
    expect(selectV10Combat(s).damageRate).toBeCloseTo(.72);
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
