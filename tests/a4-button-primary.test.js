import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('V14 ART A4 primary button assets',()=>{
  it('generated 9-slice primary button assets exist in assets/ui-kit/',()=>{
    expect(fs.existsSync('assets/ui-kit/A4-button-primary-normal.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A4-button-primary-pressed.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A4-button-primary-disabled.png')).toBe(true);
  });

  it('ballpark.css applies A4 button 9-slice border-image to .bp-verb.go and .bp-mgo',()=>{
    const css = fs.readFileSync(path.resolve('src/duel/ballpark.css'), 'utf8');
    expect(css).toMatch(/\.bp-verb\.go\{[^}]*A4-button-primary-normal\.png/);
    expect(css).toMatch(/\.bp-verb\.go:active:not\(:disabled\)\{[^}]*A4-button-primary-pressed\.png/);
    expect(css).toMatch(/\.bp-verb\.go:disabled\{[^}]*A4-button-primary-disabled\.png/);
    expect(css).toMatch(/\.bp-mgo\{[^}]*A4-button-primary-normal\.png/);
    expect(css).toMatch(/\.bp-mgo:active:not\(:disabled\)\{[^}]*A4-button-primary-pressed\.png/);
    expect(css).toMatch(/\.bp-mgo:disabled\{[^}]*A4-button-primary-disabled\.png/);
    expect(css).toMatch(/border-image-slice:\s*40\s*fill|A4-button-primary-normal\.png['"]?\)\s*40\s*fill/);
  });
});
