import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {compactVariableFonts} from '../scripts/lib/vite-variable-fonts.mjs';
it('combines only identical verified variable subsets; static faces, unicode ranges and URLs survive',()=>{
  const css=readFileSync('src/duel/fonts.css','utf8'),out=compactVariableFonts(css);
  const faces=x=>[...x.matchAll(/@font-face\s*\{[^}]*\}/g)].map(m=>m[0]);
  expect(faces(css).length-faces(out).length).toBe(120*5);
  const sources=x=>[...x.matchAll(/src:\s*([^;]+);/g)].map(m=>m[1]);
  expect(new Set(sources(out))).toEqual(new Set(sources(css)));
  expect(out.match(/font-weight: 400 900;/g)).toHaveLength(120);
  const staticFaces=faces(css).filter(x=>!x.includes('v40-PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.'));
  for(const face of staticFaces)expect(out).toContain(face);
  expect(compactVariableFonts(out)).toBe(out);
});
