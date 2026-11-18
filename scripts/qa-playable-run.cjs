/* Full real Duel playthrough. All actions are native UI inputs; no state/HP/card grants. */
const{chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:5240/',out=process.env.QA_OUT||'/tmp/9zone-playable';fs.mkdirSync(out,{recursive:true});
const key='9zone-playable-v1:9zone-v10-run',get=p=>p.evaluate(k=>JSON.parse(sessionStorage.getItem(k)),key);
async function open(p){const b=p.getByRole('button',{name:'손패 펼치기',exact:true});if(await b.count())await b.tap();}
const ready=async p=>{await p.locator('[data-roster-art]').waitFor();await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.evaluate(()=>document.fonts.ready);};
const card=(p,id)=>p.locator(`[data-card-id="${id}"] .bv-card`);
(async()=>{
 const E=await import('../src/duel/engine.js'),{choose}=await import('./lib/playable-qa-policy.mjs');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),errors=[],report=[];
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__productionTouches=[];const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;for(const[name,fn]of[['getItem',get],['setItem',set],['removeItem',remove]])Storage.prototype[name]=function(k,...args){if(this===localStorage&&['9zone-v10-run','9zone-deckbuilder-v9','9zone-read-v8','9zone-deck-v7','9zone-growth-v6','9zone-zones-v5'].includes(k))window.__productionTouches.push({name,key:k});return fn.call(this,k,...args)};});
 await p.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=2&v='+(process.env.QA_VERSION||'local'));await ready(p);await p.evaluate(()=>localStorage.setItem('qa-production-sentinel','keep'));assert.deepEqual(await p.evaluate(()=>window.__productionTouches),[]);
 const initial=await get(p),normal=E.enterV10Node(E.createV10Duel(3),'a1-entry');
 // Map edge generation uses RNG inside Array.sort's comparator, so Node/Chromium comparison order can differ. Bootstrap only that topology once; all battle state and later transitions come from the independent engine oracle.
 let oracle={...normal,runMap:{...normal.runMap,edges:structuredClone(initial.runMap.edges)}};assert.deepEqual(initial,oracle,'seed 3 bootstrap except cross-runtime map topology');assert.equal(oracle.initialSeed,3);assert.equal(oracle.runMap.currentNodeId,'a1-entry');assert.ok(E.readV10Duel({getItem:()=>JSON.stringify(initial)}));await p.screenshot({path:out+'/start.jpg',quality:88});const epoch=Date.now();await p.clock.install({time:epoch});await p.clock.pauseAt(epoch+1000);
 for(let turn=0;turn<60;turn++){
  if(!['battle','pitch','between'].includes(oracle.phase))break;
  const before=await get(p);assert.deepEqual(before,oracle,`pre-action oracle parity ${turn}`);assert.equal(oracle.phase,'battle');const a=choose(oracle);
  if(a.type==='card'){
   await open(p);await card(p,a.id).scrollIntoViewIfNeeded();await card(p,a.id).tap();
   if(a.zone!=null)await p.locator(`.bv-cell[data-zone="${a.zone}"]`).tap();
   for(const support of a.supports||[]){await p.getByRole('button',{name:'+ 카드 추가',exact:true}).tap();await card(p,support.id).scrollIntoViewIfNeeded();await card(p,support.id).tap();await p.locator(`.bv-cell[data-zone="${support.aimZone}"]`).tap();}
  }
  const aimed=a.type==='card'&&a.zone!=null?E.setAimZone(oracle,a.zone):oracle,expected=E.playV10Action(aimed,a);assert.notDeepEqual(expected,aimed);
  await p.getByTestId('bp-swing').tap();await p.clock.runFor(500);oracle=expected;assert.deepEqual(await get(p),oracle,`actual engine result ${turn}`);
  report.push({turn,action:a,pitch:oracle.stats.pitches,hp:oracle.pitcher.hp,energy:oracle.battle.energy,phase:oracle.phase});
  if(['pitch','between'].includes(oracle.phase)){await p.clock.runFor(1200);oracle=oracle.phase==='pitch'?E.advanceV10Pitch(oracle):E.advanceV10Batter(oracle);assert.deepEqual(await get(p),oracle,`advance oracle parity ${turn}`);}console.log('played',turn,oracle.stats.pitches,oracle.pitcher.hp,oracle.phase);
 }
 const victory=oracle;assert.equal(victory.phase,'reward');assert.equal(victory.pitcher.hp,0);assert.deepEqual(await get(p),victory,'final browser state matches independent engine oracle');await p.screenshot({path:out+'/reward.jpg',quality:88});await p.clock.resume();
 await p.getByTestId('bp-stop-skip').tap();assert.deepEqual(await get(p),E.claimV10Reward(victory,{type:'skip'}));await p.screenshot({path:out+'/map.jpg',quality:88});const map=await get(p);await p.reload();await p.getByTestId('bp-map-go').waitFor();assert.deepEqual(await get(p),map);
 // Return to actual title and resume the current run, rather than replaying a fixed fixture.
 await p.locator('.wordmark').tap();await p.getByRole('button',{name:'이어하기',exact:true}).tap();assert.deepEqual(await get(p),map);
 await p.getByTestId('bp-map-go').tap();await p.waitForTimeout(150);const entered=await get(p);assert.notEqual(entered.runMap.currentNodeId,map.runMap.currentNodeId);assert.ok(entered.battle||['training','rest','shop','locker','event'].includes(entered.phase));
 assert.deepEqual(await p.evaluate(()=>window.__productionTouches),[]);assert.equal(await p.evaluate(()=>localStorage.getItem('qa-production-sentinel')),'keep');await p.screenshot({path:out+'/next-node.jpg',quality:88});await p.close();
 // Natural defeat path: take pitches with no cards, no HP/out mutation.
 const lost=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'});lost.on('pageerror',e=>errors.push(e.message));await lost.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=2&v='+(process.env.QA_VERSION||'local'));await ready(lost);const t=Date.now();await lost.clock.install({time:t});await lost.clock.pauseAt(t+1000);
 for(let i=0;i<50;i++){const before=await get(lost);if(before.phase==='lost')break;const expected=E.playV10Action(before,{type:'take'});await lost.getByTestId('bp-swing').tap();await lost.clock.runFor(70);assert.deepEqual(await get(lost),expected);if(['pitch','between'].includes(expected.phase))await lost.clock.runFor(1200);}
 const defeated=await get(lost);assert.equal(defeated.phase,'lost');assert.equal(defeated.battle.outs,3);await lost.screenshot({path:out+'/defeat.jpg',quality:88});await lost.clock.resume();await lost.reload();assert.deepEqual(await get(lost),defeated);assert.equal(await lost.locator('.battle-vnext').count(),0);await lost.close();
 // Normal take bonus enables a real three-card commit in the main controller.
 const three=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'});three.on('pageerror',e=>errors.push(e.message));await three.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=2&v='+(process.env.QA_VERSION||'local'));await ready(three);const at=Date.now();await three.clock.install({time:at});await three.clock.pauseAt(at+1000);await three.getByTestId('bp-swing').tap();await three.clock.runFor(1300);const plan=await get(three),ids=plan.battle.hand.filter(id=>plan.deck.find(c=>c.id===id).kind==='place');assert.equal(plan.battle.energy,3);assert.equal(ids.length,3);await open(three);await card(three,ids[0]).tap();await three.locator('.bv-cell[data-zone="0"]').tap();
 for(let i=1;i<3;i++){await three.getByRole('button',{name:'+ 카드 추가',exact:true}).tap();await card(three,ids[i]).scrollIntoViewIfNeeded();await card(three,ids[i]).tap();await three.locator(`.bv-cell[data-zone="${i*4}"]`).tap();}
 await three.screenshot({path:out+'/actual-three.jpg',quality:88});await open(three);await three.locator('.battle-vnext').press('Escape');assert.equal(await three.locator('[data-board-card-id]').count(),3);await three.getByTestId('bp-swing').tap();await three.clock.runFor(500);const actualThree=await get(three),expectedThree=E.playV10Action(E.setAimZone(plan,0),{type:'card',id:ids[0],supports:ids.slice(1).map((id,i)=>({id,aimZone:(i+1)*4}))});assert.deepEqual(actualThree,expectedThree);assert.equal(actualThree.stats.pitches,plan.stats.pitches+1);assert.equal(actualThree.battle.energy,0);assert.equal(await three.locator('.stack-resolving').count(),0);await three.close();
 // Native default TAKE at .5x. DOM windup commits after the host clock starts,
 // so its first MutationObserver callback is diagnostic, not the time origin.
 // Fixture contract: seed3/teal-mirage/take, normal motion, 2042/.5 = 4084ms.
 // tests/playable-run.test.jsx separately derives the exact App boundary from
 // source rosterTimeline. Intentional timeline changes require reviewing both.
 const live=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'no-preference'});live.on('pageerror',e=>errors.push(e.message));
 const cpuRate=Number(process.env.QA_CPU_RATE||1);assert.ok(Number.isFinite(cpuRate)&&cpuRate>=1);
 if(cpuRate>1){const cdp=await live.context().newCDPSession(live);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});}
 await live.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=0.5&v='+(process.env.QA_VERSION||'local'));await ready(live);
 assert.equal((await get(live)).initialSeed,3);assert.equal(await live.locator('[data-roster-art]').getAttribute('data-roster-art'),'regular-02-teal-mirage');
 assert.equal(await live.getByRole('combobox',{name:'애니메이션 배속'}).inputValue(),'0.5');
 assert.equal(await live.getByTestId('bp-swing').getAttribute('data-action-kind'),'watch');
 await live.evaluate(()=>{
  window.__liveClock=[];window.__livePointer=[];
  const button=document.querySelector('[data-testid="bp-swing"]');
  for(const type of ['pointerdown','pointerup','pointercancel'])button.addEventListener(type,e=>window.__livePointer.push({type,at:performance.now(),pointerType:e.pointerType,id:e.pointerId}),true);
  new MutationObserver(ms=>{for(const m of ms)if(m.attributeName==='data-fx-stage')window.__liveClock.push({stage:m.target.dataset.fxStage||null,at:performance.now()});}).observe(document.querySelector('.bv-scene'),{attributes:true,attributeFilter:['data-fx-stage']});
 });
 await live.getByTestId('bp-swing').tap();await live.waitForFunction(()=>!!document.querySelector('.bv-scene').dataset.fxStage);
 await live.waitForTimeout(2200);assert.ok(await live.getByRole('combobox',{name:'애니메이션 배속'}).isDisabled());await live.screenshot({path:out+'/slow-real-pitch.jpg',quality:88});
 await live.waitForFunction(()=>!document.querySelector('.bv-scene')?.dataset.fxStage,null,{timeout:10000});
 const observed=await live.evaluate(()=>({clock:window.__liveClock,pointer:window.__livePointer})),clock=observed.clock;
 const down=observed.pointer.find(e=>e.type==='pointerdown'),up=observed.pointer.find(e=>e.type==='pointerup');
 const elapsed=clock.at(-1).at-clock[0].at,inputToClearMs=up?clock.at(-1).at-up.at:null;
 const halfSpeed={action:'take',cpuRate,expectedFixtureMs:4084,inputToClearMs,observedWindupToClearMs:elapsed,...observed};
 fs.writeFileSync(out+'/half-speed.json',JSON.stringify(halfSpeed,null,2));
 assert.deepEqual(observed.pointer.map(e=>e.type),['pointerdown','pointerup']);assert.equal(up.pointerType,'touch');assert.equal(down.id,up.id);
 assert.equal(clock[0].stage,'windup');assert.equal(clock.at(-1).stage,null);assert.ok(up.at<=clock[0].at);
 assert.ok(inputToClearMs>=4084&&inputToClearMs<5500,`native take input-to-clear ${inputToClearMs}ms outside fixture bounds`);
 const liveResult=await get(live);assert.equal(liveResult.stats.pitches,1);assert.equal(liveResult.battle.revealed.action,'take');assert.equal(liveResult.phase,'pitch');
 assert.equal(await live.getByRole('combobox',{name:'애니메이션 배속'}).isDisabled(),false);await live.close();
 // Every target size mounts the real controller + real opponent, no inspector fixtures.
 const layouts=[];for(const[w,h]of[[667,375],[740,360],[844,390],[1024,768],[1440,900],[1920,1080]]){const page=await browser.newPage({viewport:{width:w,height:h},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=0.5&v='+(process.env.QA_VERSION||'local'));await ready(page);assert.equal(await page.locator('.bv-legacy-fallback').count(),0);assert.equal(await page.getByRole('combobox',{name:'애니메이션 배속'}).inputValue(),'0.5');const r=await page.locator('.battle-vnext').boundingBox();assert.ok(r.y<1&&Math.abs(r.height-h)<1);await page.screenshot({path:`${out}/live-${w}.jpg`,quality:85});layouts.push({w,h,art:await page.locator('[data-roster-art]').getAttribute('data-roster-art'),fullHeight:true});await page.close();}
 await browser.close();assert.deepEqual(errors,[]);fs.writeFileSync(out+'/playthrough.json',JSON.stringify({base,normalSeed:3,actions:report,actualThreeCardCommit:true,escapeKeepsActualPlan:true,naturalDefeatAndReload:true,realHalfSpeedMs:elapsed,halfSpeed,firstMatchWon:true,pitches:victory.stats.pitches,hp:victory.pitcher.hp,rewardToMap:true,reloadResume:true,titleResume:true,nextNode:entered.runMap.currentNodeId,productionReadWriteDelete:false,layouts,errors},null,2));console.log('real first match -> reward -> map -> reload/title resume -> next node passed; six real layouts passed');
})().catch(e=>{console.error(e);process.exit(1)});
