import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,setAimZone,setGrowthMode} from '../src/duel/engine.js';
import {evaluateV10Action} from '../src/duel/policy.js';
import {CARDS} from '../src/duel/cards.js';

// E0: 기대 투수 피해 평가. 봇 전용·근사치 (유물·정타 보너스는 E3).
// take·불법 액션은 null, 합법 스윙은 {expectedDamage} (음수 없음·결정적).
function battle(){
  let s=createV10Duel(1);
  s.build='away';s.deck=['strike','place','strike','place','place','strike','place','place'].map((kind,i)=>({id:'c'+i,kind}));s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  return s;
}
const legalAttack=(s)=>{
  const ids=s.battle.hand.filter(id=>id!=='basic'||true);
  return ids.map(id=>({id,kind:id==='basic'?'basic':s.deck.find(c=>c.id===id)?.kind}));
};

describe('evaluateV10Action',()=>{
  it('scores a legal swing with finite non-negative damage, deterministically',()=>{
    const s=battle();
    const target=s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id)}))
      .find(x=>x.entry&&CARDS[x.entry.kind]?.type==='attack');
    expect(target).toBeTruthy();
    const a=evaluateV10Action(s,{type:'card',id:target.id,zone:4,mode:'normal'});
    expect(a).toBeTruthy();
    expect(Number.isFinite(a.expectedDamage)).toBe(true);
    expect(a.expectedDamage).toBeGreaterThanOrEqual(0);
    const b=evaluateV10Action(s,{type:'card',id:target.id,zone:4,mode:'normal'});
    expect(b).toEqual(a);
  });
  it('returns null for take and for unknown cards',()=>{
    const s=battle();
    expect(evaluateV10Action(s,{type:'take'})).toBeNull();
    expect(evaluateV10Action(s,{type:'card',id:'c-nope',zone:4,mode:'normal'})).toBeNull();
  });
  it('varies with aim zone (coverage moves the number)',()=>{
    const s=battle();
    const target=s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id)}))
      .find(x=>x.entry&&CARDS[x.entry.kind]?.type==='attack');
    const zs=[0,1,2,3,4,5,6,7,8].map(z=>evaluateV10Action(s,{type:'card',id:target.id,zone:z,mode:'normal'}));
    expect(zs.every(Boolean)).toBe(true);
    expect(new Set(zs.map(z=>z.expectedDamage)).size).toBeGreaterThan(1);
  });
  it('exposes out-risk probabilities in [0,1] for resource-aware selection',()=>{
    const s=battle();
    const target=s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id)}))
      .find(x=>x.entry&&CARDS[x.entry.kind]?.type==='attack');
    const r=evaluateV10Action(s,{type:'card',id:target.id,zone:4,mode:'normal'});
    for(const k of ['pOut','pWhiff']){
      expect(r[k]).toBeGreaterThanOrEqual(0);
      expect(r[k]).toBeLessThanOrEqual(1);
    }
  });
});
