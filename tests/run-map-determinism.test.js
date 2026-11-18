import {describe,it,expect} from 'vitest';
import {readV10Duel,claimV10Reward,enterV10Node,playV10Action} from '../src/duel/engine.js';
import {nearestLanesByDistance} from '../src/duel/run-map.js';
import legacyNode from './fixtures/run-map-legacy-node-seed3.json' with {type:'json'};
import legacyChromium from './fixtures/run-map-legacy-chromium-seed3.json' with {type:'json'};

function fullState(fixture,stage){
  const snapshot=fixture.stages[stage]||fixture[stage];
  return {...snapshot.state,runMap:{...fixture.runMapTopology,...snapshot.mapProgress}};
}

describe('run-map deterministic nearest-lane ordering',()=>{
  it('keeps every edge candidate in nondecreasing distance order and shuffles only ties',()=>{
    const center={row:1,lane:2},input=[0,2,4,1,3].map(lane=>({row:2,lane}));
    let draws=0;
    const result=nearestLanesByDistance(center,input,()=>{draws++;return 0;});
    expect(result.map(v=>Math.abs(v.lane-center.lane))).toEqual([0,1,1,2,2]);
    expect(result.map(v=>v.lane)).toEqual([2,3,1,4,0]);
    expect(draws).toBe(2); // one fixed Fisher–Yates draw for each two-way tie group
    expect(input.map(v=>v.lane)).toEqual([0,2,4,1,3]); // caller list is not mutated
  });

  it('uses no random draws when nearest distances are unique',()=>{
    const result=nearestLanesByDistance({lane:0},[3,0,1].map(lane=>({lane})),()=>{throw Error('unexpected tie draw');});
    expect(result.map(v=>v.lane)).toEqual([0,1,3]);
  });
});

describe('V10 saved maps from the pre-fix generator remain authoritative',()=>{
  for(const fixture of [legacyNode,legacyChromium]){
    it(`reads ${fixture.meta.runtime} map/battle/reward saves and follows their saved next node`,()=>{
      for(const stage of ['map','battle','reward','claimed','nextNode']){
        const state=fullState(fixture,stage);
        expect(readV10Duel({getItem:()=>JSON.stringify(state)})).toEqual(state);
      }
      const battle=fullState(fixture,'battle'),action=fixture.firstAction;
      expect(playV10Action(battle,action)).toEqual(fullState(fixture,'firstActionExpected'));
      const reward=fullState(fixture,'reward');
      const claimed=claimV10Reward(reward,{type:'skip'});
      expect(claimed).toEqual(fullState(fixture,'claimed'));
      expect(enterV10Node(claimed,fixture.nextNodeId)).toEqual(fullState(fixture,'nextNode'));
    });
  }
});
