/* Native browser timing, scoped CSS/WAAPI, actual audio scheduling and engine
   equivalence. QA_BASE can be the built/public Pages subdirectory. */
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:5235/',out=process.env.QA_OUT||'/tmp/9zone-animation-speed';fs.mkdirSync(out,{recursive:true});
const rates=process.env.QA_RATES?JSON.parse(process.env.QA_RATES):[.25,.5,.75,1,1.5,2];
const selector=p=>p.getByRole('combobox',{name:'애니메이션 배속'});
async function start(p,rate,fixture='watch-read0'){
 await p.goto(base+'?battleUi=vnext&battleFixture='+fixture+'&battlePresentation=clean&battleSpeed='+rate+'&v='+(process.env.QA_VERSION||'local'));
 await p.locator('.bv-actor-batter img').first().waitFor();await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.evaluate(()=>document.fonts.ready);
}
(async()=>{
 const{WIDE_PLACEMENT:placement}=await import('../src/duel/battle-vnext/placement-motion.js');
 const {buildFixture}=await import('../src/duel/battle-vnext/fixtures.js'),{setAimZone,playV10Action}=await import('../src/duel/engine.js'),{presentationFor,presentationTimeline}=await import('../src/duel/presentation.js');
 const f=buildFixture('watch-read0'),id=f.hand.find(c=>c.entry.kind==='strike').id,expected=playV10Action(setAimZone(f.s,2),{type:'card',id,supports:[]}),timeline=presentationTimeline(presentationFor(expected));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),errors=[],reports=[],layout=[];
 for(const rate of rates){
  const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
   window.__speedQA={notes:[],receipts:[],stages:[],poses:[],body:[]};const q=window.__speedQA;
   const create=BaseAudioContext.prototype.createOscillator;BaseAudioContext.prototype.createOscillator=function(){const n=create.call(this),set=n.frequency.setValueAtTime.bind(n.frequency);n.frequency.setValueAtTime=(v,t)=>{n.__qaFreq=v;return set(v,t)};return n};const orig=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(t){q.notes.push({freq:this.__qaFreq,t,wall:performance.now(),audioNow:this.context.currentTime});return orig.call(this,t)};
   new MutationObserver(ms=>{for(const m of ms){const e=m.target;if(m.attributeName==='data-fx-stage'&&e.matches('.bv-scene'))q.stages.push({stage:e.dataset.fxStage||null,at:performance.now()});if(m.attributeName==='data-pose'&&e.matches('.bv-actor'))q.poses.push({actor:e.dataset.actor,pose:e.dataset.pose,at:performance.now()});for(const n of m.addedNodes){if(n.nodeType===1&&n.matches('[data-testid=bv-coverage-insert]'))q.receipts.push({event:'add',at:performance.now()});}for(const n of m.removedNodes){if(n.nodeType===1&&n.matches('[data-testid=bv-coverage-insert]'))q.receipts.push({event:'remove',at:performance.now()});}}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-fx-stage','data-pose']});
  });
  await start(p,rate);assert.equal(await selector(p).inputValue(),String(rate));await p.evaluate(()=>localStorage.setItem('9zone-v10-run','speed-sentinel'));
  await p.getByRole('button',{name:'효과음 켜기',exact:true}).tap();await p.getByRole('button',{name:'손패 펼치기',exact:true}).tap();await p.waitForTimeout(70);
  const transition=await p.locator('.bv-hand-area').evaluate(e=>e.getAnimations().map(a=>({rate:a.playbackRate,type:a.constructor.name})));assert.ok(transition.every(a=>a.rate===rate));
  await p.waitForTimeout(420/rate);await p.locator('.bv-card[data-card-kind=strike]').first().tap();await p.locator('.bv-cell[data-zone="2"]').tap();
  await p.waitForSelector('[data-testid=bv-coverage-insert]');assert.ok(await selector(p).isDisabled());
  await p.waitForTimeout(100);const animations=await p.locator('.bv-insert-fx').evaluate(e=>e.getAnimations({subtree:true}).map(a=>({name:a.animationName,rate:a.playbackRate,time:a.currentTime})));assert.ok(animations.length>0);assert.ok(animations.every(a=>a.rate===rate),JSON.stringify(animations));
  await p.screenshot({path:`${out}/placement-${rate}.jpg`,quality:85});await p.waitForFunction(()=>!document.querySelector('[data-testid=bv-coverage-insert]'),null,{timeout:7000});assert.ok(await selector(p).isEnabled());
  const receipt=await p.evaluate(()=>window.__speedQA.receipts);const duration=receipt.at(-1).at-receipt[0].at;assert.ok(Math.abs(duration-placement.duration/rate)<250,`receipt ${rate}: ${duration}`);
  const note=await p.evaluate(()=>window.__speedQA.notes.find(n=>Math.abs(n.freq-118)<.01)); // initial frequency, low seating body
  assert.ok(note,'actual low seating oscillator was scheduled');assert.ok(Math.abs((note.t-note.audioNow)*1000-(6+placement.lockAt/rate))<120,'seating sound uses same scaled lock beat');
  await p.getByTestId('bp-swing').tap();await p.waitForFunction(()=>!!document.querySelector('.bv-scene')?.dataset.fxStage);assert.ok(await selector(p).isDisabled());
  if(rate===.25){await p.waitForTimeout(timeline.duration+80);assert.ok(await selector(p).isDisabled(),'slow RAF/host keeps playing beyond original wall duration');await p.screenshot({path:`${out}/slow-pitch-025.jpg`,quality:85});}
  await p.waitForFunction(()=>!document.querySelector('.bv-scene')?.dataset.fxStage,null,{timeout:15000});assert.ok(await selector(p).isEnabled());
  const q=await p.evaluate(()=>window.__speedQA),stages=q.stages.filter(e=>e.at>=q.receipts.at(-1).at),begin=stages.find(e=>e.stage==='windup'),end=stages.findLast(e=>e.stage===null);assert.ok(begin&&end);const pitchDuration=end.at-begin.at;assert.ok(Math.abs(pitchDuration-timeline.duration/rate)<300,`pitch ${rate}: ${pitchDuration}`);
  assert.equal(await p.locator('.bv-scene').getAttribute('data-play-token'),String(expected.stats.pitches));assert.equal(await p.getByTestId('bv-energy').getAttribute('data-energy'),String(expected.battle.energy));assert.ok((await p.locator('.bv-hud-opponent').getAttribute('aria-label')).includes(`${expected.pitcher.hp} / ${expected.pitcher.maxHp}`));assert.equal(await p.evaluate(()=>localStorage.getItem('9zone-v10-run')),'speed-sentinel');
  if(rate===.25){assert.ok(q.poses.some(e=>e.at>begin.at+timeline.duration&&e.at<end.at),'actor RAF still changes poses beyond normal duration');}
  const changed=rate===.5?'0.75':'0.5';await selector(p).selectOption(changed);await p.reload();assert.equal(await selector(p).inputValue(),changed);assert.equal(new URL(p.url()).searchParams.get('battleSpeed'),changed);
  reports.push({rate,receiptMs:duration,expectedReceiptMs:placement.duration/rate,pitchMs:pitchDuration,expectedPitchMs:timeline.duration/rate,transition,animations,lockSoundDelayMs:(note.t-note.audioNow)*1000,actualHp:expected.pitcher.hp,actualEnergy:expected.battle.energy,saveIsolated:true,preferenceReload:true});console.log('passed speed',rate);await p.close();
 }
 const muted=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});muted.on('pageerror',e=>errors.push(e.message));
 await muted.addInitScript(()=>{window.__cueNodes=[];for(const name of ['createOscillator','createBufferSource']){const create=BaseAudioContext.prototype[name];BaseAudioContext.prototype[name]=function(){const n=create.call(this),start=n.start.bind(n),stop=n.stop.bind(n);n.__starts=[];n.__stops=[];n.start=t=>{n.__starts.push(t);return start(t)};n.stop=t=>{n.__stops.push(t??null);return t==null?stop():stop(t)};window.__cueNodes.push(n);return n};}});
 await start(muted,.25,'swing-main');await muted.getByRole('button',{name:'효과음 켜기',exact:true}).tap();await muted.locator('.bv-cell[data-zone="2"]').tap();await muted.getByTestId('bp-swing').tap();await muted.waitForSelector('.bv-result-spotlight.t-exact');
 const future=await muted.evaluate(()=>window.__cueNodes.map((n,i)=>({i,start:n.__starts[0],now:n.context.currentTime})).filter(n=>n.start>n.now));assert.ok(future.length>0,'slow judgement has scheduled future sound');await muted.getByRole('button',{name:'효과음 끄기',exact:true}).tap();assert.ok(await muted.evaluate(ids=>ids.every(i=>window.__cueNodes[i].__stops.at(-1)===null),future.map(n=>n.i)),'mute explicitly stops every pending judgement source');await muted.close();
 for(const [w,h]of [[667,375],[740,360],[844,390],[1024,768],[1440,900],[1920,1080]]){
  const p=await browser.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:w<1100});p.on('pageerror',e=>errors.push(e.message));await start(p,.5);await p.getByRole('button',{name:'손패 펼치기',exact:true}).tap();await p.waitForTimeout(900);
  const boxes=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};return{speed:rect('.bv-speed-control select'),hud:rect('.bv-hud-bar'),energy:rect('.bv-energy'),zone:rect('.bv-zone')}});
  const a=boxes.speed,overlap=b=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;assert.ok(a.x>=0&&a.x+a.w<=w&&a.y>=0&&a.y+a.h<=h&&a.h>=44);assert.ok(!overlap(boxes.hud)&&!overlap(boxes.energy)&&!overlap(boxes.zone),JSON.stringify(boxes));
  await p.screenshot({path:`${out}/control-${w}.jpg`,quality:85});layout.push({w,h,...boxes});await p.close();
 }
 const reduced=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'});await start(reduced,.25,'swing-main');await reduced.getByTestId('bp-swing').tap();await reduced.waitForTimeout(200);assert.ok(await selector(reduced).isEnabled());assert.equal(await reduced.locator('.bv-bat-ribbon').count(),0);await reduced.close();
 const prep=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});await start(prep,.25,'prepare');await prep.getByTestId('bp-swing').tap();await prep.waitForTimeout(100);const fx=await prep.locator('#card-fx-layer>[data-animation-rate]').evaluateAll(es=>es.map(e=>({rate:e.dataset.animationRate,duration:e.getAnimations()[0]?.effect.getTiming().duration})));assert.ok(fx.some(e=>e.duration===2080)&&fx.some(e=>e.duration===1680));await prep.waitForFunction(()=>!document.querySelector('.bv-scene')?.dataset.fxStage,null,{timeout:10000});assert.equal(await prep.locator('#card-fx-layer>*').count(),0);await prep.close();
 await browser.close();assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/speed-browser.json`,JSON.stringify({base,reports,layout,reducedMotion:true,bodyFx:fx,scheduledAudioMute:true,errors},null,2));console.log('speed timing, audio schedule, CSS, engine, save and six layouts passed');
})().catch(e=>{console.error(e);process.exit(1)});
