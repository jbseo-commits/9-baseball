import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('V14 ART A1 speech bubble assets',()=>{
  it('generated 9-slice bubble assets exist in assets/ui-kit/',()=>{
    expect(fs.existsSync('assets/ui-kit/A1-bubble-plain.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A1-bubble-tail-right.png')).toBe(true);
    expect(fs.existsSync('assets/ui-kit/A1-bubble-tail-left.png')).toBe(true);
  });

  it('ballpark.css applies A1 bubble 9-slice border-image to .bp-voice and .bp-kovoice',()=>{
    const css = fs.readFileSync(path.resolve('src/duel/ballpark.css'), 'utf8');
    expect(css).toMatch(/\.bp-scene \.bp-voice\{[^}]*A1-bubble-tail-right\.png/);
    expect(css).toMatch(/\.bp-kovoice\{[^}]*A1-bubble-tail-right\.png/);
    expect(css).toMatch(/\.bp-stop\.stop-reward \.bp-kovoice\{[^}]*A1-bubble-tail-left\.png/);
    expect(css).toMatch(/border-image-slice:\s*48\s*fill|A1-bubble-tail-right\.png['"]?\)\s*48\s*fill/);
  });
});
