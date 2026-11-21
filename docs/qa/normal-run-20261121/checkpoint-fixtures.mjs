// Supplementary coverage only: legal engine progression with target-aware QA inputs.
// These saves never ship in runtime and do not establish a player-earned victory.
import * as E from '../../../src/duel/engine.js';
import {resolveEventChoice} from '../../../src/duel/events.js';
import {writeFileSync} from 'node:fs';
let s=E.createV10Duel(137);const checkpoints={},route=[];
for(let step=0;step<2000&&!['won','lost'].includes(s.phase);step++){
 const node=s.runMap?.nodes.find(n=>n.id===s.runMap.currentNodeId),act=node?.act||1;
 if(s.phase==='map'){
  const reach=s.runMap.nodes.filter(n=>s.runMap.reachableIds.includes(n.id));
  const next=reach.find(n=>['rest','shop','event','training','locker'].includes(n.type))||reach[0];
  if(!checkpoints['map-act'+next.act])checkpoints['map-act'+next.act]=s;
  s=E.enterV10Node(s,next.id);route.push({id:next.id,type:next.type,act:next.act});
 }else if(s.phase==='battle'){
  if(node?.type==='boss'&&!checkpoints['boss-act'+act])checkpoints['boss-act'+act]=s;
  if(node?.type==='boss'&&act===3)checkpoints['final-boss-last-decision']=s;
  const z=s.battle.pending.zone;s=z===9?E.playV10Action(s,{type:'take'}):E.playV10Action(E.setAimZone(s,z),{type:'card',id:'basic'});
 }else if(s.phase==='pitch')s=E.advanceV10Pitch(s);
 else if(s.phase==='between')s=E.advanceV10Batter(s);
 else if(s.phase==='reward'){
  if(node?.type==='boss')checkpoints['boss-reward-act'+act]=s;
  s=E.claimV10Reward(s,{type:'skip'});
 }else if(s.phase==='event'){checkpoints.event??=s;s=resolveEventChoice(s,'leave').state;}
 else {checkpoints[s.phase]??=s;s=E.completeV10UtilityNode(s,{type:'skip'});}
}
if(s.phase!=='won')throw Error('not won');
writeFileSync(new URL('./checkpoint-fixtures.json',import.meta.url),JSON.stringify({method:'Supplementary engine-oracle-generated legal saves; not user-earned progress. No HP/outcome mutations.',seed:137,route,checkpoints},null,2));console.log(Object.keys(checkpoints),route,s.phase);
