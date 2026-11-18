/* Independent reproduction only: observe real seed-3 playable swing at 0.5x with a native tap. */
const {chromium}=require('playwright'),fs=require('node:fs');
const base=process.env.QA_BASE||'http://127.0.0.1:5198/',out=process.env.QA_OUT||'/tmp/half-speed-walltime-20261118';fs.mkdirSync(out,{recursive:true});
const key='9zone-playable-v1:9zone-v10-run';
async function one(browser,condition,index,cpuRate=1){
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
 const page=await context.newPage(),errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 let cdp=null;if(cpuRate>1){cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});}
 await page.goto(base+'?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=0.5&v=half-speed-repro-'+condition+'-'+index,{waitUntil:'domcontentloaded'});
 await page.locator('.battle-vnext').waitFor({timeout:15000});await page.evaluate(()=>document.fonts.ready);
 const initial=await page.evaluate(k=>JSON.parse(sessionStorage.getItem(k)),key);
 const instrument=await page.evaluate(()=>{
  const scene=document.querySelector('.bv-scene'),button=document.querySelector('[data-testid="bp-swing"]');
  if(!scene||!button)throw new Error('battle scene or swing button unavailable');
  window.__qaTrace={condition:null,initAt:performance.now(),tap:{listeners:[]},mutations:[],raf:[],buttonLabel:button.innerText};
  for(const type of ['pointerdown','pointerup','click'])button.addEventListener(type,e=>window.__qaTrace.tap.listeners.push({type,at:performance.now(),eventTime:e.timeStamp,pointerType:e.pointerType||null}),true);
  const stamp=()=>performance.now();
  const observer=new MutationObserver(records=>{const callbackAt=stamp();for(const m of records)window.__qaTrace.mutations.push({callbackAt,mutationType:m.type,attribute:m.attributeName,oldValue:m.oldValue,currentValue:m.target.getAttribute(m.attributeName),playToken:m.target.dataset.playToken||null,phase:m.target.dataset.phase||null});});
  observer.observe(scene,{attributes:true,attributeFilter:['data-fx-stage','data-play-token','data-phase'],attributeOldValue:true});window.__qaTrace.observerStartedAt=stamp();
  let prior=null;const sample=()=>{const stage=scene.dataset.fxStage||null,phase=scene.dataset.phase||null,token=scene.dataset.playToken||null;if(stage!==prior){window.__qaTrace.raf.push({at:stamp(),stage,phase,token});prior=stage;}if(window.__qaTrace.done!==true)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  return {startedAt:performance.now(),stage:scene.dataset.fxStage||null,phase:scene.dataset.phase,token:scene.dataset.playToken||null};
 });
 const tapIssuedAt=await page.evaluate(()=>{window.__qaTrace.tapIssuedAt=performance.now();return window.__qaTrace.tapIssuedAt});
 await page.getByTestId('bp-swing').tap();const tapReturnedAt=await page.evaluate(()=>{window.__qaTrace.tapReturnedAt=performance.now();return window.__qaTrace.tapReturnedAt});
 await page.waitForFunction(()=>!!document.querySelector('.bv-scene')?.dataset.fxStage,{timeout:10000});
 await page.waitForFunction(()=>!document.querySelector('.bv-scene')?.dataset.fxStage,{timeout:20000});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()))); // record the null-stage frame before stopping RAF sampling
 await page.evaluate(()=>{window.__qaTrace.done=true;});
 // Let MutationObserver flush its final queued records before taking the trace.
 await page.waitForTimeout(50);
 const final=await page.evaluate(k=>({trace:window.__qaTrace,state:JSON.parse(sessionStorage.getItem(k)),scene:document.querySelector('.bv-scene')?.outerHTML.slice(0,1200)}),key);
 const stages=final.trace.raf.filter(x=>x.stage!==null),firstStage=stages[0],lastObservedMutation=final.trace.mutations.filter(x=>x.attribute==='data-fx-stage'&&x.currentValue===null).at(-1);
 const elapsedMutationMs=firstStage&&lastObservedMutation?lastObservedMutation.callbackAt-firstStage.at:null;
 const elapsedRafMs=final.trace.raf.length>1?final.trace.raf.at(-1).at-firstStage.at:null;
 const record={condition,index,cpuThrottleRate:cpuRate,base,requestedSpeed:'0.5x',tapIssuedAt,tapReturnedAt,tapDurationMs:tapReturnedAt-tapIssuedAt,tapEvents:final.trace.tap.listeners,
  observerStartedAt:final.trace.observerStartedAt,mutationRecords:final.trace.mutations,rafStageTransitions:final.trace.raf,firstStage,lastObservedMutation,elapsedMutationMs,elapsedRafMs,mutationDeliveryAfterStartMs:firstStage&&final.trace.mutations[0]?final.trace.mutations[0].callbackAt-firstStage.at:null,
  initial:{phase:initial.phase,seed:initial.initialSeed,pitches:initial.stats.pitches,stage:final.trace.raf[0]?.stage},final:{phase:final.state.phase,pitches:final.state.stats.pitches,outs:final.state.battle?.outs,strikes:final.state.battle?.strikes,last:final.state.last,fxStage:final.trace.raf.at(-1)?.stage},errors,consoleErrors};
 fs.writeFileSync(`${out}/${condition}-${index}.json`,JSON.stringify(record,null,2));await page.screenshot({path:`${out}/${condition}-${index}.png`});await context.close();return record;
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),records=[];
 const normalReps=Number(process.env.QA_NORMAL_REPS||2),cpuReps=Number(process.env.QA_CPU_REPS||2),cpuRate=Number(process.env.QA_CPU_RATE||4);
 for(let i=1;i<=normalReps;i++)records.push(await one(browser,'normal',i,1));
 for(let i=1;i<=cpuReps;i++)records.push(await one(browser,'cpu'+cpuRate+'x',i,cpuRate));
 await browser.close();fs.writeFileSync(out+'/summary.json',JSON.stringify({test:'single native Playwright tap on seed-3 real playable first pitch; stage changes observed via MutationObserver and RAF sampling',thresholdFromPriorQA:{minMs:4000,maxMs:5500},cpuThrottle:'Chrome Emulation.setCPUThrottlingRate rate=4 only; not a physical-device benchmark',records},null,2));console.log(JSON.stringify(records.map(r=>({condition:r.condition,index:r.index,cpuThrottleRate:r.cpuThrottleRate,tapDurationMs:r.tapDurationMs,stageSequence:r.rafStageTransitions.map(x=>x.stage),elapsedMutationMs:r.elapsedMutationMs,elapsedRafMs:r.elapsedRafMs,observerDeliveryMs:r.mutationDeliveryAfterStartMs,phase:r.final.phase,pitches:r.final.pitches,errors:r.errors})),null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
