import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateRunMap} from '/workspace/9-baseball/src/duel/run-map.js';
import {validateV10State} from '/workspace/9-baseball/src/duel/v10-storage.js';
import * as E from 'file:///workspace/9-baseball/src/duel/engine.js';
import {choose} from 'file:///workspace/9-baseball/scripts/lib/playable-qa-policy.mjs';
import {eventOfferForNode,resolveEventChoice} from 'file:///workspace/9-baseball/src/duel/events.js';

function run(seed, preference){
const started=performance.now();let s=E.createV10Duel(seed),trace=[],counts={map:0,combat:0,pitchActions:0,advancePitch:0,advanceBatter:0,reward:0,utility:0,event:0};
const maxSteps=5000;let endReason='step-cap';
const nodeName=()=>s.runMap?.nodes?.find(n=>n.id===s.runMap.currentNodeId)?.id||null;
for(let i=0;i<maxSteps;i++){
 const before=s,phase=s.phase,at=nodeName();let action=null,meta={};
 if(phase==='won'||phase==='lost'){endReason=phase;break;}
 if(phase==='map'){
  const candidates=(s.runMap.reachableIds||[]).map(id=>s.runMap.nodes.find(n=>n.id===id));const order=preference==='utility-first'?['rest','training','locker','shop','event','battle','elite','boss']:['battle','elite','boss','rest','training','locker','shop','event'];const selected=[...candidates].sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type)||a.id.localeCompare(b.id))[0];const id=selected?.id;if(!id){endReason='map-no-reachable';break;}
  const n=s.runMap.nodes.find(x=>x.id===id);action={type:'enter',nodeId:id};meta={selectedBy:preference,nodeType:n?.type,act:n?.act,alternatives:candidates.map(x=>({id:x.id,type:x.type,hp:x.opponent?.maxHp??null}))};s=E.enterV10Node(s,id);counts.map++;if(['battle','pitch','between'].includes(s.phase))counts.combat++;
 }else if(['training','locker','shop','rest'].includes(phase)){
  const options=E.v10UtilityOptions(s);action=options.length?options[0]:{type:'skip'};meta={options:options.length,selectedBy:options.length?'first actual utility option':'skip'};s=E.completeV10UtilityNode(s,action);counts.utility++;
 }else if(phase==='event'){
  const offer=eventOfferForNode(s);if(!offer){endReason='event-no-offer';break;}
  const choice=offer.choices.find(c=>!c.problem);if(!choice){endReason='event-no-legal-choice';break;}
  action={type:'event',id:choice.id};meta={event:offer.event,selectedBy:'first legal event choice'};s=resolveEventChoice(s,choice.id).state;counts.event++;
 }else if(phase==='battle'){
  const a=choose(s);action=a;meta={selectedBy:'existing exact-preview weighted hit*10 + expectedBases*2 QA policy',aimZone:a.zone??null};
  const aimed=a.type==='card'&&a.zone!=null?E.setAimZone(s,a.zone):s;
  meta.actionEnergyCost=a.type==='take'?0:(a.supports?.length?E.previewV10Stack(aimed,a.id,a.supports):E.previewCard(aimed,a.id)).cost;
  s=E.playV10Action(aimed,a);counts.pitchActions++;
  if(s===aimed){endReason='policy-action-no-progress';trace.push({i,phase,node:at,action,meta,unchanged:true});break;}
 }else if(phase==='pitch'){
  action={type:'advanceV10Pitch'};s=E.advanceV10Pitch(s);counts.advancePitch++;
 }else if(phase==='between'){
  action={type:'advanceV10Batter'};s=E.advanceV10Batter(s);counts.advanceBatter++;
 }else if(phase==='reward'){
  const options=E.v10RewardOptions(s);action=options.length?{type:'add',kind:options[0]}:{type:'skip'};
  meta={cardOptions:options.length,selectedBy:options.length?'first actual card reward option':'skip; engine still applies normal relic reward if available'};s=E.claimV10Reward(s,action);counts.reward++;
 }else{endReason='unsupported-phase:'+phase;break;}
 if(!validateV10State(s)){endReason='invalid-state';break;}
 if(!validateRunMap(s.runMap)){endReason='invalid-map';break;}
 if(s===before){endReason='transition-returned-same-state';trace.push({i,phase,node:at,action,meta,unchanged:true});break;}
 trace.push({i,phase,node:at,action,meta,resources:{energyBefore:before.battle?.energy??null,energyAfter:s.battle?.energy??null,deckBefore:before.deck?.length,deckAfter:s.deck?.length,upgradedBefore:before.deck?.filter(c=>c.plus).length,upgradedAfter:s.deck?.filter(c=>c.plus).length,relicsBefore:before.relics,relicsAfter:s.relics,runOutsBefore:before.runOuts,runOutsAfter:s.runOuts},nextPhase:s.phase,act:s.runMap.nodes.find(n=>n.id===s.runMap.currentNodeId)?.act??null,rawStage:s.stage,pitch:s.stats?.pitches||0,hp:s.pitcher?.hp??null,outs:s.battle?.outs??null,deck:s.deck?.length??null});
}
const report={seed,preference,finalStateHash:createHash('sha256').update(JSON.stringify(s)).digest('hex'),mode:'Node engine-only dry run; no browser, storage, RNG override, forced node reachability, or injected HP',policy:'exact-preview QA oracle from existing scripts/lib/playable-qa-policy.mjs; maximizes hit*10 + expectedBases*2 after setup preference, so this is not a human-public decision policy',mapPolicy:'fixed public node-type priority, then id; actual reachable only',rewardPolicy:'first eligible actual card option, otherwise skip; normal engine reward/relic processing',utilityPolicy:'first actual option, otherwise skip',eventPolicy:'first legal actual offered choice',endReason,final:{phase:s.phase,stage:s.stage,currentNodeId:s.runMap?.currentNodeId,pitches:s.stats?.pitches,deck:s.deck?.length,relics:s.relics,deckKinds:s.deck.map(c=>c.kind),hp:s.pitcher?.hp??null,runOuts:s.runOuts,victories:s.victories,completedNodes:s.runMap?.completedNodeIds?.length},counts,steps:trace.length,elapsedMs:Math.round(performance.now()-started),trace};
return report;
}
export {run};
