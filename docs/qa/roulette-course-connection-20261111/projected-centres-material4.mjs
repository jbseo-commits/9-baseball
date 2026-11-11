import fs from 'node:fs/promises';
import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createV10Duel,enterV10Node} from '/workspace/9zone-juice100-implementation/src/duel/engine.js';
import {courseTarget} from '/workspace/9zone-juice100-implementation/src/duel/battle-vnext/course-presentation.js';
const out='/workspace/9zone-roulette-connection-20261111/projection-material4';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const report=[];
for(const [width,height] of [[568,320],[667,375],[844,390],[1280,720],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true}),errors=[];
 for(let zone=0;zone<9;zone++){
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  let state=enterV10Node(createV10Duel(1),'a1-entry');state.battle.pending={zone,roll:.01,powerRoll:.1};state.battle.intent={...state.battle.intent,repertoire:[0,1,2,3,4,5,6,7,8]};
  await p.goto('http://127.0.0.1:5397/?battleUi=vnext&coursePreview=1&battleSpeed=1');await p.evaluate(s=>{sessionStorage.clear();sessionStorage.setItem('9zone-playable-v1:9zone-v10-run',JSON.stringify(s));sessionStorage.setItem('9zone-playable-v1:9zone-bp-coach-v1','done');},state);await p.reload();await p.waitForSelector('.bv-scene');await p.waitForTimeout(250);
  await p.locator('.bv-hand-handle').tap();await p.getByTestId('bv-basic-chip').tap();await p.locator(`.bv-cell[data-zone="${zone}"]`).tap();
  await p.clock.install({time:new Date('2026-11-11T06:00:00Z')});await p.clock.pauseAt(new Date('2026-11-11T06:00:01Z'));await p.getByTestId('bp-swing').tap();await p.clock.runFor(16);
  const meta=await p.evaluate(()=>{const el=document.querySelector('.bv-scene');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return){const pb=f.memoizedProps?.playback;if(pb?.timeline)return {timeline:pb.timeline,elapsed:(performance.now()-pb.startedAt)*pb.rate,rate:pb.rate};}return null;});
  await p.clock.runFor(Math.max(0,(meta.timeline.courseLockAt+180-meta.elapsed)/meta.rate));
  const actual=await p.evaluate(({zone,T})=>{const sc=document.querySelector('.bv-scene'),sr=sc.getBoundingClientRect(),w=document.querySelector('.bv-world'),matrix=new DOMMatrix(getComputedStyle(w).transform),z=document.querySelector(`.bv-cell[data-zone="${zone}"]`),zr=z.getBoundingClientRect();const expected={x:sr.x+T.x*matrix.a+matrix.e,y:sr.y+T.y*matrix.d+matrix.f};const centre={x:zr.x+zr.width/2,y:zr.y+zr.height/2};return {expected,centre,error:Math.hypot(expected.x-centre.x,expected.y-centre.y),allCells:document.querySelectorAll('.bv-cell').length,projection:!!document.querySelector('.bv-course-projection'),target:[...document.querySelectorAll('.is-course-target')].map(e=>e.dataset.zone),scroll:{width:document.documentElement.scrollWidth,viewport:innerWidth}};},{zone,T:courseTarget(zone)});
  report.push({width,height,zone,...actual,errors:[...errors]});if(zone===4)await p.screenshot({path:out+`/battle-${width}-lock.png`});await p.close();
 }
 await context.close();await fs.writeFile(out+'/report.partial.json',JSON.stringify(report,null,2));
}
await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({count:report.length,maxError:Math.max(...report.map(x=>x.error)),failures:report.filter(x=>x.error>1||x.allCells!==9||!x.projection||x.errors.length)},null,2));if(report.some(x=>x.error>1||x.allCells!==9||!x.projection||x.errors.length))process.exitCode=1;
