/* Browser evidence for right-fold -> fan -> authored coverage -> actual pitch.
   QA_BASE may point to deployed Pages. Runs in isolated fixture storage. */
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:5227/';
const out=process.env.QA_OUT||'/tmp/9zone-folded-hand';fs.mkdirSync(out,{recursive:true});
const sizes=[[667,375],[740,360],[844,390],[1024,768],[1440,900],[1920,1080]];
const open=async p=>{const h=p.getByRole('button',{name:'손패 펼치기',exact:true});if(await h.count())await h.tap();await p.waitForFunction(()=>document.querySelector('.battle-vnext').dataset.handOpen==='true');await p.waitForTimeout(400);};
const start=async(p,id)=>{await p.goto(base+'?battleUi=vnext&battleFixture='+id+(process.env.QA_VERSION?'&v='+process.env.QA_VERSION:''));await p.locator('.bv-actor-batter img').evaluate(e=>e.decode());await p.locator('.bv-actor-pitcher img').evaluate(e=>e.decode());await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);};
const box=async(p,s)=>p.locator(s).first().boundingBox();
const same=(a,b)=>['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<1);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const reports=[];
 for(const [w,h]of sizes){
  const p=await browser.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:w<1100});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await start(p,'watch-read0');await p.evaluate(()=>localStorage.setItem('9zone-v10-run','folded-sentinel'));
  assert.equal(await p.locator('.battle-vnext').getAttribute('data-hand-open'),'false');
  assert.equal(await p.locator('.bv-hand-area').getAttribute('inert'),'');
  const field=await box(p,'.bv-stage'),zone=await box(p,'.bv-zone');
  assert.ok(await p.locator('.bv-cell').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})));
  await p.screenshot({path:`${out}/folded-${w}.jpg`,quality:88});
  await open(p);assert.ok(same(zone,await box(p,'.bv-zone')),'zone does not move');assert.ok(same(field,await box(p,'.bv-stage')),'camera does not resize');
  const row=await box(p,'.bv-hand-row');assert.ok(row.x>=zone.x+zone.width-1,'expanded cards stay right of zone');
  assert.ok((await box(p,'.bv-energy')).y<row.y,'energy directly above cards');
  if(await p.locator('.bv-refined').count()){
    assert.ok(await p.locator('.bv-card-strip').evaluateAll(es=>es.every(e=>{const a=e.querySelector('.bv-card-art'),cost=e.querySelector('.bv-card-cost'),copy=e.querySelector('.bv-card-copy'),range=e.querySelector('.bv-card-range');return cost.offsetLeft>=a.offsetLeft+a.offsetWidth&&range.offsetLeft>=copy.offsetLeft+copy.offsetWidth-1;})),'cost and range do not overlap the illustration/copy');
    const action=await box(p,'.bv-action');assert.ok(Math.abs(action.width-action.height)<1,'the primary action is circular');
  }
  await p.screenshot({path:`${out}/expanded-${w}.jpg`,quality:88});
  const strike=p.locator('.bv-card[data-card-kind=strike]').first();await strike.tap();await p.locator('.bv-cell[data-zone="2"]').tap();
  assert.equal(await p.locator('.battle-vnext').getAttribute('data-hand-open'),'false');
  assert.deepEqual(await p.locator('[data-insert-zone]').evaluateAll(es=>es.map(e=>Number(e.dataset.insertZone))),[2,5,8]);
  const overlay=await box(p,'.bv-insert-fx'),root=await box(p,'.battle-vnext');assert.ok(same(overlay,root),'insert overlay uses field coordinate space');
  // Pin actual CSS timelines to the lock beat for a repeatable capture.
  await p.locator('.bv-insert-fx').evaluate(e=>{for(const el of e.querySelectorAll('*'))for(const a of el.getAnimations()){a.pause();a.currentTime=370}});
  await p.screenshot({path:`${out}/insert-${w}.jpg`,quality:88});
  assert.equal(await p.locator('.bv-scene').getAttribute('data-play-token'),'0','placing does not throw');
  await p.getByTestId('bp-swing').tap();await p.waitForSelector('.bv-result-line');
  assert.ok((await p.locator('.bv-hud-opponent').getAttribute('aria-label')).includes('48 / 60'),'real damage');
  assert.ok((await p.locator('.bv-result-line').textContent()).includes('노림'));
  assert.equal(await p.locator('.bv-insert-fx').count(),0,'placement cancels at pitch');
  await p.screenshot({path:`${out}/result-${w}.jpg`,quality:88});
  assert.equal(await p.evaluate(()=>localStorage.getItem('9zone-v10-run')),'folded-sentinel');
  // Real touch drag (not synthetic DOM pointer calls), using Chromium input.
  await start(p,'watch-read0');await open(p);const c=await box(p,'.bv-card[data-card-kind=strike]'),z=await box(p,'.bv-cell[data-zone="8"]');
  const from={x:c.x+c.width*.55,y:c.y+c.height*.5},to={x:z.x+z.width*.5,y:z.y+z.height*.5},cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]});await p.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(80);
  assert.equal(await p.locator('.bv-cell.is-aim').getAttribute('data-zone'),'8','touch drag places aim');
  assert.equal(await p.locator('.bv-card.is-main').getAttribute('data-card-kind'),'strike','touch drag selects once');
  assert.equal(await p.locator('.bv-scene').getAttribute('data-play-token'),'0');
  await p.waitForFunction(()=>document.querySelector('.battle-vnext').dataset.handOpen==='false');
  await open(p);await p.getByTestId('bv-basic-chip').tap();assert.equal(await p.getByTestId('bv-basic-chip').getAttribute('aria-pressed'),'true','first header tap after drag is not swallowed');
  // Support uses its own target; scroll never becomes a selection.
  await start(p,'support-armed');await open(p);await p.locator('.bv-cell[data-zone="6"]').tap();
  assert.equal(await p.locator('.bv-card.is-support').count(),1);
  const support=await p.locator('.bv-cell.is-support').evaluateAll(es=>es.map(e=>Number(e.dataset.zone)));
  assert.deepEqual(await p.locator('[data-insert-zone]').evaluateAll(es=>es.map(e=>Number(e.dataset.insertZone))),support);
  await open(p);const hand=p.getByTestId('bv-hand');await hand.evaluate(e=>e.scrollTop=100);const scroll=await hand.evaluate(e=>e.scrollTop);
  await p.getByRole('button',{name:'경기 정보 및 메뉴'}).tap();await p.getByTestId('bp-inspect-back').tap();assert.ok(Math.abs(await hand.evaluate(e=>e.scrollTop)-scroll)<2);
  const selected=await p.locator('.bv-card.is-main').getAttribute('data-card-kind');
  const swipe=await hand.evaluate(e=>{const r=e.getBoundingClientRect();for(const card of e.querySelectorAll('.bv-card')){const c=card.getBoundingClientRect(),top=Math.max(c.top,r.top),bottom=Math.min(c.bottom,r.bottom);if(bottom-top>30)return{x:c.left+c.width*.55,y:(top+bottom)/2};}return null;});
  assert.ok(swipe,'visible card available for a real vertical touch swipe');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[swipe]});
  for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:swipe.x,y:swipe.y-i*7}]});await p.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(80);
  assert.equal(await p.locator('.bv-card.is-main').getAttribute('data-card-kind'),selected);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),w);
  assert.deepEqual(errors,[]);reports.push({w,h,fixedCamera:true,centralZone:true,touchDrag:true,realHp48:true,supportOwnAim:true,saveIsolated:true,scrollRestored:true,errors});console.log('passed',w,h);await p.close();
 }
 const reduced=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'});await start(reduced,'watch-read0');await open(reduced);await reduced.locator('.bv-card[data-card-kind=strike]').first().tap();await reduced.locator('.bv-cell[data-zone="2"]').tap();
 assert.equal(await reduced.locator('.bv-insert-block').first().evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.equal(await reduced.locator('.bv-hand-area').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 await reduced.setViewportSize({width:390,height:844});await reduced.waitForTimeout(150);assert.equal(await reduced.locator('.bv-hand-area').getAttribute('aria-hidden'),'false');assert.equal(await reduced.locator('.bv-hand-area').getAttribute('inert'),null);await reduced.close();
 await browser.close();fs.writeFileSync(`${out}/browser.json`,JSON.stringify({base,viewports:reports,reducedMotion:true,rotation:true},null,2));console.log('6 viewports: fold/fan/fixed field/insert/touch drag/real HP/support/scroll/save + reduced-motion and rotation passed');
})().catch(e=>{console.error(e);process.exit(1)});
