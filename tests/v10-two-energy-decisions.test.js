import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,previewV10Stack,v10ActionCost} from '../src/duel/engine.js';

function fixture(seed){
  let s=enterV10Node(createV10Duel(seed),'a1-entry');
  const kinds={c0:'place',c1:'strike',c2:'place',c3:'setup',c4:'watch'};
  for(const [id,kind] of Object.entries(kinds))s.deck.find(c=>c.id===id).kind=kind;
  s.battle.hand=['c0','c1','c2','c3','c4'];
  s.battle.draw=s.deck.map(c=>c.id).filter(id=>!s.battle.hand.includes(id));s.battle.discard=[];
  return s;
}
const support=id=>[{id,aimZone:8}];

describe('V10 two-energy decisions',()=>{
  it('keeps the real 2-energy pitch restrictive, then funds three-zone plus point after a real TAKE transition',()=>{
    const base=fixture(6401);
    expect(base.battle.energy).toBe(2);
    const rejected=previewV10Stack(base,'c1',support('c2'));
    expect(rejected.problem).toContain('에너지가 부족합니다 · 3/2 필요');
    const before=JSON.stringify(base);
    expect(playV10Action(base,{type:'card',id:'c1',supports:support('c2')})).toBe(base);
    expect(JSON.stringify(base)).toBe(before);

    const next=advanceV10Pitch(playV10Action(base,{type:'take'}));
    expect(next.battle.energy).toBe(3);expect(next.battle.energyCap).toBe(3);
    expect(v10ActionCost(next,'c1',support('c2'))).toBe(3);
    const plan=previewV10Stack(next,'c1',support('c2'));
    expect(plan.problem).toBeUndefined();expect(plan.cost).toBe(3);
    const played=playV10Action(next,{type:'card',id:'c1',supports:support('c2')});
    expect(played).not.toBe(next);expect(played.battle.energy).toBe(0);
  });

  it('allows one-point preparation plus point attack but rejects the same preparation plus three-zone attack',()=>{
    const point=fixture(6402);point.deck.find(c=>c.id==='c4').kind='scout';
    const prepPoint=playV10Action(point,{type:'card',id:'c4'});
    expect(prepPoint.battle.energy).toBe(1);
    expect(previewV10Stack(prepPoint,'c0',[]).problem).toBeUndefined();
    const pointPlayed=playV10Action(prepPoint,{type:'card',id:'c0'});
    expect(pointPlayed).not.toBe(prepPoint);expect(pointPlayed.battle.energy).toBe(0);

    const row=fixture(6403);row.deck.find(c=>c.id==='c4').kind='scout';
    const prepRow=playV10Action(row,{type:'card',id:'c4'});
    expect(prepRow.battle.energy).toBe(1);
    expect(previewV10Stack(prepRow,'c1',[]).problem).toContain('에너지가 부족합니다 · 2/1 필요');
    const before=JSON.stringify(prepRow);
    expect(playV10Action(prepRow,{type:'card',id:'c1'})).toBe(prepRow);
    expect(JSON.stringify(prepRow)).toBe(before);
  });

  it('allows a 1-cost signature laser with a point support on the base pitch',()=>{
    const s=fixture(6404);s.deck.find(c=>c.id==='c1').kind='laser';
    expect(s.battle.energy).toBe(2);
    expect(v10ActionCost(s,'c1',support('c2'))).toBe(2);
    const plan=previewV10Stack(s,'c1',support('c2'));
    expect(plan.problem).toBeUndefined();
    const played=playV10Action(s,{type:'card',id:'c1',supports:support('c2')});
    expect(played).not.toBe(s);expect(played.battle.energy).toBe(0);
  });
});
