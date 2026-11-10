// Locker / training layout contract on the shipped (landscape) viewports.
// Usage: PLAYWRIGHT_MODULE=<playwright index> BASE_URL=http://127.0.0.1:4173/ node scripts/qa-facility-layout.mjs
// QA_REPORT_ONLY=1 records measurements without asserting (baseline capture).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {utilityQaState} from './lib/utility-qa-state.mjs';
import {completeV10UtilityNode,v10UtilityOptions} from '../src/duel/engine.js';

const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out=process.env.QA_OUT||'/tmp/qa-facility-layout',base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const reportOnly=process.env.QA_REPORT_ONLY==='1';
const failures=[],report=[];
const check=(ok,message)=>{if(ok)return;if(reportOnly)failures.push(message);else assert.fail(message);};
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
  for(const kind of ['locker','training']){
    const fixture=utilityQaState(kind,{claim:kind==='locker'});
    assert(v10UtilityOptions(fixture.state).length>0,`${kind}: fixture offers at least one card`);
    for(const [width,height] of [[568,320],[667,375],[844,390],[1280,720],[1440,900]]){
      const tag=`${kind} ${width}x${height}`;
      const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<1000});
      await page.addInitScript(s=>{localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},fixture.state);
      await page.goto(base+'?battleUi=vnext');
      await page.getByRole('button',{name:'이어하기',exact:true}).click();
      await page.locator('.stop-'+kind).waitFor();
      await page.waitForTimeout(400);
      const m=await page.evaluate(kind=>{
        const rect=e=>e?e.getBoundingClientRect().toJSON():null;
        const list=document.querySelector('.bp-offers');
        return {
          items:[...list.querySelectorAll(':scope>.bp-offer')].map(e=>({box:rect(e),name:rect(e.querySelector('.bp-offer-name'))})),
          list:{box:rect(list),scrollHeight:list.scrollHeight,clientHeight:list.clientHeight},
          footer:rect(document.querySelector('.stop-'+kind+'>.bp-verbs')),
          page:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},
        };
      },kind);
      check(m.items.length===v10UtilityOptions(fixture.state).length,`${tag}: every option is rendered`);
      m.items.forEach((item,i)=>{
        check(item.box.height>=64,`${tag}: offer ${i} keeps content height (got ${Math.round(item.box.height)}px)`);
        check(item.name&&item.name.top>=item.box.top-1&&item.name.bottom<=item.box.bottom+1,`${tag}: offer ${i} name stays inside its card`);
      });
      check(m.footer.top>=0&&m.footer.bottom<=height+1,`${tag}: confirm/skip stay in the viewport`);
      check(m.page.w<=width&&m.page.h<=height,`${tag}: the page itself does not scroll`);
      await page.screenshot({path:path.join(out,`${kind}-${width}x${height}.png`),animations:'disabled'});
      if(!reportOnly){
        const saved=await page.evaluate(()=>localStorage.getItem('9zone-v10-run'));
        const last=page.locator('.bp-offers>.bp-offer').last();
        await last.scrollIntoViewIfNeeded();
        const visible=await last.evaluate(e=>{const r=e.getBoundingClientRect(),l=e.parentElement.getBoundingClientRect();return r.top>=l.top-1&&r.bottom<=l.bottom+1;});
        assert(visible,`${tag}: the last offer scrolls fully into the list`);
        await last.click();await last.click();
        assert.equal(await page.evaluate(()=>localStorage.getItem('9zone-v10-run')),saved,`${tag}: selecting and scrolling do not spend the node`);
        await last.click();
        await page.getByTestId('bp-stop-go').click();
        await page.locator('.bp-map').waitFor();
        assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('9zone-v10-run'))),completeV10UtilityNode(fixture.state,v10UtilityOptions(fixture.state).at(-1)),`${tag}: confirming the last offer matches the engine`);
      }
      report.push({kind,size:[width,height],seed:fixture.seed,...m});
      await page.close();
    }
  }
}finally{
  await browser.close();
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2));
}
if(reportOnly)console.log(failures.length?'BASELINE failures:\n'+failures.join('\n'):'BASELINE clean');
else console.log('PASS locker/training: five sizes, readable cards, reachable footer, exact engine result');
