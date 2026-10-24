/* P2 투수 의도 아이콘 (2026-10-24): 확률표를 읽지 않아도 이번 공의 성격을 한눈에.
   이번 공의 실제 분포(swing-preview v10PitchDistribution — 속임수 이동·정찰 단서 반영)를 다섯 의도로 분류한다.
   틀린 아이콘은 만들지 않는다: 읽기 단계가 낮으면 흐리게만 보인다(엔진의 "틀린 숫자 금지" 계약).
   임계값은 아래 상수로 튜닝한다. 존 번호: 0 1 2 / 3 4 5 / 6 7 8, 열 0 = 몸쪽, 열 2 = 바깥쪽, 9 = 볼. */
import {v10PitchDistribution} from './swing-preview.js';
import {readLevel} from './engine.js';

export const INTENT_THRESHOLDS=Object.freeze({
  lureBall:.30,     // 볼(존 밖) 비중이 이 이상이면 유인구
  sideShare:.55,    // 존 안 공 중 한 열 비중이 이 이상이면 몸쪽/바깥쪽 공략
  strikeZone:.75,   // 존 안 비중이 이 이상이고 한 칸에 몰리면 승부구
  strikePeak:.22,   // 승부구로 읽으려면 가장 많은 칸의 전체 비중이 이 이상
});
/* 읽기 단계별 선명도 (eye가 낮을수록 흐리게) */
export const INTENT_OPACITY=Object.freeze([.45,.72,1]);

export const INTENTS=Object.freeze({
  strike:{icon:'🎯',label:'승부구',note:'존 안으로 들어온다'},
  lure:{icon:'🪤',label:'유인구',note:'존 밖 볼이 많다'},
  inside:{icon:'⬅️',label:'몸쪽 공략',note:'몸쪽 열로 몰린다'},
  outside:{icon:'➡️',label:'바깥쪽 공략',note:'바깥쪽 열로 몰린다'},
  unclear:{icon:'❓',label:'읽기 힘듦',note:'고르게 흩어진다'},
});

export function classifyIntent(probs,t=INTENT_THRESHOLDS){
  const p=probs||[],inZone=p.slice(0,9).reduce((a,x)=>a+(x||0),0),ball=p[9]||0;
  if(ball>=t.lureBall)return 'lure';
  const col=c=>[c,c+3,c+6].reduce((a,z)=>a+(p[z]||0),0);
  if(inZone>0){
    if(col(0)/inZone>=t.sideShare)return 'inside';
    if(col(2)/inZone>=t.sideShare)return 'outside';
  }
  const peak=Math.max(0,...p.slice(0,9).map(x=>x||0));
  if(inZone>=t.strikeZone&&peak>=t.strikePeak)return 'strike';
  return 'unclear';
}

/* 실제 공이 아이콘이 말한 쪽으로 왔는가 (검증용). unclear는 판정하지 않는다(null). */
export function intentMatches(kind,zone){
  if(kind==='lure')return zone===9;
  if(kind==='inside')return zone!==9&&zone%3===0;
  if(kind==='outside')return zone!==9&&zone%3===2;
  if(kind==='strike')return zone!==9;
  return null;
}

export function pitcherIntentIcon(s){
  const b=s?.battle;if(!b?.intent||s.phase!=='battle')return null;
  const kind=classifyIntent(v10PitchDistribution(s)),level=readLevel(s);
  return {kind,...INTENTS[kind],level,opacity:INTENT_OPACITY[level]??1};
}
