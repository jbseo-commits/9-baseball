import {createV10Duel,enterV10Node} from '../engine.js';
import {rosterTimeline} from './roster-actor.js';
import {withKnockoutHold} from '../pitcher-sd.js';

export const CARD_DECISION_LAB_SEED=20261118;
export const CARD_DECISION_LAB_GUIDE=Object.freeze([
  '손패 펼치기 → 카드/존 선택 → 실행 · 공개 결과 확인',
  '시간 제한 없음 · 다른 선택으로 같은 시드 재시작 · 저장 안 됨',
]);

/** A disposable real-engine first encounter. This helper has no storage or fixture grants. */
export function createCardDecisionLabRun(seed=CARD_DECISION_LAB_SEED){
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new TypeError('A uint32 lab seed is required');
  let state=createV10Duel(seed);
  const firstOpponent=(state.runMap?.reachableIds||[])
    .map(id=>state.runMap.nodes.find(node=>node.id===id))
    .find(node=>node?.opponent);
  if(!firstOpponent)throw new Error('The seeded run has no reachable opponent.');
  state=enterV10Node(state,firstOpponent.id);
  if(state.phase!=='battle'||state.runMap?.currentNodeId!==firstOpponent.id||!state.v10?.opponent)throw new Error('The first opponent could not be entered.');
  return {state,nodeId:firstOpponent.id,seed:state.initialSeed};
}

/** Align every lab pitch on one outcome-neutral pre-impact beat; keep result-specific tail after reveal. */
export function cardDecisionLabTimeline(base){
  if(!base||base.duration<=60)return base;
  const shift=300-base.impactAt;
  return {...base,impactAt:300,releaseAt:base.releaseAt+shift,settleAt:base.settleAt+shift,duration:base.duration+shift};
}

/** Exact opt-in pitch timeline used by IntegrationPreview; result-dependent fields begin at impact. */
export function cardDecisionLabPresentationTimeline(base,{actor=null,reduced=false,knockedOut=false}={}){
  const aligned=reduced?base:cardDecisionLabTimeline(base);
  const delivered=!reduced&&base?.duration>60&&actor?rosterTimeline(aligned,actor,false,{delivery:true,contactHold:aligned.freeze||0}):aligned;
  return withKnockoutHold(delivered,!reduced&&knockedOut);
}
