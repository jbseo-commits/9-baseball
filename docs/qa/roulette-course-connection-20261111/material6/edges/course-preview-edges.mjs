/* External QA for the opt-in isolated course preview. Not a physical-device or
   production-storage test. Run only after the material-5 source is sealed. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {playV10Action,setAimZone} from '/workspace/9zone-juice100-implementation/src/duel/engine.js';

const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5397/';
const out='/workspace/9zone-roulette-connection-20261111/edge-material6';
const previewKey='9zone-playable-v1:9zone-v10-run',productionKey='9zone-v10-run';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const reports=[],pageErrors=[];
const readPreview=page=>page.evaluate(k=>JSON.parse(sessionStorage.getItem(k)),previewKey);
const readProd=page=>page.evaluate(k=>localStorage.getItem(k),productionKey);
const storeCalls=page=>page.evaluate(()=>window.__courseQaStorageCalls||[]);

async function openCase(name,{seed=3,reducedMotion='no-preference',routeMode=null}={}){
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion});
  const page=await context.newPage();
  page.on('pageerror',e=>pageErrors.push(`${name}: ${e.message}`));
  let releaseImage=null,assetRequested=null;
  const imageRequest=new Promise(resolve=>assetRequested=resolve);
  let routeStarted=false;
  if(routeMode==='abort')await context.route(/batter-course-4x4/,async route=>{routeStarted=true;assetRequested(route.request().url());await route.abort();});
  if(routeMode==='delay'){
    let release;const gate=new Promise(resolve=>release=resolve);releaseImage=release;
    await context.route(/batter-course-4x4/,async route=>{routeStarted=true;assetRequested(route.request().url());await gate;await route.continue();});
  }
  await page.clock.install({time:new Date('2026-11-10T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-10T00:00:01Z'));
  await page.addInitScript(({productionKey})=>{
    if(!sessionStorage.getItem('__course_qa_initialized')){
      sessionStorage.clear();localStorage.setItem(productionKey,'course-preview-production-sentinel');
      sessionStorage.setItem('__course_qa_initialized','1');
    }
    window.__courseQaStorageCalls=[];
    const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
    Storage.prototype.setItem=function(key,value){
      if(this===localStorage&&key===productionKey)window.__courseQaStorageCalls.push({storage:'local',op:'set',key});
      if(this===sessionStorage&&key.startsWith('9zone-playable-v1:'))window.__courseQaStorageCalls.push({storage:'session',op:'set',key});
      return set.call(this,key,value);
    };
    Storage.prototype.removeItem=function(key){
      if(this===localStorage&&key===productionKey)window.__courseQaStorageCalls.push({storage:'local',op:'remove',key});
      if(this===sessionStorage&&key.startsWith('9zone-playable-v1:'))window.__courseQaStorageCalls.push({storage:'session',op:'remove',key});
      return remove.call(this,key);
    };
  },{productionKey});
  await page.goto(`${base}?coursePreview=1&seed=${seed}&edgeQa=${encodeURIComponent(name)}`,
    {waitUntil:routeMode==='delay'?'domcontentloaded':'load'});
  await page.locator('.bv-playable-run .battle-vnext').waitFor();
  await page.getByTestId('bp-swing').waitFor();
  await page.locator('[data-actor="batter"] img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.equal(await readProd(page),'course-preview-production-sentinel',`${name}: production sentinel starts intact`);
  return {page,context,name,routeMode,releaseImage,imageRequest,routeRequested:()=>routeStarted};
}

function legalPlaceIds(state,count){
  const ids=state.battle.hand.filter(id=>state.deck.find(card=>card.id===id)?.kind==='place');
  assert.ok(ids.length>=count,`expected ${count} place cards, found ${ids.length}`);
  return ids.slice(0,count);
}
async function putCard(page,id,zone){
  const handle=page.getByRole('button',{name:'손패 펼치기',exact:true});
  if(await handle.count()&&await handle.isVisible())await handle.click();
  await page.locator(`.bv-card-slot[data-card-id="${id}"] [data-testid="bv-card"]`).click();
  await page.locator(`.bv-cell[data-zone="${zone}"]`).click();
}
async function planSnapshot(page){
  return page.locator('.bv-stack-board').evaluate(board=>({count:board.dataset.cardCount,overlaps:board.dataset.overlapCount,
    pieces:[...board.querySelectorAll('[data-board-card-id]')].map(card=>({id:card.dataset.boardCardId,aim:card.dataset.boardAim,order:card.dataset.boardOrder}))}));
}
async function commitCards(page,{count,afterTake=false}={}){
  if(afterTake){
    await page.getByTestId('bp-swing').click();
    let nextReady=false;
    for(let i=0;i<60;i++){
      await page.clock.runFor(100);
      const next=page.getByTestId('bp-next');
      if(await next.isVisible().catch(()=>false)&&await next.isEnabled().catch(()=>false)){nextReady=true;break;}
    }
    assert.ok(nextReady,'normal-motion take reaches its explicit next-pitch action');
    await page.getByTestId('bp-next').click();await page.clock.runFor(100);
    const after=await readPreview(page);
    assert.equal(after.phase,'battle','explicit next-pitch action opens the next real decision');
    assert.equal(after.battle.energy,3,'normal next pitch earns the existing third energy');
  }
  const before=await readPreview(page),ids=legalPlaceIds(before,count),zones=Array.from({length:count},(_,i)=>[4,5,2][i]);
  await putCard(page,ids[0],zones[0]);
  for(let i=1;i<count;i++){
    await page.getByRole('button',{name:'+ 카드 추가',exact:true}).click();
    await putCard(page,ids[i],zones[i]);
  }
  if(count===2&&!afterTake){
    const plan=await planSnapshot(page),writes=(await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length;
    await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);
    const portraitPlan=await planSnapshot(page);
    await page.setViewportSize({width:844,height:390});await page.clock.runFor(100);
    assert.deepEqual(portraitPlan,plan,'viewport rotation preserves the in-memory two-card plan');
    assert.deepEqual(await planSnapshot(page),plan,'return to landscape preserves the same plan');
    assert.equal((await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length,writes,'rotation does not persist or recommit the plan');
  }
  const action={type:'card',id:ids[0],supports:ids.slice(1).map((id,i)=>({id,aimZone:zones[i+1]}))};
  const expected=playV10Action(setAimZone(before,zones[0]),action);
  const writesBefore=(await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length;
  const actionView=await page.evaluate(()=>({phase:document.querySelector('.battle-vnext')?.dataset.phase,
    actions:[...document.querySelectorAll('[data-testid="bp-swing"]')].map(b=>({disabled:b.disabled,label:b.getAttribute('aria-label'),kind:b.dataset.actionKind})),
    board:(()=>{const b=document.querySelector('.bv-stack-board');return b?{count:b.dataset.cardCount,pieces:[...b.querySelectorAll('[data-board-card-id]')].map(x=>({id:x.dataset.boardCardId,aim:x.dataset.boardAim,order:x.dataset.boardOrder}))}:null})()}));
  console.log(`[${page.url()}] prepared ${count} cards`,actionView);
  await page.getByTestId('bp-swing').click();await page.clock.runFor(450);
  assert.deepEqual(await readPreview(page),before,`${count}-card stack resolve does not accept early`);
  assert.equal((await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length,writesBefore,
    `${count}-card stack resolve has no early persistence`);
  await page.clock.runFor(550);
  const actual=await readPreview(page);
  assert.deepEqual(actual,expected,`${count}-card accepted state matches engine`);
  const writesAfter=(await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length;
  assert.equal(writesAfter,writesBefore+1,`${count}-card commit is accepted exactly once`);
  assert.equal(await readProd(page),'course-preview-production-sentinel','preview leaves production sentinel intact');
  assert.equal((await storeCalls(page)).filter(x=>x.storage==='local'&&x.key===productionKey).length,0,'preview makes no production-key write');
  return {before,expected,ids,zones,action,writesAfter};
}
async function visibleCourseState(page){
  return page.evaluate(()=>{
    const scene=document.querySelector('.bv-scene'),actor=document.querySelector('[data-actor="batter"]');
    const r=actor?.getBoundingClientRect(),style=actor&&getComputedStyle(actor);
    const actorImages=actor?[...actor.querySelectorAll('img')]:[];
    const course=document.querySelector('[data-testid="bv-course-batter"]'),courseStyle=course&&getComputedStyle(course);
    return {stage:scene?.dataset.fxStage||null,token:scene?.dataset.playToken||null,preview:scene?.dataset.coursePreview||null,
      state:document.querySelector('.bv-course-state')?.textContent||null,
      actorVisible:!!actor&&style.visibility!=='hidden'&&r.width>0&&r.height>0,
      actorImageLoaded:actorImages.some(image=>image.complete&&image.naturalWidth>0),
      courseVisible:!!course&&courseStyle.visibility!=='hidden'&&courseStyle.display!=='none',
      actualBalls:document.querySelectorAll('.bv-ball-sprite [data-fx-kind="ball"]').length};
  });
}
async function proveWholeTokenFallback(page,name,{releaseImage=null}={}){
  const samples=[];
  for(let i=0;i<120;i++){
    const s=await visibleCourseState(page);samples.push(s);
    assert.ok(s.actorVisible,`${name}: original batter remains visible at virtual sample ${i}`);
    assert.ok(s.actorImageLoaded,`${name}: original batter source image remains decoded at virtual sample ${i}`);
    assert.notEqual(s.preview,'true',`${name}: no course actor switch during latched fallback`);
    assert.equal(s.courseVisible,false,`${name}: no course layer flash during latched fallback`);
    assert.ok(s.actualBalls<=1,`${name}: fallback keeps at most one legacy ball, got ${s.actualBalls}`);
    assert.notEqual(s.state,'코스 확인 중',`${name}: course model/scan is absent in whole-pitch fallback`);
    if(releaseImage&&!releaseImage.released&&i>=5){releaseImage.release();releaseImage.released=true;}
    if(i>5&&s.stage==null)break;
    await page.clock.runFor(100);
  }
  assert.ok(samples.some(x=>x.token),`${name}: actual pitch token observed`);
  return samples;
}

let failure=null;
try{
  // Isolated preview accepts an exact two-card commit once, survives a hidden
  // page/resume and reload in sessionStorage, and never writes the product save.
  {
    const c=await openCase('two-card-hidden-reload');
    const {page}=c,commit=await commitCards(page,{count:2});
    assert.equal(await page.locator('.bv-hud-sound').getAttribute('aria-pressed'),'false','cue remains muted by default');
    await page.locator('[data-testid="bp-swing"]').evaluate(e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert.deepEqual(await readPreview(page),commit.expected,'synthetic retry does not resample or reapply');
    assert.equal((await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length,commit.writesAfter,'synthetic retry does not create another accepted write');
    const writes=(await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length;
    const visibilityBefore=await page.evaluate(()=>document.visibilityState);
    const other=await c.context.newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(120);
    const visibilityWhileOtherFront=await page.evaluate(()=>document.visibilityState);
    await page.bringToFront();const visibilityAfterResume=await page.evaluate(()=>document.visibilityState);
    assert.deepEqual(await readPreview(page),commit.expected,'visibility resume preserves the accepted state');
    assert.equal((await storeCalls(page)).filter(x=>x.storage==='session'&&x.op==='set'&&x.key===previewKey).length,writes,'hidden/resume does not reaccept');
    await page.reload();await page.locator('.bv-playable-run .battle-vnext').waitFor();
    assert.deepEqual(await readPreview(page),commit.expected,'reload restores accepted session state');
    assert.equal(await readProd(page),'course-preview-production-sentinel','reload leaves product save isolated');
    await page.screenshot({path:path.join(out,'two-card-session-resume.png'),animations:'disabled'});
    reports.push({case:c.name,ok:true,count:2,acceptedOnce:true,visibility:{before:visibilityBefore,whileOtherFront:visibilityWhileOtherFront,afterResume:visibilityAfterResume},hiddenActuallyExercised:visibilityWhileOtherFront==='hidden',reloadSession:true,productionUntouched:true});
    await other.close();await c.context.close();
  }
  // Start from a real take to earn the existing third energy, then commit three
  // actual place cards through the same player surface and compare the engine.
  {
    const c=await openCase('three-card-commit'),{page}=c;
    const commit=await commitCards(page,{count:3,afterTake:true});
    assert.deepEqual(await readPreview(page),commit.expected);
    await page.screenshot({path:path.join(out,'three-card-accepted.png'),animations:'disabled'});
    reports.push({case:c.name,ok:true,count:3,acceptedOnce:true,productionUntouched:true});await c.context.close();
  }
  // Abort the atlas request: original batter must remain visible through the
  // entire host-clock pitch, with no scan, mid-switch, or course-only ball.
  {
    const c=await openCase('atlas-abort-whole-pitch',{routeMode:'abort'}),{page}=c;
    const request=c.imageRequest;const commit=await commitCards(page,{count:2});
    const requested=await request;assert.match(requested,/batter-course-4x4/);
    const samples=await proveWholeTokenFallback(page,c.name);
    assert.deepEqual(await readPreview(page),commit.expected);
    await page.screenshot({path:path.join(out,'atlas-abort-fallback.png'),animations:'disabled'});
    reports.push({case:c.name,ok:true,acceptedOnce:true,samples:samples.length,wholePitchFallback:true,productionUntouched:true});await c.context.close();
  }
  // Hold the same atlas request until the current pitch is active, then release
  // it inside the token. The initial fallback latch must prevent a mid-pitch
  // switch even after browser decode completes.
  {
    const c=await openCase('atlas-delay-latched-whole-pitch',{routeMode:'delay'}),{page}=c;
    const request=c.imageRequest,commit=await commitCards(page,{count:2});
    const requested=await request;assert.match(requested,/batter-course-4x4/);
    await page.waitForFunction(()=>!!document.querySelector('.bv-scene')?.dataset.fxStage);
    const releaseState={released:false,release:c.releaseImage};
    const samples=await proveWholeTokenFallback(page,c.name,{releaseImage:releaseState});
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-testid="bv-course-batter"] img')].some(img=>img.complete&&img.naturalWidth>0),null,{timeout:10000});
    assert.deepEqual(await readPreview(page),commit.expected);
    await page.screenshot({path:path.join(out,'atlas-delayed-fallback.png'),animations:'disabled'});
    reports.push({case:c.name,ok:true,acceptedOnce:true,requestReleasedDuringToken:releaseState.released,samples:samples.length,wholePitchFallback:true,productionUntouched:true});await c.context.close();
  }
  // Reduced motion may accept the engine action but must expose no scan/flight
  // course presentation or course-only light/ball.
  {
    const c=await openCase('reduced-motion-no-course',{reducedMotion:'reduce'}),{page}=c;
    const commit=await commitCards(page,{count:2});
    const state=await visibleCourseState(page);
    assert.notEqual(state.state,'코스 확인 중');assert.equal(state.actualBalls,0);assert.equal(state.courseVisible,false);
    assert.deepEqual(await readPreview(page),commit.expected);assert.equal(await readProd(page),'course-preview-production-sentinel');
    await page.screenshot({path:path.join(out,'reduced-motion-no-course.png'),animations:'disabled'});
    reports.push({case:c.name,ok:true,reducedMotion:true,noScan:true,actualBallCount:state.actualBalls,productionUntouched:true});await c.context.close();
  }
  assert.deepEqual(pageErrors,[],'no browser exceptions');
  console.log(`${reports.length}/${reports.length} course-preview edge cases passed; 0 page errors`);
}catch(error){failure={message:error.message,stack:error.stack};throw error;}
finally{
  await browser.close();
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify({base,method:'Playwright browser automation with real card input and v10 engine state oracle; isolated coursePreview URL, session namespace, no physical-device claims.',cases:reports,pageErrors,failed:failure?1:0,failure},null,2));
}
