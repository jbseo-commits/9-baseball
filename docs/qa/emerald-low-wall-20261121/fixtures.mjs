import fs from 'node:fs';import * as E from '/workspace/9-baseball/src/duel/engine.js';
let cases={};for(let seed=1;seed<80;seed++){
 let s=E.applyHitterClass(E.createV10Duel(seed),'slugger-v1',{buildVersion:1}),n=s.runMap.nodes.find(n=>n.opponent?.artId==='boss-01-emerald-tyrant');if(!n)continue;s.runMap.reachableIds=[n.id];s=E.enterV10Node(s,n.id);
 const taken=E.playV10Action(s,{type:'take'}),z=taken.battle.revealed.zone;
 for(const action of ['take','hit','whiff']){
  const aim=action==='whiff'?(z+4)%9:z;let ready=action==='take'?s:E.setAimZone(s,aim);const next=E.playV10Action(ready,action==='take'?{type:'take'}:{type:'card',id:'basic'}),kind=next.battle.revealed.kind;
  const key=action==='take'?(z===9?'outside':'take'):kind==='foul'?'foul':kind==='hit'&&z>=6&&z<=8?'hit':kind==='whiff'?'whiff':null;
  if(key&&!cases[key])cases[key]={state:s,zone:z,action,aim,expected:{result:next.battle.revealed,last:next.last,combat:next.v10.lastCombat},seed};
 }
 if(['take','outside','foul','hit','whiff'].every(x=>cases[x]))break;
}fs.writeFileSync('/workspace/emerald-qa/cases.json',JSON.stringify(cases));console.log(Object.fromEntries(Object.entries(cases).map(([k,v])=>[k,{seed:v.seed,zone:v.zone,kind:v.expected.result.kind}])));
