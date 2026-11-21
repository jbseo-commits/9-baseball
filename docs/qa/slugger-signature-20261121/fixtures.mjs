import fs from 'node:fs';import * as E from '/workspace/9-baseball/src/duel/engine.js';
const out={};for(let seed=1;seed<150;seed++){
 let s=E.applyHitterClass(E.createV10Duel(seed),'slugger-v1',{buildVersion:1});s=E.enterV10Node(s,'a1-entry');
 for(const kind of ['slug','gapHunter','loadPower']){
  const card=s.deck.find(c=>c.kind===kind);if(!card)throw Error(kind);
  // Explicit card-availability QA checkpoint; actual engine consumes cards.
  const r=structuredClone(s);r.battle.hand=[card.id,...r.battle.hand.filter(id=>id!==card.id)].slice(0,5);r.battle.draw=r.battle.draw.filter(id=>!r.battle.hand.includes(id));
  const zone=E.playV10Action(r,{type:'take'}).battle.revealed.zone;
  for(const action of kind==='loadPower'?['prepare']:['hit','miss','take']){
   const aim=action==='miss'?(zone+4)%9:Math.min(zone,8);const before=E.setAimZone(r,aim);const after=E.playV10Action(before,action==='take'?{type:'take'}:{type:'card',id:card.id});const result=after.battle?.revealed;
   let key=kind+'-'+(action==='prepare'?'prepare':action==='take'?'take':result?.kind==='hit'?'hit':result?.kind==='foul'?'foul':result?.kind==='whiff'?'miss':'other');if(key.endsWith('other')||out[key])continue;
   out[key]={state:r,id:card.id,kind,aim,action,seed,expected:{last:after.last,result,combat:after.v10.lastCombat}};
  }
 }
 if(Object.keys(out).length>=9)break;
}fs.writeFileSync('/workspace/slugger-signature-qa/cases.json',JSON.stringify(out));console.log(Object.keys(out));
