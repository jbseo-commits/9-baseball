import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../src/duel/phone-art-v18.css',import.meta.url),'utf8');
const battle=fs.readFileSync(new URL('../src/duel/BallparkBattle.jsx',import.meta.url),'utf8');

describe('home run cutscene v2',()=>{
  it('keeps the authored HomeRunCut attached only to homer verdicts',()=>{
    expect(battle).toContain("isHomerSplash&&<HomeRunCut/>");
    expect(battle).toContain("isHomerSplash?' homer':'");
  });

  it('promotes the homer cut to a scene takeover instead of a 400px verdict card',()=>{
    expect(css).toContain('.bp-verdict.splash.homer:has(.hr-cut)');
    expect(css).toContain('position:absolute;inset:0;z-index:80');
    expect(css).toContain('animation:hr-takeover 1.72s');
  });

  it('yields battle actors and review UI during the payoff then restores them',()=>{
    expect(css).toContain('animation:hr-world-yield 1.72s');
    expect(css).toContain('animation:hr-review-yield 1.72s');
    expect(css).toMatch(/@keyframes hr-world-yield\{[^}]*opacity:1/);
    expect(css).toContain('100%{opacity:1;transform:none}');
  });

  it('does not turn knockout into the full-scene homer takeover',()=>{
    const knockoutRule=css.match(/\.bp-verdict\.splash\.knockout:has\(\.ko-cut\)\{([^}]*)\}/)?.[1]||'';
    expect(knockoutRule).toContain('width:min(92%,400px)');
    expect(knockoutRule).not.toContain('inset:0;z-index:80');
  });
});
