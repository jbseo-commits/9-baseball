import {describe,it,expect} from 'vitest';
import {createDuel,startBattle,playCard,chooseReward} from '../src/duel/engine.js';
import {rewardProblem} from '../src/duel/deck.js';
import {planReward} from '../src/duel/policy.js';
import {STAGES,DECKBUILDER_BUILD} from '../src/duel/cards.js';

// INBOX 7 첫 조각: 자동 정책의 제거·강화·유물 최소 경로.
// 탐욕·결정적 봇 휴리스틱이며 밸런스 주장이 아니다.
// 모든 제안은 rewardProblem을 통과해야 하고, 강제 경로가 막히면 합법 폴백한다.
const pitch=(s,zone=s.battle.aimZone,roll=.5,powerRoll=.99)=>{s.battle.pending={zone,roll,powerRoll};return s;};
function reward(){
  let s=startBattle(createDuel(1));
  s.deck[0]={id:'c0',kind:'strike'};s.battle.hand=['c0'];s.battle.draw=[];s.battle.discard=[];
  s.battle.runs=STAGES[s.stage].target-1;s.battle.bases=[null,null,'p8'];
  return playCard(pitch(s),'c0');
}
const legal=(s,plan)=>rewardProblem(s.deck,plan.action,s.stage,plan.growthKey,s.relics,s.build,s.route);

describe('planReward minimal bot paths',()=>{
  it('takes an unowned offered relic first',()=>{
    const s=reward();
    expect(s.phase).toBe('reward');
    const plan=planReward(s);
    expect(plan.action).toEqual({type:'relic',kind:'scope'});
    expect(legal(s,plan)).toBeNull();
  });
  it('upgrades the strongest card when relics are exhausted',()=>{
    const s=reward();
    s.relics=['scope','ledger'];
    s.deck=[{id:'a',kind:'slug'},{id:'b',kind:'defend'},{id:'c',kind:'strike'},
      {id:'d',kind:'strike'},{id:'e',kind:'strike'},{id:'f',kind:'strike'},
      {id:'g',kind:'strike'},{id:'h',kind:'strike'},{id:'i',kind:'strike'},{id:'j',kind:'strike'}];
    const plan=planReward(s);
    expect(plan.action).toEqual({type:'upgrade',id:'a'});
    expect(legal(s,plan)).toBeNull();
    const n=chooseReward(s,plan.action,plan.growthKey);
    expect(n.phase).not.toBe('reward');
    expect(n.deck.find(c=>c.id==='a').plus).toBe(true);
  });
  it('removes the weakest card only when forced',()=>{
    const s=reward();
    s.deck=[{id:'a',kind:'slug'},{id:'b',kind:'defend'},{id:'c',kind:'strike'},
      {id:'d',kind:'strike'},{id:'e',kind:'strike'},{id:'f',kind:'strike'},
      {id:'g',kind:'strike'},{id:'h',kind:'strike'},{id:'i',kind:'strike'},{id:'j',kind:'strike'}];
    const free=planReward(s);
    expect(free.action.type).not.toBe('remove');
    const plan=planReward(s,{force:'remove'});
    expect(plan.action).toEqual({type:'remove',id:'b'});
    expect(legal(s,plan)).toBeNull();
  });
  it('falls back to a legal path when the forced one is blocked',()=>{
    const s=reward();
    s.deck=s.deck.map(c=>({...c,plus:true}));
    s.relics=['scope','ledger'];
    const plan=planReward(s,{force:'upgrade'});
    expect(plan.action.type).not.toBe('upgrade');
    expect(legal(s,plan)).toBeNull();
  });
  it('picks the least-used growth and never proposes mid-run upgrades in deckbuilder',()=>{
    const s=reward();
    s.growth={patience:2,relay:0,fortune:1};
    expect(planReward(s).growthKey).toBe('relay');
    const d=reward();
    d.build=DECKBUILDER_BUILD;
    const plan=planReward(d);
    expect(plan.action).toEqual({type:'skip'});
    expect(plan.growthKey).toBeNull();
    expect(legal(d,plan)).toBeNull();
  });
});
