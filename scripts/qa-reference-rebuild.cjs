/* Run against Vite, the production Pages base or the published branch preview.
   Requires Playwright + Chromium; no engine/save state is injected. */
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:5229/';
const out=process.env.QA_OUT||'/tmp/9zone-reference-rebuild';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const reports=[];
 for(const [w,h] of [[1672,941],[844,390]]){
  const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<1000,recordVideo:{dir:out,size:{width:w,height:h}}});
  const p=await context.newPage(),errors=[],bad=[],resources=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(/\.(avif|webp|woff2|css)(\?|$)/.test(r.url())){resources.push({url:r.url(),status:r.status()});if(r.status()>=400)bad.push(r.url());}});
  await p.goto(base+'?battleUi=vnext&battleFixture=reference-boss&battlePresentation=clean&v='+(process.env.QA_VERSION||'local'));
  await p.locator('.bv-actor-batter img').first().waitFor();await p.locator('.bv-actor img,.bv-stadium').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  assert.equal(await p.locator('.bv-stadium').evaluate(e=>e.naturalWidth),1338);
  assert.equal(await p.locator('.bv-actor-batter img').count(),2,'ready overlay keeps decoded atlas mounted');
  assert.ok((await p.locator('.bv-hud-opponent').getAttribute('aria-label')).includes('78 / 112'));
  await p.screenshot({path:`${out}/folded-${w}.jpg`,quality:90});
  await p.getByRole('button',{name:'손패 펼치기',exact:true}).tap();await p.waitForTimeout(600);
  await p.screenshot({path:`${out}/expanded-${w}.jpg`,quality:90});
  const mapped=await p.locator('.bv-card-art[data-art=set]').evaluateAll(async es=>{await Promise.all(es.map(e=>{const image=new Image();image.src=getComputedStyle(e).backgroundImage.slice(5,-2);return image.decode();}));return es.length;});
  assert.ok(mapped>=5,'all five actual hand cards have loaded new illustrations');
  await p.locator('.bv-card[data-card-kind=strike]').first().tap();
  const captureTime=Date.now();await p.clock.install({time:captureTime});await p.clock.pauseAt(captureTime+50);
  await p.locator('.bv-cell[data-zone="2"]').tap();
  assert.deepEqual(await p.locator('[data-insert-zone]').evaluateAll(es=>es.map(e=>+e.dataset.insertZone)),[2,5,8]);
  await p.locator('.bv-insert-fx').evaluate(e=>{for(const el of e.querySelectorAll('*'))for(const a of el.getAnimations()){a.pause();a.currentTime=370;}});
  await p.screenshot({path:`${out}/insert-${w}.jpg`,quality:90});
  await p.clock.resume();await p.getByTestId('bp-swing').tap();await p.waitForSelector('.bv-result-line');
  const hp=await p.locator('.bv-hud-opponent').getAttribute('aria-label');assert.ok(!hp.includes('78 / 112'),'real engine pitch resolved');
  await p.screenshot({path:`${out}/result-${w}.jpg`,quality:90});
  await p.waitForTimeout(700);assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  assert.ok(resources.some(r=>r.url.endsWith('.woff2')),'production font loaded');
  assert.ok(resources.some(r=>r.url.endsWith('.avif')),'new field and actor assets loaded');
  reports.push({w,h,hp,errors,bad,resources});const video=p.video();await context.close();await video.saveAs(`${out}/interaction-${w}.webm`);
 }
 await browser.close();fs.writeFileSync(`${out}/assets-browser.json`,JSON.stringify({base,reports},null,2));console.log('reference composition, live cost/HP, new asset/font requests, fold/fan/insert/pitch captured at 1672 and 844');
})().catch(e=>{console.error(e);process.exit(1)});
