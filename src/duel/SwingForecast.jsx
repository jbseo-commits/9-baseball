import React from 'react';
import {CARDS} from './cards.js';
import {cardProblem,stackSupportProblem} from './engine.js';
import {previewSwing,previewAfterSkill,formatHitChance} from './swing-preview.js';
import './swing-forecast.css';

/* P1 스윙 예측: 행동하기 전에 결과가 보인다.
   숫자는 swing-preview.js(실제 판정과 같은 함수)에서만 온다. 색은 전부 인라인 style이다. */

/* 넓은 범위 = 파랑(안전), 좁은 범위 = 주황~빨강(리스크) */
export function riskColor(cells){
  if(cells<=1)return '#ff4d3d';
  if(cells===2)return '#ff8a2b';
  if(cells===3)return '#ffc23d';
  if(cells<=5)return '#4fc3f7';
  return '#3d7bff';
}

/* 지금 보여 줄 예측.
   - plan: 확정된 메인 카드(+지원)와 노림존
   - hoverZone: 손가락/마우스가 지나는 존(확정 전 미리보기). 지원 카드가 코스를 기다리면 그 카드의 코스로 쓴다
   - skillId: 고른(또는 가리킨) 준비 카드 — 적용 전 → 적용 후로 보여 준다 */
export function forecastFor({s,selected,stack=[],armed=null,hoverZone=null,skillId=null,lastSwing=null}){
  const b=s?.battle;if(!b||s.phase!=='battle'||!s.pitcher)return null;
  const inHand=id=>id==='basic'||b.hand.includes(id);
  const swingKind=id=>id==='basic'||CARDS[s.deck.find(c=>c.id===id)?.kind]?.type==='attack';
  let id=selected&&swingKind(selected)?selected:null,supports=id?stack:[];
  if(!id&&skillId){id=lastSwing&&inHand(lastSwing.id)&&swingKind(lastSwing.id)?lastSwing.id:'basic';supports=lastSwing&&id===lastSwing.id?lastSwing.supports.filter(x=>inHand(x.id)):[];}
  if(!id)return null;
  let base=s;
  if(Number.isInteger(hoverZone)&&hoverZone>=0&&hoverZone<9){
    if(armed&&id!=='basic')supports=[...supports,{id:armed,aimZone:hoverZone}];
    else base={...s,battle:{...b,aimZone:hoverZone}};
  }
  const plan={id,supports};
  const now=previewSwing(base,plan);if(!now)return null;
  if(!skillId)return {now,plan,skill:null};
  const after=previewAfterSkill(base,skillId);
  // A not-yet-played preparation cannot upgrade the information already earned.
  const next=after&&previewSwing(after,plan,undefined,base);
  return next?{now:next,before:now,plan,skill:skillId}:after
    ?{now,plan,skill:skillId,problem:cardProblem(after,id)||stackSupportProblem(after,id,supports)}
    :{now,plan,skill:null};
}

const chanceBounds=f=>f.sacrifice?f.sacBounds:f.hitBounds;
const dmgText=f=>{
  const [low,high]=f.sacrifice?[f.sacMin,f.sacMax]:[f.dmgMin,f.dmgMax];
  return chanceBounds(f)[1]>0?(low===high?String(low):low+'~'+high):'-';
};
const changeColor=(a,b)=>b>a?'#7dff9a':b<a?'#ff7a6b':'#f3ead2';

export function ForecastChip({forecast,compact=false}){
  if(!forecast)return null;
  const {now,before,problem}=forecast,color=riskColor(now.coverage.length);
  const hit=formatHitChance(chanceBounds(now)),hitBefore=before&&formatHitChance(chanceBounds(before));
  const outcomeName=now.sacrifice?'희생타':'안타';
  const dmg=dmgText(now),dmgBefore=before&&dmgText(before);
  const pill={padding:'2px 6px',borderRadius:'6px',background:'rgba(8,12,22,.88)'};
  const badge={padding:'1px 6px',borderRadius:'999px',fontSize:'10.5px'};
  return <div className="bp-forecast" data-testid="bp-forecast" role="status" aria-live="polite"
    aria-label={problem?`준비 후 실행 불가 · ${problem}`:`예측 ${outcomeName} ${hit} · ${outcomeName} 데미지 ${dmg}`+(now.runners?` · 주자 ${now.runners}명`:'')+(now.shaken?` · 투수 흔들림 ${now.shaken}`:'')}
    style={{position:'absolute',left:'50%',bottom:'100%',transform:'translate(-50%,-24px)',zIndex:8,pointerEvents:'none',
      display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',width:'max-content',maxWidth:'92vw',
      whiteSpace:'nowrap',font:'700 11.5px/1.15 system-ui,sans-serif',color:'#f3ead2'}}>
    {problem?<span data-testid="bp-forecast-problem" style={{...pill,color:'#ffbd9b'}}>준비 후 실행 불가 · {problem.includes('에너지')?'공격 에너지 부족':problem}</span>:<><span style={{display:'flex',gap:'4px'}}>
      <span data-testid="bp-forecast-hit" style={{...pill,border:`1px solid ${color}`,boxShadow:`0 0 8px ${color}66`}}>
        {now.sacrifice?'희생타':compact?<span aria-hidden="true">◎</span>:'적중'} {before&&hitBefore!==hit?<><s style={{opacity:.6}}>{hitBefore}</s> → <b style={{color:changeColor(chanceBounds(before)[0],chanceBounds(now)[0])}}>{hit}</b></>:<b style={{color}}>{hit}</b>}
      </span>
      <span data-testid="bp-forecast-dmg" style={{...pill,border:'1px solid #ffb347'}}>
        {compact?<span aria-hidden="true">♥ −</span>:outcomeName+' 시 '}{before&&dmgBefore!==dmg?<><s style={{opacity:.6}}>{dmgBefore}</s> → <b style={{color:changeColor(before.dmgMax,now.dmgMax)}}>{dmg}</b></>:<b style={{color:'#ffd27a'}}>{dmg}</b>}
      </span>
    </span>
    {((now.runners>0&&!now.sacrifice)||now.shaken>0)&&<span className="bp-forecast-badges" style={{display:'flex',gap:'4px'}}>
      {now.runners>0&&!now.sacrifice&&<span data-testid="bp-forecast-runners" style={{...badge,background:'#3a2a05',border:'1px solid #ffcf4a',color:'#ffe38a'}}>주자 {now.runners}명 · 기본 피해 +{now.runners*10}%</span>}
      {now.shaken>0&&<span data-testid="bp-forecast-shaken" style={{...badge,background:'#3a0f12',border:'1px solid #ff6b6b',color:'#ffb3b3'}}>투수 흔들림 {now.shaken}{now.shakenHp?` · 안타 +${now.shakenHp}`:' · 볼 증가'}</span>}
    </span>}</>}
  </div>;
}

/* 투수 HP바 위의 예상 구간: 안타면 HP가 여기까지 내려간다. 진한 빨강 = 최소 피해, 옅은 빨강 = 최대까지 */
export function HpForecastBand({forecast,hp,maxHp}){
  const f=forecast?.now;
  if(!f||forecast.problem||!(maxHp>0)||!(hp>0)||chanceBounds(f)[1]<=0)return null;
  const [dmgMin,dmgMax]=f.sacrifice?[f.sacMin,f.sacMax]:[f.dmgMin,f.dmgMax];
  if(dmgMax<=0)return null;
  const pct=v=>Math.max(0,Math.min(100,v/maxHp*100));
  const low=Math.max(0,hp-dmgMax),mid=Math.max(0,hp-dmgMin);
  const common={position:'absolute',top:0,bottom:0,pointerEvents:'none',zIndex:1};
  return <span className="bp-hp-forecast" data-testid="bp-hp-forecast" data-hp-from={low} data-hp-to={mid} aria-hidden="true">
    <i style={{...common,left:pct(low)+'%',width:(pct(mid)-pct(low))+'%',background:'rgba(255,48,48,.45)',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.5)'}}/>
    <i style={{...common,left:pct(mid)+'%',width:(pct(hp)-pct(mid))+'%',background:'rgba(220,20,40,.92)'}}/>
  </span>;
}

/* 커버 칸 위 리스크 색 (기존 칸 스타일이 !important라 칸 안에 얇은 층을 따로 둔다) */
export function RiskTint({cells}){
  const color=riskColor(cells);
  return <i className="bp-risk-tint" data-risk={cells} aria-hidden="true" style={{position:'absolute',inset:'3px',borderRadius:'3px',pointerEvents:'none',
    boxShadow:`inset 0 0 0 2px ${color},0 0 10px ${color}88`,background:`${color}22`,zIndex:2}}/>;
}
