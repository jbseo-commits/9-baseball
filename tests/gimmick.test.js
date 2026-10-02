import {describe,it,expect} from 'vitest';
import {createRunMap,validateRunMap} from '../src/duel/run-map.js';
import {GIMMICKS,gimmickRules,addShare,trickNeighbors} from '../src/duel/gimmick.js';
import {createV10Duel,enterV10Node,baseIntent,cardProblem,v10StackMax,v10PrepMax} from '../src/duel/engine.js';
import {CARDS} from '../src/duel/cards.js';

/* 같은 시드·같은 상대에서 기믹만 켜고 끄고 비교한다. */
function fight(seed,gimmick,{phase='steady',type='battle'}={}){
  const s0=createV10Duel(seed);
  const node=s0.runMap.nodes.find(n=>n.type===type);
  if(gimmick)node.opponent.gimmick={id:gimmick,label:'t',summary:'t',phases:null};else delete node.opponent.gimmick;
  s0.runMap.reachableIds=[node.id];
  const s=enterV10Node(s0,node.id);
  if(phase!=='steady'){s.pitcher={...s.pitcher,phase};}
  return s;
}

describe('엘리트·보스 기믹',()=>{
  it('강적과 보스에만 기믹이 붙고 로스터 캐릭터와 1:1이다',()=>{
    for(let seed=0;seed<40;seed++){
      const map=createRunMap(seed);expect(validateRunMap(map)).toBe(true);
      for(const n of map.nodes.filter(n=>n.opponent)){
        if(n.type==='battle')expect(n.opponent.gimmick).toBeUndefined();
        else{expect(n.opponent.gimmick?.id).toBe(GIMMICKS[n.opponent.artId].id);expect(n.opponent.gimmick.summary.length).toBeGreaterThan(5);}
      }
    }
    expect(new Set(Object.values(GIMMICKS).map(g=>g.id)).size).toBe(6); // 기믹 종류는 6가지, 캐릭터가 늘면 같은 기믹을 공유할 수 있다
  });

  it('기믹이 없거나 모르는 id면 규칙은 중립이다',()=>{
    for(const id of [undefined,null,'nope'])expect(gimmickRules(id,'critical')).toEqual(gimmickRules(undefined));
    expect(gimmickRules(undefined)).toMatchObject({prepMax:2,stackMax:4,ballShare:0,lowShare:0,oppCol:0,trickRate:0});
  });

  it('보스 HP 단계가 내려가면 규칙이 강해진다',()=>{
    expect(gimmickRules('tyrant','steady')).toMatchObject({lowShare:.1,prepMax:2});
    expect(gimmickRules('tyrant','pressured')).toMatchObject({lowShare:.1,prepMax:1});
    expect(gimmickRules('tyrant','critical')).toMatchObject({lowShare:.2,prepMax:1});
    expect(gimmickRules('halo','pressured').stackMax).toBe(3);
    expect(gimmickRules('halo','critical').ballShare).toBe(.1);
    expect(gimmickRules('eclipse','pressured').oppCol).toBe(6);
    expect(gimmickRules('eclipse','critical').prepMax).toBe(1);
  });

  it('addShare는 몫을 정확히 그만큼 늘린다',()=>{
    const w=[1,1,1,1,1,1,1,1,1,3],share=i=>i.reduce((a,k)=>a+w[k],0)/w.reduce((a,x)=>a+x,0);
    const before=share([9]);addShare(w,[9],.2);expect(share([9])).toBeCloseTo(before+.2,5);
    const w2=[2,2,2,2,2,2,2,2,2,2];addShare(w2,[6,7,8],.1);expect((w2[6]+w2[7]+w2[8])/w2.reduce((a,x)=>a+x,0)).toBeCloseTo(.3+.1,5);
  });

  it('와인 블러프는 볼 비중을 20%p 올리고 코발트는 2스트라이크에서 볼을 줄인다',()=>{
    const base=baseIntent(fight(5,null)).probabilities[9],wine=baseIntent(fight(5,'bluff')).probabilities[9];
    expect(wine-base).toBeGreaterThan(.12);
    const two=g=>{const s=fight(5,g);s.battle.strikes=2;return baseIntent(s).probabilities[9];};
    expect(two('pressure')).toBeLessThan(two(null)*.6);
  });

  it('낮은 벽: 하단 3코스 비중이 단계에 따라 커진다',()=>{
    const low=(phase)=>{const p=baseIntent(fight(9,'tyrant',{phase})).probabilities;return p[6]+p[7]+p[8];};
    const none=(()=>{const p=baseIntent(fight(9,null)).probabilities;return p[6]+p[7]+p[8];})();
    expect(low('steady')).toBeGreaterThan(none);
    expect(low('critical')).toBeGreaterThan(low('steady'));
  });

  it('엘리트도 HP 단계에 따라 강해진다',()=>{
    expect(gimmickRules('pressure','steady')).toMatchObject({earlyExtra:1,putawayExtra:3,prepMax:2});
    expect(gimmickRules('pressure','pressured').prepMax).toBe(1);
    expect(gimmickRules('trick','steady')).toMatchObject({trickRate:.6,trickLate:.25,stackMax:4});
    expect(gimmickRules('trick','pressured').stackMax).toBe(3);
    expect(gimmickRules('bluff','steady').ballShare).toBe(.35);
    expect(gimmickRules('bluff','pressured')).toMatchObject({ballShare:.45,prepMax:1});
  });

  it('속임수 코스: 첫 공만, 인접 코스로, 대략 60% 밀린다',()=>{
    let moved=0,total=0;
    for(let seed=1;seed<=400;seed++){
      const a=fight(seed,null),b=fight(seed,'trick');
      if(a.battle.pending.zone===9)continue;
      total++;
      if(a.battle.pending.zone!==b.battle.pending.zone){
        moved++;expect(trickNeighbors(a.battle.pending.zone)).toContain(b.battle.pending.zone);
      }
    }
    expect(moved/total).toBeGreaterThan(.45);expect(moved/total).toBeLessThan(.75);
    for(const z of [0,4,8])for(const n of trickNeighbors(z))expect(n>=0&&n<=8).toBe(true);
  });

  it('준비 횟수와 스택 한도가 엔진 검사에 반영된다',()=>{
    const s=fight(3,'tyrant',{phase:'pressured'});
    expect(v10PrepMax(s)).toBe(1);expect(v10StackMax(fight(3,'halo',{phase:'pressured'}))).toBe(3);
    expect(v10PrepMax(fight(3,null))).toBe(2);expect(v10StackMax(fight(3,null))).toBe(4);
    const skill=s.battle.hand.find(id=>CARDS[s.deck.find(c=>c.id===id)?.kind]?.type==='skill');
    if(skill){
      s.battle.preparations=1;
      expect(cardProblem(s,skill)).toMatch(/준비 1회/);
      const open=fight(3,null);open.battle.preparations=1;expect(cardProblem(open,skill)).toBeNull();
    }
  });
});
