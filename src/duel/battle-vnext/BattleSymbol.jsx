import React from 'react';

/* Hand-authored UI symbols: one stroke weight, no platform emoji variation. */
const paths={
  sound:<><path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="M16 8q4 4 0 8m3-11q7 7 0 14"/></>,
  muted:<><path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="m17 9 5 6m0-6-5 6"/></>,
  energy:<path d="M13 2 5 13h6l-1 9 9-12h-6z"/>,
  eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  cards:<><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M2 16V3a1 1 0 0 1 1-1h12M9 10h6m-6 4h6"/></>,
  info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>,
  menu:<><path d="M5 6h14M5 12h14M5 18h14"/></>,
  aim:<><path d="M5 5h6M5 5v6m0-6 14 14m-6 0h6v-6"/></>,
  bat:<><path d="m5 19 3-3m-1 4-3-3m4-1 4-5 5-7c2-2 5 1 3 3l-7 5-5 4Z"/></>,
};
export default function BattleSymbol({kind,className=''}){
  return <svg className={'bv-symbol '+className} data-symbol={kind} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[kind]||paths.info}</svg>;
}
export function EnergyText({children}){
  return String(children||'').split('⚡').map((s,i)=><React.Fragment key={i}>{i>0&&<BattleSymbol kind="energy"/>}{s}</React.Fragment>);
}
