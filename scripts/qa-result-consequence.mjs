// After a landed swing the HP consequence must be readable without scrolling the result panel.
// Usage: PLAYWRIGHT_MODULE=<playwright index> BASE_URL=http://127.0.0.1:4173/ node scripts/qa-result-consequence.mjs
// QA_REPORT_ONLY=1 records failures without throwing (baseline capture).
// Fixtures are engine-generated saves and the aim reads the pending pitch: layout evidence, not a play policy.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as E from '../src/duel/engine.js';

const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out=process.env.QA_OUT||'/tmp/qa-result-consequence',base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const reportOnly=process.env.QA_REPORT_ONLY==='1',failures=[],report=[];
const check=(ok,message)=>{if(ok)return;if(reportOnly)failures.push(message);else assert.fail(message);};
const fixtures=[];
for(let seed=1;seed<80&&fixtures.length<4;seed++){
  const s=E.enterV10Node(E.createV10Duel(seed),'a1-entry'),zone=s.battle?.pending?.zone;
  if(s.phase==='battle'&&Number.isInteger(zone)&&zone<9)fixtures.push({seed,state:s,zone});
}
assert(fixtures.length>0,'at least one in-zone first pitch fixture');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
  for(const [width,height] of [[568,320],[667,375],[844,390],[1280,720],[1440,900]]){
    for(const [index,fixture] of fixtures.entries()){
      const tag=`${width}x${height} seed ${fixture.seed}`;
      const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<1000});
      await page.addInitScript(s=>{localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},fixture.state);
      await page.goto(base);
      await page.getByRole('button',{name:'이어하기',exact:true}).click();
      await page.locator('.bv-cell').first().waitFor();
      await page.waitForTimeout(1800);
      const handle=page.locator('.bv-hand-handle');
      if(await handle.isVisible().catch(()=>false)&&/펼치기/.test(await handle.innerText()))await handle.click();
      await page.waitForTimeout(500);
      const cards=page.locator('.bv-card');
      for(let i=0;i<await cards.count();i++){if(/준비/.test(await cards.nth(i).innerText()))continue;await cards.nth(i).click().catch(()=>{});break;}
      await page.waitForTimeout(350);
      await page.locator('.bv-cell').nth(fixture.zone).click({force:true});
      await page.waitForTimeout(350);
      await page.locator('.bv-action').filter({hasText:/타격|스윙/}).first().click();
      const line=page.getByTestId('bv-result-line');
      await line.waitFor({timeout:8000});
      await page.waitForTimeout(700);
      const m=await line.evaluate(e=>{
        const rect=x=>x?x.getBoundingClientRect().toJSON():null,plan=e.closest('.bv-plan'),em=e.querySelector('em'),b=e.querySelector('b');
        const p=rect(plan),r=rect(em);
        return {plan:p,heading:rect(b),consequence:r,text:em?.textContent||'',planScroll:{top:plan.scrollTop,scrollHeight:plan.scrollHeight,clientHeight:plan.clientHeight},
          visible:!!r&&r.top>=p.top-1&&r.bottom<=p.bottom+1&&r.top>=0&&r.bottom<=innerHeight+1,
          hit:!!em&&(()=>{const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!t&&(em.contains(t)||e.contains(t));})()};
      });
      check(/HP/.test(m.text),`${tag}: a landed swing reports its HP consequence (got "${m.text}")`);
      check(m.planScroll.top===0,`${tag}: the result panel starts unscrolled`);
      check(m.visible,`${tag}: the HP consequence is fully inside the result panel without scrolling`);
      check(m.hit,`${tag}: nothing covers the HP consequence`);
      if(index===0)await page.screenshot({path:path.join(out,`result-${width}x${height}.png`),animations:'disabled'});
      report.push({size:[width,height],seed:fixture.seed,...m});
      await page.close();
    }
  }
}finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2));}
if(reportOnly)console.log(failures.length?`BASELINE ${failures.length} failures:\n`+failures.join('\n'):'BASELINE clean');
else console.log(`PASS result: five sizes x ${fixtures.length} landed swings, HP consequence readable without scrolling`);
