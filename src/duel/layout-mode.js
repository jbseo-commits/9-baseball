/* 2026-11-01 작가 결정: 가로 화면은 새 전투 화면(battle-ui-mode.js)이 기본이라 아래 액자·회전 안내는
   ?battleUi=legacy로 기존 화면을 고른 가로 창에서만 쓴다. 세로는 그대로 기존 휴대폰 화면.
   Portrait-only (user decision, 2026-09-28): the legacy layout never switches to a landscape layout.
   - A wide window (desktop, tablet held sideways) shows the game inside a 9:16 portrait iframe of
     the same page (PortraitFrame), so the phone CSS applies as-is and landscape rules never match.
   - A phone held sideways gets the rotate hint (portrait-lock.css); the game waits underneath.
   - JS landscape sidecars read their media from landscapeMedia(), so they stay off. */
import {battleUiMode} from './battle-ui-mode.js';
export const PORTRAIT_ONLY=true;

const never={matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}};

export function landscapeMedia(){
  if(PORTRAIT_ONLY||typeof window==='undefined'||!window.matchMedia)return never;
  return window.matchMedia('(orientation: landscape)');
}

/* a phone on its side: short and touch-first. It gets the rotate hint, not the frame. */
export const PHONE_SIDEWAYS='(orientation: landscape) and (max-height: 540px) and (pointer: coarse)';

/* 'frame': top-level wide window -> render the portrait iframe; 'app': render the game */
export function layoutMode(win=typeof window!=='undefined'?window:null){
  if(!PORTRAIT_ONLY||!win||battleUiMode(win.location?.search||'',win).vnext)return 'app';
  let framed=false;try{framed=win.self!==win.top;}catch{framed=true;}
  if(framed)return 'app';
  const mm=q=>!!win.matchMedia?.(q).matches;
  return mm('(orientation: landscape)')&&!mm(PHONE_SIDEWAYS)?'frame':'app';
}

/* the app itself (not the frame): when the window turns, reload so the screen that fits the new
   orientation takes over (landscape: new battle screen, portrait: the phone layout). A forced
   ?battleUi=vnext page never reloads. */
export function watchLayoutMode(win=typeof window!=='undefined'?window:null){
  if(!PORTRAIT_ONLY||!win?.matchMedia)return ()=>{};
  const search=win.location?.search||'';
  if(new URLSearchParams(search).get('battleUi')==='vnext')return ()=>{};
  let framed=false;try{framed=win.self!==win.top;}catch{framed=true;}
  if(framed)return ()=>{};
  const shown=()=>layoutMode(win)+'|'+battleUiMode(search,win).vnext,start=shown();
  const m=win.matchMedia('(orientation: landscape)');
  const f=()=>{if(shown()!==start)win.location.reload();};
  m.addEventListener?.('change',f);return ()=>m.removeEventListener?.('change',f);
}
