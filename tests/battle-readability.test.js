import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readFileSync(path.join(ROOT,'src/duel/battle-readability.css'),'utf8');
const main=readFileSync(path.join(ROOT,'src/main.jsx'),'utf8');
const rules=css.replace(/\/\*[\s\S]*?\*\//g,'');
const selectors=[...rules.matchAll(/([^{}@]+)\{[^{}]*\}/g)].map(m=>m[1].trim());

describe('portrait battle readability layer',()=>{
  it('loads after the portrait master and before the title layer',()=>{
    const order=[...main.matchAll(/import "(\.\/duel\/[^"]+\.css)"/g)].map(m=>m[1]);
    const at=order.indexOf('./duel/battle-readability.css');
    expect(at).toBeGreaterThan(order.indexOf('./duel/v14-portrait-master.css'));
    expect(order.at(-1)).toBe('./duel/title-pixel.css');
  });
  it('touches only the portrait battle and adds no !important',()=>{
    expect(selectors.length).toBeGreaterThan(0);
    for(const sel of selectors)expect(sel.startsWith('.v14-battle-portrait .bp-battle ')).toBe(true);
    expect(rules).not.toContain('!important');
  });
  it('shows the 흔들림 label at the 12px floor and labels dead cells in words without touching covered cells',()=>{
    expect(rules).toMatch(/\.bp-mental em\{font-size:var\(--t-micro\)/);
    expect(rules).toMatch(/\.bp-cell\.dead:not\(\.cover\):not\(\.assist\)::before\{[^}]*content:\"안 던짐\"[^}]*pointer-events:none[^}]*font:400 var\(--t-micro\)/);
  });
});
