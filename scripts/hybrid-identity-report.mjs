import {PACKS,startMatch,entryFor,publicDecision,resolveAction,continueMatch} from '../src/hybrid/model.js';
import {setAimZone} from '../src/duel/engine.js';

const evidence=[];
for(const seed of [1,2,7,91,90210])for(const pack of Object.keys(PACKS)){
  let state=startMatch(pack,seed);const actions=[];
  for(let step=0;step<32&&state.phase==='battle'&&state.battle.batterIndex<2;step++){
    const action=publicDecision(state,pack),kind=action.id==='basic'?'basic':entryFor(state,action.id)?.kind||action.type;
    if(action.zone!==undefined)state=setAimZone(state,action.zone);
    const before={pa:state.battle.batterIndex+1,energy:state.battle.energy,hand:state.battle.hand.length,runners:state.battle.bases.filter(Boolean).length};
    const resolved=resolveAction(state,action);if(!resolved)throw new Error(`Illegal public action: ${pack}/${seed}/${kind}`);
    state=resolved.next;
    actions.push({...before,kind,aim:action.zone,pitch:resolved.pitch,consumed:resolved.consumed,energyAfter:state.battle.energy,hp:state.pitcher.hp,
      ...(resolved.pitch?{verdict:state.v10.lastCombat.verdict,damage:state.v10.lastCombat.damage,keywordBonus:state.v10.lastCombat.cardFxBonus,precisionBonus:state.v10.lastCombat.precisionBonus,runs:state.battle.runs,runnersAfter:state.battle.bases.filter(Boolean).length}:{})});
    if(state.phase!=='battle')state=continueMatch(state);
  }
  evidence.push({seed,pack,phase:state.phase,appearances:state.battle.batterIndex,pitches:state.stats.pitches,actions});
}
console.log(JSON.stringify({note:'Same five seeds, real engine; heuristic sees only public information. Behavior evidence, not a fun/balance rating.',evidence},null,2));
