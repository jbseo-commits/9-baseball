/* Presentation only. Read public BEFORE state or finalized combat numbers.
   Never infer a rule from localized event strings or inspect pending rolls. */
import {PITCHER_ENCOUNTERS} from './pitcher-encounters.js';
import {v10StackMax,v10PrepMax} from './engine.js';

function activeEncounter(s){
 const e=PITCHER_ENCOUNTERS[s?.v10?.opponent?.artId];
 return s?.version===10&&s.v10?.opponent?.encounter?.version===1&&e&&
  s.defenseLab?.schema!==1&&!s.v10.zoneFirst&&s.battle?.intent?.encounter?.active===true&&s.battle.intent.encounter.appliedDistribution===true?e:null;
}
export function publicEncounterCue(s){
 const e=activeEncounter(s);if(!e)return null;
 const b=s.battle,previous=b.history?.at(-1),count=(Number.isInteger(b.pitchCount)?b.pitchCount:(b.history||[]).length),third=count%3===2;
 let motif='target',text='',detail='',ready=false,steps=null;
 switch(e.id){
 case 'regular-01-red-rush':text='본 정타 +2';detail='같은 코스를 거듭 노림';break;
 case 'regular-02-teal-mirage':motif='change';text='노림 바꿔 안타 +4';detail='같은 노림 안타는 기본 ×0.8';ready=Number.isInteger(previous?.aimZone);break;
 case 'regular-03-amber-sinker':motif='armor';text='낮은 1칸 정타 +4';detail='낮은 3칸 커버 적중: 기본 ×0.8';break;
 case 'regular-04-ivory-ace':motif='cycle';steps={count:3,current:count%3};text=third?'이번 안타 +5':'3구째 안타 +5';ready=third;break;
 case 'regular-05-violet-sting':text='중단 본 정타 +4';detail='지원만 적중: 기본 ×0.8';break;
 case 'regular-06-rose-paint':motif='cycle';steps={count:4,current:count%4};text='모서리 정타 +4';detail='모서리를 순서대로 선호';break;
 case 'tide-vesper':motif='wave';text=previous?.action==='take'?'이번 안타 +5':'지켜본 다음 공 안타 +5';detail=count%2?'높은 코스 선호':'낮은 코스 선호';ready=previous?.action==='take';break;
 case 'sky-phantom':motif='deep';text='홈런 +8';detail='높은 코스 선호 · 깊은 수비';break;
 case 'elite-01-cobalt-impact':motif='pressure';text=b.strikes===2?'이번 본 정타 +6':'2스트라이크 본 정타 +6';detail=count===0?'초구 기본 피해 ×0.85':'';ready=b.strikes===2;break;
 case 'elite-02-neon-trick':motif='change';steps={count:3,current:count%3};text='노림 바꿔 안타 +6';ready=Number.isInteger(previous?.aimZone);break;
 case 'elite-03-wine-bluff':motif='eye';text='볼 지켜보면 +3';detail='존 밖 볼을 유인';break;
 case 'gale-twister':motif='link';steps={count:4,current:count%4};text='전부 연결한 안타 +6';detail='코스를 시계 방향으로 선호';break;
 case 'vulcan-blaze':motif='heat';steps={count:3,current:count%3};text=third?'이번 안타 +8':'3구째 안타 +8';detail=third?'안타에만 추가 피해':'이번 기본 피해 ×0.85';ready=third;break;
 case 'jade-viper':motif='armor';text=previous?.kind==='hit'?'이번 기본 피해 ×0.75':'안타 뒤 다음 공 방패';detail='연속 본 정타 +8 별도';ready=previous?.kind==='hit';break;
 case 'copper-sirocco':motif='sand';text=`이번 준비 ${v10PrepMax(s)}회까지`;detail=b.balls>=2?'이번 안타 +6':'2볼 뒤 안타 +6';ready=b.balls>=2;break;
 case 'boss-01-emerald-tyrant':motif='armor';text='낮은 1칸 정타 +8';detail='낮은 3칸 커버 적중: 기본 ×0.7';break;
 case 'boss-02-platinum-halo':motif='halo';text='3장↑ 기본 피해 ×0.75';detail='홈런 +10 별도';break;
 case 'boss-03-black-eclipse':motif='change';text='다른 열 본 정타 +8';detail='직전 노림 반대 열 선호';ready=Number.isInteger(previous?.aimZone);break;
 case 'emerald-tempest':motif='wave';steps={count:3,current:count%3};text=third?'이번 연결 안타 +10':'3구째 연결 안타 +10';detail='높음 → 중간 → 낮음 선호';ready=third;break;
 case 'onyx-eclipse':motif='limit';steps={count:3,current:count%3};text=`이번 연결 ${v10StackMax(s)}장까지`;detail=third?'이번 본 정타 +10':'3구째 본 정타 +10';ready=third;break;
 default:return null;
 }
 return {id:e.id,label:e.label,motif,text,detail,ready,steps};
}

export function landedEncounterCue(s,combat){
 const e=activeEncounter(s),plan=combat?.encounterPlan||combat?.encounter;
 if(!e||!plan)return null;
 const rate=Number.isFinite(plan.rate)?plan.rate:1,bonus=Number.isFinite(plan.bonus)?Math.max(0,plan.bonus):0;
 // A multiplier cannot visibly guard a zero-base attack. Bonus is a term,
 // not necessarily the HP lost (rounding, other terms and overkill coexist).
 const guarded=rate<1&&combat.baseDamage>0;
 if(!guarded&&!bonus)return null;
 return {id:e.id,label:e.label,motif:publicEncounterCue(s)?.motif||'target',
  rate:guarded?rate:1,bonus,guarded,
  text:[guarded?`기본 피해 ×${rate}`:'',bonus?`추가 피해 +${bonus} HP`:''].filter(Boolean).join(' · ')};
}
