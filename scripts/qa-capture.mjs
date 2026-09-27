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
  await p.getByRole('button', { name: 'MAIN RUN 이어하기', exact: true }).click();
  await p.waitForTimeout(1500);

  const shotPath = path.join(OUT, 'phone-portrait-battle-decide.png');
  await p.screenshot({ path: shotPath });
  console.log('Saved screenshot to:', shotPath);

  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
