import React from 'react';

/* Road-event screen (P2 follow-up): choice mode names every consequence up front;
   the result mode shows what the seed actually dealt, then leaves to the map.
   Shared duel-modal shell — no new overlay contract. */
// offer: {title,text,choices:[{id,label,desc,problem}]}, result: {title,outcome}
export default function BallparkEvent({offer,result,onPick,onLeave,onDeck}){
  if(result){
    return <div className="duel-backdrop">
      <section className="duel-modal" role="dialog" aria-modal="true" aria-label={`${result.title} 결과`}>
        <span className="eyebrow">ROAD EVENT · 길 위의 사건</span>
        <h2>{result.title}</h2>
        <p>{result.outcome}</p>
        <div className="title-actions">
          <button type="button" className="primary" data-testid="event-leave" onClick={onLeave}>지도로</button>
        </div>
      </section>
    </div>;
  }
  if(!offer)return null;
  return <div className="duel-backdrop">
    <section className="duel-modal" role="dialog" aria-modal="true" aria-label={`${offer.title} 사건`}>
      <span className="eyebrow">ROAD EVENT · 길 위의 사건</span>
      <h2>{offer.title}</h2>
      <p>{offer.text}</p>
      <div className="start-pack-offers">
        {offer.choices.map(c=>(
          <button key={c.id} type="button" className="start-pack" data-testid="event-choice" aria-label={c.label} disabled={!!c.problem} onClick={()=>onPick?.(c.id)}>
            <strong>{c.label}</strong>
            <span>{c.desc}</span>
            {c.problem&&<small>{c.problem}</small>}
          </button>
        ))}
      </div>
      <div className="title-actions">
        <button type="button" onClick={onDeck}>덱 보기</button>
      </div>
    </section>
  </div>;
}
