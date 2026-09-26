import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('V14 ART A6 card-frame and A7 card-back assets',()=>{
  it('generated A6 card frame variants and A7 card back exist in assets/ui-kit/',()=>{
    expect(fs.existsSync('assets/ui-kit/A6-card-frame-common.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A6-card-frame-selected.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A6-card-frame-signature.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A6-card-frame-skill.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A7-card-back-back.png')).toBe(true);
  });

  it('ballpark.css applies A6 card frames and A7 card back to .bp-offer and .bp-offer-back',()=>{
    const css = fs.readFileSync(path.resolve('src/duel/ballpark.css'), 'utf8');
    expect(css).toMatch(/\.bp-offer\{[^}]*A6-card-frame-common\.png/);
    expect(css).toMatch(/\.bp-offer\.on\{[^}]*A6-card-frame-selected\.png/);
    expect(css).toMatch(/\.bp-offer\.rare[^}]*A6-card-frame-signature\.png/);
    expect(css).toMatch(/\.bp-offer\.skill\{[^}]*A6-card-frame-skill\.png/);
    expect(css).toMatch(/\.bp-offer-back\{[^}]*A7-card-back-back\.png/);
    expect(css).toMatch(/border-image-slice:\s*32\s*fill|A6-card-frame-common\.png['"]?\)\s*32\s*fill/);
  });
});
