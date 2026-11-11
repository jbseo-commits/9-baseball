import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
import {createV10Duel,enterV10Node,setAimZone,playV10Action} from '../src/duel/engine.js';
const out=process.env.QA_OUT||'/tmp/9zone-zone-board';await fs.mkdir(out,{recursive:true});
const targetBase=process.env.BASE_URL||'http://127.0.0.1:5199/';
const proxyValue=targetBase.startsWith('https:')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY),proxy=proxyValue?new URL(proxyValue):null;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox'],...(proxy?{proxy:{server:proxy.protocol+'//'+proxy.host,...(proxy.username?{username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)}:{})}}:{})});const reports=[];
for(const [width,height] of JSON.parse(process.env.VIEWPORTS||'[[568,320],[667,375],[844,390],[1280,720],[1440,900]]')){
 const p=await browser.newPage({viewport:{width,height},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const base=targetBase;
 let state=enterV10Node(createV10Duel(1),'a1-entry');state.battle.pending={zone:4,roll:.01,powerRoll:.1};state.battle.intent={...state.battle.intent,repertoire:[0,1,2,3,4,5,6,7,8]};
 await p.goto(base+'?battleUi=vnext&battlePlay=1&coursePreview=1&battleSpeed=1&v='+(process.env.RELEASE_SHA||'local'));await p.evaluate(s=>{sessionStorage.clear();sessionStorage.setItem('9zone-playable-v1:9zone-v10-run',JSON.stringify(s));sessionStorage.setItem('9zone-playable-v1:9zone-bp-coach-v1','done');},state);await p.reload();await p.waitForSelector('.bv-scene');await p.waitForFunction(()=>[...document.querySelectorAll('[data-testid="bv-course-batter"] img')].some(im=>im.complete&&im.naturalWidth===4096),null,{timeout:20000});
 await p.locator('.bv-hand-handle').tap();await p.getByTestId('bv-basic-chip').tap();await p.locator('.bv-cell[data-zone="4"]').tap();
 await p.evaluate(()=>{window.__initialZone=document.querySelector('.bv-zone');});
 const measure=()=>p.evaluate(()=>{const z=document.querySelector('.bv-zone'),r=z.getBoundingClientRect(),c=document.querySelector('.bv-cell'),cr=c.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,ratio:r.width/r.height,cellWidth:cr.width,cellHeight:cr.height,sameNode:z===window.__initialZone,count:document.querySelectorAll('.bv-zone').length,buttons:z.querySelectorAll('button').length,disabled:[...z.querySelectorAll('button')].every(b=>b.disabled),caption:document.querySelector('.bv-course-state')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth};});
 const stages=[{stage:'planning',...await measure()}];await p.screenshot({path:out+`/battle-${width}-planning.png`});
 await p.clock.install({time:new Date('2026-11-11T12:00:00Z')});await p.clock.pauseAt(new Date('2026-11-11T12:00:01Z'));await p.getByTestId('bp-swing').tap();await p.clock.runFor(16);
 const meta=await p.evaluate(()=>{const el=document.querySelector('.bv-scene');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return){const pb=f.memoizedProps?.playback;if(pb?.timeline)return{timeline:pb.timeline,elapsed:(performance.now()-pb.startedAt)*pb.rate,rate:pb.rate};}throw Error('hostmissing');});
 for(const [stage,time] of [['scan',meta.timeline.courseLockAt/2],['lock',meta.timeline.courseLockAt+180],['flight',meta.timeline.pitchReleaseAt+120],['contact',meta.timeline.impactAt+25],['settled',meta.timeline.duration+40]]){
  await p.clock.runFor(Math.max(0,(time-meta.elapsed)/meta.rate));meta.elapsed=time;stages.push({stage,...await measure()});await p.screenshot({path:out+`/battle-${width}-${stage}.png`});
 }
 const expected=playV10Action(setAimZone(state,4),{type:'card',id:'basic'}),actual=await p.evaluate(()=>sessionStorage.getItem('9zone-playable-v1:9zone-v10-run'));
 const initial=stages[0],deltas=stages.slice(1).map(s=>({stage:s.stage,delta:Math.max(...['x','y','width','height'].map(k=>Math.abs(s[k]-initial[k])))}));
 reports.push({width,height,stages,deltas,exactEngine:actual===JSON.stringify(expected),errors,pass:deltas.every(x=>x.delta<=1)&&stages.every(x=>x.sameNode&&Math.abs(x.ratio-1)<0.01&&Math.abs(x.cellWidth-x.cellHeight)<=1&&x.count===1&&x.buttons===9&&!x.overflow&&(x.stage==='planning'||x.disabled)&&(x.stage!=='scan'||x.caption==='코스 확인 중')&&(!['lock','flight'].includes(x.stage)||x.caption?.includes('확정'))&&(!['contact','settled'].includes(x.stage)||x.caption?.includes('도착')))});await p.close();
}
await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));if(reports.some(x=>!x.pass||!x.exactEngine||x.errors.length))process.exitCode=1;
