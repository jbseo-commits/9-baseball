import {createV10Duel,applyHitterClass,enterV10Node,playV10Action,advanceV10Pitch} from '../9-baseball/src/duel/engine.js';import fs from 'node:fs';
const path='/workspace/classes-qa/cases.json',out=JSON.parse(fs.readFileSync(path));
for(let seed=1;seed<10000;seed++){
 let s=enterV10Node(applyHitterClass(createV10Duel(seed),'bad-ball-v1'),'a1-entry');s=playV10Action(s,{type:'take'});if(s.phase!=='pitch')continue;s=advanceV10Pitch(s);if(s.battle.pending?.zone!==9)continue;
 const chase=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='chaseBall'),scout=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='scout');if(!chase||!scout)continue;
 const n=playV10Action(s,{type:'card',id:scout});if(n===s||n.battle.energy<2)continue;
 const done=playV10Action(n,{type:'card',id:chase});if(done===n)continue;
 out['outside-confirmed']={seed,kind:'chaseBall',state:n,aim:n.battle.aimZone,expected:done.battle.revealed,damage:done.v10.lastCombat.damage};break;
}
if(!out['outside-confirmed'])throw Error('missing');fs.writeFileSync(path,JSON.stringify(out,null,2));console.log(out['outside-confirmed'].seed);
