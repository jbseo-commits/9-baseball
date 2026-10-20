import React,{useEffect,useRef,useState} from 'react';
import {CARDS,cardCost} from './cards.js';
import {START_PACK_COMMON,startPackOffers} from './engine.js';
import {cardArtFor,cardArtFocusFor} from './card-art.js';
import plate from '../../assets/production-art/phone-assets-v18/A06-title-stadium-plate.png';
import coach from '../../assets/production-art/phone-assets-v18/A05-title-coach.png';
import './start-pack.css';

/* Start-pack pick: before the first battle, seven direction cards join the common two.
   Packs are tastes, not locked builds — later rewards can shift or mix freely.
   Masterpiece pass (2026-10-10): a full-screen locker-room beat instead of a text modal. Each pack
   shows its three real card illustrations, costs and roles; tap selects, the gold button commits —
   the run's first decision is never a mis-tap. */
const PACK_LOOK={
  power:{tone:'power',tag:'장타'},
  link:{tone:'link',tag:'진루'},
  hold:{tone:'hold',tag:'생존'},
};

export default function StartPackPick({seed,onPick,onClose}){
  const offers=startPackOffers(seed);
  const [chosen,setChosen]=useState(null);
  const confirmRef=useRef(null);
  const pack=offers.find(p=>p.id===chosen);
  useEffect(()=>{const esc=e=>{if(e.key==='Escape')onClose?.()};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[onClose]);
  useEffect(()=>{if(chosen)confirmRef.current?.scrollIntoView?.({block:'nearest'})},[chosen]);
  return <div className="sp-root" role="dialog" aria-modal="true" aria-label="시작 팩 선택">
    <div className="sp-bg" style={{backgroundImage:`url(${plate})`}} aria-hidden="true"/>
    <button type="button" className="sp-close" aria-label="닫기" onClick={onClose}>×</button>
    <header className="sp-head">
      <img className="sp-coach" src={coach} alt="" aria-hidden="true"/>
      <div className="sp-bubble">
        <span className="sp-eyebrow">MAIN RUN · START PACK</span>
        <p>“첫 경기다.<br/>어떤 야구로 갈래?”</p>
      </div>
    </header>
    <h2 className="sp-title">어떤 야구로 시작할까</h2>
    <p className="sp-rule"><b>공통 2장</b><i>+</i><b>방향 7장</b><i>=</i><b>9장 덱</b><span>보상에서 언제든 바꾸거나 섞을 수 있다</span></p>
    <div className="sp-list" role="radiogroup" aria-label="시작 팩">
      {offers.map((p,i)=>{const look=PACK_LOOK[p.id]||{tone:'power',tag:''},on=chosen===p.id;
        const complete=[...START_PACK_COMMON,...p.kinds],counts=new Map();
        for(const k of complete)counts.set(k,(counts.get(k)||0)+1);
        return <button key={p.id} type="button" role="radio" aria-checked={on} aria-label={p.name}
          className={'start-pack sp-pack t-'+look.tone+(on?' on':'')} data-testid="start-pack" data-pack={p.id}
          style={{'--i':i}} onClick={()=>setChosen(p.id)}>
          <span className="sp-fan" aria-hidden="true">
            {p.featured.map((k,j)=>{const art=cardArtFor(k),focus=cardArtFocusFor(k);
              return <span key={k+j} className={'sp-mini c'+j}>
                <span className="sp-mini-art" style={art?{backgroundImage:`url(${art})`,backgroundPosition:focus?.objectPosition||'center 25%'}:undefined}/>
                <span className="sp-mini-cost">{cardCost(k)}</span>
              </span>;})}
          </span>
          <span className="sp-info">
            <span className="sp-tag">{on?'전체 9장 구성':'대표 3종'} · {look.tag}</span>
            <strong>{p.name}</strong>
            <em>{p.desc}</em>
            <span className="sp-cards" aria-label={on?'전체 9장 구성':'대표 카드 3종'}>{(on?[...counts]:p.featured.map(k=>[k,1])).map(([k,n])=><span key={k} className={(CARDS[k]?.type==='skill'?'skill ':'')+(on&&START_PACK_COMMON.includes(k)?'common':'')}>
              {CARDS[k]?.name||k}{on&&n>1?` ×${n}`:''}<small>{on&&START_PACK_COMMON.includes(k)?'공통':CARDS[k]?.role}</small></span>)}</span>
          </span>
          <span className="sp-check" aria-hidden="true"/>
        </button>;})}
    </div>
    <footer className="sp-foot">
      <button ref={confirmRef} type="button" className="sp-go" data-testid="start-pack-go" disabled={!pack} onClick={()=>pack&&onPick?.(pack.id)}>
        <span>{pack?pack.name+'로 출발':'팩을 고르세요'}</span>
        {pack&&<small>공통 2장 + 방향 7장 · 총 9장 덱</small>}
      </button>
    </footer>
  </div>;
}
