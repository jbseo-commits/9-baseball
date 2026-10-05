import {CARDS,rangeFor,shadeFor,GROWTHS,RELIC_OFFERS,FACILITY_ROUTES,DECKBUILDER_BUILD,DECK_MIN,canUpgrade,cardPower} from './cards.js';
import {rewardProblem} from './deck.js';
import {previewCard,cardProblem,publicProbabilities,readLevel,setAimZone,setGrowthMode,growthProblem,knownPitchZones,facilityProblem,previewV10Stack} from './engine.js';
import {damageForOutcome} from './pitcher-hp.js';

// Public-information baseline, not an oracle or a human-fun metric.
// This module never reads pending pitch, RNG seed, or resolved future states.
const normalize=(weights,total=1)=>{const sum=weights.reduce((value,weight)=>value+weight,0);return weights.map(weight=>sum?weight/sum*total:0);};
const rangeMidpoint=p=>{const [low,high=low]=rangeFor(p).replaceAll('%','').split('~').map(Number);return (low+high)/200;};
export function perceivedProbabilities(s,level=readLevel(s)){
  const exact=publicProbabilities(s);
  if(level>=2)return exact;
  const knowsUnused=(s.relics||[]).includes('radar');
  const known=knownPitchZones(s);
  const perceived=exact.map((p,z)=>!known.includes(z)?0:known.length===1?1:level===0?(knowsUnused&&p===0?0:shadeFor(p)):p===0?0:rangeMidpoint(p));
  if((s.relics||[]).includes('ledger'))return [...normalize(perceived.slice(0,9),1-exact[9]),exact[9]];
  return normalize(perceived);
}
export function planAction(s,{level=readLevel(s)}={}){
  if(s.phase!=='battle')return null;
  const b=s.battle,legal=b.hand.filter(id=>!cardProblem(s,id));
  if(b.preparations<2){
    const desired=!b.scouted?'scout':b.hand.length<6?'watch':b.strikes===2?'calm':'setup';
    const prep=legal.find(id=>s.deck.find(c=>c.id===id).kind===desired)
      ||legal.find(id=>['setup','lure'].includes(s.deck.find(c=>c.id===id).kind));
    if(prep)return {id:prep,zone:b.aimZone,mode:b.growthMode};
  }
  let best={id:null,zone:b.aimZone,mode:'normal',value:-Infinity};
  const ball=perceivedProbabilities(s,level)[9];
  // Value of extending the PA; at two strikes, a called strike is an out.
  best.value=ball*(b.balls===3?1.15:.22)-(1-ball)*(b.strikes===2?1.15:.15);
  if(s.growth.patience&&b.strikes<2)best.value+=(1-ball)*(b.waitCharge? .3:.55);
  for(const mode of ['normal','patience','fortune'].filter(m=>!growthProblem(s,m))){
  const candidate=setGrowthMode(s,mode);
  for(const id of ['basic',...candidate.battle.hand.filter(id=>!cardProblem(candidate,id)&&CARDS[s.deck.find(c=>c.id===id).kind].type==='attack')]){
    const kind=id==='basic'?'basic':s.deck.find(c=>c.id===id).kind;
    for(let zone=0;zone<9;zone++){
      const aimed=setAimZone(candidate,zone),p=previewCard(aimed,id,perceivedProbabilities(aimed,level));
      const value=p.expectedBases+p.hit*(kind==='rally'?b.bases.filter(Boolean).length*.3:0)
        -p.out*1.1-p.whiff*(b.strikes===2?1.1:.22)
        +p.sacrifice*(b.outs<2&&b.bases[2]?1.1:-1)
        +p.fortuneChance*(b.bases.filter(Boolean).length*.5+.45)
        +p.sacrifice*(s.growth.relay&&b.outs<2&&b.bases.some(Boolean)?.4:0)
        -p.foul*(kind==='bunt'&&b.strikes===2?1.1:.015);
      if(value>best.value)best={id,zone,mode,value};
    }
  }
  }
  return {id:best.id,zone:best.zone,mode:best.mode};
}
export const planTurn=s=>{const action=planAction(s);return action?[action.id]:[];};

// E0: expected pitcher damage for one swing (bot-only approximation).
// Reads previewV10Stack + damageForOutcome only (C6); no relic/precision
// refinement (E3). take and illegal actions score null, never a number.
// pOut/pWhiff expose out-risk for resource-aware selection (E1).
export function evaluateV10Action(s,action,{level}={}){
  if(!action||action.type!=='card'||!action.id)return null;
  if(action.id!=='basic'&&!s.deck?.some(c=>c.id===action.id))return null;
  const aimed=setGrowthMode(setAimZone(s,action.zone??s.battle?.aimZone),action.mode||'normal');
  const p=previewV10Stack(aimed,action.id,action.supports||[],perceivedProbabilities(s,level));
  if(!p||p.problem)return null;
  const hitDmg=(p.types||[]).reduce((acc,t)=>acc+(t.p||0)*damageForOutcome({kind:'hit',bases:t.bases||1}).damage,0);
  const pOut=p.out||0,pWhiff=p.whiff||0;
  const expectedDamage=(p.damageRate||1)*((((p.hit||0)*hitDmg)
    +(p.foul||0)*damageForOutcome({kind:'foul'}).damage
    +(p.whiff||0)*damageForOutcome({kind:'whiff'}).damage
    +(p.out||0)*damageForOutcome({kind:'out'}).damage
    +(p.sacrifice||0)*damageForOutcome({kind:'sacrifice'}).damage));
  if(!Number.isFinite(expectedDamage))return null;
  return {expectedDamage:Math.max(0,expectedDamage),pOut,pWhiff,pFoul:p.foul||0};
};

// E3a: take value in E1-selection units (damage net of out cost).
// Weighs only public info (perceived ball rate) plus engine tables —
// no tuned constants, no oracle (never resolves the pending pitch).
export function evaluateTake(s,{level}={}){
  if(!s?.battle)return null;
  const q9=perceivedProbabilities(s,level)[9]??0;
  const need=(s.pitcher?.hp??0)/Math.max(1,3-(s.battle?.outs??0));
  const strikes=Math.min(2,s.battle?.strikes??0);
  const takeDmg=q9*((s.battle?.balls??0)>=3
    ?damageForOutcome({kind:'walk'}).damage
    :damageForOutcome({kind:'ball'}).damage);
  // Called strikes advance the count like whiffs: (S+1)/3 of an out,
  // full out at two strikes. Symmetric with swing strike pricing.
  const takeOuts=(1-q9)*(strikes>=2?1:(strikes+1)/3);
  const expectedDamage=takeDmg-need*takeOuts;
  return Number.isFinite(expectedDamage)?{expectedDamage,qBall:q9}:null;
};

// Bot-only reward picker for headless measurement (INBOX 7). Greedy and
// deterministic; never a balance claim. Every proposal satisfies rewardProblem;
// a blocked forced path falls back to the default priority. No game caller yet.
export function planReward(s,{force=null}={}){
  const deck=Array.isArray(s.deck)?s.deck:[],relics=s.relics||[],stage=s.stage||0;
  const growthKey=s.build===DECKBUILDER_BUILD?null
    :Object.keys(GROWTHS).reduce((a,k)=>((s.growth||{})[k]||0)<((s.growth||{})[a]||0)?k:a,Object.keys(GROWTHS)[0]);
  const rank=(a,b)=>cardPower(b)-cardPower(a)||deck.indexOf(a)-deck.indexOf(b);
  const strongest=[...deck.filter(canUpgrade)].sort(rank)[0];
  const weakest=[...deck].sort((a,b)=>-rank(a,b))[0];
  const offer=(RELIC_OFFERS[stage]||[]).find(k=>!relics.includes(k));
  const candidates={
    relic:offer?{type:'relic',kind:offer}:null,
    upgrade:strongest?{type:'upgrade',id:strongest.id}:null,
    remove:deck.length>DECK_MIN&&weakest?{type:'remove',id:weakest.id}:null,
    skip:{type:'skip'},
  };
  const action=[force,'relic','upgrade','skip']
    .map(k=>candidates[k]).find(a=>a&&!rewardProblem(deck,a,stage,growthKey,relics,s.build,s.route))
    ||{type:'skip'};
  return {action,growthKey};
}

// Bot-only facility picker (INBOX 7). Same contract as planReward:
// greedy, deterministic, route-gated, falls back to a legal path.
export function planFacility(s,{force=null}={}){
  const deck=Array.isArray(s.deck)?s.deck:[],relics=s.relics||[];
  const route=FACILITY_ROUTES[(s.stage||1)-1]||[];
  const rank=(a,b)=>cardPower(b)-cardPower(a)||deck.indexOf(a)-deck.indexOf(b);
  const strongest=[...deck.filter(canUpgrade)].sort(rank)[0];
  const weakest=[...deck].sort((a,b)=>-rank(a,b))[0];
  const gear=(RELIC_OFFERS[(s.stage||1)-1]||[]).find(k=>!relics.includes(k));
  const candidates={
    equipment:gear?{type:'equipment',kind:gear}:null,
    training:strongest?{type:'training',id:strongest.id}:null,
    release:deck.length>DECK_MIN&&weakest?{type:'release',id:weakest.id}:null,
    scouting:{type:'scouting'},
  };
  const inRoute=t=>route.includes(t);
  return [force,'equipment','training','scouting']
    .map(k=>candidates[k]).find(a=>a&&inRoute(a.type)&&!facilityProblem(s,a))
    ||{type:'scouting'};
}
