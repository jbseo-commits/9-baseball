import React,{useState} from 'react';
import {gimmickLines,isEnraged,GIMMICK_TUNING,GIMMICK_REWARD_TEXT} from './pitcher-gimmicks.js';
import {ZONES} from './cards.js';

/* 강적·보스 기믹 배지. 누르면 위험/보상 설명이 투수 태그 안에서 펼쳐진다(고정 레이어 아님). */
export default function GimmickBadges({opponent,pitcher,hits=0}){
  const [open,setOpen]=useState(false);
  const lines=gimmickLines(opponent);if(!lines.length)return null;
  const enraged=isEnraged(opponent,pitcher),armor=pitcher?.armor||0;
  const state=g=>g.key==='armor'?(armor?String(armor):'파괴'):g.key==='rage'?(enraged?'발동':'대기'):g.key==='killZone'&&g.zone!=null?ZONES[g.zone]:'';
  const reached=hits>=GIMMICK_TUNING.rewardAt;
  return <div className="bp-gimmick" data-testid="bp-gimmick">
    <button type="button" className="bp-gimmick-row" aria-expanded={open} onClick={()=>setOpen(v=>!v)}
      aria-label={'기믹 '+lines.map(g=>g.name+(state(g)?' '+state(g):'')).join(', ')+` · 공략 ${Math.min(hits,GIMMICK_TUNING.rewardAt)}/${GIMMICK_TUNING.rewardAt}`}>
      {lines.map(g=><span key={g.key} className={'bp-gimmick-chip g-'+g.key+(g.key==='rage'&&enraged?' on':'')+(g.key==='armor'&&!armor?' broken':'')} data-gimmick={g.key}>
        <i aria-hidden="true">{g.mark}</i>{g.name}{state(g)&&<b>{state(g)}</b>}</span>)}
      <span className={'bp-gimmick-hits'+(reached?' done':'')} data-testid="bp-gimmick-hits">공략 {Math.min(hits,GIMMICK_TUNING.rewardAt)}/{GIMMICK_TUNING.rewardAt}</span>
    </button>
    {open&&<ul className="bp-gimmick-detail">
      {lines.map(g=><li key={g.key}><b>{g.mark} {g.name}</b><span className="risk">위험 · {g.risk}</span><span className="reward">보상 · {g.reward}</span></li>)}
      <li className="bp-gimmick-bonus">{GIMMICK_REWARD_TEXT}{reached?' · 달성':''}</li>
    </ul>}
  </div>;
}
