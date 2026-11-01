/* Actual browser/AudioContext evidence. Playwright + Chromium + ffmpeg required.
   QA_BASE can be the Pages preview. Frame captures freeze QA time; the separate
   live recording never freezes time and uses native game buttons. */
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const base=process.env.QA_BASE||'http://127.0.0.1:5232/',out=process.env.QA_OUT||'/tmp/9zone-placement-material';fs.mkdirSync(out,{recursive:true});
const start=async(p,fixture='watch-read0')=>{await p.goto(base+'?battleUi=vnext&battleFixture='+fixture+'&battlePresentation=clean&v='+(process.env.QA_VERSION||'local'));await p.locator('.bv-actor-batter img').first().waitFor();await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.evaluate(()=>document.fonts.ready);};
const open=async p=>{await p.getByRole('button',{name:'손패 펼치기',exact:true}).tap();await p.waitForTimeout(420);};
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const frames=[],errors=[];
 for(const [w,h]of [[1672,941],[844,390]]){
  const p=await browser.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:w<1000});p.on('pageerror',e=>errors.push(e.message));await start(p);await open(p);await p.locator('.bv-card[data-card-kind=strike]').first().tap();
  const now=Date.now();await p.clock.install({time:now});await p.clock.pauseAt(now+25);await p.locator('.bv-cell[data-zone="2"]').tap();
  const parent=p.getByTestId('bv-insert-flight');assert.equal(await parent.locator('[data-insert-zone]').count(),3);
  assert.deepEqual(await parent.locator('[data-insert-zone]').evaluateAll(es=>es.map(e=>+e.dataset.insertZone)),[2,5,8]);
  for(const t of [0,140,300,490,640]){
   await p.locator('.bv-insert-fx').evaluate((e,t)=>{for(const el of [e,...e.querySelectorAll('*')])for(const a of el.getAnimations()){a.pause();a.currentTime=t;}},t);
   const geometry=await p.locator('.bv-insert-fx').evaluate(e=>{const card=e.querySelector('.bv-insert-card'),r=card.getBoundingClientRect();return {card:{x:r.x,y:r.y,w:r.width,h:r.height},tiles:[...e.querySelectorAll('[data-insert-zone]')].map(el=>({zone:+el.dataset.insertZone,parent:el.parentElement.className,x:el.offsetLeft,y:el.offsetTop}))};});
   if(t<=140)assert.ok(geometry.card.w<w*.4,'source card never balloons across the field');
   await p.screenshot({path:`${out}/material-${w}-${t}.jpg`,quality:90});frames.push({w,h,t,...geometry});
  }
  await p.close();
 }
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,recordVideo:{dir:out,size:{width:844,height:390}}});
 await context.addInitScript(()=>{
  const Native=window.AudioContext||window.webkitAudioContext;if(!Native)return;
  const original=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...rest){const result=original.call(this,target,...rest);if(window.__qaAudio?.context===this.context&&target===this.context.destination)original.call(this,window.__qaAudio.destination);return result;};
  window.AudioContext=class extends Native{constructor(...args){super(...args);const destination=this.createMediaStreamDestination(),chunks=[],recorder=new MediaRecorder(destination.stream);window.__qaAudio={context:this,destination,chunks,recorder};recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start(40);}};
 });
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await start(p);await p.getByRole('button',{name:'효과음 켜기',exact:true}).tap();assert.equal(await p.getByRole('button',{name:'효과음 끄기',exact:true}).getAttribute('aria-pressed'),'true');
 await open(p);await p.locator('.bv-card[data-card-kind=strike]').first().tap();await p.locator('.bv-cell[data-zone="2"]').tap();
 await p.waitForTimeout(1150);assert.equal(await p.locator('.bv-scene').getAttribute('data-play-token'),'0','placement never pitches or spends');
 await p.getByTestId('bp-swing').tap();await p.waitForSelector('.bv-result-spotlight.t-exact');await p.waitForTimeout(140);await p.screenshot({path:`${out}/exact-contact-844.jpg`,quality:90});await p.waitForTimeout(1300);
 assert.ok((await p.locator('.bv-hud-opponent').getAttribute('aria-label')).includes('48 / 60'),'actual seeded exact hit');
 const audio=await p.evaluate(async()=>{const q=window.__qaAudio;await new Promise(resolve=>{q.recorder.onstop=resolve;q.recorder.stop();});return {state:q.context.state,data:[...new Uint8Array(await new Blob(q.chunks).arrayBuffer())]};});assert.equal(audio.state,'running');fs.writeFileSync(`${out}/placement-and-hit.webm`,Buffer.from(audio.data));
 const video=p.video();await context.close();await video.saveAs(`${out}/live-placement-and-hit.webm`);
 const converted=spawnSync('ffmpeg',['-y','-loglevel','error','-i',`${out}/placement-and-hit.webm`,'-ac','1','-ar','24000','-f','f32le',`${out}/audio.pcm`]);assert.equal(converted.status,0,converted.stderr?.toString());
 const data=fs.readFileSync(`${out}/audio.pcm`);let peak=0,sum=0;for(let i=0;i+4<=data.length;i+=4){const v=data.readFloatLE(i);peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 assert.ok(peak>.01&&peak<1,'actual routed audio is audible and not clipped');const sound={duration:data.length/4/24000,peak,rms:Math.sqrt(sum/(data.length/4))};
 // Inspect actual host-clock contact frames, after asset/font decode. This is
 // a deterministic engine fixture, not CSS pretending that a miss was a hit.
 const {buildFixture}=await import('../src/duel/battle-vnext/fixtures.js');
 const {presentationFor,presentationTimeline}=await import('../src/duel/presentation.js');
 for(const fixture of ['cinema-exact','cinema-near']){
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
  const epoch=Date.now();await page.clock.install({time:epoch});await page.clock.pauseAt(epoch+25);await start(page,fixture);
  const timeline=presentationTimeline(presentationFor(buildFixture(fixture).s));await page.clock.runFor(timeline.impactAt+32);
  const exact=fixture==='cinema-exact';assert.equal(await page.locator('.bv-contact-burst').count(),exact?1:0);
  assert.equal(await page.locator('.bv-exact-cut').count(),exact?1:0);
  await page.screenshot({path:`${out}/${fixture}-844.jpg`,quality:90});await page.close();
 }
 await browser.close();assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/material-browser.json`,JSON.stringify({base,frames,sound,errors,actualHp48:true,liveVideo:'live-placement-and-hit.webm'},null,2));console.log(JSON.stringify({frames:frames.length,sound,actualHp48:true,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
