import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
import {createV10Duel,enterV10Node,setAimZone,playV10Action} from '../../../src/duel/engine.js';
const out=process.env.QA_OUT||'/workspace/9zone-roulette-juice-20261112/live';await fs.mkdir(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:5401/';
const proxyValue=base.startsWith('https:')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY),proxy=proxyValue?new URL(proxyValue):null;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],...(proxy?{proxy:{server:proxy.protocol+'//'+proxy.host}}:{})});
const report=[];
const specs=JSON.parse(process.env.REVIEW_CASES||JSON.stringify([.25,.5,1,2].flatMap(rate=>[4,9].map(zone=>({rate,zone})))));
for(const spec of specs){
 const {rate,zone}=spec,tag=`z${zone}-r${rate}`;
 let before=enterV10Node(createV10Duel(1),'a1-entry');before.battle.pending={zone,roll:.01,powerRoll:.1};before.battle.intent={...before.battle.intent,repertoire:[0,1,2,3,4,5,6,7,8]};
 const expected=playV10Action(setAimZone(before,4),{type:'card',id:'basic'});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,recordVideo:{dir:out,size:{width:844,height:390}}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.qaAudio=[];const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio){const original=Audio.prototype.createOscillator;Audio.prototype.createOscillator=function(...args){const osc=original.apply(this,args),set=osc.frequency.setValueAtTime.bind(osc.frequency),start=osc.start.bind(osc);let frequency=null;osc.frequency.setValueAtTime=(value,...rest)=>{frequency??=value;return set(value,...rest);};osc.start=(at)=>{window.qaAudio.push({wall:performance.now(),frequency,at,contextTime:this.currentTime});return start(at);};return osc;};
   const compressor=Audio.prototype.createDynamicsCompressor;Audio.prototype.createDynamicsCompressor=function(...args){const node=compressor.apply(this,args);if(!window.qaRecorder){const dest=this.createMediaStreamDestination();node.connect(dest);const rec=new MediaRecorder(dest.stream),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);window.qaAudioDone=new Promise(resolve=>rec.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))));rec.start();window.qaRecorder=rec;}return node;};
  }
 });
 await p.goto(base+'?battleUi=vnext&battlePlay=1&coursePreview=1&battleSpeed='+rate+'&v='+(process.env.RELEASE_SHA||'juice-v1'));
 await p.evaluate(s=>{localStorage.setItem('9zone-v10-run','production-sentinel');sessionStorage.clear();sessionStorage.setItem('9zone-playable-v1:9zone-v10-run',JSON.stringify(s));sessionStorage.setItem('9zone-playable-v1:9zone-bp-coach-v1','done');},before);await p.reload();
 await p.waitForSelector('.bv-scene');await p.waitForFunction(()=>[...document.querySelectorAll('[data-testid="bv-course-batter"] img')].some(im=>im.complete&&im.naturalWidth===4096));
 await p.getByRole('button',{name:'효과음 켜기',exact:true}).tap();
 await p.locator('.bv-hand-handle').tap();await p.getByTestId('bv-basic-chip').tap();await p.locator('.bv-cell[data-zone="4"]').tap();
 await p.evaluate(()=>{window.qaSamples=[];window.qaRun=true;function sample(){const el=document.querySelector('.bv-scene'),d=document.querySelector('.bv-decision'),z=document.querySelector('.bv-zone'),r=z?.getBoundingClientRect();let f=el?.[Object.keys(el).find(k=>k.startsWith('__reactFiber'))],pb=null;for(;f;f=f.return)if(f.memoizedProps?.playback?.timeline){pb=f.memoizedProps.playback;break;}window.qaSamples.push({wall:performance.now(),elapsed:pb?(performance.now()-pb.startedAt)*pb.rate:null,timeline:pb?.timeline,phase:d?.dataset.coursePhase,scan:[...document.querySelectorAll('.is-course-scan')].map(e=>e.dataset.zone??'9'),target:[...document.querySelectorAll('.is-course-target')].map(e=>e.dataset.zone??'9'),lockAge:document.querySelector('[data-lock-age]')?.dataset.lockAge,caption:document.querySelector('.bv-course-state')?.textContent,result:!!document.querySelector('[data-testid="bv-result-line"]'),rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null});if(window.qaRun)requestAnimationFrame(sample);}requestAnimationFrame(sample);});
 await p.getByTestId('bp-swing').tap();await p.waitForTimeout(100);
 const timing=await p.evaluate(()=>{const el=document.querySelector('.bv-scene');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return){const pb=f.memoizedProps?.playback;if(pb?.timeline)return{timeline:pb.timeline,startedAt:pb.startedAt,rate:pb.rate};}throw Error('missingplayback');});
 await p.waitForTimeout(timing.timeline.duration/rate+100);
 const actual=await p.evaluate(()=>{window.qaRun=false;window.qaRecorder?.stop();return{samples:window.qaSamples,audio:window.qaAudio,result:sessionStorage.getItem('9zone-playable-v1:9zone-v10-run'),production:localStorage.getItem('9zone-v10-run')};});
 const bytes=await p.evaluate(()=>window.qaAudioDone||[]);await fs.writeFile(out+'/'+tag+'-audio.webm',Buffer.from(bytes));
 const ticks=actual.audio.filter(a=>a.frequency===1160),locks=actual.audio.filter(a=>a.frequency===196),virtualOnset=a=>(a.wall-timing.startedAt)*rate;
 const active=actual.samples.filter(s=>s.elapsed!=null),early=active.filter(s=>s.elapsed<timing.timeline.impactAt);
 const item={spec,timing,errors,ticks:ticks.map(a=>({...a,virtual:virtualOnset(a)})),locks:locks.map(a=>({...a,virtual:virtualOnset(a)})),samples:actual.samples,exactEngine:actual.result===JSON.stringify(expected),productionPreserved:actual.production==='production-sentinel',earlyResult:early.some(s=>s.result),lockFx:active.some(s=>s.lockAge!=null),outsideShown:zone!==9||active.some(s=>s.target.includes('9')),observedScanSteps:active.filter((s,i,a)=>s.phase==='scan'&&s.scan[0]!==a[i-1]?.scan?.[0]).length};
 item.pass=item.exactEngine&&item.productionPreserved&&!item.earlyResult&&item.lockFx&&item.outsideShown&&locks.length===1&&ticks.length>1&&ticks.every(a=>virtualOnset(a)<timing.timeline.courseLockAt)&&errors.length===0;
 report.push(item);const video=p.video();await context.close();await video.saveAs(out+'/'+tag+'.webm');await fs.writeFile(out+'/report.partial.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...item,samples:undefined,ticks:item.ticks.length,locks:item.locks.length}));
}
await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));assert(report.every(x=>x.pass),'live juice contract failed');
