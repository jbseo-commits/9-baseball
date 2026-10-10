import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,claimV10Reward,HAND_MAX,HAND_OPEN,V10_TAKE_HAND_MAX} from '../src/duel/engine.js';

const atReward=(outs,rewardTier,type)=>{
  let s=enterV10Node(createV10Duel(7),'a1-entry');
  const node=s.runMap.nodes.find(n=>n.id===s.runMap.currentNodeId)||s.runMap.nodes.find(n=>n.id==='a1-entry');
  s.runOuts=outs;s.phase='reward';s.pitcher={...s.pitcher,hp:0};
  s.v10={...s.v10,rewardChoices:[],relicChoices:[],opponent:{...s.v10.opponent,rewardTier}};
  s.runMap.nodes=s.runMap.nodes.map(n=>n.id===s.runMap.currentNodeId?{...n,type}:n);
  return s;
};

describe('이어지는 아웃',()=>{
  it('다음 전투는 지난 전투에서 남은 아웃으로 시작한다',()=>{
    let s=createV10Duel(3);s.runOuts=2;s=enterV10Node(s,'a1-entry');
    expect(s.battle.outs).toBe(2);
    let t=createV10Duel(3);t=enterV10Node(t,'a1-entry');expect(t.battle.outs).toBe(0);
  });
  it('보스 승리 때만 보상 대신 아웃을 0으로 회복할 수 있다',()=>{
    const boss=claimV10Reward(atReward(2,3,'boss'),{type:'recover'});
    expect(boss.runOuts).toBe(0);expect(boss.phase).not.toBe('reward');
    expect(boss.rewards.at(-1).type).toBe('recover');expect(boss.relics.length).toBe(0);
    const elite=atReward(2,2,'elite');expect(claimV10Reward(elite,{type:'recover'})).toBe(elite);
    const clean=atReward(0,3,'boss');expect(claimV10Reward(clean,{type:'recover'})).toBe(clean);
  });
  it('일반 보상을 고르면 아웃은 그대로 이어진다',()=>{
    const next=claimV10Reward(atReward(1,3,'boss'),{type:'skip'});
    expect(next.runOuts).toBe(1);
  });
});

describe('손패 상한',()=>{
  it('일반 시작 손패는 5장이고 보통 드로우 한도도 5장이다',()=>{
    expect(HAND_OPEN).toBe(5);expect(HAND_MAX).toBe(5);
    expect(V10_TAKE_HAND_MAX).toBe(6); // 지켜보기 보너스 드로우만 한 장 더 허용한다.
    const s=enterV10Node(createV10Duel(5),'a1-entry');expect(s.battle.hand.length).toBeLessThanOrEqual(HAND_MAX);
  });
});
