/* 스윙 예측 프리뷰 (P1, 2026-10-24).
   계산은 게임이, 판단은 유저가: 실행하기 전에 이 스윙이 투수 HP에 무엇을 할지 보여 준다.
   실제 판정(engine resolve → playV10Action)과 같은 함수만 쓴다:
   - 공 분포: 공개 분포(publicProbabilities)에 속임수 코스 이동(dealPitch와 같은 규칙)을 합친 것
   - 결과 분포: swingOdds / hitProfile (resolve·battingResult와 같은 함수)
   - HP: v10DamageTerms + pitcherDamageFor (playV10Action·applyPitcherOutcome와 같은 함수)
   숨은 난수(pending.zone/roll)는 절대 읽지 않는다. */
import {CARDS} from './cards.js';
import {trickNeighbors} from './gimmick.js';
import {publicProbabilities,knownPitchZones,coverage,coverageAt,swingOdds,hitProfile,v11StackPlan,v10GimmickRules,
  v10DamageTerms,v10Shaken,readLevel,playV10Action,V10_RUNNER_PRESSURE} from './engine.js';
import {pitcherDamageFor} from './pitcher-hp.js';
import {probabilityBounds} from './information.js';

const EPS=1e-9;
const kindOf=(s,id)=>id==='basic'?'basic':s.deck.find(c=>c.id===id)?.kind;

/* 속임수 코스(gimmick trick): dealPitch는 존 안 공을 이 확률로 예고 칸의 이웃으로 민다. */
export function trickRateFor(s){
  const b=s?.battle,gr=v10GimmickRules(s);
  return b?.strikes===0&&b?.balls===0?gr.trickRate:gr.trickLate;
}
function trickMix(p,t){
  if(!t)return [...p];
  const out=p.map((v,z)=>z<9?v*(1-t):v);
  for(let z=0;z<9;z++){if(!p[z])continue;const near=trickNeighbors(z);for(const y of near)out[y]+=p[z]*t/near.length;}
  return out;
}
/* 이번 공이 실제로 떨어질 분포 (판정용 진짜 확률). 정찰 단서가 있으면 그 범위로 좁힌다. */
export function v10PitchDistribution(s){
  const b=s.battle,mixed=trickMix(b.intent.probabilities,trickRateFor(s));
  if(!b.scouted||!b.pending)return mixed;
  const known=knownPitchZones(s),visible=mixed.map((v,z)=>known.includes(z)?v:0),sum=visible.reduce((a,x)=>a+x,0);
  return sum>0?visible.map(v=>v/sum):publicProbabilities(s);
}

/* 화면에 보이는 적중 확률. 읽기 2단계는 정확한 값, 낮은 단계는 공개 구간(틀린 숫자는 보이지 않는다).
   공개 칸 구간을 속임수 이동에 그대로 통과시킨다: 이동은 비음수 선형이라 구간이 보존된다. */
export function v10HitBounds(s,zones){
  const list=(zones||[]).filter(z=>z<9);if(!list.length)return [0,0];
  const exact=v10PitchDistribution(s);
  if(readLevel(s)===2){const v=list.reduce((a,z)=>a+exact[z],0);return [v,v];}
  const t=trickRateFor(s),bounds=probabilityBounds(s);
  const lo=trickMix(bounds.map(x=>x[0]),t),hi=trickMix(bounds.map(x=>x[1]),t);
  const sum=(arr,inside)=>arr.reduce((a,v,z)=>a+((list.includes(z))===inside?v:0),0);
  return [Math.max(0,sum(lo,true),1-sum(hi,false)),Math.min(1,sum(hi,true),1-sum(lo,false))];
}
export function formatHitChance([lo,hi]){
  if(hi<EPS)return '0%';
  if(lo>1-EPS)return '100%';
  if(hi-lo<EPS)return Math.round(lo*100)+'%';
  return Math.floor(lo*100+EPS)+'–'+Math.ceil(hi*100-EPS)+'%';
}

/* 손패 수를 읽는 카드(fx.hand)를 위해, 판정 뒤 손패 수를 판정과 같은 규칙으로 센다. */
function handAfterFor(s,id,supports,hit){
  const b=s.battle,used=(id&&id!=='basic'?1:0)+supports.length,def=CARDS[kindOf(s,id)];
  let hand=b.hand.length-used,stock=b.draw.length+b.discard.length+used;
  const draws=(def?.fx?.drawPlay||0)+(hit?def?.fx?.drawHit||0:0);
  for(let i=0;i<draws&&hand<5&&stock>0;i++){hand++;stock--;}
  return hand;
}

/* 계획된 스윙(메인 id + 지원 카드)의 결과 분포와 투수 HP 피해.
   반환: hitChance(진짜 확률) · dmgMin/dmgMax(안타일 때) · multiplier(HP 배율) · multiplierReason(배율의 이유) 등. */
export function previewSwing(s,{id='basic',supports=[]}={},probabilities=v10PitchDistribution(s)){
  const b=s.battle;if(!b||!s.pitcher||!id)return null;
  const k=kindOf(s,id);if(id!=='basic'&&CARDS[k]?.type!=='attack')return null;
  const main=coverage(s,id),items=supports.map(x=>({id:x.id,aimZone:x.aimZone,kind:kindOf(s,x.id),coverage:coverageAt(s,x.id,x.aimZone)}));
  const combined=[...new Set([...main,...items.flatMap(x=>x.coverage)])];
  const plan=v11StackPlan(s,id,supports),stackCardCount=1+items.length,stackDamageRate=plan.orderedDamageRate??plan.damageRate;
  const pitchInPA=1+(b.history||[]).filter(h=>h.turn===b.turn).length;
  const action={type:'card',id,supports},foulStreak=s.pitcher.foulStreak||0;
  const outcomes=[];
  const push=(p,r,outcome)=>{
    if(p<=EPS)return;
    const terms=v10DamageTerms(s,{action,choice:k,r,outcome,stackCardCount,stackDamageRate,pitchInPA,
      handAfter:handAfterFor(s,id,items,r.kind==='hit'),foulStreak});
    const {damage}=pitcherDamageFor(outcome,foulStreak,{damageMultiplier:terms.damageMultiplier,damageBonus:terms.damageBonus});
    outcomes.push({p,kind:r.kind,bases:outcome.bases||0,zone:outcome.zone,label:outcome.label,damage,terms});
  };
  const base={aimZone:b.aimZone,primaryCoverage:main,supportKinds:items.map(x=>x.kind),stackLinks:plan.links||[]};
  probabilities.forEach((p,z)=>{
    if(p<=EPS)return;
    if(z!==9&&main.includes(z)){
      for(const t of hitProfile(s,id,z,combined.length)){
        const outcome={kind:'hit',label:t.label,bases:t.bases,zone:z,aimZone:b.aimZone,covered:true};
        push(p*t.p,{...base,kind:'hit',zone:z,assistOnly:false},outcome);
      }
      return;
    }
    const saver=z!==9?items.find(x=>x.coverage.includes(z)):null;
    if(saver){
      push(p,{...base,kind:'hit',zone:z,assistOnly:true},{kind:'hit',label:'겹친 카드 단타',bases:1,zone:z,aimZone:b.aimZone,covered:true});
      return;
    }
    const o=swingOdds(s,id,z);
    for(const kind of ['foul','whiff','out','sacrifice'])
      push(p*(o[kind]||0),{...base,kind,zone:z},{kind,label:kind,bases:0,zone:z,aimZone:b.aimZone,covered:false});
  });
  const hits=outcomes.filter(o=>o.kind==='hit'),misses=outcomes.filter(o=>o.kind!=='hit');
  const hitChance=hits.reduce((a,o)=>a+o.p,0);
  const range=list=>list.length?[Math.min(...list.map(o=>o.damage)),Math.max(...list.map(o=>o.damage))]:[0,0];
  const [dmgMin,dmgMax]=range(hits),[missMin,missMax]=range(misses);
  const expected=outcomes.reduce((a,o)=>a+o.p*o.damage,0);
  const hitTerms=hits[0]?.terms||outcomes[0]?.terms;
  const runners=(b.bases||[]).filter(Boolean).length,shaken=v10Shaken(s);
  const multiplier=hitTerms?hitTerms.damageMultiplier*(1+runners*V10_RUNNER_PRESSURE):1;
  /* 배율의 이유: 실제로 피해에 들어가는 항목만, 화면 뱃지 순서대로 */
  const reasons=[];
  if(stackCardCount>1)reasons.push({key:'stack',label:stackCardCount+'장 스택 ×'+(stackDamageRate).toFixed(2).replace(/0$/,'')});
  if(hitTerms?.momentumBefore>0)reasons.push({key:'momentum',label:'기세 ×'+hitTerms.momentumRate.toFixed(1)});
  const precision=hits.find(o=>o.terms.precisionRate>0)?.terms.precisionRate||0;
  if(precision)reasons.push({key:'precision',label:'정확 적중 +'+Math.round(precision*100)+'%'});
  if(runners)reasons.push({key:'runners',label:'+'+Math.round(runners*V10_RUNNER_PRESSURE*100)+'% (주자 '+runners+'명)'});
  const shakenHp=shaken?(CARDS[k]?.fx?.shaken||0)*shaken:0;
  return {hitChance,hitBounds:v10HitBounds(s,combined),dmgMin,dmgMax,missMin,missMax,expected,
    multiplier,multiplierReason:reasons.map(x=>x.label).join(' · '),reasons,
    runners,shaken,shakenHp,coverage:combined.sort((a,c)=>a-c),cardCount:stackCardCount,outcomes};
}

/* 준비 카드를 쓴다고 가정한 상태: 실제 playV10Action을 그대로 돌린 뒤, 정찰로 드러날 숨은 공 정보만 지운다.
   (정찰 결과를 미리 보여 주면 숨은 난수가 새어 나간다.) */
export function previewAfterSkill(s,skillId){
  const entry=s.deck.find(c=>c.id===skillId),def=entry&&CARDS[entry.kind];
  if(!def||def.type!=='skill')return null;
  const next=playV10Action(s,{type:'card',id:skillId});
  if(next===s||!next.battle)return null;
  next.battle.scouted=false;next.battle.scoutPlus=false;next.battle.scoutBall=false;
  return next;
}
