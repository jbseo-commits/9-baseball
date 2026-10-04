import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,
  setAimZone,setGrowthMode,claimV10Reward,completeV10UtilityNode,selectV10Map} from '../src/duel/engine.js';
import {planAction} from '../src/duel/policy.js';

// INBOX 7 본편: 전투→보상→맵→유틸리티를 headless로 한 런 끝까지 주행.
// 봇 선택은 고정(전투 planAction, 보상 풀 첫 장, 유틸리티 건너뜀, 맵 첫 도달).
// 측정 베이스라인용이며 인간 재미·밸런스 주장이 아니다.
const UTILITY=new Set(['training','locker','shop','rest']);
export function driveRun(seed=1,guardMax=20000){
  let s=createV10Duel(seed);
  s=enterV10Node(s,'a1-entry');
  let guard=0;
  while(!['won','lost'].includes(s.phase)&&guard++<guardMax){
    if(s.phase==='pitch')s=advanceV10Pitch(s);
    else if(s.phase==='between')s=advanceV10Batter(s);
    else if(s.phase==='battle'){
      const a=planAction(s);
      if(!a)throw new Error('bot stalled in battle');
      s=setGrowthMode(setAimZone(s,a.zone),a.mode);
      s=a.id?playV10Action(s,{type:'card',id:a.id}):playV10Action(s,{type:'take'});
    }
    else if(s.phase==='reward'){
      const pool=s.v10?.rewardChoices||[];
      s=claimV10Reward(s,pool.length?{type:'add',kind:pool[0]}:{type:'skip'});
    }
    else if(UTILITY.has(s.phase))s=completeV10UtilityNode(s);
    else if(s.phase==='map'){
      const next=selectV10Map(s).reachableIds[0];
      if(!next)throw new Error('bot stalled on map');
      s=enterV10Node(s,next);
    }
    else throw new Error('unknown phase '+s.phase);
  }
  return {s,guard};
}

describe('v10 headless full run',()=>{
  for(const seed of [1,2]){
    it(`reaches won or lost with a completed path (seed ${seed})`,()=>{
      const {s,guard}=driveRun(seed);
      expect(guard).toBeLessThan(20000);
      expect(['won','lost']).toContain(s.phase);
      expect(s.runMap.completedNodeIds.length).toBeGreaterThan(0);
    });
  }
});
