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

  it('keeps the full-scene takeover on the QA route, so live play keeps the approved home-run movie',()=>{
    const takeover=css.split('\n').filter(l=>/position:absolute;inset:0;z-index:80|hr-world-yield 1|hr-review-yield 1/.test(l)||/^\S.*:has\(\.bp-verdict\.splash\.homer/.test(l));
    expect(takeover.length).toBeGreaterThan(0);
    for(const l of css.split('\n'))if(/\.bp-(scene|battle):has\(\.bp-verdict\.splash\.homer/.test(l))expect(l).toContain('.homer-qa ');
    const main=fs.readFileSync(path.resolve('src/main.jsx'),'utf8');
    expect(main).toContain('homer-qa');
    expect(main).toContain('HomerunVideoPreview');
  });

  it('does not replace battle orchestration to achieve the cutscene',()=>{
    expect(battle).toContain('<HomeRunCut/>');
    expect(battle).toContain('<KnockoutCut');
    expect(battle).toContain('<BallparkActors');
  });

  it('keeps reduced-motion support for the V2 home-run layers',()=>{
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).toContain('.homer-qa .bp-verdict.splash.homer:has(.hr-cut),.homer-qa .bp-verdict.splash.homer .hr-plate,.homer-qa .bp-verdict.splash.homer .hr-batter,.homer-qa .bp-verdict.splash.homer .hr-trail');
    expect(css).toContain('animation:none');
  });
});
