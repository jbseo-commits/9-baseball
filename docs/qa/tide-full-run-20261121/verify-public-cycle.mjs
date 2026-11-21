// Real engine sequences, diagnostic aim oracle only; no modified pitch/HP/RNG.
import * as E from '../../../src/duel/engine.js';
import {publicEncounterCue} from '../../../src/duel/encounter-cues.js';
import {writeFileSync} from 'node:fs';
const advance=s=>s.phase==='pitch'?E.advanceV10Pitch(s):s.phase==='between'?E.advanceV10Batter(s):s;
const rows=[];
for(const sequence of [[],['take'],['hit'],['take','take']]){
 let s=E.enterV10Node(E.createV10Duel(4),'a1-entry');
 for(const action of sequence){const z=s.battle.pending.zone;s=advance(action==='take'?E.playV10Action(s,{type:'take'}):E.playV10Action(E.setAimZone(s,z),{type:'card',id:'basic'}));}
 const before=publicEncounterCue(s),count=s.battle.pitchCount,ready=s.battle.history.at(-1)?.action==='take',zone=s.battle.pending.zone;
 if(zone===9)throw Error('expectedinzonefixture');
 const hit=E.playV10Action(E.setAimZone(s,zone),{type:'card',id:'basic'});
 if(hit.battle.revealed.kind!=='hit')throw Error('notactualhit');
 if(hit.v10.lastCombat.encounter.bonus!==(ready?5:0))throw Error('bonus');
 rows.push({sequence,count,before,actualHit:hit.last,bonus:hit.v10.lastCombat.encounter.bonus});
}
writeFileSync(new URL('./public-cycle-verification.json',import.meta.url),JSON.stringify(rows,null,2));console.log('PASS natural low/high x eligible/ineligible sequences; realhits0/5bonus');
