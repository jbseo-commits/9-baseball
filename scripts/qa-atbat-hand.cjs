/* Real-browser QA for the opt-in at-bat hand. NODE_PATH supplies Playwright.
   QA_BASE can target the deployed preview; no production save is written. */
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const motion=JSON.parse(fs.readFileSync('assets/production-art/landscape-cinema/motion.json'));
const base=process.env.QA_BASE||'http://127.0.0.1:5225/';
const out=process.env.QA_OUT||'docs/qa/atbat-hand';fs.mkdirSync(out,{recursive:true});
const sizes=[[667,375],[740,360],[844,390],[1024,768],[1440,900],[1920,1080]];
const settle=async p=>{await p.locator('.bv-actor-batter img').evaluate(x=>x.decode());await p.locator('.bv-actor-pitcher img').evaluate(x=>x.decode());await p.waitForTimeout(450)};
const start=async(p,fixture)=>{await p.goto(base+'?battleUi=vnext&battleFixture='+fixture+(process.env.QA_VERSION?'&v='+process.env.QA_VERSION:''));await settle(p)};
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const reports=[];
for(const [w,h] of sizes){
 const p=await browser.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:w<1100});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await start(p,'swing-main');await p.evaluate(()=>localStorage.setItem('9zone-v10-run','atbat-sentinel'));
 assert.equal(await p.locator('.bv-hand-more.left').count(),0,'no false upward hidden card at scrollTop0');
 const geometry=await p.evaluate(motion=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};const q=s=>r(document.querySelector(s));
 const actors={};for(const name of ['batter','pitcher']){const e=document.querySelector('.bv-actor-'+name),b=r(e),m=motion[name],f=m.frames.find(f=>f.name===e.dataset.pose),[l,t,rr,bb]=f.alphaBounds;actors[name]={x:b.x+l/m.sourceWidth*b.w,y:b.y+t/m.sourceHeight*b.h,right:b.x+rr/m.sourceWidth*b.w,bottom:b.y+bb/m.sourceHeight*b.h,pose:e.dataset.pose}}
 return {width:document.documentElement.scrollWidth,stage:q('.bv-stage'),rail:q('.bv-command-rail'),zone:q('.bv-zone'),action:q('.bv-action'),energy:q('.bv-energy'),head:q('.bv-hand-head'),row:q('.bv-hand-row'),cells:[...document.querySelectorAll('.bv-cell')].map(r),actors,opponent:q('.bv-hud-opponent'),score:q('.bv-hud-bar')};},motion);
 assert.ok(geometry.width<=w+1);assert.ok(geometry.zone.right<geometry.rail.x,'zone stays on field');
 assert.ok(geometry.action.bottom<=h+1&&geometry.action.h>=44);assert.ok(geometry.cells.every(c=>c.w>=44&&c.h>=44));
 assert.ok(geometry.energy.bottom<=geometry.row.y+1,'energy stays above hand');
 for(const [name,a]of Object.entries(geometry.actors)){assert.ok(a.x>=-1&&a.y>=-1&&a.right<=w+1&&a.bottom<=h+1,name+' visible');assert.ok(a.right<geometry.rail.x+1,name+' not under hand')}
 assert.ok(geometry.actors.pitcher.bottom+8<=geometry.zone.y,'pitcher clear of zone');
 const overlap=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
 assert.ok(!overlap(geometry.actors.pitcher,geometry.opponent),'HP does not cover pitcher');assert.ok(!overlap(geometry.actors.pitcher,geometry.score),'score does not cover pitcher');
 const strike=p.locator('.bv-card[data-card-kind=strike]').first();await strike.tap();assert.equal(await p.locator('.bv-card.is-main').count(),1);assert.equal(await p.locator('.bv-card.is-support').count(),0);
 await p.locator('.bv-cell[data-zone="2"]').tap();assert.equal(await p.locator('.bv-cell.is-aim').getAttribute('data-zone'),'2');
 await strike.tap();assert.equal(await p.locator('.bv-card.is-armed').count(),0);
 assert.ok((await p.getByTestId('bp-swing').textContent()).includes('밀어치기'));
 await p.screenshot({path:`${out}/selected-${w}.jpg`,quality:88});
 const row=p.getByTestId('bv-hand');await row.evaluate(e=>e.scrollTop=100);const y=await row.evaluate(e=>e.scrollTop);
 await p.getByRole('button',{name:'경기 정보 및 메뉴'}).tap();await p.getByTestId('bp-inspect-back').tap();
 assert.ok(Math.abs(await row.evaluate(e=>e.scrollTop)-y)<2,'inspector restores vertical scroll');
 const selected=await p.locator('.bv-card.is-main').getAttribute('data-card-kind');
 await row.evaluate(e=>{const c=e.querySelector('.bv-card');c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:42,clientX:20,clientY:180}));c.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:42,clientX:20,clientY:110}));c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:42}));c.click()});
 assert.equal(await p.locator('.bv-card.is-main').getAttribute('data-card-kind'),selected,'scroll release cannot choose');
 // Actual pitch: precise read at2, actual damage/HP, no production save changes.
 await p.getByTestId('bp-swing').tap();await p.waitForSelector('.bv-result-line');
 assert.ok((await p.locator('.bv-result-line').textContent()).includes('노림'));
 assert.ok((await p.locator('.bv-hud-opponent').getAttribute('aria-label')).includes('48 / 60'));
 await p.screenshot({path:`${out}/result-${w}.jpg`,quality:88});
 assert.equal(await p.evaluate(()=>localStorage.getItem('9zone-v10-run')),'atbat-sentinel');
 // Mode is optional; selecting another card normally always replaces directly.
 await p.locator('select').selectOption('support-armed');await settle(p);await p.getByRole('button',{name:'카드 겹치기'}).tap();await p.getByRole('button',{name:'카드 겹치기'}).tap();await p.locator('.bv-card[data-card-kind=strike]').first().tap();await p.locator('.bv-cell[data-zone="6"]').tap();assert.equal(await p.locator('.bv-card.is-support').count(),1);
 // Shortage retains a readable cause while execute stays locked.
 await p.locator('select').selectOption('cost-short');await settle(p);assert.equal(await p.getByTestId('bp-swing').isDisabled(),true);assert.ok((await p.locator('.bv-plan-problem').textContent()).includes('에너지 부족'));
 assert.equal(errors.length,0);reports.push({w,h,geometry,verticalScrollRestore:true,swipeGuard:true,realHitHp48:true,support:true,shortage:true,saveIsolated:true,errors});await p.close();
}
// Actual browser fan timeline and no replay on re-tap/inspector.
const p=await browser.newPage({viewport:{width:1440,height:900}});await start(p,'watch-read0');
await p.clock.install({time:new Date('2030-01-01T00:00:00Z')});await p.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await p.getByRole('button',{name:'다시 시작'}).evaluate(e=>e.click());
await p.locator('.bv-card-slot').first().waitFor();
const cdp=await p.context().newCDPSession(p);const fan=[];
for(const t of [0,90,180,380]){await p.evaluate(t=>{for(const e of document.querySelectorAll('.bv-card-slot'))for(const a of e.getAnimations()){a.pause();a.currentTime=t}},t);const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88});fs.writeFileSync(`${out}/fan-${t}.jpg`,Buffer.from(shot.data,'base64'));fan.push({t,cards:await p.locator('.bv-card-slot').evaluateAll(es=>es.map(e=>({id:e.dataset.cardId,opacity:Number(getComputedStyle(e).opacity),transform:getComputedStyle(e).transform,delay:getComputedStyle(e).animationDelay})))})}
assert.ok(fan[1].cards.some(c=>c.opacity>.4&&c.opacity<1),'fan unfolds over time');assert.ok(fan[3].cards.every(c=>c.opacity===1),'fan finishes');
const card=p.locator('.bv-card[data-card-kind=strike]').first();await card.evaluate(e=>e.click());await p.clock.runFor(150);await card.evaluate(e=>{window.__qaFanNode=e.closest('li');window.__qaFanAnimation=window.__qaFanNode.getAnimations().find(a=>a.animationName==='bv-fan-deal')});await card.evaluate(e=>e.click());assert.equal(await card.evaluate(e=>e.closest('li')===window.__qaFanNode&&e.closest('li').getAnimations().includes(window.__qaFanAnimation)),true,'same-card tap retains deal animation and DOM identity');
await p.close();
const reduced=await browser.newPage({viewport:{width:844,height:390},reducedMotion:'reduce'});await start(reduced,'swing-main');assert.equal(await reduced.locator('.bv-card-slot').first().evaluate(e=>getComputedStyle(e).animationName),'none');await reduced.close();
await browser.close();fs.writeFileSync(`${out}/browser.json`,JSON.stringify({base,version:process.env.QA_VERSION||null,viewports:reports,fan,reducedMotion:true},null,2));console.log('6 viewports: actual targeting/card/support/HP/scroll; staggered fan timeline and reduced motion passed');
})().catch(e=>{console.error(e);process.exit(1)});
