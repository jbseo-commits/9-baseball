import fs from 'node:fs';
import {describe,it,expect} from 'vitest';

/* 2026-11-11: at 667x375 and 844x390 the rail result line showed its heading and explanation but the
   "투수 HP -N (a→b)" consequence wrapped below the height-capped panel. Geometry is checked in a browser by
   scripts/qa-result-consequence.mjs; this keeps the ordering rule and the markup it relies on in CI. */
const css=fs.readFileSync('src/duel/battle-vnext/layout.css','utf8');
const jsx=fs.readFileSync('src/duel/battle-vnext/ResultReadout.jsx','utf8');

describe('rail result line shows the HP consequence first',()=>{
  it('orders the consequence onto the heading row, before the explanation',()=>{
    expect(css).toMatch(/\.battle-vnext \.bv-command-rail>\.bv-plan>\.bv-result-line>em\{order:1;margin-left:auto\}/);
    expect(css).toMatch(/\.battle-vnext \.bv-command-rail>\.bv-plan>\.bv-result-line>span\{order:2\}/);
  });
  it('the line variant still renders heading, explanation and consequence as direct children',()=>{
    expect(jsx).toMatch(/className=\{'bv-result-line t-'\+tone\.key\}[^>]*>\s*<b>\{tone\.label\}<\/b><span>\{result\.explanation\}<\/span>\{dmg&&<em>\{dmg\}<\/em>\}/);
  });
});
