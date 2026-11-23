import React from 'react';
import './emerald-passage.css';
export const EMERALD='boss-01-emerald-tyrant';
export const isEmeraldPassage=(artId,act)=>artId===EMERALD&&act===1;
// A result-only echo, never a prediction or a condition for defeating the boss.
export function emeraldEcho(artId,result){
 return artId===EMERALD&&result?.kind==='hit'&&result.encounterBonus===8;
}
export default function EmeraldPassage({open=false,echo=false,field=false}){
 return <svg className={'emerald-passage'+(field?' in-field':'')} data-testid="emerald-passage" data-open={String(open)} data-echo={String(echo)} viewBox="0 0 64 36" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
  <path fill="#252c33" d="M2 32V12h6V4h42v8h6v20Z"/>
  <path fill="#686b66" d="M6 30V14h6V8h34v6h6v16Z"/>
  <path fill="#95978a" d="M12 8h34v4H12ZM6 16h6v4H6Zm40 0h6v4h-6Z"/>
  <path fill="#202a2c" d="M18 14h22v18H18Z"/>
  {open?<path fill="#aeaa87" d="M22 30h14l6 6H16Z"/>:<><path fill="#4f5c55" d="M18 14h10v18H18Zm12 0h10v18H30Z"/><path fill="#899184" d="M18 24h22v3H18Z"/></>}
  <path fill="#242c32" d="M55 19h3v14h-3Zm-3 0h9v3h-9Zm1-8h7v8h-7Z"/>
  <path className="passage-light" fill={open?'#ffe3a0':'#58605b'} d="M55 13h3v4h-3Z"/>
  <path fill="#313a35" d="M0 32h64v3H0Z"/>
 </svg>;
}
