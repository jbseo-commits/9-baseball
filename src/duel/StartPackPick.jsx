import React,{useEffect,useRef,useState} from 'react';
import {CARDS,cardCost} from './cards.js';
import {startPackOffers} from './engine.js';
import {cardArtFor,cardArtFocusFor} from './card-art.js';
import plate from '../../assets/production-art/phone-assets-v18/A06-title-stadium-plate.png';
import coach from '../../assets/production-art/phone-assets-v18/A05-title-coach.png';
import './start-pack.css';

/* P2 start-pack pick: before the first battle, one of three direction packs joins the common 6.
   Packs are tastes, not locked builds — later rewards can shift or mix freely.
   Masterpiece pass (2026-10-10): a full-screen locker-room beat instead of a text modal. Each pack
   shows its three real card illustrations, costs and roles; tap selects, the gold button commits —
   the run's first decision is never a mis-tap. */
const PACK_LOOK={
  power:{tone:'power',tag:'장타',line:'노림수 하나에 모든 걸 건다. 맞으면 담장 너머.'},
  link:{tone:'link',tag:'진루',line:'출루한 주자를 한 베이스씩 밀어 홈까지 부른다.'},
  hold:{tone:'hold',tag:'생존',line:'끈질기게 커트하고 버텨, 실투 하나를 기다린다.'},
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
    <p className="sp-rule"><b>공통 6장</b><i>+</i><b>방향 3장</b><i>=</i><b>9장 덱</b><span>보상에서 언제든 바꾸거나 섞을 수 있다</span></p>
    <div className="sp-list" role="radiogroup" aria-label="시작 팩">
      {offers.map((p,i)=>{const look=PACK_LOOK[p.id]||{tone:'power',tag:'',line:''},on=chosen===p.id;
        return <button key={p.id} type="button" role="radio" aria-checked={on} aria-label={p.name}
          className={'start-pack sp-pack t-'+look.tone+(on?' on':'')} data-testid="start-pack" data-pack={p.id}
          style={{'--i':i}} onClick={()=>setChosen(p.id)}>
          <span className="sp-fan" aria-hidden="true">
            {p.kinds.map((k,j)=>{const art=cardArtFor(k),focus=cardArtFocusFor(k);
              return <span key={k+j} className={'sp-mini c'+j}>
                <span className="sp-mini-art" style={art?{backgroundImage:`url(${art})`,backgroundPosition:focus?.objectPosition||'center 25%'}:undefined}/>
                <span className="sp-mini-cost">{cardCost(k)}</span>
              </span>;})}
          </span>
          <span className="sp-info">
            <span className="sp-tag">{look.tag} 3종</span>
            <strong>{p.name}</strong>
            <em>{look.line}</em>
            <span className="sp-cards">{p.kinds.map((k,j)=><span key={k+j} className={CARDS[k]?.type==='skill'?'skill':''}>
              {CARDS[k]?.name||k}<small>{CARDS[k]?.role}</small></span>)}</span>
          </span>
          <span className="sp-check" aria-hidden="true"/>
        </button>;})}
    </div>
    <footer className="sp-foot">
      <button ref={confirmRef} type="button" className="sp-go" data-testid="start-pack-go" disabled={!pack} onClick={()=>pack&&onPick?.(pack.id)}>
        <span>{pack?pack.name+'로 출발':'팩을 고르세요'}</span>
        {pack&&<small>{pack.kinds.map(k=>CARDS[k]?.name||k).join(' · ')} 합류</small>}
      </button>
    </footer>
  </div>;
}
