import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const css=fs.readFileSync(path.resolve('src/duel/cinematic-director.css'),'utf8');

describe('cinematic director css containment',()=>{
  it('keeps every authored rule scoped to the battle scene or reduced-motion block',()=>{
    expect(css).toContain('.bp-battle.cinema-contact .bp-scene::before');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).not.toMatch(/(^|\n)\s*(html|body|#root)\b/);
  });

  it('does not alter interaction geometry',()=>{
    expect(css).not.toMatch(/pointer-events\s*:\s*none[^}]*\.bp-hand/);
    expect(css).not.toMatch(/display\s*:\s*none/);
  });
});
