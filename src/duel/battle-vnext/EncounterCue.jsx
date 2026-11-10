import React from 'react';
import './encounter-cue.css';

/* Shapes carry the same meaning before and after activation; color is secondary. */
export function EncounterMark({motif='target'}){
 const shape={
  wave:<><path d="M2 8q5-6 10 0t10 0M2 15q5-6 10 0t10 0"/></>,
  armor:<><path d="M12 2 21 6v6q-2 6-9 10-7-4-9-10V6Z"/><path d="m8 11 4 4 4-4"/></>,
  heat:<><path d="M7 21V4m10 17V4M3 8l4-4 4 4m2 0 4-4 4 4"/><path d="M9 18h6"/></>,
  limit:<><rect x="3" y="5" width="7" height="14" rx="1"/><rect x="14" y="5" width="7" height="14" rx="1"/></>,
  link:<><path d="m9 8 3-3a5 5 0 0 1 7 7l-3 3M15 16l-3 3a5 5 0 0 1-7-7l3-3m0 7 8-8"/></>,
  change:<><path d="M3 7h17l-4-4m5 14H4l4 4M4 7l4 4m12 6-4-4"/></>,
  cycle:<><path d="M19 7A8 8 0 1 0 20 16M19 2v6h-6"/></>,
  eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  deep:<><path d="m3 17 9-10 9 10M3 10l9-7 9 7"/><path d="M8 21h8"/></>,
  halo:<><ellipse cx="12" cy="7" rx="9" ry="4"/><path d="M5 13v7m7-6v8m7-9v7"/></>,
  pressure:<><path d="m4 3 5 9-5 9m16-18-5 9 5 9M11 12h2"/></>,
  sand:<><path d="M4 3h16M4 21h16M6 3q0 6 6 9-6 3-6 9m12-18q0 6-6 9 6 3 6 9M9 18h6"/></>,
  target:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></>,
 };
 return <svg className="bv-encounter-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shape[motif]||shape.target}</svg>;
}

export default function EncounterCue({cue,result=null,phase,token=0,rate=1}){
 if(!cue)return null;
 const actual=phase==='result'?result:null;
 return <p className="bv-hud-gimmick bv-encounter-cue" data-testid="bv-encounter" data-ready={cue.ready?'true':'false'} data-motif={cue.motif} data-trigger={actual?(actual.guarded?(actual.bonus?'both':'guard'):'bonus'):undefined}
  title={[cue.label,cue.text,cue.detail,actual?.text].filter(Boolean).join(' · ')}>
  <span key={actual?token:'tell'} className={'bv-encounter-seal'+(actual?' is-triggered':'')} style={{'--encounter-beat':`${600/rate}ms`}}><EncounterMark motif={cue.motif}/></span>
  <b>{cue.label}</b>
  {cue.steps&&<span className="bv-encounter-steps" aria-label={`순환 ${cue.steps.current+1}/${cue.steps.count}`}>{Array.from({length:cue.steps.count},(_,i)=><i key={i} className={i===cue.steps.current?'current':i<cue.steps.current?'past':''}/>)}</span>}
  <em className="bv-encounter-rule">{cue.text}</em>
  {cue.detail&&<small className="bv-encounter-detail">{cue.detail}</small>}
  {actual&&<strong key={token} className="bv-encounter-applied" data-testid="bv-encounter-applied" style={{'--encounter-beat':`${600/rate}ms`}}>{actual.text}</strong>}
 </p>;
}
