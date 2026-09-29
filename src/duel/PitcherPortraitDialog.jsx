import React,{useEffect,useRef,useState} from 'react';
import pitcherRoster from '../../assets/pitcher-mobs-v1/roster.json' with {type:'json'};
import {pitcherPortraits} from './pitcher-visuals.js';
import './pitcher-portrait.css';

export default function PitcherPortraitDialog({opponent,src,onClose}){
  const closeRef=useRef(null);
  const initialId=opponent?.artId||opponent?.id||'regular-01-red-rush';
  const [selectedId,setSelectedId]=useState(initialId);

  useEffect(()=>{
    setSelectedId(opponent?.artId||opponent?.id||'regular-01-red-rush');
    closeRef.current?.focus();
  },[opponent]);

  if(!opponent||!src)return null;

  const activePitcher=pitcherRoster.find(p=>p.id===selectedId)||opponent;
  const activeArt=selectedId===initialId?src:(pitcherPortraits[selectedId]||src);
  const name=activePitcher.name||opponent.name||'상대 투수';

  return <div className="pitcher-portrait-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="pitcher-portrait-dialog pitcher-dex-dialog" role="dialog" aria-modal="true" aria-label={`${opponent.name||name} 투수 큰 그림`} onKeyDown={e=>{
      if(e.key==='Escape'){e.stopPropagation();onClose()}
      if(e.key==='Tab'){e.preventDefault();closeRef.current?.focus()}
    }}>
      <header>
        <div>
          <span>9ZONE / PITCHER DEX · 투수 도감</span>
          <h2>{name} <small>{activePitcher.archetype ? `· ${activePitcher.archetype}` : ''}</small></h2>
        </div>
        <button ref={closeRef} type="button" aria-label="큰 그림 닫기" onClick={onClose}>닫기 ×</button>
      </header>
      <div className="pitcher-portrait-frame">
        <img src={activeArt} alt={`${name} 투수 전신 원화`}/>
      </div>
      <div className="pitcher-dex-shelf" aria-label={`${pitcherRoster.length}인 투수 명단`}>
        <div className="pitcher-dex-bar">
          <strong>PITCHER ROSTER ({pitcherRoster.length}명)</strong>
          <span>카드를 선택하여 투수 프로필을 전환합니다</span>
        </div>
        <div className="pitcher-dex-scroll">
          {pitcherRoster.map(p=>{
            const art=pitcherPortraits[p.id];
            const isSel=p.id===selectedId;
            const hp=p.tier==='boss'?120:p.tier==='elite'?92:72;
            return <button key={p.id} type="button" className={'pitcher-dex-card'+(isSel?' active':'')} onClick={()=>setSelectedId(p.id)} aria-pressed={isSel} aria-label={`${p.name} 투수 정보 보기`}>
              <div className="dex-card-thumb">
                {art&&<img src={art} alt={p.name}/>}
              </div>
              <div className="dex-card-info">
                <span className="dex-card-tier">{p.tier==='boss'?'보스':p.tier==='elite'?'강적':'정규'}</span>
                <strong className="dex-card-name">{p.name}</strong>
                <small className="dex-card-hp">HP {hp}</small>
              </div>
            </button>;
          })}
        </div>
      </div>
    </section>
  </div>;
}
