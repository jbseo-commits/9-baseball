/* Portrait-only (user decision, 2026-09-28): the game never switches to a landscape layout.
   - A wide window (desktop, tablet held sideways) shows the game inside a 9:16 portrait iframe of
     the same page (PortraitFrame), so the phone CSS applies as-is and landscape rules never match.
   - A phone held sideways gets the rotate hint (portrait-lock.css); the game waits underneath.
   - JS landscape sidecars read their media from landscapeMedia(), so they stay off. */
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
  if(!PORTRAIT_ONLY||!win)return 'app';
  let framed=false;try{framed=win.self!==win.top;}catch{framed=true;}
  if(framed)return 'app';
  const mm=q=>!!win.matchMedia?.(q).matches;
  return mm('(orientation: landscape)')&&!mm(PHONE_SIDEWAYS)?'frame':'app';
}

/* the app itself (not the frame): if the window turns wide, reload into the portrait frame so a
   landscape layout never shows (a phone turned sideways stays in the app under the rotate hint) */
export function watchLayoutMode(win=typeof window!=='undefined'?window:null){
  if(!PORTRAIT_ONLY||!win?.matchMedia||layoutMode(win)!=='app')return ()=>{};
  let framed=false;try{framed=win.self!==win.top;}catch{framed=true;}
  if(framed)return ()=>{};
  const m=win.matchMedia('(orientation: landscape)');
  const f=()=>{if(layoutMode(win)==='frame')win.location.reload();};
  m.addEventListener?.('change',f);return ()=>m.removeEventListener?.('change',f);
}
