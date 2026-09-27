import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {layoutMode,landscapeMedia,PHONE_SIDEWAYS,PORTRAIT_ONLY} from '../src/duel/layout-mode.js';

/* a fake window: which media queries match, and whether it sits inside a frame */
const win=({landscape=false,sideways=false,framed=false}={})=>{
  const w={matchMedia:q=>({matches:q===PHONE_SIDEWAYS?sideways:q==='(orientation: landscape)'?landscape:false})};
  w.self=w;w.top=framed?{}:w;return w;
};

describe('portrait-only layout (2026-09-28)',()=>{
  it('is on, and the landscape sidecars never see a landscape match',()=>{
    expect(PORTRAIT_ONLY).toBe(true);
    expect(landscapeMedia().matches).toBe(false);
  });

  it('a wide window plays the phone layout in a portrait frame; phones and the frame itself run the game',()=>{
    expect(layoutMode(win({landscape:true}))).toBe('frame');              // desktop / tablet sideways
    expect(layoutMode(win({landscape:false}))).toBe('app');               // phone upright
    expect(layoutMode(win({landscape:true,sideways:true}))).toBe('app');  // phone sideways: app + rotate hint
    expect(layoutMode(win({landscape:true,framed:true}))).toBe('app');    // inside the frame: no recursion
  });

  it('the frame is 9:16 and the sideways phone gets a rotate hint instead of a landscape layout',()=>{
    const css=fs.readFileSync('src/duel/portrait-lock.css','utf8');
    expect(css).toContain('calc(100dvh * 9 / 16)');
    expect(css).toMatch(/@media \(orientation:landscape\) and \(max-height:540px\) and \(pointer:coarse\)\{\s*html body #root\{visibility:hidden\}/);
    expect(css).toContain('세로로 돌려 주세요');
    const main=fs.readFileSync('src/main.jsx','utf8');
    expect(main.indexOf('portrait-lock.css')).toBeGreaterThan(main.indexOf('v14-portrait-master.css'));   // after the layout layers (title layer stays last)
    expect(main).toContain('layoutMode() === "frame" ? <PortraitFrame />');
  });
});
