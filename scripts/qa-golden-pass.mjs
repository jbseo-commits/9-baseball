#!/usr/bin/env node
/* End-to-end playable test and screenshot capture for P1-13 Battle Portrait Golden Pass */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createV10Duel, enterV10Node } from '../src/duel/engine.js';
import { pitcherPhase } from '../src/duel/pitcher-hp.js';

const require = createRequire(import.meta.url);
const playwright = require('C:/Users/정현아/AppData/Local/Programs/Antigravity IDE/resources/app/node_modules/playwright');
const { chromium } = playwright;

const OUT = path.resolve('work/golden-pass');
fs.mkdirSync(OUT, { recursive: true });

function battleSave(hp = 60) {
  let s = createV10Duel(1);
  s = enterV10Node(s, 'a1-entry');
  s.pitcher = { ...s.pitcher, hp, phase: pitcherPhase(hp, s.pitcher.maxHp) };
  s.battle.pending = { zone: 4, roll: 0.5, powerRoll: 0.9 };
  return s;
}

async function runGoldenPass() {
  console.log('=== Starting P1-13 Battle Portrait Golden Pass End-to-End Test ===');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });

  const errors = [];

  const openPage = async (saveState) => {
    const p = await browser.newPage({ viewport: { width: 412, height: 743 } });
    p.on('pageerror', err => errors.push(err.message));
    p.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon')) errors.push(text);
      }
    });
    await p.goto('http://localhost:5174/?qa=1');
    await p.evaluate(s => {
      localStorage.clear();
      localStorage.setItem('9zone-v10-run', s);
      localStorage.setItem('9zone-hint-chase', 'done');
    }, JSON.stringify(saveState));
    await p.reload();
    await p.getByRole('button', { name: '이어하기', exact: true }).click();
    await p.waitForTimeout(1500);
    return p;
  };

  // Step 1: Normal In-Play Flow (HP 60)
  console.log('1. Loading standard in-play battle screen...');
  const p1 = await openPage(battleSave(60));

  const shot1 = path.join(OUT, '01-battle-decide.png');
  await p1.screenshot({ path: shot1 });
  console.log('Saved:', shot1);

  // Step 2: Select Card & Aim Zone
  console.log('2. Selecting card and aiming zone...');
  await p1.locator('.bp-card').first().click();
  await p1.locator('.bp-cell').nth(4).click();
  await p1.waitForTimeout(500);

  const shot2 = path.join(OUT, '02-battle-armed.png');
  await p1.screenshot({ path: shot2 });
  console.log('Saved:', shot2);

  // Step 3: Swing & Hit Impact
  console.log('3. Executing swing...');
  await p1.getByTestId('bp-swing').click();
  await p1.waitForTimeout(1100);

  const shot3 = path.join(OUT, '03-battle-impact.png');
  await p1.screenshot({ path: shot3 });
  console.log('Saved:', shot3);

  // Step 4: Settle & Verdict
  console.log('4. Waiting for verdict settlement...');
  await p1.waitForTimeout(2500);

  const shot4 = path.join(OUT, '04-battle-verdict.png');
  await p1.screenshot({ path: shot4 });
  console.log('Saved:', shot4);
  await p1.close();

  // Step 5: Knockout / Result Splash Test (HP 1 -> Knockout Splash)
  console.log('5. Testing Knockout Splash on Critical Pitcher...');
  const p2 = await openPage(battleSave(1));

  await p2.locator('.bp-card').first().click();
  await p2.locator('.bp-cell').nth(4).click();
  await p2.getByTestId('bp-swing').click();
  await p2.waitForTimeout(3500);

  const shot5 = path.join(OUT, '05-battle-knockout-splash.png');
  await p2.screenshot({ path: shot5 });
  console.log('Saved:', shot5);

  // Check if knockout splash overlay exists in DOM
  const hasSplash = await p2.evaluate(() => {
    const v = document.querySelector('.bp-verdict.splash');
    return v !== null && (v.classList.contains('knockout') || v.classList.contains('homer'));
  });
  console.log('Knockout splash overlay detected:', hasSplash);

  // Step 6: Next Button -> Reward Screen Transition
  console.log('6. Clicking proceed to transition to reward screen...');
  const nextBtn = p2.locator('.bp-next, [data-testid="bp-next"], .bp-next-btn');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await p2.waitForTimeout(2000);
  } else {
    // If screen click proceeds
    await p2.locator('.bp-verdict, .duel-app').click();
    await p2.waitForTimeout(2000);
  }

  const shot6 = path.join(OUT, '06-reward-screen.png');
  await p2.screenshot({ path: shot6 });
  console.log('Saved:', shot6);

  await p2.close();
  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    errors,
    knockoutSplashDetected: hasSplash,
    screenshots: [shot1, shot2, shot3, shot4, shot5, shot6],
    passed: errors.length === 0 && hasSplash
  };

  fs.writeFileSync(path.join(OUT, 'golden-pass-report.json'), JSON.stringify(report, null, 2));
  console.log('=== Golden Pass Playthrough Complete! Errors:', errors.length, 'Passed:', report.passed, '===');

  if (!report.passed) {
    process.exit(1);
  }
}

runGoldenPass().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
