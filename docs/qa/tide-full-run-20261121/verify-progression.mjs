// Accelerated engine verification ONLY. Uses private target as a QA aim oracle,
// never imported by game. Does not edit targets/RNG/HP/rules or force any result.
import * as E from '../../../src/duel/engine.js';
import {resolveEventChoice} from '../../../src/duel/events.js';
import {writeFileSync} from 'node:fs';
let s=E.createV10Duel(4);const phases={},nodes=[],records=[];
for(let step=0;step<2000&&!['won','lost'].includes(s.phase);step++){
 phases[s.phase]=(phases[s.phase]||0)+1;let n;
 if(s.phase==='map'){n=E.enterV10Node(s,s.runMap.reachableIds[0]);nodes.push({id:n.v10.nodeId,artId:n.v10.opponent?.artId,phase:n.phase});}
 else if(s.phase==='battle'){const z=s.battle.pending.zone;n=z===9?E.playV10Action(s,{type:'take'}):E.playV10Action(E.setAimZone(s,z),{type:'card',id:'basic'});}
 else if(s.phase==='pitch')n=E.advanceV10Pitch(s);
 else if(s.phase==='between')n=E.advanceV10Batter(s);
 else if(s.phase==='reward')n=E.claimV10Reward(s,{type:'skip'});
 else if(s.phase==='event')n=resolveEventChoice(s,'leave').state;
 else n=E.completeV10UtilityNode(s,{type:'skip'});
 if(n===s)throw Error('no progress '+s.phase);s=n;
 const memory=new Map(),st={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};E.saveV10Duel(st,s);if(JSON.stringify(E.readV10Duel(st))!==JSON.stringify(s))throw Error('round trip');
 records.push({step,phase:s.phase,pitches:s.stats.pitches,outs:s.runOuts});
}
if(s.phase!=='won')throw Error('not won '+s.phase);
const result={method:'accelerated real-engine legal-input QA; target oracle used for aim only, no HP/RNG/outcome forcing; not human-play evidence',terminal:s.phase,phases,nodes,pitches:s.stats.pitches,records};writeFileSync(new URL('./progression-verification.json',import.meta.url),JSON.stringify(result,null,2));console.log('PASS actual engine full seed4 run',s.phase,s.stats.pitches,'pitches',nodes.length,'nodes');
