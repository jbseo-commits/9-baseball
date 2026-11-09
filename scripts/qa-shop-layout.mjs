import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {utilityQaState} from './lib/utility-qa-state.mjs';
import {completeV10UtilityNode,v10UtilityOptions} from '../src/duel/engine.js';

const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out=process.env.QA_OUT||'/tmp/qa-shop-layout',base=process.env.BASE_URL||'http://127.0.0.1:5350/';
await fs.mkdir(out,{recursive:true});
const fixture=utilityQaState('shop'),report=[];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
try{
  for(const [width,height] of [[568,320],[667,375],[844,390],[1280,720],[1440,900]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<1000});
    await page.addInitScript(s=>{localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},fixture.state);
    await page.goto(base+'?battleUi=vnext');await page.getByRole('button',{name:'이어하기',exact:true}).click();await page.locator('.stop-shop').waitFor();
    const dimensions=await page.evaluate(()=>{
      const rect=e=>e.getBoundingClientRect().toJSON();
      return {items:[...document.querySelectorAll('.bp-offers>.bp-offer')].map(e=>({box:rect(e),name:rect(e.querySelector('.bp-offer-name')),description:rect(e.querySelector('.bp-offer-desc')),mark:e.querySelector('.bp-mark')?getComputedStyle(e.querySelector('.bp-mark')).display:null,art:!!e.querySelector('.bp-relic-ico')})),footer:rect(document.querySelector('.stop-shop>.bp-verbs')),page:[scrollX,scrollY]};
    });
    for(const item of dimensions.items){
      assert(item.box.height>=64,'offers retain content height');
      for(const text of [item.name,item.description])assert(text.top>=item.box.top-1&&text.bottom<=item.box.bottom+1,'name/effect stay inside their offer');
      if(item.art)assert.equal(item.mark,'none','art equipment has no duplicate fallback medal');
    }
    assert(dimensions.footer.top>=0&&dimensions.footer.bottom<=height+1,'confirm/skip remain in viewport');
    const saved=await page.evaluate(()=>localStorage.getItem('9zone-v10-run'));
    await page.locator('.bp-offers>.bp-offer').last().click();
    await page.locator('.bp-offers>.bp-offer').last().click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('9zone-v10-run')),saved,'selection and scrolling do not spend the node');
    await page.locator('.bp-offers>.bp-offer').last().click();
    await page.getByTestId('bp-stop-go').click();
    await page.locator('.bp-map').waitFor();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('9zone-v10-run'))),completeV10UtilityNode(fixture.state,v10UtilityOptions(fixture.state).at(-1)),'actual last-item acquisition matches the engine');
    report.push({size:[width,height],dimensions});await page.close();
  }
}finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify({fixture:{seed:fixture.seed,path:fixture.path,method:fixture.method},report},null,2));}
console.log('PASS shop: five sizes, readable rows, one equipment art, reachable footer, exact engine acquisition');
