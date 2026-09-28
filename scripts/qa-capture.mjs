import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const playwright = require('C:/Users/정현아/AppData/Local/Programs/Antigravity IDE/resources/app/node_modules/playwright');
const { chromium } = playwright;

import { createV10Duel, enterV10Node, setAimZone, playV10Action } from '../src/duel/engine.js';

const OUT = path.resolve('work/qa-v14-inplay');
fs.mkdirSync(OUT, { recursive: true });

function battleSave() {
  let s = createV10Duel(1);
  s = enterV10Node(s, 'a1-entry');
  s.battle.pending = { zone: 4, roll: 0.5, powerRoll: 0.9 };
  return s;
}

async function capture() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });

  const p = await browser.newPage({ viewport: { width: 412, height: 743 } });
  await p.goto('http://localhost:5174/?qa=1');
  await p.evaluate(s => {
    localStorage.clear();
    localStorage.setItem('9zone-v10-run', s);
    localStorage.setItem('9zone-hint-chase', 'done');
  }, JSON.stringify(battleSave()));

  await p.reload();
  await p.getByRole('button', { name: '이어하기', exact: true }).click();
  await p.waitForTimeout(1500);

  const shotDecide = path.join(OUT, 'phone-portrait-battle-decide.png');
  await p.screenshot({ path: shotDecide });
  console.log('Saved screenshot to:', shotDecide);

  // Arm card 2 (정타 노림)
  const card2 = p.locator('.bp-card:not(.basic)').first();
  await card2.click();
  await p.waitForTimeout(600);
  const shotArmed = path.join(OUT, 'phone-portrait-battle-armed.png');
  await p.screenshot({ path: shotArmed });
  console.log('Saved screenshot to:', shotArmed);

  // Swing at the pitch and capture impact beat
  const swingBtn = p.getByTestId('bp-swing');
  await swingBtn.click();
  await p.waitForTimeout(380);
  const shotImpact = path.join(OUT, 'phone-portrait-battle-impact.png');
  await p.screenshot({ path: shotImpact });
  console.log('Saved screenshot to:', shotImpact);

  // Wait for result settle
  await p.waitForTimeout(2800);
  const shotResult = path.join(OUT, 'phone-portrait-battle-result.png');
  await p.screenshot({ path: shotResult });
  console.log('Saved screenshot to:', shotResult);

  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
