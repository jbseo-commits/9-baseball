import fs from 'node:fs/promises';
import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createV10Duel,enterV10Node} from '/workspace/9zone-juice100-implementation/src/duel/engine.js';
const root='/workspace/9zone-roulette-connection-20261111/material4';
await fs.mkdir(root+'/before',{recursive:true});await fs.mkdir(root+'/after',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const report=[];
for(const [width,height] of [[844,390],[1280,720]])for(const zone of [1,4,7])for(const candidate of [false,true]){
 const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(6000);
 let s=enterV10Node(createV10Duel(1),'a1-entry');s.battle.pending={zone,roll:.01,powerRoll:.1};s.battle.intent={...s.battle.intent,repertoire:[0,1,2,3,4,5,6,7,8]};
 await p.goto(`http://127.0.0.1:5397/?battleUi=vnext&battlePlay=1&battleSpeed=0.5${candidate?'&coursePreview=1':''}`);
 await p.evaluate(s=>{localStorage.clear();sessionStorage.clear();sessionStorage.setItem('9zone-playable-v1:9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-hint-chase','9zone-bp-coach-v1'])sessionStorage.setItem('9zone-playable-v1:'+k,'done');},s);
 await p.reload();await p.waitForSelector('.bv-scene');await p.waitForTimeout(700);
 await p.locator('.bv-hand-handle').click();await p.getByTestId('bv-basic-chip').click();await p.locator(`.bv-cell[data-zone="${zone}"]`).click();
 await p.clock.install({time:new Date('2026-11-11T05:00:00Z')});await p.clock.pauseAt(new Date('2026-11-11T05:00:01Z'));
 await p.getByTestId('bp-swing').click();await p.clock.runFor(16);
 const meta=await p.evaluate(()=>{const el=document.querySelector('.bv-scene');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return){const pb=f.memoizedProps?.playback;if(pb?.timeline)return {timeline:pb.timeline,elapsed:(performance.now()-pb.startedAt)*pb.rate,rate:pb.rate};}return null;});
 if(!meta)throw Error('No existing host presentation');
 const captures=[];
 if(zone===4){const to=(meta.timeline.courseLockAt??Math.max(0,meta.timeline.pitchReleaseAt-260))+180;await p.clock.runFor(Math.max(0,(to-meta.elapsed)/meta.rate));const file=`battle-${width}-z${zone}-lock.png`;await p.screenshot({path:root+`/${candidate?'after':'before'}/`+file});captures.push(file);meta.elapsed=to;}
 const to=meta.timeline.impactAt+25;await p.clock.runFor(Math.max(0,(to-meta.elapsed)/meta.rate));const file=`battle-${width}-z${zone}-contact.png`;await p.screenshot({path:root+`/${candidate?'after':'before'}/`+file});captures.push(file);
 const actual=await p.evaluate(()=>({courseFrame:document.querySelector('[data-course-frame]')?.dataset.courseFrame,pose:document.querySelector('.bv-actor-batter')?.dataset.pose,phase:document.querySelector('.bv-scene')?.dataset.phase,projection:!!document.querySelector('.bv-course-projection')}));report.push({width,height,zone,candidate,captures,meta,actual,errors});await p.close();
}
await browser.close();await fs.writeFile(root+'/capture-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({meta,...r})=>r),null,2));
