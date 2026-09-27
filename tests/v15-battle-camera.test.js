import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

/* target: docs/art/benchmark/target/battle-portrait.png (user feedback 2026-09-28:
   the batter must stand in the batter's box, and the verb buttons must read like the mockup) */
const css=fs.readFileSync('src/duel/v14-portrait-master.css','utf8');

describe('V15 portrait battle camera matches the target mockup',()=>{
  it('batter in the left box, zone over the plate, pitcher on the mound — one vw geometry with the stadium plate',()=>{
    /* 125% plate: home plate ~62%, mound ~85% — the zone floats right of the batter, over the plate */
    expect(css).toContain('background-position:left 0 bottom -31.2vw!important');
    expect(css).toContain('background-size:125% auto!important');
    expect(css).toMatch(/\.bp-batter\{left:-27%;top:auto;bottom:1vw;height:78vw\}/);   // V15 hero inside the box, off the chalk
    expect(css).toMatch(/\.bp-pitcher\{left:auto;right:1%;top:auto;bottom:71vw;height:24vw;z-index:2\}/);   // top:auto, or the base top:18% drops her off the mound
    expect(css).toMatch(/\.bp-zone\{\s*left:44%;top:auto;bottom:19vw;width:36%;/);
  });

  it('the HP panel moves top-left and the tell sits top-right, so neither hides the pitcher',()=>{
    expect(css).toMatch(/\.bp-ptag\{\s*left:8px;right:auto;top:6px;width:46%;/);
    expect(css).toContain('.v14-battle-portrait .bp-scene .bp-tell{left:auto;right:8px;top:8px;max-width:46%;white-space:nowrap;font-size:12px}');
  });

  it('verbs: heavy display verb, one readable sans hint; battle body copy is Noto Sans KR, not Gowun Dodum',()=>{
    expect(css).toContain('font:400 24px/1.05 var(--bp-impact)!important');
    expect(css).toMatch(/\.bp-verb::after\{\s*grid-column:2;[^}]*font:500 12px\/1\.25 "Noto Sans KR"/);
    expect(css).toContain('.v14-battle-portrait .bp-verb:has(small)::after{content:none;display:none}');
    expect(css).toContain('.v14-battle-portrait .bp-battle{--bp-ko:"Noto Sans KR"');
    expect(css).toContain('.v14-battle-portrait .bp-verbs.next .bp-verb.go::after{content:"다음 투구로 넘어간다"}');
  });

  it('the main run plays the V15 over-the-shoulder hero on its baseline-aligned 4x2 sheet',async()=>{
    const {BATTER_V15_SHEET:v}=await import('../src/duel/batter-v15.js');
    const m=JSON.parse(fs.readFileSync('assets/production-art/battle-portrait-v15/manifest.json','utf8'));
    expect([v.cols,v.rows]).toEqual([m.batter.atlas_columns,2]);
    expect(v.smooth).toBe(true);
    const poses=['ready','load','trigger','swing-start','swing-mid','contact','follow-through-early','follow-through-late','finish','settle'];
    for(const p of poses)expect(v.order[p],p).toBeLessThan(m.batter.frames.length);
    expect(v.order.contact).toBe(m.batter.frames.findIndex(f=>f.file==='batter-contact.png'));
    const app=fs.readFileSync('src/duel/App.jsx','utf8');
    expect(app).toContain('batterSheet={BATTER_V15_SHEET}');
  });
});
