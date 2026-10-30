/* Start Vite at5222. QA_BASE/QA_OUT/QA_SCRIPT support deployed verification. */
const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const base=process.env.QA_BASE||'http://127.0.0.1:5222/',out=process.env.QA_OUT||'docs/qa/battle-comparison';fs.mkdirSync(out,{recursive:true});const reports=[];
for(const [w,h]of [[667,375],[844,390],[1024,768],[1440,900],[1920,1080],[390,844]]){
 const p=await b.newPage({viewport:{width:w,height:h},hasTouch:w<1200,isMobile:w<1200});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'?battleUi=vnext&battleCompare=1');if(process.env.QA_SCRIPT)assert.equal(await p.locator('script[type=module]').getAttribute('src'),process.env.QA_SCRIPT);
 await p.evaluate(()=>localStorage.setItem('9zone-v10-run','comparison-sentinel'));
 const a=p.frameLocator('iframe[title="기존 전투 UI"]'),n=p.frameLocator('iframe[title="가로 개선 UI"]');await n.locator('.bv-cell:not(:disabled)').first().waitFor();await a.locator('.bp-battle').waitFor({state:'attached'});
 const aframe=p.frames().find(f=>f.url().includes('battleCompareChild=legacy')),nframe=p.frames().find(f=>f.url().includes('battleCompareChild=vnext'));
 const state=await p.locator('.battle-comparison').getAttribute('data-layout');if(state==='paired')await p.getByRole('button',{name:'한 화면씩 보기'}).click();
 await n.locator('.bv-cell[data-zone="8"]').click();await n.locator('.bv-card[data-card-kind=place]').click();const id=await n.locator('.bv-card.is-main').getAttribute('data-card-kind');
 await p.getByRole('tab',{name:'A · 기존'}).click();await a.locator('.bp-cell:not(:disabled)').first().waitFor();await a.locator('.bp-card[data-card-kind=place]').click();
 await p.getByRole('tab',{name:'B · 개선'}).click();assert.equal(p.frames().find(f=>f.url().includes('battleCompareChild=legacy')),aframe);assert.equal(p.frames().find(f=>f.url().includes('battleCompareChild=vnext')),nframe);assert.equal(await n.locator('.bv-card.is-main').getAttribute('data-card-kind'),id);assert.equal(await n.locator('.bv-cell.is-aim').getAttribute('data-zone'),'8');
 // Both restart controls remount only the child sessions, with the same engine fixtures.
 await p.getByRole('button',{name:'함께 다시 시작'}).click();await n.locator('.bv-cell:not(:disabled)').first().waitFor();assert.equal(await n.locator('.bv-card.is-main').count(),0);assert.equal(await n.locator('[data-testid=bv-energy]').getAttribute('data-energy'),'2');
 await p.getByRole('tab',{name:'A · 기존'}).click();await a.locator('.bp-cell:not(:disabled)').first().waitFor();assert.equal(await a.locator('.bp-card.main').count(),0);assert.equal(await a.getByTestId('bp-energy').getAttribute('data-energy'),'2');
 await p.getByRole('tab',{name:'B · 개선'}).click();await p.locator('select[aria-label="비교 장면"]').selectOption('cinema-exact');await n.locator('.bv-result-line').waitFor();
 await p.getByRole('tab',{name:'A · 기존'}).click();await p.waitForTimeout(2500);assert.equal(await n.locator('.bv-scene').getAttribute('data-play-token'),'1');assert.equal(await n.locator('.bv-card').count(),4);
 await p.locator('select[aria-label="비교 장면"]').selectOption('watch-read0');await a.locator('.bp-cell:not(:disabled)').first().waitFor();await a.locator('.bp-pitcher .sprite-stage').waitFor();
 const visibleActor=await a.locator('.bp-batter .batter-sheet-frame').evaluate(e=>({image:getComputedStyle(e).backgroundImage,rect:e.getBoundingClientRect().toJSON()}));assert.ok(visibleActor.image.includes('url('));
 await p.getByRole('tab',{name:'B · 개선'}).click();if(w>=1200)await p.getByRole('button',{name:'나란히 보기'}).click();await n.locator('.bv-actor-batter img').evaluate(e=>e.decode());await p.waitForTimeout(120);
 const layout=await p.evaluate(()=>({mode:document.querySelector('.battle-comparison').dataset.layout,width:document.documentElement.scrollWidth,viewport:innerWidth,rotate:getComputedStyle(document.body,'::after').content,frames:[...document.querySelectorAll('iframe')].map(e=>({title:e.title,tabIndex:e.tabIndex,hidden:e.closest('section').getAttribute('aria-hidden'),rect:e.getBoundingClientRect().toJSON()}))}));assert.ok(layout.width<=w+1);assert.equal(layout.rotate,'none');assert.equal(await p.evaluate(()=>localStorage.getItem('9zone-v10-run')),'comparison-sentinel');assert.equal(errors.length,0);
 await p.screenshot({path:`${out}/comparison-${w}.jpg`,quality:85});reports.push({w,h,layout,selectionPreserved:true,resetBoth:true,hiddenNoAdvance:true,legacyActor:visibleActor,saveSentinel:true,errors});await p.close();
}
await b.close();fs.writeFileSync(`${out}/browser.json`,JSON.stringify(reports,null,2));console.log(reports.length+' viewport comparison flows passed');})().catch(e=>{console.error(e);process.exit(1)});
