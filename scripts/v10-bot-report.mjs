import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,
  setAimZone,setGrowthMode,claimV10Reward,completeV10UtilityNode,selectV10Map,
  v10UtilityOptions,cardProblem,previewV10Stack} from '../src/duel/engine.js';
import {planAction} from '../src/duel/policy.js';
import {cardPower} from '../src/duel/cards.js';

// INBOX 7: baseline bot with ONE forced utility path per variant, then identical play.
// Scope: bot-behavior deltas only; NOT human fun or balance proof.
const UTILITY=new Set(['training','locker','shop','rest']);
const rank=(a,b)=>cardPower(b)-cardPower(a);

function utilityAction(s,used,variant){
  if(used[variant])return {type:'skip'};
  const opts=v10UtilityOptions(s);
  if(variant==='upgrade'&&s.phase==='training'){
    const best=opts.filter(o=>o.type==='upgrade')
      .map(o=>({...o,card:s.deck.find(c=>c.id===o.id)}))
      .filter(o=>o.card).sort((a,b)=>rank(a.card,b.card))[0];
    if(best){used[variant]=true;return {type:'upgrade',id:best.id};}
  }
  if(variant==='relic'&&s.phase==='shop'){
    const gear=opts.find(o=>o.type==='relic');
    if(gear){used[variant]=true;return {type:'relic',relic:gear.relic};}
  }
  if(variant==='remove'&&s.phase==='locker'){
    const victim=opts.filter(o=>o.type==='remove')
      .map(o=>({...o,card:s.deck.find(c=>c.id===o.id)}))
      .filter(o=>o.card).sort((a,b)=>-rank(a.card,b.card))[0];
    if(victim){used[variant]=true;return {type:'remove',id:victim.id};}
  }
  return {type:'skip'};
}

export function driveVariant(seed,variant='base',guardMax=20000){
  let s=createV10Duel(seed);
  s=enterV10Node(s,'a1-entry');
  const used={};
  let guard=0;
  while(!['won','lost'].includes(s.phase)&&guard++<guardMax){
    if(s.phase==='pitch')s=advanceV10Pitch(s);
    else if(s.phase==='between')s=advanceV10Batter(s);
    else if(s.phase==='battle'){
      const a=planAction(s);
      if(!a)break;
      s=setGrowthMode(setAimZone(s,a.zone),a.mode);
      if(!a.id)s=playV10Action(s,{type:'take'});
      else if(variant!=='support')s=playV10Action(s,{type:'card',id:a.id});
      else{
        // Naive attachment stalls on illegal supports; attach only a
        // problem-free one, else play solo.
        const sup=(s.battle.hand||[]).find(id=>id!==a.id&&!cardProblem(s,id)
          &&!previewV10Stack(s,a.id,[{id,aimZone:a.zone}]).problem);
        s=sup?playV10Action(s,{type:'card',id:a.id,supports:[{id:sup,aimZone:a.zone}]})
             :playV10Action(s,{type:'card',id:a.id});
      }
    }
    else if(s.phase==='reward'){
      const pool=s.v10?.rewardChoices||[];
      s=claimV10Reward(s,pool.length?{type:'add',kind:pool[0]}:{type:'skip'});
    }
    else if(UTILITY.has(s.phase))s=completeV10UtilityNode(s,utilityAction(s,used,variant));
    else if(s.phase==='map'){
      const next=selectV10Map(s).reachableIds[0];
      if(!next)break;
      s=enterV10Node(s,next);
    }
    else break;
  }
  return {seed,variant,phase:s.phase,nodes:s.runMap.completedNodeIds.length,
    pitches:s.stats.pitches,forced:!!used[variant]};
}

const seeds=Math.max(1,Number(process.argv[2]||10));
const variants=['base','upgrade','relic','remove','support'];
const rows={};
for(const v of variants){
  const runs=[];
  for(let seed=1;seed<=seeds;seed++)runs.push(driveVariant(seed,v));
  rows[v]={seeds,won:runs.filter(r=>r.phase==='won').length,
    lost:runs.filter(r=>r.phase==='lost').length,
    unfinished:runs.filter(r=>!['won','lost'].includes(r.phase)).length,
    avgNodes:runs.reduce((a,r)=>a+r.nodes,0)/runs.length,
    avgPitches:runs.reduce((a,r)=>a+r.pitches,0)/runs.length,
    forcedRuns:runs.filter(r=>r.forced).length};
}
console.log(JSON.stringify({scope:'Bot-behavior deltas with fixed weak bot; NOT human fun or balance proof',rows},null,2));
