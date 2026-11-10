import fs from 'node:fs';
import {describe,it,expect} from 'vitest';

/* 2026-11-10: on phone landscape every road-event choice was sized to the button min-height (56px)
   and its effect line, chips and reason spilled out under the next choice. Real geometry is checked
   in a browser by scripts/qa-event-layout.mjs; this keeps the rule and its scope from regressing in CI. */
const css=fs.readFileSync('src/duel/event.css','utf8');
const block=sel=>{const i=css.indexOf(sel+'{');return i<0?'':css.slice(i+sel.length+1,css.indexOf('}',i));};

describe('road event layout contract',()=>{
  it('the choice list keeps intrinsic row heights and still scrolls',()=>{
    const list=block('.ev-list');
    expect(list).toMatch(/grid-auto-rows:max-content/);
    expect(list).toMatch(/overflow-y:auto/);
    expect(list).toMatch(/min-height:0/);
  });
  it('phone landscape puts the story beside the choices, and only while choosing',()=>{
    const i=css.indexOf('@media (orientation:landscape) and (max-height:540px){');
    expect(i).toBeGreaterThan(-1);
    const media=css.slice(i,css.indexOf('\n}\n',i));
    expect(media).toMatch(/grid-template-areas:"head list" "paper list" "foot list"/);
    const selectors=media.split('\n').slice(1).map(l=>l.trim()).filter(l=>l.includes('{')&&!l.startsWith('grid-')&&!l.startsWith('padding')).map(l=>l.slice(0,l.indexOf('{')));
    expect(selectors.length).toBeGreaterThan(4);
    for(const s of selectors)expect(s,s).toMatch(/^\.ev-root:not\(\.is-result\)/);
  });
  it('stays scoped to .ev-* with no global selectors',()=>{
    expect(css).not.toMatch(/(^|[},\n])\s*(html|body|#root|\.duel-app)\b[^{]*\{/);
  });
});
