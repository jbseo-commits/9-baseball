/* Tactical defense experiment A — explicit main-card stance map.
   Never guessed from role strings: strike's role is 범위 but its stance is
   정타; finisher's name suggests relay but its role/stance is 장타-leaning
   power; bunt's role is 진루 but its stance is 희생. BASIC and unlisted
   cards have no spatial effect and move nothing. Plus keeps the stance. */
export const DEFENSE_VERSION='A-v1';
export const DEFENSE_DEPTH_MIN=0;
export const DEFENSE_DEPTH_MAX=2;
export const DEFENSE_DEPTH_START=1;
export const DEFENSE_DEPTH_NAMES=['전진','기본','후퇴'];
/* Candidate spatial values (spec §8): unverified, NOT balance-final. */
export const DEFENSE_SPACE_BONUS=8;
export const DEFENSE_SPACE_PENALTY=-4;

const STANCE={
  place:'contact',strike:'contact',
  tableSetter:'advance',rally:'advance',
  slug:'power',finisher:'power',
  bunt:'sacrifice',squeeze:'sacrifice',
  setup:'prep',watch:'prep',scout:'prep',flow:'prep',
};
export const defenseStance=kind=>STANCE[kind]||'none';
export const defenseDepthName=d=>DEFENSE_DEPTH_NAMES[d]||'기본';
const clampDepth=d=>Math.min(DEFENSE_DEPTH_MAX,Math.max(DEFENSE_DEPTH_MIN,d));
const rowOf=zone=>zone<0||zone>8?null:Math.floor(zone/3); // 0 high, 1 mid, 2 low

/* Next-defense transition (spec §7). Pure: same inputs → same outputs.
   hit/direct describe the resolved pitch; sacrificeValid bundles §7 1-4. */
export function defenseTransition({depth,stance,hit,direct,zone,sacrificeValid}){
  const at=clampDepth(depth);
  if(sacrificeValid)return {nextDepth:DEFENSE_DEPTH_MIN,cause:'sacrifice'};
  if(!hit||!direct)return {nextDepth:at,cause:'hold'};
  if(stance==='advance')return {nextDepth:clampDepth(at-1),cause:at>0?'advance':'hold'};
  if(stance==='power')return {nextDepth:clampDepth(at+1),cause:at<2?'power':'hold'};
  if(stance==='contact'){
    const row=rowOf(zone);
    if(row===0)return {nextDepth:clampDepth(at+1),cause:at<2?'contact-high':'hold'};
    if(row===2)return {nextDepth:clampDepth(at-1),cause:at>0?'contact-low':'hold'};
    return {nextDepth:at,cause:'hold'};
  }
  return {nextDepth:at,cause:'hold'};
}

/* Current-defense spatial effect (spec §8). Only main direct hits;
   homers are immune; returns zero otherwise. Caller adds delta to the final
   damage (max 1) and +1 base to pre-existing runners only. */
export function defenseSpace({depth,stance,hit,direct,homer}){
  if(!hit||!direct||homer)return {delta:0,extraAdvance:0};
  const at=clampDepth(depth);
  if(stance==='advance'){
    if(at===DEFENSE_DEPTH_MIN)return {delta:DEFENSE_SPACE_PENALTY,extraAdvance:0};
    if(at===DEFENSE_DEPTH_MAX)return {delta:0,extraAdvance:1};
    return {delta:0,extraAdvance:0};
  }
  if(stance==='power'){
    if(at===DEFENSE_DEPTH_MIN)return {delta:DEFENSE_SPACE_BONUS,extraAdvance:0};
    if(at===DEFENSE_DEPTH_MAX)return {delta:DEFENSE_SPACE_PENALTY,extraAdvance:0};
    return {delta:0,extraAdvance:0};
  }
  return {delta:0,extraAdvance:0};
}

/* Valid successful sacrifice (§7 1-4): kind is sacrifice, a runner stood
   before the pitch, that runner actually advanced/scored, outs stay under 3. */
export function defenseSacrificeValid({isSacrifice,hadRunner,advanced,outsAfter,isBuntFamily}){
  return !!(isSacrifice&&hadRunner&&advanced&&outsAfter<3&&isBuntFamily);
}

/* Display copy for a transition cause (spec §6/§12 direction). */
export const DEFENSE_CAUSE_TEXT={
  'contact-high':'높은 코스 안타 경계로 다음 수비 후퇴',
  'contact-low':'낮은 코스 안타로 다음 수비 전진',
  advance:'진루 적중 → 다음 수비 전진',
  power:'장타 경계로 다음 수비 후퇴',
  sacrifice:'유효 희생 → 즉시 전진',
  hold:'다음 수비 유지',
};
export const defenseCauseText=cause=>DEFENSE_CAUSE_TEXT[cause]||DEFENSE_CAUSE_TEXT.hold;
