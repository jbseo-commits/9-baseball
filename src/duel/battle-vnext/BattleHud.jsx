import React from 'react';
import './decision.css';
import BattleSymbol from './BattleSymbol.jsx';

/* C04 — 상대 HP · BSO · 주자 · 읽기 + 공개 단서 한 줄. 에너지는 손패 위(C03) 한 곳이라 여기서 그리지 않는다.
   공이 닿기 전 값(던지기 전 HP·카운트)은 view model이 이미 골라 준다. */

const READ_MARK=['0','I','II'];
const READ_NAME=['명암만','확률 구간','정확한 확률'];

/* 예상 피해 띠: 선택 중에만, “안타 시” 조건이 붙은 범위로. 확정 피해처럼 칠하지 않는다(빗금). */
export function hpForecastBand(hud,forecast){
  const p=hud?.pitcher;
  if(!p||!(p.maxHp>0)||!forecast||forecast.problem||!(forecast.damageMax>0)||!(forecast.chance?.[1]>0))return null;
  const pct=v=>Math.max(0,Math.min(100,v/p.maxHp*100));
  const lo=Math.max(0,p.hp-forecast.damageMax);
  return {left:pct(lo),width:pct(p.hp)-pct(lo),label:forecast.damageLabel};
}

export default function BattleHud({hud=null,forecast=null,sources=[],phase='deciding',result=null,playback=null,resultKey=0,title='',onMenu=null,menuOpen=false,refined=false}){
  if(!hud)return null;
  const p=hud.pitcher,c=hud.count,band=phase==='deciding'?hpForecastBand(hud,forecast):null;
  const hpPct=p&&p.maxHp>0?Math.max(0,Math.min(100,p.hp/p.maxHp*100)):0;
  const changing=!!p&&phase==='result'&&!!playback&&result?.damage>0&&result.hpBefore>result.hpAfter;
  const beforePct=changing?Math.min(100,result.hpBefore/p.maxHp*100):hpPct;
  const runners=[0,1,2].filter(i=>hud.bases[i]).map(i=>i+1+'루');
  const twoStrike=phase==='deciding'&&c.strikes===2;
  return <header className="bv-hud" data-testid="bv-hud" data-phase={phase}>
    <div className="bv-hud-bar">
      {title&&<span className="bv-hud-title">{title}</span>}
      {p&&<div className="bv-hud-opponent" aria-label={`${p.name} 투수 HP ${p.hp} / ${p.maxHp}`+(band?` · ${band.label} 예상`:'')}>
        <b className="bv-hud-name">{p.name}</b>
        <span key={resultKey} className={'bv-hud-hp'+(changing?' is-damaged':'')} aria-hidden="true" style={{'--hp-from':beforePct+'%','--hp-to':hpPct+'%'}}>
          {changing&&<i className="bv-hud-hp-ghost" style={{width:beforePct+'%'}}/>}
          <i className="bv-hud-hp-fill" style={{width:hpPct+'%'}}/>
          {band&&<i className="bv-hud-hp-forecast" data-testid="bv-hp-forecast" title={band.label+' 예상'} style={{left:band.left+'%',width:band.width+'%'}}/>}
        </span>
        <small key={'hp-'+resultKey} className={changing?'bv-hp-number is-damaged':''} aria-hidden="true">{changing&&<span className="bv-hp-was">{result.hpBefore}</span>}<span className="bv-hp-now">{p.hp}</span> / {p.maxHp}</small>
        {refined&&hud.gimmick&&<p className="bv-hud-gimmick"><span className="bv-opponent-tier">{hud.tier===3?'BOSS':'ELITE'}</span><b>{hud.gimmick.label}</b><span>{hud.gimmick.summary}</span></p>}
      </div>}
      <div className="bv-hud-count" role="img" aria-label={`볼 ${c.balls} 스트라이크 ${c.strikes} 아웃 ${c.outs} · 남은 아웃 ${hud.outsLeft}`}>
        {[['B',3,c.balls],['S',2,c.strikes],['O',refined?3:2,c.outs]].map(([k,n,v])=><span key={k} className={'k-'+k}><em>{k}</em>{Array.from({length:n},(_,i)=><i key={i} className={i<v?'on':''}/>)}</span>)}
      </div>
      <span className="bv-hud-read" data-testid="bv-read" aria-label={`읽기 ${hud.readLevel}단계 · ${READ_NAME[hud.readLevel]}`+(sources.length?' · '+sources.join(' · '):'')}>
        <em aria-hidden="true">READ</em><b aria-hidden="true">{READ_MARK[hud.readLevel]}</b>
      </span>
      {onMenu&&<button type="button" className="bv-hud-menu" aria-label="경기 정보 및 메뉴" aria-expanded={menuOpen} disabled={phase==='committing'||phase==='flight'} onClick={onMenu}>{refined?<BattleSymbol kind="menu"/>:'•••'}</button>}
    </div>
    <div className="bv-hud-notes">
      {hud.tell&&<p className="bv-hud-tell" data-testid="bv-tell" title={hud.tellDetail||undefined}><span aria-hidden="true">{refined?<BattleSymbol kind="aim"/>:'↘'}</span>{hud.tell}</p>}
      <p className="bv-hud-bases" aria-label={runners.length?'주자 '+runners.join(', '):'주자 없음'}>
        <span className="bv-hud-diamond" aria-hidden="true">{[1,2,0].map(i=><i key={i} className={'b'+(i+1)+(hud.bases[i]?' on':'')}/>)}</span>
        <span aria-hidden="true">{runners.length?runners.join(' · '):'주자 없음'}</span>
      </p>
      {twoStrike&&<p className="bv-hud-warn" role="status">2스트라이크 · 존 안을 지켜보면 삼진</p>}
      {!refined&&hud.gimmick&&<p className="bv-hud-gimmick">{hud.gimmick.label}</p>}
    </div>
  </header>;
}
