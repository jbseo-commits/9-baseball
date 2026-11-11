import fs from 'node:fs';
import {describe,it,expect} from 'vitest';

/* 2026-11-11: on 568x320 the title page scrolled and "설정" sat below the fold. Geometry is checked in a
   browser by scripts/qa-title-fit.mjs; this keeps the short-landscape rule and its scope in CI. */
const css=fs.readFileSync('src/duel/title-screen.css','utf8');
const start=css.indexOf('@media (orientation:landscape) and (max-height:430px){');
const media=css.slice(start,css.indexOf('\n}\n',start));

describe('title short-landscape fit',()=>{
  it('tightens spacing only on short landscape screens',()=>{
    expect(start).toBeGreaterThan(-1);
    expect(media).toMatch(/\.title-screen \.ts-menu ul\{gap:2px\}/);
    expect(media).toMatch(/padding-top:calc\(env\(safe-area-inset-top,0px\) \+ 10px\)/);
  });
  it('keeps menu items at a 44px touch height',()=>{
    expect(media).toMatch(/\.title-screen \.ts-item\{min-height:44px/);
  });
  it('every rule in the block stays under .title-screen',()=>{
    const selectors=media.split('\n').slice(1).map(l=>l.trim()).filter(Boolean).map(l=>l.slice(0,l.indexOf('{')));
    expect(selectors.length).toBe(5);
    for(const s of selectors)expect(s,s).toMatch(/^\.title-screen( |$)/);
  });
});
