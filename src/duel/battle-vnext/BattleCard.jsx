import React from 'react';
import {cardArtFor,cardArtFocusFor} from '../card-art.js';
import BattleSymbol from './BattleSymbol.jsx';

/* C03 — 손패 카드 한 장. 데이터는 view model hand[] 항목(C01) 그대로, 문구는 cardFaceOf 결과다.
   선택은 색 + 테두리 모양(메인 실선 · 지원 점선 · 대기 점선 깜빡임) + 순서 표시로 구별한다. */

/* 기본: 기존 kind별 원화(card-art.js, 읽기만). */
export function defaultCardArt(item){
  const url=cardArtFor(item.kind);if(!url)return null;
  return {url,position:cardArtFocusFor(item.kind)?.objectPosition||'50% 25%',size:'cover'};
}
const ORDER_MARK=['','①','②','③','④'];
export function selectionTag(item){
  if(item.selectionRole==='main')return `${ORDER_MARK[1]} 메인`;
  if(item.selectionRole==='support')return `${ORDER_MARK[item.order]||item.order} 지원`;
  if(item.selectionRole==='armed')return '코스 선택 대기';
  return '';
}

export function CoverageGlyph({zones}){
  return <span className="bv-glyph" aria-hidden="true">{Array.from({length:9},(_,z)=><i key={z} className={zones?.includes(z)?'on':''}/>)}</span>;
}

export default function BattleCard({item,art=null,onTap,onDetail,detailDisabled=false,onKeyDown,cardRef,dealIndex=0,dealCount=1,strip=false}){
  const tag=selectionTag(item);
  const supportLimited=item.overBudget&&!item.problem;
  const label=[item.name,'에너지 '+item.cost,item.type==='prepare'?'준비':'',item.summary,item.condition,item.warning,
    supportLimited?'지원 추가 비용 초과 · 겹치기를 끄면 메인으로 교체 가능':'',tag].filter(Boolean).join(' · ');
  const cls='bv-card t-'+item.type+(strip?' bv-card-strip':'')+(item.selectionRole?' is-'+item.selectionRole:'')+(item.unavailable?' is-unavailable':'')+(item.plus?' is-plus':'');
  return <li className="bv-card-slot" data-card-id={item.id} style={{'--bv-deal-delay':Math.min(8,dealIndex)*18+'ms','--bv-fan-angle':Math.max(-12,Math.min(12,(dealIndex-(dealCount-1)/2)*(strip?-4:2)))+'deg','--bv-fan-inset':Math.abs(dealIndex-(dealCount-1)/2)*5+'px'}}>
    <button ref={cardRef} type="button" className={cls} data-testid="bv-card" data-card-kind={item.kind} data-card-plus={item.plus?'1':'0'} data-card-problem={item.problem||undefined} data-selection={item.selectionRole||undefined}
      aria-pressed={item.selectionRole==='main'||item.selectionRole==='support'} aria-label={label} title={item.name}
      disabled={item.disabled} onClick={()=>onTap?.(item.id)} onKeyDown={onKeyDown}
      onContextMenu={e=>{if(!onDetail||detailDisabled)return;e.preventDefault();onDetail(item.id,e.currentTarget);}}>
      <span className="bv-card-art" style={art?{backgroundImage:`url(${art.url})`,backgroundPosition:art.position,backgroundSize:art.size}:undefined} data-art={art?'set':'none'}>
        {strip&&<span className="bv-card-grip" aria-hidden="true"><i/><i/></span>}
        {!strip&&<b className="bv-card-cost" aria-hidden="true"><small>⚡</small>{item.cost}{supportLimited&&<sup className="bv-support-limit" title="지원 추가 비용 초과 · 겹치기를 끄면 메인으로 교체 가능">＋제한</sup>}</b>}
        {!strip&&<span className="bv-card-range">{item.type==='prepare'?<span className="bv-prep-glyph" aria-hidden="true">◎</span>:<CoverageGlyph zones={item.coverage}/>}</span>}
      </span>
      {strip&&<span className="bv-card-copy">
        <span className="bv-card-topline"><b className="bv-card-cost" aria-hidden="true">{item.cost}</b><strong className="bv-card-name">{item.name}</strong></span>
        <span className="bv-card-effectline"><span className="bv-card-range" aria-hidden="true">{item.type==='prepare'?<BattleSymbol kind="eye"/>:<CoverageGlyph zones={item.coverage}/>}</span><span className="bv-card-effect">{item.summary}</span></span>
        {(item.condition||item.warning||item.drawNote)&&<span className="bv-card-notes">
          {item.condition&&<span className="bv-card-condition">{item.condition}</span>}
          {item.drawNote&&item.drawNote!==item.condition&&<span className="bv-card-condition">{item.drawNote}</span>}
          {item.warning&&item.warning!==item.condition&&<span className="bv-card-warning">{item.warning}</span>}
        </span>}
        {supportLimited&&<span className="bv-card-warning">지원 비용 초과</span>}
        {tag&&<span className="bv-card-tag" aria-hidden="true">{tag}</span>}
      </span>}
      {!strip&&<>
      <strong className="bv-card-name">{item.name}</strong>
      <span className="bv-card-effect">{item.summary}</span>
      {(item.condition||item.warning||item.drawNote)&&<span className="bv-card-notes">
        {item.condition&&<span className="bv-card-condition">{item.condition}</span>}
        {item.drawNote&&item.drawNote!==item.condition&&<span className="bv-card-condition">{item.drawNote}</span>}
        {item.warning&&item.warning!==item.condition&&<span className="bv-card-warning">{item.warning}</span>}
      </span>}
      <span className="bv-card-foot" aria-hidden="true"><span className="bv-card-role">{item.type==='prepare'?'준비 · ':''}{item.role}</span>{tag&&<b className="bv-card-tag">{tag}</b>}</span>
      </>}
    </button>
    {onDetail&&<button type="button" className="bv-card-detail" aria-label={item.name+' 자세히'} disabled={detailDisabled} onClick={e=>onDetail(item.id,e.currentTarget)}>{strip?<BattleSymbol kind="info"/>:'ⓘ'}</button>}
  </li>;
}
