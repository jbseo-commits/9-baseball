import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,setAimZone,setGrowthMode} from '../src/duel/engine.js';
import {planAction} from '../src/duel/policy.js';

// INBOX 7 본편 정찰: planAction으로 V10 전투 1회를 headless로 끝까지 주행.
// 종료(투수 강판/3아웃/런 종료)에 도달하고 투구가 전진해야 한다.
function driveBattle(seed=1){
  let s=createV10Duel(seed);
  s=enterV10Node(s,'a1-entry');
  expect(s.phase).toBe('battle');
  let guard=0;
  while(['battle','pitch','between'].includes(s.phase)&&guard++<2000){
    if(s.phase==='pitch')s=advanceV10Pitch(s);
    else if(s.phase==='between')s=advanceV10Batter(s);
    else{
      const a=planAction(s);
      expect(a).toBeTruthy();
      s=setGrowthMode(setAimZone(s,a.zone),a.mode);
      s=a.id?playV10Action(s,{type:'card',id:a.id}):playV10Action(s,{type:'take'});
    }
  }
  return {s,guard};
}

describe('v10 headless battle drive',()=>{
  for(const seed of [1,2,3]){
    it(`finishes one V10 battle with forward progress (seed ${seed})`,()=>{
      const {s,guard}=driveBattle(seed);
      expect(guard).toBeLessThan(2000);
      expect(s.stats.pitches).toBeGreaterThan(0);
      expect(['reward','won','lost']).toContain(s.phase);
    });
  }
});
