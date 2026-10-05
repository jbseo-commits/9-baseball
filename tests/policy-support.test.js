import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node} from '../src/duel/engine.js';
import {scoreV10Swing,pickBestSolo,pickBestSupport} from '../src/duel/policy.js';
import {CARDS} from '../src/duel/cards.js';

// E2: CONNECT 인식 지원 선택. 전부 상태-유도 가중치, 튜닝상수 0.
// 지원은 한계 이득이 양수일 때만, 동점이면 단독이 이긴다.
function battle(){
  let s=createV10Duel(1);
  s.build='away';s.deck=['strike','place','strike','place','place','strike','place','place'].map((kind,i)=>({id:'c'+i,kind}));s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  return s;
}
const attackId=s=>s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id)}))
  .find(x=>x.entry&&CARDS[x.entry.kind]?.type==='attack').id;

describe('E2 support selection',()=>{
  it('scores a solo swing in selection units',()=>{
    const s=battle();
    const args={type:'card',id:attackId(s),zone:4,mode:'normal'};
    const frozen=JSON.stringify(s);
    const r=scoreV10Swing(s,args);
    expect(r).toBeTruthy();
    expect(Number.isFinite(r.value)).toBe(true);
    expect(Number.isFinite(r.expectedDamage)).toBe(true);
    expect(scoreV10Swing(s,args)).toEqual(r);
    expect(JSON.stringify(s)).toBe(frozen);
  });
  it('picks a legal solo with finite value',()=>{
    const s=battle();
    const best=pickBestSolo(s,'normal');
    expect(best).toBeTruthy();
    expect(Number.isFinite(best.value)).toBe(true);
    expect(best.zone).toBeGreaterThanOrEqual(0);
    expect(best.zone).toBeLessThan(9);
  });
  it('attaches a support only for positive marginal gain, problem-free',()=>{
    const s=battle();
    const solo=pickBestSolo(s,'normal');
    const sup=pickBestSupport(s,{id:solo.id,zone:solo.zone,mode:'normal'});
    if(sup){
      expect(sup.value).toBeGreaterThan(solo.value);
      expect(sup.supports.length).toBeGreaterThan(0);
      for(const x of sup.supports){
        expect(x.aimZone).toBeGreaterThanOrEqual(0);
        expect(x.aimZone).toBeLessThan(9);
      }
    }else{
      expect(solo.value).toBeDefined();
    }
  });
});
