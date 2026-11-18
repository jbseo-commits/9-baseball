/* Read-only same-state displayed-chance sensitivity. Not a human policy or balance test. */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const output=process.argv[2]||'/tmp/pitch-information-ablation.json';
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const parse=text=>{if(text==='-')return[0,0];const values=text.match(/\d+(?:\.\d+)?/g)?.map(Number);assert.ok(values?.length===1||values?.length===2,`unexpected display text ${text}`);return values.length===1?[values[0],values[0]]:values;};
// This chooser receives only an allowlisted public display DTO, never engine state.
function choose(rows,information,objective){
 const scores=rows.map(row=>{const c=information==='visible'?parse(row.chanceText):[0,100],d=parse(row.damageText);return(objective==='midpoint'?(c[0]+c[1])*(d[0]+d[1])/4:c[0]*d[0])/100;});
 const best=Math.max(...scores),optimal=rows.filter((_,i)=>Math.abs(scores[i]-best)<1e-10).map(r=>r.key);
 const ordered=[...new Set(scores)].sort((a,b)=>b-a);
 return {selected:optimal[0],optimal,score:best,margin:ordered.length>1?best-ordered[1]:null,tieCount:optimal.length};
}
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const E=await server.ssrLoadModule('/src/duel/engine.js'),{CARDS}=await server.ssrLoadModule('/src/duel/cards.js');
 const {forecastFor}=await server.ssrLoadModule('/src/duel/SwingForecast.jsx'),{publicForecast}=await server.ssrLoadModule('/src/duel/battle-vnext/view-model.js');
 function observations(state){
  const ids=['basic',...state.battle.hand.filter(id=>CARDS[state.deck.find(c=>c.id===id)?.kind]?.type==='attack')],rows=[];
  for(const id of ids)for(let zone=0;zone<9;zone++){
   const aimed=E.setAimZone(state,zone);if(E.cardProblem(aimed,id))continue;
   const f=publicForecast(forecastFor({s:aimed,selected:id,stack:[]}));if(!f||f.problem)continue;
   rows.push({key:`${id}:${zone}`,id,zone,kind:id==='basic'?'basic':state.deck.find(c=>c.id===id).kind,chanceText:f.chanceText,damageText:f.damageText,outcome:f.outcome});
  }
  assert.ok(rows.length);return freeze(rows);
 }
 const cases=[];
 // Fixed BEFORE results: seeds0..9, first3 naturally reached battle decisions,
 // collecting by TAKE only. No state grants, redeals, encounter overrides or filtering for success.
 for(let seed=0;seed<10;seed++){
  let s=E.enterV10Node(E.createV10Duel(seed),'a1-entry');
  for(let decision=0;decision<3&&s.phase==='battle';decision++){
   const originalHash=hash(s),rows=observations(s),obsHash=hash(rows),conditions={};
   for(const info of ['visible','masked'])for(const objective of ['midpoint','lower'])conditions[`${info}_${objective}`]=choose(rows,info,objective);
   let perturbations=0;
   // Eight boundary probes, not an exhaustive continuous-roll proof. No scouting
   // is collected here; a legitimately earned pending-derived clue must not be erased.
   for(const zone of [0,9])for(const roll of [0,0.999999])for(const powerRoll of [0,0.999999]){
    const altered=structuredClone(s);altered.battle.pending={zone,roll,powerRoll};
    assert.equal(hash(observations(altered)),obsHash,'hidden pending must not change this unscouted display DTO');perturbations++;
   }
   assert.equal(hash(s),originalHash,'analysis mutated original state');
   cases.push({seed,decision,stateHash:originalHash,observationHash:obsHash,opponent:s.v10.opponent.artId,readLevel:E.readLevel(s),balls:s.battle.balls,strikes:s.battle.strikes,energy:s.battle.energy,perturbations,rows,conditions});
   s=E.playV10Action(s,{type:'take'});if(s.phase==='pitch')s=E.advanceV10Pitch(s);else if(s.phase==='between')s=E.advanceV10Batter(s);
  }
 }
 const comparisons={};
 for(const [label,a,b]of [['information_midpoint','visible_midpoint','masked_midpoint'],['information_lower','visible_lower','masked_lower'],['objective_visible','visible_midpoint','visible_lower'],['objective_masked','masked_midpoint','masked_lower']]){
  const counts={cases:cases.length,selectedChanged:0,cardChanged:0,zoneChanged:0,optimalSetsDisjoint:0,bothUnique:0};
  for(const c of cases){const x=c.conditions[a],y=c.conditions[b],rx=c.rows.find(r=>r.key===x.selected),ry=c.rows.find(r=>r.key===y.selected);counts.selectedChanged+=x.selected!==y.selected;counts.cardChanged+=rx.id!==ry.id;counts.zoneChanged+=rx.zone!==ry.zone;counts.optimalSetsDisjoint+=!x.optimal.some(k=>y.optimal.includes(k));counts.bothUnique+=x.tieCount===1&&y.tieCount===1;}
  comparisons[label]=counts;
 }
 const report={baseline:'main fb8e7b13f043e2c17376138abe6696f48c2d8022',method:'2x2 same-state display chance-channel masking × midpoint/lower immediate-damage heuristic',collection:'seeds0..9, first3 actual battle decisions by TAKE; no preparation/support/encounter mutation',mask:'only chanceText becomes common [0,100]%; damageText/outcome/action availability retained, so not all pitch information is removed',tieRule:'first legal action in basic/hand order then zone0..8; optimum sets and margins reported to expose arbitrary ties',hypothesis:'Displayed chance or objective can change optimal action set in this fixed sample; zero disjoint sets is a valid negative result, not a failing software gate.',limits:['No take/preparation/support alternatives in chooser; core card strategy not exhaustively tested.','No exact EV or sampled outcome optimization; no win-rate/long-run cost analysis.','Damage interval midpoint is a heuristic, not mathematical expected damage.','Lower-endpoint heuristic is not survival or two-strike-optimal play.','No slider/curve-specific current engine mechanic inferred from visual labels.','No human readability, enjoyment or physical-device evidence.'],cases,comparisons,validation:{statesUnchanged:true,pendingBoundaryProbes:cases.reduce((n,c)=>n+c.perturbations,0),displayDTOUnchanged:true}};
 await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:cases.length,comparisons,validation:report.validation,output}));
}finally{await server.close();}
