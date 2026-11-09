// Deterministic engine-generated utility fixture. This deliberately reads the
// pending pitch for setup speed; it is not a player policy or a fun/balance test.
import * as E from '../../src/duel/engine.js';
import {validateV10State} from '../../src/duel/v10-storage.js';

export function utilityQaState(type){
  for(let seed=1;seed<200;seed++){
    let s=E.createV10Duel(seed),path=null;
    const queue=s.runMap.reachableIds.map(id=>[id]);
    while(queue.length){
      const p=queue.shift(),n=s.runMap.nodes.find(n=>n.id===p.at(-1));
      if(n.type===type){path=p;break;}
      if(['event','boss'].includes(n.type)||p.length>=4)continue;
      for(const e of s.runMap.edges.filter(e=>e.from===n.id))queue.push([...p,e.to]);
    }
    if(!path)continue;
    for(const id of path){
      s=E.enterV10Node(s,id);if(s.phase===type)break;
      if(['training','rest','locker','shop'].includes(s.phase)){s=E.completeV10UtilityNode(s,{type:'skip'});continue;}
      if(s.phase!=='battle')break;
      for(let i=0;i<180&&['battle','pitch','between'].includes(s.phase);i++){
        if(s.phase==='pitch')s=E.advanceV10Pitch(s);
        else if(s.phase==='between')s=E.advanceV10Batter(s);
        else{const z=s.battle.pending?.zone;s=Number.isInteger(z)&&z<9?E.playV10Action(E.setAimZone(s,z),{type:'card',id:'basic'}):E.playV10Action(s,{type:'take'});}
      }
      if(s.phase!=='reward')break;
      s=E.claimV10Reward(s,{type:'skip'});
    }
    if(s.phase===type&&validateV10State(s))return {state:s,seed,path,method:'Engine-generated QA fixture; setup reads pending. Not a human/normal input playthrough.'};
  }
  throw new Error(`Cannot generate validated ${type} fixture`);
}
