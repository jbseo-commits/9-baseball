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
    expect(css).toContain('.bp-scene.fx-stage-slowmo::before');
    expect(css).not.toContain('.bp-scene.fx-stage-windup::before');
    expect(css).not.toContain('.bp-scene.fx-stage-impact::before');
    expect(css).not.toContain('.bp-scene.fx-stage-release::before');
  });

  it('does not alter pointer geometry or page overflow',()=>{
    expect(css).not.toMatch(/pointer-events\s*:\s*(auto|none)/);
    expect(css).not.toMatch(/(?:html|body|#root)\s*\{/);
    expect(css).not.toMatch(/overflow\s*:/);
  });
});
