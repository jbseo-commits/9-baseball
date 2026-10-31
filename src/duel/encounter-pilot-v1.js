/* Opt-in, versioned opponent rules for the first encounter pilot slice.
   This module stays independent of engine selectors so the same rules can be
   read by the engine, previews, save validation and battle view model. */

export const ENCOUNTER_PILOT_VERSION=1;

export const ENCOUNTER_PILOTS=Object.freeze({
  red:Object.freeze({id:'red',artId:'regular-01-red-rush',name:'레드 러시',type:'battle',style:'deep',archetype:'정면 승부형',rewardTier:1,initialZones:Object.freeze([5]),zoneOpen:1,zoneMax:3}),
  teal:Object.freeze({id:'teal',artId:'regular-02-teal-mirage',name:'청록 미라주',type:'battle',style:'rookie',archetype:'바깥 고집형',rewardTier:1,initialZones:Object.freeze([2,5,8]),zoneOpen:3,zoneMax:3}),
  cobalt:Object.freeze({id:'cobalt',artId:'elite-01-cobalt-impact',name:'코발트 임팩트',type:'elite',style:'deep',archetype:'카운트 사냥꾼',rewardTier:2,initialZones:Object.freeze([0,3,6]),zoneOpen:3,zoneMax:6}),
  tyrant:Object.freeze({id:'tyrant',artId:'boss-01-emerald-tyrant',name:'에메랄드 타이런트',type:'boss',style:'sinker',archetype:'낮은 벽',rewardTier:3,act:1}),
});
const ALIASES=Object.freeze({red:'red','red-rush':'red','regular-01-red-rush':'red',teal:'teal','teal-mirage':'teal','regular-02-teal-mirage':'teal',
  cobalt:'cobalt','cobalt-impact':'cobalt','elite-01-cobalt-impact':'cobalt',tyrant:'tyrant','emerald-tyrant':'tyrant','boss-01-emerald-tyrant':'tyrant'});

export const normalizeEncounterPilot=value=>value===true?'red':typeof value==='string'?ALIASES[value.toLowerCase()]||null:null;
export const isEncounterPilotId=id=>Object.hasOwn(ENCOUNTER_PILOTS,id);
export const encounterPilotFor=state=>{
  const id=state?.v10?.opponent?.encounterPilot?.id;
  return state?.v10?.opponent?.encounterPilot?.version===ENCOUNTER_PILOT_VERSION&&isEncounterPilotId(id)?id:null;
};

export function bindEncounterPilotToMap(map,id){
  const profile=ENCOUNTER_PILOTS[id];if(!profile||!map)return map;
  const entry=map.nodes.find(n=>n.id==='a1-entry');if(!entry)return map;
  let template=entry;
  if(profile.type!=='battle')template=map.nodes.find(n=>n.act===1&&n.type===profile.type&&n.id!=='a1-entry')||entry;
  entry.type=profile.type;entry.name=template.name;entry.route=template.route;entry.routeLabel=template.routeLabel;
  entry.risk=template.risk;entry.reward=template.reward;
  const source=template.opponent||entry.opponent;
  entry.opponent={...source,name:profile.name,artId:profile.artId,style:profile.style,archetype:profile.archetype,
    archetypeKey:profile.id,act:1,rewardTier:profile.rewardTier,gimmick:null,
    encounterPilot:{version:ENCOUNTER_PILOT_VERSION,id}};
  if(profile.initialZones){
    entry.opponent={...entry.opponent,openingZones:[...profile.initialZones],zoneOpen:profile.zoneOpen,zoneMax:profile.zoneMax};
  }
  entry.preview=`${entry.opponent.name} · ${entry.opponent.archetype} · HP ${entry.opponent.maxHp}`;
  return map;
}

export function createEncounterBattleState(id){
  if(!isEncounterPilotId(id))return null;
  return {version:ENCOUNTER_PILOT_VERSION,id,committedPitches:0,pitchesInPA:0,guardOpenPitchesRemaining:0,lastMessage:null};
}

export function encounterPitchPlan(state){
  const id=encounterPilotFor(state),e=state?.battle?.encounter;if(!id||!e)return null;
  if(id==='red'){
    const n=e.committedPitches;
    if(n<2)return {zones:[...ENCOUNTER_PILOTS.red.initialZones],ballChance:0,name:'표시된 한곳으로 승부',detail:'첫 두 공은 기존 튜토리얼처럼 표시된 한곳으로 옵니다.'};
    if(n<4)return {zones:[2,5],ballChance:.06,name:'같은 열 후보 2칸',detail:'같은 바깥 열 두 높이 중 하나로 옵니다.'};
    return {zones:[2,5,8],ballChance:.08,name:'같은 열 후보 3칸',detail:'바깥 열 세 높이 중 하나로 옵니다.'};
  }
  if(id==='teal'){
    const center=e.committedPitches%3===2,zones=center?[1,4,7]:[...ENCOUNTER_PILOTS.teal.initialZones];
    return {zones,ballChance:.10,name:center?'가운데로 돌아온다':'바깥쪽 고집',detail:`${e.committedPitches+1}구째 · ${center?'가운데 열':'바깥 열'}에서 높이를 고릅니다.`};
  }
  if(id==='cobalt'){
    const expanded=state.battle.strikes===2;
    return {zones:expanded?[0,1,3,4,6,7]:[...ENCOUNTER_PILOTS.cobalt.initialZones],ballChance:expanded?.04:.08,
      name:expanded?'결정구 · 6존으로 넓힌다':'초구부터 승부 · 안쪽 3존',detail:expanded?'2스트라이크에서는 안쪽·가운데 여섯 후보로 넓어집니다.':'타석 초반은 안쪽 열 세 후보로 승부합니다.'};
  }
  return null;
}

export function encounterGuardZones(state){
  if(encounterPilotFor(state)!=='tyrant')return [];
  const low=[6,7,8],expanded=(state.pitcher?.hp||0)<=((state.pitcher?.maxHp||1)*.60);
  return expanded?[...new Set([...low,4])].sort((a,b)=>a-b):low;
}

export function snapshotEncounterPitch(state){
  const id=encounterPilotFor(state),e=state?.battle?.encounter;if(!id||!e)return null;
  const plan=encounterPitchPlan(state),guardZones=encounterGuardZones(state);
  return {version:ENCOUNTER_PILOT_VERSION,id,pitchNumber:e.committedPitches+1,
    ...(plan?{candidateZones:[...plan.zones],intent:plan.name}:{}),guardZones,
    guardOpen:e.guardOpenPitchesRemaining>0,guardOpenPitchesRemaining:e.guardOpenPitchesRemaining,
    damageEfficiency:e.guardOpenPitchesRemaining>0?1.25:1};
}

export function commitEncounterPitch(encounter,pending,result,aimZone,mainCoverage){
  if(!encounter||!pending?.encounter)return encounter;
  const snap=pending.encounter,next={...encounter,committedPitches:encounter.committedPitches+1,pitchesInPA:encounter.pitchesInPA+1,lastMessage:null};
  if(snap.id==='tyrant'){
    if(snap.guardOpen){next.guardOpenPitchesRemaining=Math.max(0,encounter.guardOpenPitchesRemaining-1);}
    else if(result?.kind==='hit'&&!result.assistOnly&&snap.guardZones.includes(result.zone)&&aimZone===result.zone&&mainCoverage.includes(result.zone)){
      next.guardOpenPitchesRemaining=2;next.lastMessage='낮은 벽이 깨졌다 · 다음 두 공 빈틈';
    }else next.guardOpenPitchesRemaining=0;
  }
  return next;
}

export function encounterDamageRule(state,r,outcome){
  const snap=state?.battle?.pending?.encounter||state?.battle?.encounter?.currentPitch;
  if(snap?.id!=='tyrant'||r?.kind!=='hit'||!snap.guardZones.includes(outcome?.zone))return {efficiency:1,reason:null};
  if(snap.guardOpen)return {efficiency:1.25,reason:'낮은 벽이 열림 · HP ×1.25'};
  const exact=!r.assistOnly&&r.aimZone===outcome.zone&&Array.isArray(r.primaryCoverage)&&r.primaryCoverage.includes(outcome.zone);
  if(exact)return {efficiency:1,reason:'정확 적중 · 낮은 벽 해제'};
  return {efficiency:.75,reason:'낮은 벽 · 비정확 안타 HP ×0.75'};
}

export function encounterIntentLine(state,{locked=false}={}){
  const id=encounterPilotFor(state),plan=encounterPitchPlan(state),pending=state?.battle?.pending?.encounter,
    shown=locked?(state?.battle?.encounter?.currentPitch||pending):pending;
  if(id==='tyrant'){
    if(shown?.guardOpen)return `낮은 벽 빈틈 · ${shown.guardOpenPitchesRemaining}공 남음`;
    return '낮은 벽 · 정확 적중으로 빈틈을 연다';
  }
  return (locked?shown?.intent:plan?.name)||null;
}

export function encounterZoneMark(state,zone){
  const p=state?.battle?.pending?.encounter;
  if(p?.id!=='tyrant'||!p.guardZones.includes(zone))return null;
  return p.guardOpen?'빈틈':'벽';
}
