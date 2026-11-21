import {foxFlightAt} from './fox-flight.js';
/* Public encounter identity only. No state, pending roll, aimed zone or RNG. */
export function pitchPersonality(cue,artId=null){
 if(!cue||cue.id!==artId)return null;
 switch(cue.id){
 case 'vulcan-blaze':{
  if(cue.steps?.count!==3||![0,1,2].includes(cue.steps.current))return null;
  if(cue.ready!==(cue.steps.current===2))return null;
  const vent=cue.ready;
  return {id:vent?'vulcan-vent':'vulcan-brace',label:vent?'3구 · 빈틈':`${cue.steps.current+1}구 · 압축`,glyph:vent?'⌁':'Ⅱ',sound:vent?'pitchVent':'pitchCompression',amplitude:vent?300:0,ready:vent,description:vent?'배기판 열림 · 이번 안타에만 +8 HP · 중간 선호는 확정 코스가 아님':'브레이스 닫힘 · 기본 피해 ×0.85 · 높은 선호는 확정 코스가 아님'};
 }
 case 'boss-01-emerald-tyrant':return {id:'low-wall',label:'낮은 성벽',glyph:'▂',sound:'pitchWall',ready:false,description:'낮은 선호 · 확정 코스 아님 · 낮은 한 칸만 본 정타 +8 HP · 낮은 3칸 커버 안타 기본 ×0.7'};
 case 'tide-vesper':return {id:'float-drop',label:'낙차',glyph:'≈',sound:'pitchFloat',amplitude:cue.flightPreference==='high'?260:360,ready:cue.ready,description:'떠올랐다 급강하 · 선호는 확정 코스가 아님'};
 case 'gale-twister':return {id:'sweep',label:'회전',glyph:'↻',sound:'pitchSweep',amplitude:(cue.steps?.current<2?1:-1)*440,ready:cue.ready,description:'시계 회전 궤적 · 연결 안타를 노리세요'};
 case 'elite-01-cobalt-impact':return {id:'rush',label:'압축',glyph:'»',sound:'pitchRush',ready:cue.ready,description:'압축 후 돌진 · 2스트라이크 본 정타 기회'};
 default:return null;
 }
}
/* One core ball. Local stylization is zero at release and actual crossing.
 * Beyond crossing retain the incoming derivative, including radius/depth.
 * Cobalt compresses time within the SAME 300ms deadline, never gameplay time. */
export function personalityFlightAt(elapsed,releaseAt,impactAt,R,C,profile){
 if(!profile)return foxFlightAt(elapsed,releaseAt,impactAt,R,C);
 const duration=Math.max(1,impactAt-releaseAt),raw=Math.max(0,(elapsed-releaseAt)/duration);
 const warp=t=>(profile.id==='rush'||profile.id==='vulcan-brace')?(t<=1?.35*t+.65*t*t*t:1+2.3*(t-1)):t;
 const bend=t=>t<=1?t*t*(1-t):-(t-1);
 const sample=t=>{
  const w=Math.min(1.6,warp(t)),depth=2-w,q=w/depth;
  const offset=(profile.amplitude||0)*bend(Math.min(t,1.6));
  return {ball:{x:R.x+(C.x-R.x)*q+(['sweep','vulcan-vent'].includes(profile.id)?offset:0),y:R.y+(C.y-R.y)*(profile.id==='low-wall'?q*q:q)-(profile.id==='float-drop'?offset:0)},radius:12/depth};
 };
 const value=sample(raw),previous=sample(Math.max(0,raw-1000/60/duration));
 return {...value,previous:previous.ball,hidden:warp(raw)>=1.6,personality:profile.id,releasePoint:R,releaseBeat:Math.max(0,1-raw/.28)};
}
