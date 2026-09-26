import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('V14 ART A3 panel assets',()=>{
  it('generated A3 panel asset exists in assets/ui-kit/',()=>{
    expect(fs.existsSync('assets/ui-kit/A3-panel-base.png')).toBe(true);
  });

  it('ballpark.css applies A3 panel 9-slice border-image to .bp-ptag',()=>{
    const css = fs.readFileSync(path.resolve('src/duel/ballpark.css'), 'utf8');
    expect(css).toMatch(/\.bp-ptag\{[^}]*A3-panel-base\.png/);
    expect(css).toMatch(/border-image-slice:\s*40\s*fill|A3-panel-base\.png['"]?\)\s*40\s*fill/);
  });
});
