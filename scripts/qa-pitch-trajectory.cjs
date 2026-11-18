/* Isolated presentation QA: real DOM/actors and explicit authored time; no game state grants. */
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:5173/',out=process.env.QA_OUT||'/tmp/pitch-trajectory-evidence/browser';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),errors=[],report={base,viewports:[],events:[],storage:[],rates:[]};
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
 await context.addInitScript(()=>{window.__storage=[];for(const name of ['getItem','setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__storage.push({name,key:args[0]});return original.apply(this,args);};}});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));let navigations=0;p.on('framenavigated',f=>{if(f===p.mainFrame())navigations++;});
 await p.goto(base+'?showcase=pitch-trajectory');await p.locator('.pt-panel').first().waitFor();
 await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.evaluate(()=>document.fonts.ready);
 const seek=async time=>{await p.getByRole('slider',{name:'장면 시각'}).fill(String(time));await p.waitForFunction(t=>[...document.querySelectorAll('.pt-flight')].every(e=>Math.abs(Number(e.dataset.elapsed)-t)<.11),time);await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
 const sample=()=>p.locator('.pt-flight').evaluateAll(es=>es.map(e=>({profile:e.dataset.profile,x:+e.dataset.ballX,y:+e.dataset.ballY,r:+e.dataset.radius,time:+e.dataset.elapsed})));
 await p.getByRole('button',{name:'릴리스',exact:true}).click();const release=(await sample())[0].time;
 await p.getByRole('button',{name:'접촉 / 통과',exact:true}).click();const impact=(await sample())[0].time;assert.equal(impact-release,300);
 report.release=release;report.impact=impact;
 // Full rate list is available; all seek states are invariant to wall-clock playback rate.
 const at=release+225;await seek(at);const expected=await sample();
 for(const rate of ['0.25','0.5','0.75','1','1.5','2','6']){await p.getByRole('combobox',{name:'재생 배속'}).selectOption(rate);await seek(at);assert.deepEqual(await sample(),expected);report.rates.push(rate);}
 await p.getByRole('button',{name:'다음 프레임',exact:true}).click();assert.ok(Math.abs((await sample())[0].time-at-1000/60)<.01);
 await p.getByRole('button',{name:'이전 프레임',exact:true}).click();assert.ok(Math.abs((await sample())[0].time-at)<.01);
 for(const age of [-1,0,25,50,75,100,175,199.9,200]){await seek(impact+age);const frames=await p.locator('[data-pxf-frame]').evaluateAll(es=>es.map(e=>Number(e.dataset.pxfFrame)));assert.deepEqual(frames,age>=0&&age<200?Array(3).fill(Math.floor(age/25)):[]);}
 report.pxf200msEightFrames=true;
 await seek(impact+50);assert.ok(await p.locator('.pt-flight').evaluateAll(es=>es.every(e=>!!(e.querySelector('[data-pxf-frame]').compareDocumentPosition(e.querySelector('[data-testid=trajectory-ball]'))&Node.DOCUMENT_POSITION_FOLLOWING))));
 await p.getByRole('checkbox',{name:'짧은 잔상',exact:true}).uncheck();assert.equal(await p.locator('.pt-flight path').count(),0);
 await p.getByRole('checkbox',{name:'접촉 표식',exact:true}).uncheck();await seek(impact);assert.equal(await p.getByTestId('trajectory-contact').count(),0);
 const navigationStart=navigations;
 for(const [w,h] of [[568,320],[667,375],[844,390],[932,430],[1280,720],[1440,900],[390,844],[412,915]]){
   await p.setViewportSize({width:w,height:h});await seek(impact);await p.locator('.bv-actor img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.waitForTimeout(120);
   const layout=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,balls:[...document.querySelectorAll('[data-testid=trajectory-ball]')].map(e=>{const r=e.getBoundingClientRect(),s=e.closest('.pt-stage').getBoundingClientRect();return {visible:r.left>=s.left&&r.right<=s.right&&r.top>=s.top&&r.bottom<=s.bottom};})}));
   assert.equal(layout.overflow,false,`${w}: horizontal overflow`);assert.equal(layout.balls.length,3,`${w}: balls missing; samples=${JSON.stringify(await sample())}`);assert.ok(layout.balls.every(b=>b.visible));report.viewports.push({w,h,...layout});await p.screenshot({path:`${out}/contact-no-fx-${w}x${h}.png`,fullPage:true});
   await seek(impact+50);await p.getByRole('checkbox',{name:'접촉 표식',exact:true}).check();await p.screenshot({path:`${out}/pxf-on-${w}x${h}.png`,fullPage:true});await p.getByRole('checkbox',{name:'접촉 표식',exact:true}).uncheck();await p.screenshot({path:`${out}/pxf-off-${w}x${h}.png`,fullPage:true});
 }
 assert.equal(navigations,navigationStart,'rotation must preserve the preview, never reload');report.rotationPreservesSession=true;
 await p.setViewportSize({width:1440,height:900});await p.getByRole('checkbox',{name:'짧은 잔상',exact:true}).check();
 for(const offset of [0,75,150,225,299,300,301,380,500]){await seek(release+offset);report.events.push({offset,samples:await sample()});await p.screenshot({path:`${out}/three-${offset}.png`});}
 // A real 1x sequence followed by 6x, then verify completion and pause cancellation.
 for(const rate of ['1','6']){await p.getByRole('combobox',{name:'재생 배속'}).selectOption(rate);await seek(0);await p.getByRole('button',{name:'재생',exact:true}).click();await p.getByRole('button',{name:'재생',exact:true}).waitFor({timeout:5000});assert.equal((await sample())[0].time,2500);}
 await p.getByRole('combobox',{name:'재생 배속'}).selectOption('1');await seek(0);await p.getByRole('button',{name:'재생',exact:true}).click();await p.getByRole('button',{name:'일시정지',exact:true}).click();await p.getByRole('button',{name:'재생',exact:true}).waitFor();const paused=await sample();await p.waitForTimeout(100);assert.deepEqual(await sample(),paused);
 // Matching native main versus candidate event frames at identical scene dimensions.
 await p.getByRole('combobox',{name:'비교 보기'}).selectOption('fastball');await p.getByRole('checkbox',{name:'main 기준 장면',exact:true}).check();
 for(const result of ['hit','foul','take']){
   await p.getByRole('combobox',{name:'비교 결과'}).selectOption(result);
   for(const offset of [-1,0,1,80]){await seek(impact+offset);const name=`${result}-${offset}`;await p.locator('.pt-panel .pt-stage').screenshot({path:`${out}/candidate-${name}.png`});await p.locator('.pt-baseline .pt-stage').screenshot({path:`${out}/baseline-${name}.png`});}
 }
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.getByRole('button',{name:'재생',exact:true}).waitFor();await p.waitForTimeout(100);assert.equal((await sample())[0].time,0);report.reducedMotionNoAutoplay=true;await p.getByRole('button',{name:'재생',exact:true}).click();assert.equal((await sample())[0].time,impact);report.reducedMotionPlaySeeksImpact=true;assert.equal(await p.getByTestId('trajectory-contact').count(),0);report.reducedMotionNoSpark=true;
 report.storage=await p.evaluate(()=>window.__storage);assert.equal(report.storage.filter(e=>e.name!=='getItem').length,0);
 const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await touch.addInitScript(()=>{window.__fullscreenRequests=0;Element.prototype.requestFullscreen=()=>{window.__fullscreenRequests++;return Promise.resolve();};});
 const phone=await touch.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'?showcase=pitch-trajectory');await phone.getByRole('button',{name:'접촉 / 통과',exact:true}).tap();
 for(const size of [{width:390,height:844},{width:844,height:390}]){await phone.setViewportSize(size);await phone.getByRole('button',{name:'접촉 / 통과',exact:true}).tap();const state=await phone.evaluate(()=>({coarse:matchMedia('(pointer: coarse)').matches,before:getComputedStyle(document.body,'::before').display,after:getComputedStyle(document.body,'::after').display,fullscreen:window.__fullscreenRequests,time:Number(document.querySelector('.pt-flight').dataset.elapsed)}));assert.ok(state.coarse);assert.equal(state.before,'none');assert.equal(state.after,'none');assert.equal(state.fullscreen,0);assert.equal(state.time,impact);}
 report.touchPortraitLandscape=true;await touch.close();
 report.errors=errors;assert.deepEqual(errors,[]);report.completed=true;
 const video=p.video();await context.close();report.video=await video.path();await browser.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({completed:true,viewports:report.viewports.length,rates:report.rates,storage:report.storage,errors}));
})().catch(e=>{console.error(e);process.exit(1);});
