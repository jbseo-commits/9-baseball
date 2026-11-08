/* Synthetic opening-state sensitivity, not a win-rate or human-fun benchmark.
   The chooser sees only the same bounded forecast displayed by the UI. */
import fs from 'node:fs/promises';
import {createServer} from 'vite';
const arg=(name,fallback)=>{const i=process.argv.indexOf('--'+name);return i<0?fallback:process.argv[i+1];};
const seeds=Number(arg('seeds','20')),output=arg('out','/tmp/pitcher-decision-sensitivity.json');
if(!Number.isInteger(seeds)||seeds<1||seeds>100)throw Error('seeds must be 1..100');
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const E=await server.ssrLoadModule('/src/duel/engine.js');
 const {CARDS}=await server.ssrLoadModule('/src/duel/cards.js');
 const {PITCHER_ENCOUNTERS,encounterFor}=await server.ssrLoadModule('/src/duel/pitcher-encounters.js');
 const {forecastFor}=await server.ssrLoadModule('/src/duel/SwingForecast.jsx');
 const {publicForecast}=await server.ssrLoadModule('/src/duel/battle-vnext/view-model.js');
 function choose(state){
  const ids=['basic',...state.battle.hand.filter(id=>CARDS[state.deck.find(c=>c.id===id)?.kind]?.type==='attack')];
  let best=null,bestScore=-Infinity;
  for(const id of ids)for(let zone=0;zone<9;zone++){
   const forecast=publicForecast(forecastFor({s:E.setAimZone(state,zone),selected:id,stack:[]}));
   if(!forecast||forecast.problem)continue;
   const score=(forecast.chance[0]+forecast.chance[1])/2*(forecast.damageMin+forecast.damageMax)/2;
   if(score>bestScore){bestScore=score;best={type:'card',id,zone};}
  }
  return best||{type:'take'};
 }
 const report={kind:'synthetic signature assignment onto shared opening state',seeds,rows:[],changed:0,cases:0,hiddenPendingChanges:0,
  hiddenPerturbation:'pending.zone +1 modulo10 only; other hidden rolls untouched',
  policy:'one card/basic × nine zones; midpoint(UI chance interval) × midpoint(UI conditional HP interval); first on tie; no supports or preparation policy',
  limits:'Sensitivity only. Not actual roster encounter win rates, balance, learnability, replay variety or human fun.'};
 for(const id of Object.keys(PITCHER_ENCOUNTERS)){
  const row={id,changed:0,cases:0,examples:[]};
  for(let seed=1;seed<=seeds;seed++){
   const on=E.enterV10Node(E.createV10Duel(seed,{tutorial:true}),'a1-entry');
   on.v10.opponent={...on.v10.opponent,artId:id,encounter:encounterFor(id)};on.battle.intent=E.baseIntent(on);
   const off=structuredClone(on);off.v10.opponent={...off.v10.opponent,encounter:null};off.battle.intent=E.baseIntent(off);
   const actual=choose(on),without=choose(off),changed=JSON.stringify(actual)!==JSON.stringify(without);
   const hidden=structuredClone(on);hidden.battle.pending.zone=(hidden.battle.pending.zone+1)%10;
   if(JSON.stringify(actual)!==JSON.stringify(choose(hidden)))report.hiddenPendingChanges++;
   row.cases++;report.cases++;if(changed){row.changed++;report.changed++;if(row.examples.length<2)row.examples.push({seed,on:actual,off:without});}
  }
  report.rows.push(row);
 }
 report.pass=report.rows.length===20&&report.hiddenPendingChanges===0;
 await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:report.cases,changed:report.changed,hiddenPendingChanges:report.hiddenPendingChanges,pass:report.pass,output}));
 if(!report.pass)process.exitCode=1;
}finally{await server.close();}
