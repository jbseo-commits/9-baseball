import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const css=fs.readFileSync(path.resolve('src/duel/phone-art-v18.css'),'utf8');
const battle=fs.readFileSync(path.resolve('src/duel/BallparkBattle.jsx'),'utf8');

describe('home run cutscene v2 isolation',()=>{
  it('keeps the takeover scoped to homer verdicts',()=>{
    expect(css).toContain('.bp-verdict.splash.homer:has(.hr-cut)');
    expect(css).not.toContain('.bp-verdict.splash.knockout:has(.ko-cut){position:absolute;inset:0');
  });

  it('does not replace battle orchestration to achieve the cutscene',()=>{
    expect(battle).toContain('<HomeRunCut/>');
    expect(battle).toContain('<KnockoutCut');
    expect(battle).toContain('<BallparkActors');
  });

  it('keeps reduced-motion support for the V2 home-run layers',()=>{
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).toContain('.bp-verdict.splash.homer:has(.hr-cut),.bp-verdict.splash.homer .hr-plate,.bp-verdict.splash.homer .hr-batter,.bp-verdict.splash.homer .hr-trail');
    expect(css).toContain('animation:none');
  });
});
