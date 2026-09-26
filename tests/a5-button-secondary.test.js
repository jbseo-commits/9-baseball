import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('V14 ART A5 secondary button assets',()=>{
  it('generated 9-slice secondary button assets exist in assets/ui-kit/',()=>{
    expect(fs.existsSync('assets/ui-kit/A5-button-secondary-normal.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A5-button-secondary-pressed.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A5-button-secondary-disabled.png')).toBe(true);
  });

  it('ballpark.css applies A5 button 9-slice border-image to .bp-verb.wait',()=>{
    const css = fs.readFileSync(path.resolve('src/duel/ballpark.css'), 'utf8');
    expect(css).toMatch(/\.bp-verb\.wait\{[^}]*A5-button-secondary-normal\.png/);
    expect(css).toMatch(/\.bp-verb\.wait:active:not\(:disabled\)\{[^}]*A5-button-secondary-pressed\.png/);
    expect(css).toMatch(/\.bp-verb\.wait:disabled\{[^}]*A5-button-secondary-disabled\.png/);
    expect(css).toMatch(/border-image-slice:\s*40\s*fill|A5-button-secondary-normal\.png['"]?\)\s*40\s*fill/);
  });
});
