import {describe,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import {battleUiMode} from '../src/duel/battle-ui-mode.js';
import {watchLayoutMode} from '../src/duel/layout-mode.js';
import {installOrientationLock} from '../src/duel/orientation-lock.js';

const mmWin=(match)=>({matchMedia:q=>({matches:!!match[q],addEventListener(){},removeEventListener(){}})});

describe('phone is landscape-only (2026-11-04)',()=>{
  it('touch devices always get the new landscape battle screen, upright or sideways',()=>{
    expect(battleUiMode('',mmWin({'(pointer: coarse)':true})).vnext).toBe(true);
    expect(battleUiMode('',mmWin({'(pointer: coarse)':true,'(orientation: landscape)':true})).vnext).toBe(true);
    expect(battleUiMode('?battleUi=legacy',mmWin({'(pointer: coarse)':true})).vnext).toBe(false);
    expect(battleUiMode('',mmWin({})).vnext).toBe(false); // desktop portrait window keeps the old screen
  });

  it('turning a phone does not reload the page (same screen both ways)',()=>{
    let landscape=false,listener=null;const reload=vi.fn();
    const w={location:{search:'',reload},matchMedia:q=>({matches:q==='(pointer: coarse)'||(q==='(orientation: landscape)'&&landscape),addEventListener:(_,f)=>{listener=f},removeEventListener(){}})};
    w.self=w;w.top=w;watchLayoutMode(w);
    landscape=true;listener?.();landscape=false;listener?.();
    expect(reload).not.toHaveBeenCalled();
  });

  it('upright phones see a rotate overlay that exists only in portrait',()=>{
    const css=fs.readFileSync('src/duel/orientation-lock.css','utf8');
    expect(css).toMatch(/@media \(orientation:portrait\) and \(pointer:coarse\)\{\s*html\[data-battle-ui=vnext\] body::before\{content:"↻\\A 휴대폰을 가로로/);
    expect(css).not.toContain('\\A9'); // a hex escape would eat the 9 of 9ZONE
    expect(fs.readFileSync('src/main.jsx','utf8')).toContain("import './duel/orientation-lock.css'");
  });

  it('short landscape under a browser bar is not clipped by a height floor',()=>{
    const atbat=fs.readFileSync('src/duel/battle-vnext/atbat.css','utf8');
    expect(atbat).not.toMatch(/\.battle-vnext\.bv-atbat\{[^}]*min-height:320px/);
    const short=fs.readFileSync('src/duel/battle-vnext/short-landscape.css','utf8');
    expect(short).toContain('@media(orientation:landscape) and (max-height:340px)');
    expect(short).toMatch(/\.bv-hand-head\{flex-wrap:nowrap/);
    const view=fs.readFileSync('src/duel/battle-vnext/BattleView.jsx','utf8');
    expect(view.indexOf("'./short-landscape.css'")).toBeGreaterThan(view.indexOf("'./thumb-hand.css'"));
  });

  it('first tap on a touch device asks for fullscreen + landscape lock; desktops are untouched',async()=>{
    const lock=vi.fn(()=>Promise.resolve());
    const requestFullscreen=vi.fn(()=>Promise.resolve());
    let tap=null;
    const doc={documentElement:{requestFullscreen},fullscreenElement:null,addEventListener:(t,f)=>{if(t==='pointerup')tap=f},removeEventListener(){}};
    installOrientationLock({document:doc,screen:{orientation:{lock}},matchMedia:()=>({matches:true})});
    tap();await Promise.resolve();await Promise.resolve();
    expect(requestFullscreen).toHaveBeenCalledWith({navigationUI:'hide'});
    expect(lock).toHaveBeenCalledWith('landscape');
    doc.fullscreenElement={};tap();expect(requestFullscreen).toHaveBeenCalledTimes(1);
    const desk={documentElement:{requestFullscreen:vi.fn()},addEventListener:vi.fn()};
    installOrientationLock({document:desk,matchMedia:()=>({matches:false})});
    expect(desk.addEventListener).not.toHaveBeenCalled();
  });
});
