import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

/* target: docs/art/benchmark/target/battle-portrait.png (user feedback 2026-09-28:
   the batter must stand in the batter's box, and the verb buttons must read like the mockup) */
const css=fs.readFileSync('src/duel/v14-portrait-master.css','utf8');

describe('V15 portrait battle camera matches the target mockup',()=>{
  it('batter in the left box, zone over the plate, pitcher on the mound — one vw geometry with the stadium plate',()=>{
    expect(css).toContain('background-position:left 0 bottom -28.4vw!important');
    expect(css).toContain('background-size:115% auto!important');
    expect(css).toMatch(/\.bp-batter\{left:-27%;bottom:2vw;height:76vw\}/);
    expect(css).toMatch(/\.bp-pitcher\{right:8%;bottom:63vw;height:28vw;z-index:2\}/);
    expect(css).toMatch(/\.bp-zone\{\s*left:35%;top:auto;bottom:18vw;/);
  });

  it('the HP panel moves top-left and the tell sits top-right, so neither hides the pitcher',()=>{
    expect(css).toMatch(/\.bp-ptag\{\s*left:8px;right:auto;top:6px;width:46%;/);
    expect(css).toContain('.v14-battle-portrait .bp-scene .bp-tell{left:auto;right:8px;top:8px}');
  });

  it('verbs: heavy display verb, one readable sans hint; battle body copy is Noto Sans KR, not Gowun Dodum',()=>{
    expect(css).toContain('font:400 24px/1.05 var(--bp-impact)!important');
    expect(css).toMatch(/\.bp-verb::after\{\s*grid-column:2;[^}]*font:500 12px\/1\.25 "Noto Sans KR"/);
    expect(css).toContain('.v14-battle-portrait .bp-verb:has(small)::after{content:none;display:none}');
    expect(css).toContain('.v14-battle-portrait .bp-battle{--bp-ko:"Noto Sans KR"');
    expect(css).toContain('.v14-battle-portrait .bp-verbs.next .bp-verb.go::after{content:"다음 투구로 넘어간다"}');
  });
});
