import React from 'react';
import {CARDS} from './cards.js';
import {startPackOffers} from './engine.js';

/* P2 start-pack pick (2026-10-09 analysis): before the first battle, one of three
   direction packs joins the common 6. Packs are tastes, not locked builds —
   later rewards can shift or mix freely. Rendered in the shared modal shell so
   no new overlay contract is introduced. */
export default function StartPackPick({seed,onPick,onClose}){
  const offers=startPackOffers(seed);
  return <div className="duel-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose?.()}}>
    <section className="duel-modal" role="dialog" aria-modal="true" aria-label="시작 팩 선택" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" aria-label="닫기" onClick={onClose}>×</button>
      <span className="eyebrow">MAIN RUN · START PACK</span>
      <h2>어느 야기로 시작할까</h2>
      <p>공통 6장에 방향 3장을 더해 9장으로 출발합니다. 첫 손패에 고른 방향이 들어 있습니다. 이후 보상에서 방향을 바꾸거나 섞을 수 있습니다.</p>
      <div className="start-pack-offers">
        {offers.map(p=><button key={p.id} type="button" className="start-pack" data-testid="start-pack" aria-label={p.name} onClick={()=>onPick?.(p.id)}>
          <strong>{p.name}</strong>
          <span>{p.desc}</span>
          <small>{p.kinds.map(k=>CARDS[k]?.name||k).join(' · ')}</small>
        </button>)}
      </div>
    </section>
  </div>;
}
