import React from 'react';
import {shortCardProblem} from './card-face.js';
import {ForecastChip} from './SwingForecast.jsx';

// Already public text: choice → actual → cause · result name. The verdict is
// the heading, so the dock only needs the path and a distinct cause underneath.
export function landscapeResultLines(review,verdict=''){
  const parts=review.replace(' 노림 → 실제 ',' → ').replace('지켜봄 → 실제 ','지켜봄 → ').split(' → ');
  const cause=parts.slice(2).join(' → ').split(' · ')[0]||'';
  return {path:parts.slice(0,2).join(' → '),cause:cause===verdict?'':cause};
}

/* Presentation only: face/forecast already obey the engine's public boundary. */
export default function LandscapeSelection({deciding,selected,name,face,prepare=false,armedName='',cost=0,energy=0,prepLeft=0,stackCount=0,problem='',forecast=null,takeHint='',review='',phase=null,verdict=''}){
  const mode=!deciding?'resolving':armedName?'support':!selected?'watch':prepare?'prepare':'main';
  const title=!deciding?(verdict||({windup:'투구 중',impact:'타격',release:'결과',settle:'준비 자세로'}[phase])||(review?'이번 공':'실행 중')):armedName||(!selected?'지켜보기':name);
  const summary=!deciding?review:armedName?'범위 추가':!selected?takeHint:face?.summary||'';
  const warning=deciding&&!armedName&&selected?shortCardProblem(problem):'';
  const result=!deciding&&review?landscapeResultLines(review,verdict):null;
  return <section className={'bp-selection-dock mode-'+mode} data-testid="wide-selection" data-mode={mode} aria-label="선택한 카드 효과">
    <header><span className="bp-selection-badge" aria-hidden="true">{mode==='support'?'＋':mode==='prepare'?'✦':mode==='main'?'1':'○'}</span><strong>{title}</strong>
      {deciding&&selected&&<small className={warning?'blocked':''}>⚡ {cost}/{energy}</small>}</header>
    {result?<p className="bp-selection-effect bp-selection-review" data-testid="bp-result-explanation" role="status" aria-label={review}>
      <span>{result.path}</span>{result.cause&&<span>{result.cause}</span>}
    </p>:summary&&<p className="bp-selection-effect">{summary.split(' · ').map((part,i)=><span key={i}>{part}</span>)}</p>}
    {deciding&&armedName?<small className="bp-selection-condition">코스 선택 · 추가 효과는 메인만</small>:deciding&&selected&&<>
      {face?.condition&&<small className="bp-selection-condition">{face.condition}</small>}
      {warning?<b className="bp-selection-warning">{warning}</b>:prepare?<small className="bp-selection-detail">{[face?.drawNote,`준비 ${prepLeft}회 남음`].filter(Boolean).join(' · ')}</small>
        :stackCount>0&&<small className="bp-selection-detail">메인 효과 · 지원 {stackCount}장</small>}
    </>}
    {deciding&&selected&&!prepare&&!warning&&forecast&&<div className="bp-selection-forecast"><small>적중 시</small><ForecastChip forecast={forecast} compact/></div>}
  </section>;
}
