/* QA only: real seed-3 playable win, then fork one accepted memory-only map into reachable training/battle paths. */
const {chromium}=require('playwright'),fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const repoRoot=process.env.QA_REPO_ROOT||path.resolve(__dirname,'..'),base=process.env.QA_BASE||'http://127.0.0.1:5198/',out=process.env.QA_OUT||'/tmp/browser-route-fork';fs.mkdirSync(out,{recursive:true});
const prefix='9zone-playable-v1:',runKey=prefix+'9zone-v10-run';
const productionKeys=['9zone-v10-run','9zone-deckbuilder-v9','9zone-read-v8','9zone-deck-v7','9zone-growth-v6','9zone-zones-v5'];
const get=p=>p.evaluate(k=>JSON.parse(sessionStorage.getItem(k)),runKey);
const allPageErrors=[];
async function installStorageTrace(page,snapshot=null){
 await page.addInitScript(({state,prefix,runKey,keys})=>{
  if(state!==null)sessionStorage.setItem(runKey,state);
  window.__storageTrace={production:[],previewSession:[],positiveProbe:[]};
  // Wrap Storage.prototype once; identify the backing store from each call's receiver.
  const proto=Storage.prototype;
  for(const method of ['getItem','setItem','removeItem']){
   const original=proto[method];proto[method]=function(key,...args){
    const name=this===window.localStorage?'localStorage':this===window.sessionStorage?'sessionStorage':'other',k=String(key);
    if(keys.includes(k))window.__storageTrace.production.push({store:name,method,key:k});
    if(name==='sessionStorage'&&k.startsWith(prefix))window.__storageTrace.previewSession.push({method,key:k});
    if(k==='__qa-storage-probe-only__')window.__storageTrace.positiveProbe.push({store:name,method,key:k});
    return original.call(this,key,...args);
   };
  }
 },{state:snapshot===null?null:JSON.stringify(snapshot),prefix,runKey,keys:productionKeys});
}
async function ready(p){await p.locator('.bp-map, .battle-vnext').waitFor({timeout:15000});await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode().catch(()=>{}))));await p.evaluate(()=>document.fonts.ready);}
async function positiveStorageProbe(browser){
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>allPageErrors.push(e.message));
 await installStorageTrace(page);await page.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=2&storage-probe=separate');await ready(page);
 const probe=await page.evaluate(()=>{const k='__qa-storage-probe-only__';localStorage.setItem(k,'temporary');const v=localStorage.getItem(k);localStorage.removeItem(k);return {value:v,trace:window.__storageTrace};});
 assert.equal(probe.value,'temporary');assert.deepEqual(probe.trace.positiveProbe.map(x=>x.method),['setItem','getItem','removeItem']);assert.deepEqual(probe.trace.production,[],'probe uses only its dedicated non-production key');
 await context.close();return {contextSeparate:true,operations:probe.trace.positiveProbe,production:probe.trace.production,previewSession:probe.trace.previewSession};
}
async function openHand(p){const b=p.getByRole('button',{name:'손패 펼치기',exact:true});if(await b.count())await b.tap();}
const card=(p,id)=>p.locator(`[data-card-id="${id}"] .bv-card`);
async function bootContext(browser,snapshot,label){
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);allPageErrors.push(e.message);});await installStorageTrace(page,snapshot);
 await page.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=2&fork='+label);await ready(page);
 assert.deepEqual(await get(page),snapshot,`${label} starts from exact same accepted browser memory save`);
 return {context,page,errors};
}
async function playToTerminal(page,oracle,E,choose,label){
 const epoch=Date.now();await page.clock.install({time:epoch});await page.clock.pauseAt(epoch+1000);
 const turns=[];let capped=false,noOp=false;
 for(let turn=0;turn<60;turn++){
  const before=await get(page);assert.deepEqual(before,oracle,`${label} pre-action parity ${turn}`);
  if(['reward','lost'].includes(oracle.phase))break;
  assert.equal(oracle.phase,'battle');const action=choose(oracle);
  if(action.type==='card'){
   await openHand(page);await card(page,action.id).scrollIntoViewIfNeeded();await card(page,action.id).tap();
   if(action.zone!=null)await page.locator(`.bv-cell[data-zone="${action.zone}"]`).tap();
   for(const support of action.supports||[]){await page.getByRole('button',{name:'+ 카드 추가',exact:true}).tap();await card(page,support.id).scrollIntoViewIfNeeded();await card(page,support.id).tap();await page.locator(`.bv-cell[data-zone="${support.aimZone}"]`).tap();}
  }
  const aimed=action.type==='card'&&action.zone!=null?E.setAimZone(oracle,action.zone):oracle,next=E.playV10Action(aimed,action);
  if(next===aimed){noOp=true;break;}
  await page.getByTestId('bp-swing').tap();await page.clock.runFor(500);oracle=next;assert.deepEqual(await get(page),oracle,`${label} engine result ${turn}`);
  turns.push({turn,action,phase:oracle.phase,pitches:oracle.stats.pitches,hp:oracle.pitcher.hp});
  if(['pitch','between'].includes(oracle.phase)){await page.clock.runFor(1200);oracle=oracle.phase==='pitch'?E.advanceV10Pitch(oracle):E.advanceV10Batter(oracle);assert.deepEqual(await get(page),oracle,`${label} advance ${turn}`);}
 }
 if(!['reward','lost'].includes(oracle.phase))capped=true;
 await page.clock.resume();return {oracle,turns,outcome:capped?'incomplete':oracle.phase,capped,noOp};
}
(async()=>{
 const E=await import(pathToFileURL(path.join(repoRoot,'src/duel/engine.js')).href),policy=await import(pathToFileURL(path.join(repoRoot,'scripts/lib/playable-qa-policy.mjs')).href),choose=policy.choose;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),positiveProbe=await positiveStorageProbe(browser);
 const firstContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),first=await firstContext.newPage(),firstErrors=[];
 first.on('pageerror',e=>{firstErrors.push(e.message);allPageErrors.push(e.message);});await installStorageTrace(first);
 await first.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=2&fork=bootstrap');await ready(first);
 const initial=await get(first),node=initial.runMap.nodes.find(n=>n.id==='a1-entry');assert.equal(initial.initialSeed,3);assert.equal(initial.phase,'battle');assert.equal(node?.type,'battle');
 assert.ok(E.readV10Duel({getItem:()=>JSON.stringify(initial)}));const oracle=structuredClone(initial); // Chrome state is the complete engine-oracle checkpoint; no Node/Chrome topology exception.
 await first.screenshot({path:out+'/bootstrap-start.png'});
 const firstResult=await playToTerminal(first,oracle,E,choose,'first battle');
 if(firstResult.outcome!=='reward'){
  const report={base,repoRoot,seed:3,firstBattle:{outcome:firstResult.outcome,capped:firstResult.capped,turns:firstResult.turns,finalState:firstResult.oracle,interpretation:firstResult.outcome==='lost'?'natural loss preserved; no fork checkpoint and not a product defect':'action cap reached without terminal state; incomplete QA, not a natural outcome'},productionStorage:(await first.evaluate(()=>window.__storageTrace)).production,positiveProbe,errors:allPageErrors};
  report.forkChecks='unavailable: no accepted winning checkpoint';report.firstBattle.noOp=firstResult.noOp;
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));fs.writeFileSync(out+'/natural-first-outcome.json',JSON.stringify(firstResult.oracle,null,2));console.log(JSON.stringify(report,null,2));await firstContext.close();await browser.close();
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.productionStorage,[]);process.exitCode=firstResult.outcome==='lost'?2:1;return;
 }
 await first.getByTestId('bp-stop-skip').tap();const accepted=E.claimV10Reward(firstResult.oracle,{type:'skip'});assert.deepEqual(await get(first),accepted,'actual reward skip matches engine');assert.equal(accepted.phase,'map');assert.ok(accepted.runMap.completedNodeIds.includes('a1-entry'),'accepted seed-3 map has first node completed');assert.ok(E.readV10Duel({getItem:()=>JSON.stringify(accepted)}));
 const reachable=accepted.runMap.reachableIds.map(id=>accepted.runMap.nodes.find(n=>n.id===id)),training=reachable.find(n=>n.type==='training'),battle=reachable.find(n=>n.type==='battle');assert.ok(training,'accepted map exposes actual reachable training');assert.ok(battle,'same accepted map exposes actual reachable battle');
 const serialized=JSON.stringify(accepted),canonicalJsonSha256=crypto.createHash('sha256').update(serialized).digest('hex');fs.writeFileSync(out+'/accepted-seed3.json',JSON.stringify(accepted,null,2));const prettyFileSha256=crypto.createHash('sha256').update(fs.readFileSync(out+'/accepted-seed3.json')).digest('hex');const rawSession=await first.evaluate(k=>sessionStorage.getItem(k),runKey);assert.deepEqual(JSON.parse(rawSession),accepted);const sessionSerializedSha256=crypto.createHash('sha256').update(rawSession).digest('hex');assert.equal(sessionSerializedSha256,canonicalJsonSha256,'raw session serialization matches canonical serialized checkpoint');
 await first.screenshot({path:out+'/accepted-map.png'});const firstStorage=await first.evaluate(()=>window.__storageTrace);
 await first.close();await firstContext.close();
 const utilityRun=await bootContext(browser,accepted,'training'),battleRun=await bootContext(browser,accepted,'battle');
 async function enterNode(run,target){await run.page.locator(`[data-node="${target.id}"]`).tap();await run.page.locator('[data-testid="bp-map-go"]').tap();const expected=E.enterV10Node(accepted,target.id);assert.deepEqual(await get(run.page),expected,`reachable ${target.type} map entry parity`);return expected;}
 const utilityState=await enterNode(utilityRun,training);assert.equal(utilityState.phase,'training');const utilities=E.v10UtilityOptions(utilityState).filter(o=>o.type==='upgrade');assert.ok(utilities.length,'engine offers a legal training upgrade');
 const upgrade=utilities[0],offer=utilityRun.page.locator('.bp-offers .bp-offer').nth(utilities.indexOf(upgrade));await offer.tap();await utilityRun.page.getByTestId('bp-stop-go').tap();const upgraded=E.completeV10UtilityNode(utilityState,upgrade);assert.deepEqual(await get(utilityRun.page),upgraded,'actual training UI upgrades selected card and returns to map');assert.equal(upgraded.deck.find(c=>c.id===upgrade.id)?.plus,true);await utilityRun.page.screenshot({path:out+'/training-upgrade-map.png'});
 const battleState=await enterNode(battleRun,battle),battleResult=await playToTerminal(battleRun.page,battleState,E,choose,'forked battle');let added=null,addition=null;
 if(battleResult.outcome==='reward'){
  const adds=E.v10RewardOptions(battleResult.oracle);assert.ok(adds.length,'engine offers a legal card reward');addition=adds[0];await battleRun.page.locator(`.bp-offer[data-card-kind="${addition}"]`).first().tap();await battleRun.page.getByTestId('bp-stop-go').tap();added=E.claimV10Reward(battleResult.oracle,{type:'add',kind:addition});assert.deepEqual(await get(battleRun.page),added,'actual battle reward adds selected card with engine parity');assert.equal(added.deck.length,accepted.deck.length+1);await battleRun.page.screenshot({path:out+'/battle-card-added.png'});
 }else{await battleRun.page.screenshot({path:out+'/battle-natural-outcome.png'});fs.writeFileSync(out+'/battle-natural-outcome.json',JSON.stringify(battleResult.oracle,null,2));}
 const utilityStorage=await utilityRun.page.evaluate(()=>window.__storageTrace),battleStorage=await battleRun.page.evaluate(()=>window.__storageTrace);
 const errors=[...allPageErrors];
 const report={base,repoRoot,seed:3,previewPolicy:'exact engine preview; technical oracle only, not a human public-information policy',mapBootstrap:'full Chrome-generated seed-3 battle checkpoint; all subsequent transitions independently advanced by imported engine and deep-compared',firstBattle:{turns:firstResult.turns.length,pitches:firstResult.oracle.stats.pitches,hp:firstResult.oracle.pitcher.hp,outcome:firstResult.outcome},accepted:{rewardProtocol:'first-match reward skipped; distinct from G027 first-eligible card-add checkpoint; fork pair only, no cross-cycle state-equivalence claim',canonicalJsonSha256,prettyFileSha256,sessionSerializedSha256,phase:accepted.phase,completedNodeIds:accepted.runMap.completedNodeIds,reachable:reachable.map(n=>({id:n.id,type:n.type})),validated:!!E.readV10Duel({getItem:()=>serialized})},forks:{identicalAcceptedStart:true,training:{node:training.id,option:upgrade,utilityHistory:upgraded.v10.utilityHistory.at(-1),deckCountBefore:accepted.deck.length,deckCountAfter:upgraded.deck.length},battle:{node:battle.id,outcome:battleResult.outcome,capped:battleResult.capped,pitches:battleResult.oracle.stats.pitches,rewardAdded:addition,naturalOutcomeState:added?undefined:battleResult.oracle,deckCountBefore:accepted.deck.length,deckCountAfter:added?.deck.length??battleResult.oracle.deck.length,interpretation:added?'reward card addition verified':battleResult.outcome==='lost'?'natural loss preserved; card addition not tested, not a product defect':'60-action cap reached without terminal state; incomplete QA, not a natural loss'},storage:{productionTouches:{first:firstStorage.production,training:utilityStorage.production,battle:battleStorage.production},previewSessionPrefixTouches:{first:firstStorage.previewSession,training:utilityStorage.previewSession,battle:battleStorage.previewSession},positiveProbe}},errors};
 report.forks.battle.noOp=battleResult.noOp;
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await utilityRun.context.close();await battleRun.context.close();await browser.close();
 assert.deepEqual(errors,[]);for(const trace of [firstStorage,utilityStorage,battleStorage])assert.deepEqual(trace.production,[],'raw production storage access');
 assert.notEqual(battleResult.outcome,'incomplete','fork QA did not reach a natural terminal state');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
