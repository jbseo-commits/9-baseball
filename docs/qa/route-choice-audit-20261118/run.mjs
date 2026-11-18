import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {run} from '../route-choice-audit-preflight.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const root='/workspace/9-baseball',rows=[],pairs=[];
for(let seed=0;seed<10;seed++){
 const pair=[];
 for(const preference of ['utility-first','combat-first']){
  const first=run(seed,preference),repeat=run(seed,preference);
  const deterministic=hash(first.trace)===hash(repeat.trace)&&first.finalStateHash===repeat.finalStateHash;
  const terminal=['won','lost'].includes(first.endReason);
  rows.push({...first,deterministic,terminal,traceHash:hash(first.trace)});pair.push(first);
  console.log(seed,preference,first.endReason,first.steps,deterministic);
 }
 const maps=pair.map(r=>r.trace.filter(x=>x.phase==='map'));let shared=0;
 while(shared<Math.min(...maps.map(x=>x.length))&&maps[0][shared].action.nodeId===maps[1][shared].action.nodeId)shared++;
 const fork=maps[0][shared]&&maps[1][shared]?{index:shared,alternatives:maps[0][shared].meta.alternatives,chosen:maps.map(x=>x[shared].action.nodeId)}:null;
 pairs.push({seed,sharedMapEntries:shared,encounteredChoice:maps.some(m=>m.some(x=>x.meta.alternatives.length>1)),fork,paths:maps.map(m=>m.map(x=>({id:x.action.nodeId,type:x.meta.nodeType}))),finals:pair.map(r=>r.final),terminal:pair.map(r=>r.endReason)});
}
const result={baseline:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,policyHash:hash(fs.readFileSync(root+'/scripts/lib/playable-qa-policy.mjs','utf8')),engineHash:hash(fs.readFileSync(root+'/src/duel/engine.js','utf8')),mapHash:hash(fs.readFileSync(root+'/src/duel/run-map.js','utf8')),scope:'Node-only exact-preview QA policy; route-category comparison, not human/balance/causal evidence',rows,pairs,summary:{runs:rows.length,repeats:rows.length,deterministic:rows.filter(r=>r.deterministic).length,terminal:rows.filter(r=>r.terminal).length,choicePairs:pairs.filter(p=>p.encounteredChoice).length,divergedPairs:pairs.filter(p=>p.fork).length}};
fs.writeFileSync('/tmp/route-choice-audit-20261118/results.json',JSON.stringify(result));
console.log(JSON.stringify(result.summary));
if(rows.some(r=>!r.deterministic||!r.terminal))process.exitCode=1;
