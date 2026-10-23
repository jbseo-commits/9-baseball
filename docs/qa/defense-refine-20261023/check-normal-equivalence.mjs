import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const repo=fileURLToPath(new URL('../../../',import.meta.url)).replace(/[\\/]+$/,'');
const root=new URL('./',import.meta.url);
const sourceBase=pathToFileURL(repo+'/src/duel/engine.js');
const baselineCommit='9fe86cbd43a1fb806e5bd38f142f9bbd9188e58f';
const original=execFileSync('git',['show',baselineCommit+':src/duel/engine.js'],{cwd:repo,encoding:'utf8'});
const rewritten=original.replace(/from\s+(['"])(\.\/[^'"]+)\1/g,(_,quote,relative)=>'from '+JSON.stringify(new URL(relative,sourceBase).href));
const baselineFile=pathToFileURL(join(tmpdir(),'9zone-defense-baseline-'+process.pid+'.mjs'));
await fs.writeFile(baselineFile,rewritten);
const old=await import(baselineFile.href);
const next=await import(sourceBase.href);
const {CARDS}=await import(pathToFileURL(repo+'/src/duel/cards.js').href);
const {resolveEventChoice,eventOfferForNode}=await import(pathToFileURL(repo+'/src/duel/events.js').href);
let comparisons=0,pitches=0;
const runs=[];
function equal(a,b,context){
  comparisons++;
  if(JSON.stringify(a)!==JSON.stringify(b)){
    const failure={context,baseline:a,current:b};
    fs.writeFile(new URL('./normal-equivalence-failure.json',root),JSON.stringify(failure,null,2));
    throw new Error('Normal state diverged: '+JSON.stringify(context));
  }
}
for(const pack of ['link','hold','power'])for(let seed=1;seed<=25;seed++){
  let a=old.applyStartPack(old.createV10Duel(seed),pack);
  let b=next.applyStartPack(next.createV10Duel(seed),pack);
  equal(a,b,{pack,seed,stage:'create'});
  let rand=seed*1597334677>>>0;
  const random=()=>{rand=(Math.imul(rand,1664525)+1013904223)>>>0;return rand/4294967296;};
  const choose=arr=>arr[Math.floor(random()*arr.length)];
  let steps=0;
  for(;steps<1000&&!['won','lost'].includes(a.phase);steps++){
    const phase=a.phase;
    let operation;
    if(phase==='map'){
      const id=a.runMap.reachableIds[0];operation='enter:'+id;
      a=old.enterV10Node(a,id);b=next.enterV10Node(b,id);
    }else if(phase==='battle'){
      const zone=Math.floor(random()*9);
      a=old.setAimZone(a,zone);b=next.setAimZone(b,zone);
      equal(a,b,{pack,seed,steps,stage:'aim'});
      const legal=['basic',...a.battle.hand.filter(id=>!old.cardProblem(a,id))];
      let action;
      if(random()<.2)action={type:'take'};
      else{
        const id=choose(legal);let supports=[];
        if(id!=='basic'&&CARDS[a.deck.find(c=>c.id===id)?.kind]?.type==='attack'&&random()<.5){
          const candidates=a.battle.hand.filter(x=>x!==id&&CARDS[a.deck.find(c=>c.id===x)?.kind]?.type==='attack');
          if(candidates.length){supports=[{id:choose(candidates),aimZone:Math.floor(random()*9)}];
            if(old.stackSupportProblem(a,id,supports))supports=[];
          }
        }
        action={type:'card',id,supports};
      }
      operation=action;a=old.playV10Action(a,action);b=next.playV10Action(b,action);
    }else if(phase==='pitch'){
      operation='advancePitch';a=old.advanceV10Pitch(a);b=next.advanceV10Pitch(b);
    }else if(phase==='between'){
      operation='advanceBatter';a=old.advanceV10Batter(a);b=next.advanceV10Batter(b);
    }else if(phase==='reward'){
      operation='rewardSkip';a=old.claimV10Reward(a,{type:'skip'});b=next.claimV10Reward(b,{type:'skip'});
    }else if(['training','locker','shop','rest'].includes(phase)){
      operation='utilitySkip';a=old.completeV10UtilityNode(a,{type:'skip'});b=next.completeV10UtilityNode(b,{type:'skip'});
    }else if(phase==='event'){
      operation='eventLeave';
      if(!eventOfferForNode(a))throw new Error('Missing public event');
      a=resolveEventChoice(a,'leave').state;b=resolveEventChoice(b,'leave').state;
    }else throw new Error('Unhandled phase '+phase);
    equal(a,b,{pack,seed,steps,phase,operation});
  }
  if(steps>=1000)throw new Error('No termination: '+pack+' '+seed);
  pitches+=a.stats.pitches;
  runs.push({pack,seed,steps,pitches:a.stats.pitches,phase:a.phase});
}
const result={baselineCommit,method:'Automated differential engine regression; no human-play or balance claim',runs:runs.length,comparisons,pitches,allStatesEqual:true,details:runs};
await fs.writeFile(new URL('./normal-equivalence.json',root),JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,details:undefined}));
await fs.unlink(baselineFile);
