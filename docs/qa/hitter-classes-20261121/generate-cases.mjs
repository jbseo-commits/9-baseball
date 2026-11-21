import {createV10Duel,applyHitterClass,enterV10Node,playV10Action,setAimZone} from '../9-baseball/src/duel/engine.js';import fs from 'node:fs';
const out={};
for(const [name,cls,kind] of [['outside-hit','bad-ball-v1','chaseBall'],['outside-foul','bad-ball-v1','chaseBall'],['outside-whiff','bad-ball-v1','chaseBall'],['inside-whiff','bad-ball-v1','chaseBall'],['spray-left','spray-v1','sprayPull'],['spray-center','spray-v1','sprayCenter'],['spray-right','spray-v1','sprayPush']]){
 for(let seed=1;seed<5000;seed++){
  let s=enterV10Node(applyHitterClass(createV10Duel(seed),cls),'a1-entry');const id=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind===kind);if(!id)continue;
  const z=s.battle.pending.zone;if(name.startsWith('outside')&&z!==9||name==='inside-whiff'&&z===9||name.startsWith('spray')&&z===9)continue;
  s=setAimZone(s,z<9?z:4);const n=playV10Action(s,{type:'card',id});if(n===s)continue;
  const want=name.startsWith('spray')?'hit':name.split('-')[1];if(n.battle.revealed.kind!==want)continue;
  out[name]={seed,kind,state:s,aim:s.battle.aimZone,expected:n.battle.revealed,damage:n.v10.lastCombat.damage};break;
 }
 if(!out[name])throw Error(name);
}
fs.writeFileSync('/workspace/classes-qa/cases.json',JSON.stringify(out,null,2));console.log(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.seed])));
