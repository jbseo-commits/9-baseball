// Title menu fits the shipped landscape viewports without page scroll.
// Usage: PLAYWRIGHT_MODULE=<playwright index> BASE_URL=http://127.0.0.1:4173/ node scripts/qa-title-fit.mjs
// QA_REPORT_ONLY=1 records failures without throwing (baseline capture).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out=process.env.QA_OUT||'/tmp/qa-title-fit',base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const reportOnly=process.env.QA_REPORT_ONLY==='1',failures=[],report=[];
const check=(ok,message)=>{if(ok)return;if(reportOnly)failures.push(message);else assert.fail(message);};
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
  for(const [width,height] of [[568,320],[667,375],[844,390],[932,430],[1280,720],[1440,900]]){
    const tag=`${width}x${height}`;
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});
    await page.goto(base);await page.locator('.ts-item').first().waitFor();await page.waitForTimeout(1300);
    const m=await page.evaluate(()=>({
      page:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},
      brand:document.querySelector('.ts-brand').getBoundingClientRect().toJSON(),
      items:[...document.querySelectorAll('.ts-item')].map(e=>{const r=e.getBoundingClientRect();return {label:e.querySelector('b')?.textContent,top:r.top,bottom:r.bottom,height:r.height,hit:e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};}),
    }));
    check(m.page.h<=height&&m.page.w<=width,`${tag}: the title does not scroll (document ${m.page.w}x${m.page.h})`);
    check(m.items.length===5,`${tag}: five menu items`);
    for(const item of m.items){
      check(item.top>=m.brand.bottom-1&&item.bottom<=height+1,`${tag}: "${item.label}" sits below the wordmark and inside the viewport`);
      check(item.height>=44,`${tag}: "${item.label}" keeps a 44px touch height (got ${Math.round(item.height)})`);
      check(item.hit,`${tag}: "${item.label}" is hit-testable`);
    }
    await page.screenshot({path:path.join(out,`title-${tag}.png`),animations:'disabled'});
    report.push({size:[width,height],...m});await page.close();
  }
}finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2));}
if(reportOnly)console.log(failures.length?`BASELINE ${failures.length} failures:\n`+failures.join('\n'):'BASELINE clean');
else console.log('PASS title: six sizes, no page scroll, five reachable 44px items');
