import React,{useEffect,useRef} from 'react';
import {nearCoverage} from './motion-timeline.js';
import ResultSequence from './ResultSequence.jsx';
import ResultReadout from './ResultReadout.jsx';
import './decision.css';
import BattleSymbol,{EnergyText} from './BattleSymbol.jsx';

/* C04 — 오른쪽 결정 영역: 9존 → 선택 요약 → 단일 행동. 결과는 같은 9존에 실제 공으로 강조한다.
   9존은 투구 코스 전용이다(README “규칙 실험 경계”). 값은 view model(C01)의 공개 값만 쓴다. */

/* 공개 표면 문자열에서만 칸 농도를 정한다(명암 낱말 · 5%p 구간의 아래 끝 · 정확 %). 새 확률을 읽지 않는다. */
const SHADE={드묾:.32,가끔:.52,자주:.78,확정:.9,'단서 밖':.12};
export function faceDensity(face){
  if(face==null)return null;
  if(face in SHADE)return SHADE[face];
  const m=/^(\d+)/.exec(face);if(!m)return null;
  return Math.min(.9,.2+Number(m[1])/100*1.4);
}

const ORDER=['','①','②','③','④'];
export function planCaption(zones){
  if(!zones)return '';
  const steps=zones.cells.flatMap(c=>c.tokens.map(n=>({n,word:c.word}))).sort((a,b)=>a.n-b.n);
  if(!steps.length&&zones.aimWord)return '노림 · '+zones.aimWord;
  return steps.map(s=>(steps.length>1?ORDER[s.n]+' ':'')+s.word).join(' → ');
}

/* 선택 요약: 카드 이름 · 적중(공개 구간) · 조건부 피해. 적중은 공이 범위에 올 가능성이지 커버 칸 수가 아니다. */
export function planSummary({hand=[],forecast=null,input=null,energy=null,effects=[]}){
  const main=hand.find(x=>x.selectionRole==='main'),supports=hand.filter(x=>x.selectionRole==='support');
  const armed=hand.find(x=>x.selectionRole==='armed');
  if(!input||input.actionKind==='watch')return {title:'지켜보기',detail:energy?.nextTakeHint||'',hint:'카드와 코스를 고르면 타격'};
  const title=main?main.name+(supports.length?` + ${supports.length}장 지원`:''):'';
  if(input.actionKind==='support-zone')return {title,detail:`${armed?.name||'지원 카드'} · 지원할 코스를 9존에서 고르세요`,hint:''};
  const chance=forecast?(forecast.outcome==='희생타'?'희생타 ':'적중 ')+forecast.chanceText:'';
  const before=forecast?.before&&forecast.before.chanceText!==forecast.chanceText?forecast.before.chanceText+' → ':'';
  return {title,cost:energy?.selectedCost??null,chance:chance&&(before?chance.replace(forecast.chanceText,before+forecast.chanceText):chance),
    damage:forecast?.damageLabel||'',reasons:forecast?.reasons||[],problem:input.blockedReason||forecast?.problem||'',
    detail:input.actionKind==='prepare'&&effects.length?'준비 유지 · '+effects.join(' · '):'',
    hint:input.blockedReason&&!input.canExecute&&input.canSelect?'선택 해제로 지켜보기로 전환':''};
}

export default function DecisionPanel({zones=null,forecast=null,input=null,hand=[],energy=null,result=null,phase='deciding',effects=[],scene=null,execution=null,
  shotGrade=null,recent=null,showAction=true,showPlan=true,quiet=false,selection=null,onZoneTap,onZoneHover=null,onTake,onSwing,onNext}){
  if(!zones||!input)return null;
  const deciding=phase==='deciding';
  const caption=planCaption(zones),near=result?.kind==='whiff'?nearCoverage(result):null;
  const pt=z=>({x:(z%3)*100+50,y:Math.floor(z/3)*100+50});
  return <section className={'bv-decision'+(zones.targetingSupport?' is-targeting':'')} data-testid="bv-decision" data-phase={phase} aria-label="코스와 행동">
    <p className="bv-zone-caption"><span>{deciding&&selection?.supportMode&&!zones.targetingSupport?'겹칠 카드를 고르세요':caption||(deciding?'노릴 코스':'')}</span>{deciding&&zones.clue&&<b>단서 적용</b>}</p>
    <div className="bv-zone" role="group" aria-label="노릴 코스" data-read-level={zones.level}>
      {near&&<svg className="bv-near-link" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true" data-testid="bv-near-link"><path d={`M${pt(near.from).x},${pt(near.from).y}L${pt(near.to).x},${pt(near.to).y}`}/><circle cx={pt(near.from).x} cy={pt(near.from).y} r="20"/></svg>}
      {zones.cells.map(c=>{
        const d=faceDensity(c.face);
        const cls='bv-cell'+(c.live?'':' is-dead')+(c.cover?' is-cover':'')+(c.support?' is-support':'')+(c.aim?' is-aim':'')+(c.actual?' is-actual':'')+(result?.good&&c.actual?' is-good':'');
        return <button key={c.zone} type="button" className={cls} data-zone={c.zone} disabled={!input.canSelect}
          style={d!=null?{'--bv-density':d}:undefined}
          aria-pressed={c.aimed} aria-label={[c.word,c.live?c.face:'던지지 않는 코스',c.tokens.length?c.tokens.map(n=>n===1?'메인 노림':n+'번 지원').join(', '):'',c.actual?'실제 공':''].filter(Boolean).join(' · ')}
          onClick={()=>onZoneTap?.(c.zone)}
          onPointerEnter={e=>{if(e.pointerType==='mouse')onZoneHover?.(c.zone);}} onPointerLeave={e=>{if(e.pointerType==='mouse')onZoneHover?.(null);}}
          onFocus={()=>onZoneHover?.(c.zone)} onBlur={()=>onZoneHover?.(null)}>
          {c.tokens.map(n=><em key={n} className={'bv-token n'+n} aria-hidden="true">{n}</em>)}
          {c.aim&&<i className="bv-aim-ring" aria-hidden="true"/>}
          {c.actual&&<i className="bv-pitch-mark" data-testid="bv-pitch-mark" aria-hidden="true"/>}
          <span className="bv-cell-face" aria-hidden="true">{c.live?c.face??'':quiet?'':'안 던짐'}</span>
        </button>;
      })}
    </div>
    <p className={'bv-band'+(zones.band.actual?' is-actual':'')} data-testid="bv-band">
      {zones.band.actual&&<i className="bv-pitch-mark" data-testid="bv-pitch-mark" aria-hidden="true"/>}
      <span>존 밖 볼</span>{zones.band.face&&<b>{zones.band.face}</b>}
    </p>

    {showPlan&&<DecisionSummary {...{hand,forecast,input,energy,effects,phase,result,shotGrade,execution,scene,recent}}/>}

    {showAction&&<BattleAction input={input} energy={energy} phase={phase} onTake={onTake} onSwing={onSwing} onNext={onNext}/>}
  </section>;
}

/* One causal readout, also usable outside the field's touch/slide surface. */
export function DecisionSummary({hand=[],forecast,input,energy,effects=[],phase='deciding',result,shotGrade,execution,scene,recent,compact=false}){
  const deciding=phase==='deciding',sum=deciding?planSummary({hand,forecast,input,energy,effects}):null;
  return <div className="bv-plan" data-testid="bv-plan" aria-live="polite">
      {deciding&&sum&&!(compact&&input.actionKind==='watch')&&<>
        <p className="bv-plan-title">{sum.title}{sum.cost>0&&<small> · ⚡{sum.cost}</small>}</p>
        {sum.chance&&<p className="bv-plan-metrics"><strong>{sum.chance}</strong>{sum.damage&&<span>{sum.damage}</span>}</p>}
        {sum.reasons?.length>0&&<p className="bv-plan-reasons">{sum.reasons.join(' · ')}</p>}
        {sum.detail&&<p className="bv-plan-detail">{sum.detail}</p>}
        {sum.hint&&<p className="bv-plan-hint">{sum.hint}</p>}
        {sum.problem&&<p className="bv-plan-problem" role="status">{sum.problem}</p>}
      </>}
      {!deciding&&(result
        ?<ResultReadout result={result} shotGrade={shotGrade} variant="line"/>
        :execution?.preparation&&['impact','slowmo','release','settle'].includes(scene?.fxStage)?<div className="bv-preparation-confirm" role="status"><b>{execution.preparation.name} · 적용</b><span>{execution.preparation.detail}</span></div>
        :<p className="bv-plan-detail">{phase==='flight'||phase==='committing'?(execution?.action==='prepare'?'준비 효과 적용 중':'공을 기다린다'):''}</p>)}
      {result&&<ResultSequence hideHp result={result} execution={execution}/>}
      {deciding&&<ResultReadout recent={recent}/>}
    </div>;
}


/* The sole action may be mounted by BattleView's persistent dock or inline by
   standalone DecisionPanel. Identical input lock and repeated-click guard. */
export function BattleAction({input,energy,phase='deciding',actionName='',symbolic=false,onTake,onSwing,onNext}){
  const fired=useRef(false);
  useEffect(()=>{fired.current=false;},[input?.actionKind,input?.canExecute,phase]);
  if(!input||(input.actionKind==='none'&&phase==='result'))return null;
  const cost=input.actionKind==='swing'||input.actionKind==='prepare'?energy?.selectedCost:null;
  const run=()=>{
    if(fired.current||!input.canExecute||!input.callback)return;
    fired.current=true;({onTake,onSwing,onNext})[input.callback]?.();
  };
  return (
    <button type="button" className={'bv-action k-'+input.actionKind} data-testid={input.actionKind==='next'?'bp-next':'bp-swing'}
      data-action-kind={input.actionKind} aria-label={[actionName,input.ariaLabel||input.actionLabel].filter(Boolean).join(' · ')} aria-busy={input.actionKind==='busy'}
      aria-disabled={!input.canExecute||undefined} disabled={!input.canExecute}
      onKeyDown={e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();}} onClick={run}>
      {symbolic&&<BattleSymbol kind={input.actionKind==='watch'?'eye':input.actionKind==='prepare'?'cards':'bat'} className="bv-action-symbol"/>}
      {cost>0&&<span className="bv-action-cost" aria-hidden="true">{symbolic?<BattleSymbol kind="energy"/>:'⚡'}{cost}</span>}
      <b>{actionName&&<span className="bv-action-name">{actionName} </span>}{input.actionLabel}</b>
      {input.actionKind==='watch'&&energy?.nextTakeHint&&<small aria-hidden="true">{symbolic?<EnergyText>{energy.nextTakeHint}</EnergyText>:energy.nextTakeHint}</small>}
      {(input.actionKind==='swing'||input.actionKind==='prepare')&&<span className="bv-action-arrow" aria-hidden="true">↗</span>}
    </button>
  );
}
