import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../src/duel/cinematic-director.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

describe('cinematic live bridge',()=>{
  it('loads the scoped cinematic stylesheet in the Vite document',()=>{
    expect(html).toContain('/src/duel/cinematic-director.css');
  });

  it('maps every existing battle FX stage to a directed field treatment',()=>{
    for(const stage of ['windup','impact','slowmo','release','settle']){
      expect(css).toContain(`.bp-scene.fx-stage-${stage} .bp-bg`);
    }
  });

  it('keeps contact as the only live scene-wide bloom apex',()=>{
    // V2 moved the contact bloom from ::before to a stronger ::after white-out and split the
    // sheet into SUCCESS EXIT / HOME RUN PAYOFF / FAILURE LANGUAGE. The contract is therefore
    // no longer "only ::before exists" but: the apex bloom is keyed to contact, and any bloom
    // on the exit stages must be result-gated so a whiff never inherits the home-run flare.
    expect(css).toContain('.bp-scene.fx-stage-slowmo::after');
    expect(css).toContain('.bp-battle.cinema-contact .bp-scene::after');
    // Pre-contact stages never carry the apex bloom at all.
    expect(css).not.toMatch(/\.bp-scene\.fx-stage-windup::(?:before|after)/);
    expect(css).not.toMatch(/\.bp-scene\.fx-stage-impact::(?:before|after)/);
    // Every bloom on release/settle must name the result it belongs to, so a whiff or chase
    // never inherits the warm home-run flare. Selectors are extracted from the sheet rather
    // than split on braces, because several rules share one line.
    const RESULT=/\.(?:fx-homer|fx-grand|fx-dead|fx-whiff|fx-chase|fx-hit|fx-single|fx-extra)\b/;
    const selectors=[...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m=>m[1].trim());
    const exitBlooms=selectors.filter(s=>/::after/.test(s)&&/fx-stage-(?:release|settle)/.test(s));
    expect(exitBlooms.length).toBeGreaterThan(0);
    for(const s of exitBlooms) expect(s).toMatch(RESULT);
    // The warm home-run exit must never fire at contact: that is the success-neutral apex.
    for(const s of selectors){
      if(!/::after/.test(s)) continue;
      expect(/\.(?:fx-homer|fx-grand)\b[\s\S]*fx-stage-slowmo/.test(s)).toBe(false);
    }
  });

  it('keeps the direction layer out of page geometry and interactive controls',()=>{
    expect(css).not.toMatch(/(?:html|body|#root)\s*\{/);
    expect(css).not.toMatch(/overflow\s*:/);
    expect(css).not.toMatch(/\.bp-(?:cell|card|verb|pile)[^{]*\{[^}]*pointer-events/s);
  });
});
