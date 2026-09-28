// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import fs from 'node:fs';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel} from '../src/duel/engine.js';
import {BUILDS,CARDS} from '../src/duel/cards.js';
import {sceneUnit,SCENE_UNITS_TALL,nextHint} from '../src/duel/BallparkBattle.jsx';
import {layoutBox,pitcherStance} from '../src/duel/BallparkActors.jsx';
import {BATTER_V15_SHEET,sheetCellStyle} from '../src/duel/batter-v15.js';
import {pitcherAtlases} from '../src/duel/pitcher-visuals.js';
import {planText} from '../src/duel/DecisionDebrief.jsx';

/* GitHub #103 — 2026-09-28 mobile playtest (docs/feedback/2026-09-28-mobile-playtest.md).
   M09 the batter art flipped between two drawings; M10 every pitcher stood off the mound;
   M03 "지켜본/다" and "피해 …"; M04 the debrief ran under the verbs, "HP 72%" read like damage;
   M08 the pitcher's name was cut off. */
beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

function begin(){
  let s=createV10Duel(1);
  s.build='away';s.deck=BUILDS.away.cards.filter(k=>CARDS[k].type!=='skill').map((kind,i)=>({id:'c'+i,kind}));
  s.nextId=s.deck.length;
  s=enterV10Node(s,'a1-entry');
  saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  return s;
}
const portrait=fs.readFileSync('src/duel/v14-portrait-master.css','utf8');
const ballpark=fs.readFileSync('src/duel/ballpark.css','utf8');

describe('#103 M10 — one camera unit keeps the pitcher on the mound on every phone height',()=>{
  it('is 1% of the width while the scene is tall enough, and pulls back (never under 80%) when it is short',()=>{
    expect(sceneUnit(412,462)).toBeCloseTo(4.12);                 // 412x780: tall enough
    expect(sceneUnit(412,401)).toBeCloseTo(401/SCENE_UNITS_TALL);  // Chrome's address bar showing
    expect(sceneUnit(412,401)).toBeLessThan(4.12);
    expect(sceneUnit(360,200)).toBeCloseTo(3.6*.8);               // floor: the 125u stadium still covers the width
    expect(sceneUnit(0,400)).toBe(0);
    expect(sceneUnit(390,0)).toBeCloseTo(3.9);
  });
  it('lays the stadium, batter, pitcher and zone out in that unit — no vw left on the field',()=>{
    for(const sel of ['.bp-batter{','.bp-pitcher{'])expect(portrait).toContain(sel+'left:calc(');
    expect(portrait).toMatch(/background-size:calc\(125 \* var\(--u,1vw\)\) auto/);
    expect(portrait.split('var(--u,1vw)').join('U')).not.toMatch(/\.bp-(batter|pitcher|zone)\{[^}]*\dvw/);
  });
  it('knows where every pitcher stands in her frame, and both renderers use it',()=>{
    for(const id of Object.keys(pitcherAtlases)){
      const [x,y]=pitcherStance(id);
      expect(x,id).toBeGreaterThan(.2);expect(x,id).toBeLessThan(.85);
      expect(y,id).toBeGreaterThan(.9);expect(y,id).toBeLessThanOrEqual(1);
    }
    expect(pitcherStance('unknown')).toEqual([.5,1]);
    expect(ballpark).toMatch(/\.bp-pitcher>\.sprite-stage\{translate:calc\(\(\.5 - var\(--stance-x,\.5\)\) \* 100%\)/);
    begin();
    const box=document.querySelector('.bp-pitcher');
    expect(Number(box.style.getPropertyValue('--stance-x'))).toBe(pitcherStance('regular-01-red-rush')[0]);
  });
  it('measures layout boxes from offsets, so a transform (entrance, camera zoom) never moves where Pixi draws',()=>{
    const scene={getBoundingClientRect:()=>({left:0,top:0})};
    const parent={offsetLeft:10,offsetTop:20,offsetParent:scene};
    const el={offsetLeft:5,offsetTop:7,offsetWidth:99,offsetHeight:98,offsetParent:parent,
      getBoundingClientRect:()=>({left:400,top:300,width:140,height:140})};   // mid-animation rect: must be ignored
    expect(layoutBox(el,scene)).toEqual({x:15,y:27,w:99,h:98});
    expect(layoutBox(null,scene)).toBeNull();
  });
});

describe('#103 M09 — one batter drawing whether Pixi or the DOM draws him',()=>{
  it('the runtime sheet is the V15 master at half size, same 4x2 grid and baseline',()=>{
    expect(BATTER_V15_SHEET.src).toMatch(/batter-sheet-runtime/);
    expect([BATTER_V15_SHEET.cols,BATTER_V15_SHEET.rows]).toEqual([4,2]);
    expect(BATTER_V15_SHEET.baseline).toBeCloseTo(1527/1536);
    expect(fs.existsSync('assets/production-art/battle-portrait-v15/batter-sheet-runtime.png')).toBe(true);
  });
  it('maps each pose to its sheet cell for the DOM fallback',()=>{
    expect(sheetCellStyle(BATTER_V15_SHEET,'ready').backgroundPosition).toBe('0% 0%');
    expect(sheetCellStyle(BATTER_V15_SHEET,'contact').backgroundPosition).toBe('0% 100%');
    expect(sheetCellStyle(BATTER_V15_SHEET,'swing-mid').backgroundPosition).toBe('100% 0%');
    expect(sheetCellStyle(BATTER_V15_SHEET,'settle').backgroundPosition).toBe(`${200/3}% 100%`);
    expect(sheetCellStyle(BATTER_V15_SHEET,'ready').backgroundSize).toBe('400% 200%');
  });
  it('the battle DOM batter is that sheet, not the older reboot art',()=>{
    begin();
    const frame=document.querySelector('.bp-batter .batter-sheet-frame');
    expect(frame).toBeTruthy();
    expect(frame.style.backgroundImage).toMatch(/batter-sheet-runtime/);
    expect(document.querySelector('.bp-batter img.batter-reboot-art')).toBeNull();
  });
  it('re-measures while idle and hands the actors back to the DOM when the WebGL context is lost',()=>{
    const src=fs.readFileSync('src/duel/BallparkActors.jsx','utf8');
    expect(src).toMatch(/if\(!active&&now-measuredAt>REMEASURE_MS\)measure\(\)/);
    expect(src).toContain("addEventListener('webglcontextlost',onLost)");
    expect(src).toContain('const rel=el=>layoutBox(el,scene);');   // not the old getBoundingClientRect measure, which carried transforms
  });
});

describe('#103 M03/M04/M08 — battle text reads whole',()=>{
  it('the wait verb is one unbroken word and the swing numbers wrap between each other',()=>{
    begin();
    fireEvent.click(document.querySelector('.bp-hand .bp-card:not(.basic)'));
    expect(screen.getByTestId('bp-take').querySelector('.bp-verb-word').textContent).toBe('지켜본다');
    const parts=[...screen.getByTestId('bp-swing').querySelectorAll('.bp-verb-sub>span')].map(x=>x.textContent);
    expect(parts[0]).toMatch(/^적중권 \d+%$/);
    expect(parts[1]).toMatch(/^피해 ×/);
    expect(portrait).toContain('.v14-battle-portrait .bp-verb-word{grid-column:2;white-space:nowrap;min-width:0}');
    expect(portrait).toMatch(/\.bp-verbs:has\(\.bp-info\)\{grid-template-columns:minmax\(0,1\.45fr\) minmax\(136px,1fr\) 40px\}/);
  });
  it('the next-step hint names the same step as its verb',()=>{
    expect(nextHint('pitch')).toContain('다음 공');
    expect(nextHint('between')).toContain('다음 타자');
    expect(nextHint('battle')).toBe('');
    expect(portrait).toContain('.v14-battle-portrait .bp-verbs.next{grid-template-columns:minmax(0,1fr)}');
  });
  it('the debrief fits its row (scrolls inside itself) and keeps efficiency apart from real damage',()=>{
    expect(planText({choice:'strike',cardCount:3,connectCount:1,damageRate:.72})).toBe('3장 STACK · CONNECT 1/2 · 피해 효율 72%');
    expect(portrait).toMatch(/\.bp-debrief\{[^}]*overflow-y:auto;overscroll-behavior:contain/);
    expect(fs.readFileSync('src/duel/BallparkBattle.jsx','utf8')).toContain("'투수 HP -'+lessonCombat.damage");
    expect(portrait).toContain('.v14-battle-portrait .bp-damage{top:auto;bottom:4px;right:8px;');
  });
  it('the pitcher name is never truncated; only the pitch-type prefix may give way',()=>{
    begin();
    const title=document.querySelector('.bp-pitcher-title-name');
    expect(title.querySelector('.bp-pname').textContent).toBe('레드 러시');
    expect(title.textContent).toMatch(/ · 레드 러시$/);
    expect(portrait).toMatch(/\.bp-pname\{flex:0 0 auto/);
    expect(portrait).toMatch(/\.bp-ptype\{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis/);
  });
  it('zone cells never split a word and the zone keeps a tappable width on short phones',()=>{
    expect(portrait).toContain('.v14-battle-portrait .bp-cell{white-space:nowrap;word-break:keep-all}');
    expect(portrait).toMatch(/\.bp-zone\{width:max\(calc\(36 \* var\(--u,1vw\)\),138px\)/);
  });
});
