import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readFileSync(path.join(ROOT,'src/duel/hud-clarity.css'),'utf8');
const main=readFileSync(path.join(ROOT,'src/main.jsx'),'utf8');
const rules=css.replace(/\/\*[\s\S]*?\*\//g,'');
const selectors=[...rules.matchAll(/([^{}@]+)\{[^{}]*\}/g)].map(m=>m[1].trim());

describe('portrait battle HUD clarity',()=>{
  it('is loaded by main.jsx after the portrait master layer it refines',()=>{
    const order=[...main.matchAll(/import "(\.\/duel\/[^"]+\.css)"/g)].map(m=>m[1]);
    expect(order.indexOf('./duel/hud-clarity.css')).toBeGreaterThan(order.indexOf('./duel/v14-portrait-master.css'));
  });
  it('touches only the portrait battle top bar and adds no !important',()=>{
    expect(selectors.length).toBeGreaterThan(0);
    for(const sel of selectors)expect(sel.startsWith('.v14-battle-portrait .bp-bar ')).toBe(true);
    expect(rules).not.toContain('!important');
    expect(rules).not.toMatch(/(^|[\s,}])(html|body|#root|\.duel-app)\b/);
  });
  it('keeps the inning badge on the 12px micro token and hides the decorative subtitle',()=>{
    expect(rules).toMatch(/\.bp-hud-inning\{[^}]*font-size:var\(--t-micro\)/);
    expect(rules).toMatch(/\.bp-hud-sub\{display:none\}/);
    expect(rules).toMatch(/\.bp-hud-brand\{[^}]*flex:0 0 auto/);
  });
  it('draws out lamps larger than ball/strike lamps at every width',()=>{
    const size=re=>[...rules.matchAll(re)].map(m=>Number(m[1]));
    const all=size(/\.bp-bar \.bp-bso-leds i\{width:(\d+)px/g);
    const outs=size(/\.bp-bso-unit\.o \.bp-bso-leds i\{width:(\d+)px/g);
    expect(outs).toHaveLength(all.length);
    outs.forEach((o,i)=>expect(o).toBeGreaterThan(all[i]));
  });
});
