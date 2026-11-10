#!/usr/bin/env node
/* QA screenshots for the ballpark screens (docs/ANTIGRAVITY-LOOP.md §3 ⑥, used by the ag-qa agent).

   Usage:  npx vite --port 5199 &          (or any running dev/preview server)
           node scripts/qa-shots.mjs --url http://localhost:5199 --out work/qa

   For each viewport (two legacy portraits and five current landscapes) it loads a
   fixed save from the engine and captures: map, battle (deciding), battle (result), reward.
   It checks what broke before: horizontal scroll, the page growing taller than the screen, and the
   pitcher being covered by the HUD. Writes PNGs + report.json; exits 1 when a check fails.
   Playwright is not a project dependency: it uses a local or global install (PLAYWRIGHT_MODULE to
   override) and CHROMIUM_PATH if set. */
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createV10Duel,enterV10Node,setAimZone,playV10Action} from '../src/duel/engine.js';

const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const URL_=arg('url','http://localhost:5199'),OUT=arg('out','work/qa');
/* Current landscape uses vnext directly. Explicit legacy portraits still cover
   the retained fallback; an empty legacy selector is never a landscape PASS. */
const VIEWPORTS=[[412,743,'phone-portrait','legacy'],[375,667,'phone-small','legacy'],
  [568,320,'landscape-small','vnext'],[667,375,'landscape-phone','vnext'],[844,390,'landscape-wide','vnext'],
  [1280,720,'desktop-small','vnext'],[1440,900,'desktop','vnext']];
fs.mkdirSync(OUT,{recursive:true});

async function loadPlaywright(){
  const antigravityPw = 'C:/Users/정현아/AppData/Local/Programs/Antigravity IDE/resources/app/node_modules/playwright/index.mjs';
  const tries=[process.env.PLAYWRIGHT_MODULE,'playwright'];
  if(fs.existsSync(antigravityPw)) tries.push(pathToFileURL(antigravityPw).href);
  try{tries.push(pathToFileURL(path.join(execSync('npm root -g').toString().trim(),'playwright/index.mjs')).href);}catch{}
  for(const t of tries.filter(Boolean)){try{return await import(t);}catch{}}
  console.error('Playwright not found. Install it globally (npm i -g playwright) or set PLAYWRIGHT_MODULE.');process.exit(2);
}

/* saves: fixed seed, first Act 1 fight */
function battleSave(){let s=createV10Duel(1);s=enterV10Node(s,'a1-entry');s.battle.pending={zone:4,roll:.5,powerRoll:.9};return s;}
function rewardSave(){let s=createV10Duel(0);s=enterV10Node(s,'a1-entry');s={...s,pitcher:{...s.pitcher,hp:1,phase:'critical'}};s=setAimZone(s,s.battle.aimZone);return playV10Action(s,{type:'card',id:'basic'});}
const SAVES={map:createV10Duel(1),battle:battleSave(),reward:rewardSave()};
for(const [key,s] of Object.entries(SAVES))if(s.phase!==key)throw Error(`Invalid ${key} fixture: ${s.phase}`);

const overlap=(a,b)=>{if(!a||!b)return 0;const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)),h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));return a.w*a.h?w*h/(a.w*a.h):0;};

const {chromium}=await loadPlaywright();
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync(chromeExe) ? chromeExe : undefined);
const browser=await chromium.launch({executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];let failed=0;
const check=(name,ok,detail)=>{report.push({name,ok,detail});if(!ok){failed++;console.log('FAIL',name,detail||'');}};
const inside=(r,w,h)=>!!r&&r.w>0&&r.h>0&&r.x>=-1&&r.y>=-1&&r.x+r.w<=w+1&&r.y+r.h<=h+1;

try{
for(const [w,h,label,mode] of VIEWPORTS){
  const open=async key=>{
    const p=await browser.newPage({viewport:{width:w,height:h}});
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(URL_+'/?qa=1&battleUi='+mode);
    await p.evaluate(s=>{localStorage.clear();localStorage.setItem('9zone-v10-run',s);localStorage.setItem('9zone-hint-chase','done');localStorage.setItem('9zone-bp-coach-v1','done');},JSON.stringify(SAVES[key]));
    await p.reload();await p.getByRole('button',{name:'이어하기',exact:true}).click();await p.waitForTimeout(1500);
    return {p,errors};
  };
  const measure=p=>p.evaluate(()=>{
    const q=s=>{const e=document.querySelector(s);if(!e)return null;const style=getComputedStyle(e);if(style.visibility==='hidden'||style.display==='none'||Number(style.opacity)===0)return null;const r=e.getBoundingClientRect();return r.width&&r.height?{x:r.x,y:r.y,w:r.width,h:r.height}:null;};
    const vnext=!!document.querySelector('.battle-vnext');
    return {vnext,hscroll:document.documentElement.scrollWidth>innerWidth+1,vover:document.documentElement.scrollHeight-innerHeight,
      pitcher:q(vnext?'.bv-actor-pitcher':'.bp-pitcher'),swing:q('[data-testid=bp-swing]'),hand:q(vnext?'[data-testid=bv-hand]':'.bp-hand'),
      cards:[...document.querySelectorAll(vnext?'.bv-card':'.bp-hand .bp-card')].map(e=>e.getBoundingClientRect().bottom),
      zoneBoxes:[...document.querySelectorAll(vnext?'.bv-cell[data-zone]':'.bp-cell[data-zone]')].map(e=>q(`[data-zone="${e.dataset.zone}"]`)),
      map:q('.bp-map'),reward:q('.stop-reward'),
      handHandle:q('.bv-hand-handle'),
      ih:innerHeight,appOver:(e=>e?e.scrollHeight-e.clientHeight:0)(document.querySelector('.duel-app')),
      // The HUD parent includes transparent space between its positioned panels.
      // Measure the actual panels, retaining the parent rectangle as a diagnostic.
      hudParent:vnext?q('.bv-hud'):null,
      hud:(vnext?['.bv-hud-bar','.bv-hud-opponent','.bv-result-spotlight']:['.bp-ptag','.bp-verdict','.bp-voice','.bp-count']).map(q)};
  });
  const shot=async(p,name)=>{const f=path.join(OUT,`${label}-${name}.png`);await p.screenshot({path:f});return f;};
  const common=(tag,m,errors)=>{
    check(`${label} ${tag}: no horizontal scroll`,!m.hscroll);
    check(`${label} ${tag}: no console errors`,!errors.length,errors.join(' | '));
  };

  {const {p,errors}=await open('map');const m=await measure(p);await shot(p,'map');common('map',m,errors);check(`${label} map: expected screen present`,!!m.map);await p.close();}
  {const {p,errors}=await open('battle');let m=await measure(p);await shot(p,'battle-decide');common('battle',m,errors);
    check(`${label} battle: requested renderer present`,mode==='vnext'?m.vnext:!m.vnext,mode);
    check(`${label} battle: nine visible zone targets inside viewport`,m.zoneBoxes.length===9&&m.zoneBoxes.every(r=>inside(r,w,h)),m.zoneBoxes);
    check(`${label} battle: fits the screen`,m.vover<=1,`overflow ${m.vover}px`);
    // a page that fits can still hide its actions inside the app's own scroll box
    check(`${label} battle: no inner scroll`,m.appOver<=1,`app overflow ${m.appOver}px`);
    check(`${label} battle: swing button fully on screen`,inside(m.swing,w,h),m.swing);
    if(m.vnext){
      check(`${label} battle: folded hand handle on screen`,inside(m.handHandle,w,h),m.handHandle);
      await p.locator('.bv-hand-handle').click();await p.getByTestId('bv-basic-chip').click();await p.locator('.bv-cell[data-zone="4"]').click();
    }else{
      check(`${label} battle: hand cards not clipped`,!!m.hand&&m.cards.every(b=>b<=m.hand.y+m.hand.h+1),m.hand?`hand bottom ${Math.round(m.hand.y+m.hand.h)}, card bottom ${Math.round(Math.max(...m.cards))}`:'missing');
      await p.locator('.bp-card.basic').first().click();await p.locator('.bp-cell').nth(4).click();
    }
    await p.getByTestId('bp-swing').click();
    // Measure the visible result after its finite entrance animation. A fixed
    // delay could sample the transparent 2.4x first frame and report 100% cover.
    await p.locator(m.vnext?'[data-testid=bv-result-spotlight]':'.bp-verdict').waitFor();
    await p.evaluate(async()=>{const el=document.querySelector('[data-testid=bv-result-spotlight],.bp-verdict');if(el)await Promise.allSettled(el.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished));});
    m=await measure(p);await shot(p,'battle-result');
    const cover=Math.max(...m.hud.map(b=>overlap(m.pitcher,b)));
    check(`${label} battle: pitcher rectangle overlap with visible HUD panels`,!!m.pitcher&&cover<.35,
      {panelRectangleCoverage:cover,transparentHudParentCoverage:m.hudParent?overlap(m.pitcher,m.hudParent):null,silhouetteVerified:false});
    check(`${label} result: no console errors`,!errors.length,errors.join(' | '));
    await p.close();}
  {const {p,errors}=await open('reward');const m=await measure(p);await shot(p,'reward');common('reward',m,errors);
    check(`${label} reward: expected screen present`,!!m.reward);
    const face=await p.evaluate(()=>{const i=document.querySelector('.bp-sport img'),h=document.querySelector('.bp-shead');if(!i||!h)return {present:false,loaded:false,inside:false};const a=i.getBoundingClientRect(),b=h.getBoundingClientRect();return {present:true,loaded:i.complete&&i.naturalWidth>0,inside:a.top>=b.top-2};});
    check(`${label} reward: portrait loaded and top inside its stage`,face.present&&face.loaded&&face.inside,face);
    await p.close();}
}
}catch(error){check('QA aborted before completing all requested viewports',false,error.message);}
await browser.close();
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({url:URL_,viewports:VIEWPORTS,input:'desktop mouse; explicit renderer queries; not touch/default-routing or full-run validation',failed,checks:report},null,1));
console.log(`${report.length-failed}/${report.length} checks passed · shots in ${OUT}`);
process.exit(failed?1:0);
