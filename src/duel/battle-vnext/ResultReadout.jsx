import React from 'react';
import './decision.css';

/* C04 — 방금 일어난 일. view model result(C01)만 읽는다: 판정은 엔진 결과, 해설은 resultExplanation.
   새 계산·타이머 없음. 최근 결과 한 줄을 언제까지 남길지는 부모가 recent로 정한다. */

/* 실제 결과의 종류. 규칙 추가 없이 엔진/연출이 이미 정한 값으로만 나눈다. */
export function resultTone(result,shotGrade=null){
  if(!result)return null;
  if(result.knockedOut)return {key:'knockout',label:'강판'};
  if(result.kind==='hit'){
    if(result.exact)return {key:'exact',label:'정확 적중'};
    if(result.assistOnly)return {key:'assist',label:'지원 적중'};
    return {key:'range',label:'범위 적중'};
  }
  if(result.kind==='sacrifice')return {key:'sacrifice',label:'희생타'};
  if(shotGrade==='near-miss'||shotGrade==='near-miss-k')return {key:'near',label:'한 칸 차이'};
  if(result.kind==='ball')return {key:'ball',label:result.call==='볼넷'?'볼넷':'볼'};
  if(result.kind==='called')return {key:'called',label:/삼진/.test(result.label)?'루킹 삼진':'루킹'};
  if(result.kind==='foul')return {key:'foul',label:'파울'};
  if(result.outside&&result.action==='swing')return {key:'chase',label:'유인구 스윙'};
  return {key:'miss',label:'범위 밖'};
}

/* 실제 피해: 확정된 값이다(예측이 아니다). 안타가 아닌데 HP가 줄었으면 그 이유를 같은 줄에 붙인다. */
export function damageText(result,tone){
  if(!result||!(result.damage>0))return '';
  const base=`투수 HP −${result.damage}`;
  const hp=Number.isInteger(result.hpBefore)&&Number.isInteger(result.hpAfter)?` (${result.hpBefore}→${result.hpAfter})`:'';
  const why=tone?.key==='near'?' · 한 칸 차이 압박':result.kind==='hit'||result.kind==='sacrifice'?'':' · 압박';
  return base+hp+why;
}

const MOVES_SHOWN=3;

export default function ResultReadout({result=null,shotGrade=null,variant='stage',recent=null,finale=null}){
  /* 다음 선택 중: 부모가 남긴 최근 결과 한 줄만 */
  if(!result){
    if(!recent)return null;
    return <p className="bv-result-recent" data-testid="bv-result-recent" role="status">{recent}</p>;
  }
  const tone=variant==='spotlight'&&finale?{key:finale,label:finale==='homer'?'홈런':'강판'}:resultTone(result,shotGrade),dmg=damageText(result,tone);
  const moves=result.moves||[],extra=moves.length-MOVES_SHOWN;
  if(variant==='spotlight'){
    // Decorative counterpart of the rail's one live result announcement.
    // No explanation/damage duplication, no outcome before impact.
    return <div className={'bv-result-spotlight t-'+tone.key} data-testid="bv-result-spotlight" aria-hidden="true">
      <span>{finale?(finale==='knockout'?'투수 HP 0 · 승부를 끝냈다':result.exact?'코스를 읽어낸 한 방':'담장을 넘겼다'):['exact','near'].includes(tone.key)?result.call||tone.label:tone.label}</span><strong>{finale==='knockout'?'강판':finale==='homer'?(/만루/.test(result.call||'')?'만루홈런':'홈런'):tone.key==='exact'?'읽었다!':tone.key==='near'?'한 칸 차이':result.call||tone.label}</strong>
    </div>;
  }
  if(variant==='line'){
    return <p className={'bv-result-line t-'+tone.key} data-testid="bv-result-line" role="status" title={result.explanation}>
      <b>{tone.label}</b><span>{result.explanation}</span>{dmg&&<em>{dmg}</em>}
    </p>;
  }
  return <section className={'bv-result t-'+tone.key+(result.good?' is-good':'')} data-testid="bv-result" data-tone={tone.key} role="status" aria-live="polite"
    aria-label={[result.call||tone.label,tone.label,result.explanation,dmg,...moves].filter(Boolean).join(' · ')}>
    <span className="bv-result-tag">{tone.label}</span>
    <strong className="bv-result-call">{result.call||tone.label}</strong>
    {dmg&&<b className="bv-result-damage">{dmg}</b>}
    <p className="bv-result-copy">{result.explanation}{result.outsideNote?' · '+result.outsideNote:''}</p>
    {moves.length>0&&<ul className="bv-result-moves">
      {moves.slice(0,MOVES_SHOWN).map((m,i)=><li key={i}>{m}</li>)}
      {extra>0&&<li>외 {extra}명</li>}
    </ul>}
  </section>;
}
