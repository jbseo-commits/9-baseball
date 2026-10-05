import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,
  setAimZone,setGrowthMode,claimV10Reward,completeV10UtilityNode,selectV10Map,
  v10UtilityOptions,cardProblem,previewV10Stack} from '../src/duel/engine.js';
import {planAction,evaluateTake,scoreV10Swing,pickBestSolo,pickBestSupport} from '../src/duel/policy.js';
import {cardPower, CARDS} from '../src/duel/cards.js';
import {V10_RELICS} from '../src/duel/v10-relics.js';

// INBOX 7: baseline bot with ONE forced utility path per variant, then identical play.
// Scope: bot-behavior deltas only; NOT human fun or balance proof.
const UTILITY=new Set(['training','locker','shop','rest']);
const rank=(a,b)=>cardPower(b)-cardPower(a);

const kindOfId=(s,id)=>id==='basic'?'basic':s.deck.find(c=>c.id===id)?.kind;
const isAttackPick=(s,id)=>id==='basic'||CARDS[kindOfId(s,id)]?.type==='attack';

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
  try{
    return driveInner(seed,variant,guardMax);
  }catch(e){
    return {seed,variant,phase:'error',nodes:0,pitches:0,forced:false,exitReason:'exception:'+((e&&e.message)||e)};
  }
}

function driveInner(seed,variant='base',guardMax=20000){
  let s=createV10Duel(seed);
  s=enterV10Node(s,'a1-entry');
  const used={};
  if(variant.startsWith('relic:')&&V10_RELICS[variant.slice(6)]){
    // E4a: granted at start — measures the relic effect, not acquisition.
    s={...s,relics:[variant.slice(6)]};
    used[variant]=true;
  }
  let guard=0,exitReason='terminal';
  while(!['won','lost'].includes(s.phase)&&guard++<guardMax){
    if(s.phase==='pitch')s=advanceV10Pitch(s);
    else if(s.phase==='between')s=advanceV10Batter(s);
    else if(s.phase==='battle'){
      const a=planAction(s);
      if(!a){exitReason='no-action';break;}
      if(variant==='damage'||variant.startsWith('relic:')){
        // E2: skill picks stay planAction's; solo/support/take compete
        // in selection units. Supports only on positive marginal gain.
        let pick;
        if(a.id&&!isAttackPick(s,a.id))pick={id:a.id,zone:a.zone,supports:[]};
        else{
          const solo=pickBestSolo(s,a.mode);
          const sup=solo?pickBestSupport(s,{id:solo.id,zone:solo.zone,mode:a.mode}):null;
          const tv=evaluateTake(s)?.expectedDamage??-Infinity;
          const cands=[solo?{...solo,supports:[]}:null,
            sup?{id:solo.id,zone:solo.zone,supports:sup.supports,value:sup.value}:null];
          const best=cands.filter(Boolean).reduce((m,c)=>c.value>m.value?c:m,{value:tv});
          pick=best.value>tv?best:{id:null,zone:a.zone};
        }
        s=setGrowthMode(setAimZone(s,pick.zone??a.zone),a.mode);
        s=pick.id?playV10Action(s,{type:'card',id:pick.id,...(pick.supports?.length?{supports:pick.supports}:{})}):playV10Action(s,{type:'take'});
      }
      else{
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
    }
    else if(s.phase==='reward'){
      const pool=s.v10?.rewardChoices||[];
      s=claimV10Reward(s,pool.length?{type:'add',kind:pool[0]}:{type:'skip'});
    }
    else if(UTILITY.has(s.phase))s=completeV10UtilityNode(s,utilityAction(s,used,variant));
    else if(s.phase==='map'){
      const next=selectV10Map(s).reachableIds[0];
      if(!next){exitReason='map-stall';break;}
      s=enterV10Node(s,next);
    }
    else{exitReason='unknown:'+s.phase;break;}
  }
  if(guard>=guardMax)exitReason='guard';
  return {seed,variant,phase:s.phase,nodes:s.runMap.completedNodeIds.length,
    pitches:s.stats.pitches,forced:!!used[variant],exitReason};
}

const seeds=Math.max(1,Number(process.argv[2]||10));
const variants=['base','damage','upgrade','relic','remove','support',
  ...Object.keys(V10_RELICS).map(k=>'relic:'+k)];
const rows={};
for(const v of variants){
  const runs=[];
  for(let seed=1;seed<=seeds;seed++)runs.push(driveVariant(seed,v));
  rows[v]={seeds,won:runs.filter(r=>r.phase==='won').length,
    lost:runs.filter(r=>r.phase==='lost').length,
    unfinished:runs.filter(r=>!['won','lost'].includes(r.phase)).length,
    exits:runs.reduce((m,r)=>(m[r.exitReason]=(m[r.exitReason]||0)+1,m),{}),
    avgNodes:runs.reduce((a,r)=>a+r.nodes,0)/runs.length,
    avgPitches:runs.reduce((a,r)=>a+r.pitches,0)/runs.length,
    forcedRuns:runs.filter(r=>r.forced).length};
}
console.log(JSON.stringify({scope:'Bot-behavior deltas with fixed weak bot; NOT human fun or balance proof',rows},null,2));
