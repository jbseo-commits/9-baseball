import React from 'react';
import {READ_LEVELS} from './cards.js';
import {cardDetailOf} from './CardDetailSheet.jsx';
import {lessonFor,planText} from './DecisionDebrief.jsx';
import {v10EnergyBase} from './engine.js';
import './battle-inspector.css';

/* Battle inspector — manual, on-demand only. It swaps the arena region in
   place (same box, same height): no backdrop, no page move, no accordion over
   the hand. Tabs show exactly one body. Nothing here may leak pre-landing
   state: every number comes from the shared frozen view model in props. */
const TABS=[['card','카드'],['pitcher','투수'],['read','읽기'],['pitch','이번 공']];

function CardBody({inspectCard,problem}){
  const d=inspectCard?cardDetailOf(inspectCard.kind,inspectCard.plus,problem||null,true):null;
  if(!d)return <p className="bp-inspect-empty">손패에서 카드를 탭하면 그 카드를 검사합니다. 실제 계획은 바뀌지 않습니다.</p>;
  return <div className="bp-inspect-card">
    <strong>{d.name}</strong>
    <small>{d.kindLabel} · {d.role} · {d.axis}</small>
    <p>{d.rule}</p>
    {!!d.gives?.length&&<p className="bp-inspect-gives">{d.gives.join(' · ')}</p>}
    {!!d.needs?.length&&<p className="bp-inspect-needs">필요: {d.needs.join(', ')}</p>}
    {d.upgrade&&<p className="bp-inspect-up">{d.upgrade}</p>}
    {d.stack&&<p className="bp-inspect-stack">{d.stack}</p>}
    {typeof d.energyCost==='number'&&<p className="bp-inspect-cost">MAIN RUN 에너지 비용 · ⚡ {d.energyCost}{d.energyCost===0?(d.kind==='basic'?' · 무료 기본 스윙':' · 무료 준비'):''}</p>}
    {d.flavor&&<p className="bp-inspect-flavor">{d.flavor}</p>}
  </div>;
}

function PitcherBody({s,pitcher,shown,gm,gtier,intent}){
  const opp=s.v10?.opponent;
  const tendency=shown.tendency;
  return <div>
    <strong>{pitcher?.name||'투수'}</strong>
    {intent&&<p>의도: {intent.icon} {intent.label} · {intent.note}</p>}
    {opp?.archetype&&<p>성향: {opp.archetype}</p>}
    {tendency&&<p className="bp-inspect-tendency">현재 투구 경향: {tendency} — 예측이며 확정 코스가 아닙니다.</p>}
    {shown.tendencyDetail&&<p className="bp-inspect-tendency-detail">{shown.tendencyDetail}</p>}
    <p className="bp-inspect-state">현재 상태: 흔들림 {shown.shaken}/{shown.mentalCap}{shown.shaken?' · 볼 증가 · 읽기 +1':' · 정상'} · 기세 {shown.momentum} · 피해 ×{shown.momentumRate.toFixed(1)}</p>
    <p>HP {shown.hp} / {shown.maxHp}</p>
    {gm?<div>
      <p><i className="bp-gtier">{gtier==='boss'?'BOSS':'ELITE'}</i> <b>{gm.label}</b></p>
      <p>{gm.summary}</p>
      {gm.phases?.pressured&&<p>압박 국면: {gm.phases.pressured}{shown.phase==='pressured'?' · 현재':''}</p>}
      {gm.phases?.critical&&<p>위기 국면: {gm.phases.critical}{shown.phase==='critical'?' · 현재':''}</p>}
      {shown.phase==='steady'&&<p>현재 국면: 정상</p>}
    </div>:<p>이 투수의 특수 규칙은 없습니다.</p>}
  </div>;
}

function ReadBody({read}){
  const lv=READ_LEVELS[read.level]||READ_LEVELS[0];
  return <div>
    <strong>읽기 {read.level}/2 · {lv.name}</strong>
    <p>{lv.detail}</p>
    <p>공 한 개는 드묾, 두 개는 가끔, 세 개는 자주 오는 코스입니다. 빗금은 던지지 않는 코스입니다.</p>
    <p>색이 진할수록 자주 오는 코스입니다. 농도는 공개된 낱말·구간·정수 확률만 따릅니다. 0%는 반올림된 값이며, 빗금인 미투구 코스와 다릅니다.</p>
    {!!read.sources.length&&<p>기여: {read.sources.map(x=>`${x.label}${x.amount>1?' +'+x.amount:''}`).join(' · ')}</p>}
  </div>;
}

function PitchBody({lastCombat,r}){
  if(!lastCombat)return <p className="bp-inspect-empty">아직 던진 공이 없습니다. 첫 공을 던지면 여기에 실제 플랜·공·판정이 남습니다.</p>;
  const lesson=lessonFor(lastCombat,r);
  return <div>
    <strong>{lastCombat.verdict||'판정'}</strong>
    <p>내 선택: {planText(lastCombat)}</p>
    <p>실제 공: {lastCombat.pitchLabel||'코스'} · 투수 HP -{lastCombat.damage||0}</p>
    {lesson&&<p className="bp-inspect-advice">다음엔: {lesson.title} — {lesson.text}</p>}
  </div>;
}

function PileBody({piles}){
  return <div>
    {piles.map(p=><div key={p.key} className="bp-inspect-pile">
      <strong>{p.title} {p.n}장</strong>
      <p className="bp-inspect-pile-note">순서 비공개 — 구성만 봅니다.</p>
      {p.groups.length?p.groups.map(([name,n])=><p key={name}>{name} ×{n}</p>):<p>비어 있습니다.</p>}
    </div>)}
  </div>;
}

export default function BattleInspector({tab,setTab,pileKind,inspectCard,inspectProblem,s,shown,pitcher,label,read,lastCombat,r,piles,onClose,
  compact=false,effects=[],labView=null,energy=null,intent=null,onHome,onToggleSound,sound=false,onConditions,onPractice}){
  const gm=s.v10?.opponent?.gimmick,gtier=gm?(s.v10?.opponent?.rewardTier===3?'boss':'elite'):null;
  const tabs=compact?[...TABS,['pile','더미'],['menu','메뉴']]:pileKind?[...TABS,['pile','더미']]:TABS;
  return <section id="bp-information" className="bp-inspect" aria-label="정보 보기" data-testid="bp-inspect">
    <header className="bp-inspect-head">
      <strong>정보 보기</strong>
      <span className="bp-inspect-kept">계획은 유지됩니다</span>
      <button type="button" className="bp-inspect-back" data-testid="bp-inspect-back" onClick={onClose}>경기로</button>
    </header>
    <div className="bp-inspect-tabs" role="tablist" aria-label="검사 항목">
      {tabs.map(([key,name])=><button key={key} type="button" role="tab" aria-selected={tab===key} className={tab===key?'on':''} onClick={()=>setTab(key)}>{name}</button>)}
    </div>
    <div className="bp-inspect-body">
      {tab==='card'&&<CardBody inspectCard={inspectCard} problem={inspectProblem}/>}
      {tab==='pitcher'&&<PitcherBody s={s} pitcher={pitcher} shown={shown} gm={gm} gtier={gtier} intent={intent}/>}
      {tab==='read'&&<ReadBody read={read}/>}
      {tab==='pitch'&&<PitchBody lastCombat={lastCombat} r={r}/>}
      {tab==='pile'&&<PileBody piles={piles}/>}
      {tab==='menu'&&<div className="bp-inline-menu">
        <strong>카드 → 코스 → 실행</strong>
        <p>카드를 고르지 않고 실행하면 지켜봅니다. 공격 카드는 조준해 타격하고 준비 카드는 공을 소비하지 않고 사용합니다. 고른 카드를 다시 누르면 선택과 지원을 비웁니다.</p>
        <p>다른 공격 카드를 더 고르면 지원 코스를 정합니다. 무료 맨손 스윙은 에너지가 없어도 쓸 수 있습니다.</p>
        <p>카드를 길게 누르면 설명을 봅니다. 정보 보기 중 손패를 누르면 계획을 바꾸지 않고 그 카드만 확인합니다.</p>
        {energy&&<p>에너지 {energy.current}/{energy.cap} · 기본은 다음 실제 공마다 {v10EnergyBase(s)}을 충전합니다. 볼·삼진 전 스트라이크를 지켜보면 다음 실제 공에 +1(최대 {v10EnergyBase(s)+1})을 예약합니다. 볼넷은 다음 타자에게 전달되며 삼진·투수 강판에는 보상이 없습니다. 기본 보충 뒤 카드 1장을 더 뽑습니다(손패 최대6장·더미 한도 적용).</p>}
        {effects.length>0&&<div><strong>유지 중인 준비</strong>{effects.map(x=><p key={x}>{x}</p>)}</div>}
        {labView&&<div><strong>{labView.packName}</strong><p>{labView.rule}</p><p>{labView.active} · {labView.threat}</p><p>{labView.status}</p>{labView.result&&<p>{labView.result}</p>}</div>}
        {onToggleSound&&<button type="button" onClick={onToggleSound}>{sound?'소리 끄기':'소리 켜기'}</button>}
        {onPractice&&<button type="button" onClick={onPractice}>첫 타격 연습</button>}
        {onConditions&&<button type="button" onClick={onConditions}>실험 조건 변경</button>}
        {onHome&&<button type="button" onClick={onHome}>{labView?'실험 선택으로':'타이틀로'}</button>}
      </div>}
    </div>
    <small className="bp-inspect-status" aria-hidden="true">{label}</small>
  </section>;
}
