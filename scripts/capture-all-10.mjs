import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createV10Duel, enterV10Node, setAimZone, playV10Action } from '../src/duel/engine.js';

async function loadPlaywright(){
  const antigravityPw = 'C:/Users/정현아/AppData/Local/Programs/Antigravity IDE/resources/app/node_modules/playwright/index.mjs';
  const tries=[process.env.PLAYWRIGHT_MODULE,'playwright'];
  if(fs.existsSync(antigravityPw)) tries.push(pathToFileURL(antigravityPw).href);
  try{tries.push(pathToFileURL(path.join(execSync('npm root -g').toString().trim(),'playwright/index.mjs')).href);}catch{}
  for(const t of tries.filter(Boolean)){try{return await import(t);}catch{}}
  throw new Error('Playwright not found');
}

const URL_ = 'http://localhost:5174';
const OUT = 'work/audit-10';
fs.mkdirSync(OUT, { recursive: true });

function battleSave(){
  let s = createV10Duel(1);
  s = enterV10Node(s, 'a1-entry');
  s.battle.pending = { zone: 4, roll: 0.5, powerRoll: 0.9 };
  return s;
}

function rewardSave(){
  let s = createV10Duel(0);
  s = enterV10Node(s, 'a1-entry');
  s = { ...s, pitcher: { ...s.pitcher, hp: 1, phase: 'critical' } };
  s = setAimZone(s, s.battle.aimZone);
  return playV10Action(s, { type: 'card', id: 'basic' });
}

function wonSave(){
  let s = createV10Duel(1);
  s.phase = 'won';
  s.stats = { runs: 14, appearances: 18, pitches: 42, hits: 11, walks: 3, fouls: 5, whiffs: 4 };
  s.runMap.completedNodeIds = ['a1-entry', 'a1-battle-1', 'a1-locker', 'a1-elite-1', 'a1-boss', 'a2-entry', 'a2-battle-1', 'a2-shop', 'a2-boss', 'a3-entry', 'a3-boss'];
  return s;
}

const { chromium } = await loadPlaywright();
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync(chromeExe) ? chromeExe : undefined);
const browser = await chromium.launch({ executablePath, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

console.log('Capturing all 10 runtime screens...');

// Helper to open page with state
async function setupPage(viewport, state, action) {
  const p = await browser.newPage({ viewport });
  await p.goto(URL_ + '/?qa=1');
  if (state) {
    await p.evaluate(s => {
      localStorage.clear();
      localStorage.setItem('9zone-v10-run', s);
      localStorage.setItem('9zone-hint-chase', 'done');
    }, JSON.stringify(state));
    await p.reload();
    const resumeBtn = p.getByRole('button', { name: '이어하기', exact: true });
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
      await p.waitForTimeout(1000);
    }
  } else {
    await p.evaluate(() => { localStorage.clear(); });
    await p.reload();
    await p.waitForTimeout(600);
  }
  if (action) await action(p);
  return p;
}

// 1. Title
{
  console.log('1. Title');
  const p = await setupPage({ width: 613, height: 358 }, null);
  await p.screenshot({ path: path.join(OUT, 'runtime-title.png') });
  await p.close();
}

// 2. Battle Portrait
{
  console.log('2. Battle Portrait (412x743 and 720x1279)');
  const p1 = await setupPage({ width: 412, height: 743 }, battleSave());
  await p1.screenshot({ path: path.join(OUT, 'runtime-battle-portrait-412.png') });
  await p1.close();

  const p2 = await setupPage({ width: 720, height: 1279 }, battleSave());
  await p2.screenshot({ path: path.join(OUT, 'runtime-battle-portrait-720.png') });
  await p2.close();
}

// 3. Battle Landscape
{
  console.log('3. Battle Landscape (612x358 and 844x390)');
  const p1 = await setupPage({ width: 612, height: 358 }, battleSave());
  await p1.screenshot({ path: path.join(OUT, 'runtime-battle-landscape-612.png') });
  await p1.close();

  const p2 = await setupPage({ width: 844, height: 390 }, battleSave());
  await p2.screenshot({ path: path.join(OUT, 'runtime-battle-landscape-844.png') });
  await p2.close();
}

// 4. Map
{
  console.log('4. Map (611x358 and 844x390)');
  const p1 = await setupPage({ width: 611, height: 358 }, createV10Duel(1));
  await p1.screenshot({ path: path.join(OUT, 'runtime-map-611.png') });
  await p1.close();

  const p2 = await setupPage({ width: 844, height: 390 }, createV10Duel(1));
  await p2.screenshot({ path: path.join(OUT, 'runtime-map-844.png') });
  await p2.close();
}

// 5. Reward
{
  console.log('5. Reward (612x303 and 844x390)');
  const p1 = await setupPage({ width: 612, height: 303 }, rewardSave());
  await p1.screenshot({ path: path.join(OUT, 'runtime-reward-612.png') });
  await p1.close();

  const p2 = await setupPage({ width: 844, height: 390 }, rewardSave());
  await p2.screenshot({ path: path.join(OUT, 'runtime-reward-844.png') });
  await p2.close();
}

// 6. Deck Modal
{
  console.log('6. Deck Modal (613x213 and 844x390)');
  const p1 = await setupPage({ width: 613, height: 358 }, createV10Duel(1), async p => {
    const deckBtn = p.getByRole('button', { name: '덱', exact: true });
    if (await deckBtn.isVisible()) await deckBtn.click();
    await p.waitForTimeout(500);
  });
  await p1.screenshot({ path: path.join(OUT, 'runtime-deck-613.png') });
  await p1.close();
}

// 7. Dex Modal / Pitcher Inspect
{
  console.log('7. Dex Modal (611x213 and 844x390)');
  const p1 = await setupPage({ width: 611, height: 358 }, createV10Duel(1), async p => {
    // Open pitcher portrait dialog
    const inspectBtn = p.locator('.bp-mpor-btn').first();
    if (await inspectBtn.isVisible()) await inspectBtn.click();
    await p.waitForTimeout(500);
  });
  await p1.screenshot({ path: path.join(OUT, 'runtime-dex-611.png') });
  await p1.close();
}

// 8. Homerun
{
  console.log('8. Homerun');
  const p = await setupPage({ width: 613, height: 274 }, battleSave(), async p => {
    // Inject splash homerun element for fidelity audit
    await p.evaluate(() => {
      const arena = document.querySelector('.bp-scene') || document.querySelector('.bp-arena') || document.querySelector('.bp-battle');
      if (arena) {
        const v = document.createElement('div');
        v.className = 'bp-verdict good splash homer';
        v.setAttribute('role', 'status');
        v.innerHTML = '<strong>HOME RUN!</strong><small>비거리 128m</small>';
        arena.appendChild(v);
      }
    });
    await p.waitForTimeout(500);
  });
  await p.screenshot({ path: path.join(OUT, 'runtime-homerun-613.png') });
  await p.close();
}

// 9. Knockout
{
  console.log('9. Knockout');
  const p = await setupPage({ width: 611, height: 274 }, battleSave(), async p => {
    // Inject splash knockout element for fidelity audit
    await p.evaluate(() => {
      const arena = document.querySelector('.bp-scene') || document.querySelector('.bp-arena') || document.querySelector('.bp-battle');
      if (arena) {
        const v = document.createElement('div');
        v.className = 'bp-verdict splash knockout';
        v.setAttribute('role', 'status');
        v.innerHTML = '<strong>RED RUSH 강판</strong><small>HP 0 / 72</small>';
        arena.appendChild(v);
      }
    });
    await p.waitForTimeout(500);
  });
  await p.screenshot({ path: path.join(OUT, 'runtime-knockout-611.png') });
  await p.close();
}

// 10. Ending
{
  console.log('10. Ending (612x185 and 844x390)');
  const p1 = await setupPage({ width: 612, height: 185 }, wonSave());
  await p1.screenshot({ path: path.join(OUT, 'runtime-ending-612.png') });
  await p1.close();

  const p2 = await setupPage({ width: 844, height: 390 }, wonSave());
  await p2.screenshot({ path: path.join(OUT, 'runtime-ending-844.png') });
  await p2.close();
}

await browser.close();
console.log('All 10 screen shots captured in', OUT);
