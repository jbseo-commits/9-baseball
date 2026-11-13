import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,drawReceiptFor} from '../src/duel/engine.js';
const base=process.env.BASE_URL||'http://127.0.0.1:4173/',out=process.env.QA_OUT||'/tmp/9zone-hand-draw';await fs.mkdir(out,{recursive:true});
const value=base.startsWith('https:')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY),proxy=value?new URL(value):null;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox'],...(proxy?{proxy:{server:proxy.protocol+'//'+proxy.host}}:{})});
const reports=[];
const specs=JSON.parse(process.env.CASES||JSON.stringify([.5,1,2].map(rate=>({rate,kind:'three',width:844,height:390})).concat([{rate:1,kind:'take',width:568,height:320},{rate:1,kind:'take',width:667,height:375},{rate:1,kind:'take',width:844,height:390},{rate:1,kind:'three',width:1280,height:720},{rate:1,kind:'three',width:844,height:390,reduced:true}])));
for(const spec of specs){
 const {rate,kind,width,height,reduced=false}=spec,tag=`${kind}-${width}-${rate}${reduced?'-reduce':''}`;
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:reduced?'reduce':'no-preference',recordVideo:{dir:out,size:{width,height}}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.qaAudio=[];const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){const create=Audio.prototype.createOscillator;Audio.prototype.createOscillator=function(...args){const o=create.apply(this,args),set=o.frequency.setValueAtTime.bind(o.frequency),start=o.start.bind(o);let f=null;o.frequency.setValueAtTime=(v,...r)=>{f??=v;return set(v,...r)};o.start=(at)=>{window.qaAudio.push({frequency:f,wall:performance.now(),at});return start(at)};return o;};}});
 let before=enterV10Node(createV10Duel(3),'a1-entry'),id=before.battle.hand[0];
 if(kind==='three'){before.deck.find(c=>c.id===id).kind='reshuffle';before.battle.hand=[id];before.battle.draw=before.deck.map(c=>c.id).filter(x=>x!==id);before.battle.discard=[];}
 else before.battle.pending={zone:9,roll:.1,powerRoll:.1};
 await p.goto(base+'?battleUi=vnext&battlePlay=1&coursePreview=1&seed=3&battleSpeed='+rate+'&v='+(process.env.RELEASE_SHA||'draw-material1'));
 await p.evaluate(s=>{sessionStorage.clear();localStorage.setItem('9zone-v10-run','production-sentinel');sessionStorage.setItem('9zone-playable-v1:9zone-v10-run',JSON.stringify(s));sessionStorage.setItem('9zone-playable-v1:9zone-bp-coach-v1','done');},before);await p.reload();await p.waitForSelector('.bv-scene');
 await p.waitForFunction(()=>document.querySelector('.battle-vnext')?.dataset.handOpen==='true');
 await p.getByRole('button',{name:'효과음 켜기',exact:true}).tap();await p.waitForTimeout(850/rate);
 const restoredBadges=await p.locator('.bv-draw-badge').count();assert.equal(restoredBadges,0,'restored hand must not fake new draws');
 const startAudio=await p.evaluate(()=>qaAudio.length);
 await p.evaluate(()=>{window.qaDraw=[];window.qaRunning=true;function frame(){const root=document.querySelector('.battle-vnext'),row=document.querySelector('.bv-hand-row'),r=row?.getBoundingClientRect();window.qaDraw.push({wall:performance.now(),phase:root?.dataset.phase,open:root?.dataset.handOpen,ids:[...document.querySelectorAll('.bv-card-slot[data-draw-kind="draw"]')].map(e=>e.dataset.cardId),cards:[...document.querySelectorAll('.bv-card-slot[data-draw-kind]')].map(e=>{const b=e.getBoundingClientRect();return{id:e.dataset.cardId,order:e.dataset.drawOrder,y:b.y,opacity:getComputedStyle(e).opacity,translate:getComputedStyle(e).translate,playing:e.getAnimations().filter(a=>a.playState==='running').length,visible:r?Math.max(0,Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top))*Math.max(0,Math.min(b.right,r.right)-Math.max(b.left,r.left))/(b.height*b.width):0}})});if(window.qaRunning)requestAnimationFrame(frame);}requestAnimationFrame(frame);});
 let expected,ids;
 if(kind==='three'){
  expected=playV10Action(before,{type:'card',id});ids=drawReceiptFor(expected).ids;
  await p.locator(`.bv-card-slot[data-card-id="${id}"] .bv-card`).tap();await p.getByTestId('bp-swing').tap();
 }else{expected=advanceV10Pitch(playV10Action(before,{type:'take'}));ids=drawReceiptFor(expected).ids;await p.getByTestId('bp-swing').tap();}
 await p.waitForFunction(n=>document.querySelector('.battle-vnext')?.dataset.phase==='deciding'&&document.querySelectorAll('.bv-draw-badge').length===n,ids.length,{timeout:20000});
 await p.screenshot({path:out+'/'+tag+'-arrival.png'});await p.waitForTimeout(1200/rate);await p.screenshot({path:out+'/'+tag+'-settled.png'});
 const observed=await p.evaluate(()=>{window.qaRunning=false;return{samples:qaDraw,audio:qaAudio,save:sessionStorage.getItem('9zone-playable-v1:9zone-v10-run'),prod:localStorage.getItem('9zone-v10-run'),ids:[...document.querySelectorAll('.bv-card-slot[data-draw-kind="draw"]')].map(e=>e.dataset.cardId),open:document.querySelector('.battle-vnext')?.dataset.handOpen,overflow:document.documentElement.scrollWidth>innerWidth}});
 const textVisibility=await p.locator('.bv-card-slot[data-draw-kind="draw"]').evaluateAll(elements=>elements.map(el=>{
  const row=el.closest('.bv-hand-row').getBoundingClientRect(),button=el.querySelector('.bv-card').getBoundingClientRect();
  const clip={left:Math.max(0,row.left,button.left),right:Math.min(innerWidth,row.right,button.right),top:Math.max(0,row.top,button.top),bottom:Math.min(innerHeight,row.bottom,button.bottom)};
  return {id:el.dataset.cardId,fields:['.bv-card-name','.bv-card-cost','.bv-card-effect'].map(selector=>{const node=el.querySelector(selector),b=node.getBoundingClientRect(),area=b.width*b.height;return{selector,text:node.textContent.trim(),bounds:{x:b.x,y:b.y,width:b.width,height:b.height},clip,fraction:area?Math.max(0,Math.min(b.right,clip.right)-Math.max(b.left,clip.left))*Math.max(0,Math.min(b.bottom,clip.bottom)-Math.max(b.top,clip.top))/area:0};})};
 }));
 assert.deepEqual(new Set(textVisibility.map(x=>x.id)),new Set(ids));
 assert(textVisibility.every(x=>x.fields.every(f=>f.text&&f.fraction>=.95)),'drawn name, cost and effect must be readable');
 const sounds=observed.audio.slice(startAudio).filter(x=>x.frequency===1480),active=observed.samples.flatMap(s=>s.cards),animating=active.some(c=>c.playing&&c.translate!=='none'),restoredNew=false;
 assert.equal(observed.save,JSON.stringify(expected),'actual save must match engine exactly');assert.equal(observed.prod,'production-sentinel');assert.equal(observed.open,'true');assert.deepEqual(observed.ids,ids);const visibleLast=observed.samples.filter(s=>s.ids.length).at(-1)?.cards||[];if(kind==='take')assert(visibleLast.every(c=>c.visible>=.95),'one drawn card must remain fully readable after settlement');assert(!observed.overflow);assert(reduced?!animating:animating);assert(reduced?sounds.length===0:sounds.length>0);assert(sounds.length<=ids.length);
 if(kind==='three'){
  await p.getByRole('button',{name:'손패 접기',exact:true}).tap();await p.locator('.bv-cell[data-zone="4"]').tap();await p.waitForTimeout(80);assert.equal(await p.locator('.battle-vnext').getAttribute('data-hand-open'),'false','aim must respect explicit close');
 }
 const item={spec,ids,restoredBadges,autoOpened:true,textVisibility,settledVisible:visibleLast.map(c=>({id:c.id,fraction:c.visible})),exactEngine:true,productionPreserved:true,animating,landingSounds:sounds.length,errors,pass:errors.length===0,samples:observed.samples,audio:observed.audio.slice(startAudio)};reports.push(item);
 const video=p.video();await context.close();await video.saveAs(out+'/'+tag+'.webm');await fs.writeFile(out+'/partial.json',JSON.stringify(reports,null,2));console.log(JSON.stringify({...item,samples:undefined,audio:undefined}));
}
await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(reports,null,2));assert(reports.every(r=>r.pass));
