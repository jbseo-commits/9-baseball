import * as old from '../classes-baseline/src/duel/engine.js';
import * as now from '../9-baseball/src/duel/engine.js';
import assert from 'node:assert/strict';import fs from 'node:fs';
let count=0;
for(const pack of ['power','link','hold'])for(let seed=1;seed<=20;seed++){
 let a=old.applyStartPack(old.createV10Duel(seed),pack),b=now.applyStartPack(now.createV10Duel(seed),pack);assert.deepEqual(b,a);
 a=JSON.parse(JSON.stringify(a));b=JSON.parse(JSON.stringify(b));
 a=old.enterV10Node(a,'a1-entry');b=now.enterV10Node(b,'a1-entry');assert.deepEqual(b,a);
 a=old.playV10Action(a,{type:'take'});b=now.playV10Action(b,{type:'take'});assert.deepEqual(b,a);count++;
}
fs.writeFileSync('/workspace/classes-qa/legacy-parity.json',JSON.stringify({base:'66a65bcdf51b8e5b5e065753b3168f56434ed8d1',cases:count,stages:['fresh-map','serialize-resume-map','opening-hand','actual-take'],deepEqual:true},null,2));console.log('PASS',count);
