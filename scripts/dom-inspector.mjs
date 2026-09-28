import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const { chromium } = await loadPlaywright();
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync(chromeExe) ? chromeExe : undefined);
const browser = await chromium.launch({ executablePath, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

console.log('=== RUNTIME DOM & TYPOGRAPHY INSPECTION ===');

// Helper
async function getStyles(page, selector) {
  return await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      text: el.innerText.slice(0, 50).replace(/\n/g, ' '),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      color: cs.color,
      background: cs.background.slice(0, 50),
      padding: cs.padding,
      margin: cs.margin,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }, selector);
}

// 1. Title DOM
{
  const p = await browser.newPage({ viewport: { width: 613, height: 358 } });
  await p.goto(URL_ + '/?qa=1');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  console.log('--- 1. Title Elements ---');
  console.log('Wordmark:', await getStyles(p, '.wordmark'));
  console.log('Title H1:', await getStyles(p, '.duel-title h1'));
  console.log('Main Action Btn:', await getStyles(p, '.title-main-actions button.primary'));
  await p.close();
}

// 2. Battle Portrait DOM
{
  const p = await browser.newPage({ viewport: { width: 412, height: 743 } });
  await p.goto(URL_ + '/?qa=1');
  await p.evaluate(s => {
    localStorage.clear();
    localStorage.setItem('9zone-v10-run', s);
    localStorage.setItem('9zone-hint-chase', 'done');
  }, JSON.stringify(battleSave()));
  await p.reload();
  await p.getByRole('button', { name: '이어하기', exact: true }).click();
  await p.waitForTimeout(1000);

  console.log('--- 2. Battle Portrait Elements ---');
  console.log('Top HUD:', await getStyles(p, '.bp-bar'));
  console.log('Pitcher Tag:', await getStyles(p, '.bp-ptag'));
  console.log('HP Gauge:', await getStyles(p, '.bp-hp-gauge-container'));
  console.log('Coach Balloon:', await getStyles(p, '.bp-coach-bubble'));
  console.log('Card Basic:', await getStyles(p, '.bp-card.basic'));
  console.log('Action Swing Btn:', await getStyles(p, '.bp-verb.go'));
  console.log('Action Wait Btn:', await getStyles(p, '.bp-verb.wait'));
  await p.close();
}

// 3. Map DOM
{
  const p = await browser.newPage({ viewport: { width: 611, height: 358 } });
  await p.goto(URL_ + '/?qa=1');
  await p.evaluate(s => {
    localStorage.clear();
    localStorage.setItem('9zone-v10-run', s);
    localStorage.setItem('9zone-hint-chase', 'done');
  }, JSON.stringify(createV10Duel(1)));
  await p.reload();
  await p.getByRole('button', { name: '이어하기', exact: true }).click();
  await p.waitForTimeout(1000);

  console.log('--- 3. Map Elements ---');
  console.log('Map Container:', await getStyles(p, '.bp-map'));
  console.log('Map Sheet:', await getStyles(p, '.bp-msheet'));
  console.log('Map Enter Button:', await getStyles(p, '.bp-menter'));
  await p.close();
}

// 4. Reward DOM
{
  const p = await browser.newPage({ viewport: { width: 612, height: 303 } });
  await p.goto(URL_ + '/?qa=1');
  await p.evaluate(s => {
    localStorage.clear();
    localStorage.setItem('9zone-v10-run', s);
    localStorage.setItem('9zone-hint-chase', 'done');
  }, JSON.stringify(rewardSave()));
  await p.reload();
  await p.getByRole('button', { name: '이어하기', exact: true }).click();
  await p.waitForTimeout(1000);

  console.log('--- 4. Reward Elements ---');
  console.log('Reward Stop:', await getStyles(p, '.bp-stop'));
  console.log('Reward Head:', await getStyles(p, '.bp-shead'));
  console.log('Reward Card:', await getStyles(p, '.bp-stop-card'));
  console.log('Skip Button:', await getStyles(p, '.bp-sskip'));
  await p.close();
}

await browser.close();
