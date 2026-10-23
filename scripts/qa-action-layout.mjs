/* Regression for action captions pushed into the frame by inherited grid gaps.
   Run against a production build; verify the actual inner text geometry. */
import fs from 'node:fs';
import path from 'node:path';
import {createV10Duel,enterV10Node,playV10Action,setAimZone} from '../src/duel/engine.js';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const url=arg('url','http://127.0.0.1:5183/9-baseball/'),out=arg('out','/tmp/action-layout');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],failures=[];let completed=false;
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(ok?{}:{detail})});
function fixture(){
 let s=createV10Duel(1);s.deck=['place','cutMaster','loadPower','laser','rally','setup','watch','slug','place'].map((kind,i)=>({id:'q'+i,kind}));s.nextId=s.deck.length;s=enterV10Node(s,'a1-entry');
 s.battle.hand=s.deck.slice(0,5).map(c=>c.id);s.battle.draw=s.deck.slice(5).map(c=>c.id);s.battle.discard=[];s.battle.pending={zone:9,roll:.5,powerRoll:.5};return s;
}
const ui=async p=>{await p.waitForFunction(()=>document.querySelector('.title-screen,iframe'));const el=p.locator('iframe.portrait-frame-screen');return await el.count()?(await el.elementHandle()).contentFrame():p;};
async function open(p,s){
 await p.goto(url);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-hint-chase','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},s);
 await p.reload();const f=await ui(p);await f.getByRole('button',{name:'이어하기',exact:true}).waitFor();
 // Result saves auto-advance after 1.1 seconds. Only hold while measuring them.
 if(s.phase!=='battle'){await p.clock.install();await p.clock.pauseAt(new Date());}
 await f.getByRole('button',{name:'이어하기',exact:true}).click();await f.locator('.bp-battle').waitFor();await f.evaluate(()=>document.fonts.ready);return f;
}
async function measure(p,f,label){
 const host=p.locator('iframe.portrait-frame-screen');
 if(await host.count()){
  const box=await host.boundingBox(),viewport=p.viewportSize();
  check(label+' scaled frame stays within host',box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,{box,viewport});
 }
 const geometry=await f.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,r:r.right};};
  return {viewport:{w:innerWidth,h:innerHeight},scroll:document.documentElement.scrollWidth-innerWidth,buttons:[...document.querySelectorAll('.bp-verbs .bp-verb')].map(e=>{
   const title=e.querySelector('.bp-verb-word'),caption=e.querySelector('small'),style=getComputedStyle(e),icon=getComputedStyle(e,'::before');
   return {text:e.textContent,box:rect(e),title:rect(title),titleOverflow:title.scrollWidth-title.clientWidth,caption:caption?rect(caption):null,
    captionOverflow:caption?caption.scrollWidth-caption.clientWidth:0,isWait:e.classList.contains('wait'),
    iconRight:rect(e).x+parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft)+parseFloat(icon.width)};
  })};
 });
 check(label+' actions stay within screen',geometry.scroll<=1&&geometry.buttons.every(b=>b.box.x>=0&&b.box.r<=geometry.viewport.w+1&&b.box.b<=geometry.viewport.h+1),geometry);
 for(const [i,b] of geometry.buttons.entries()){
  check(label+' '+i+' title is whole and beside icon',b.titleOverflow<=1&&b.title.x>=b.iconRight+2&&b.title.r<=b.box.r-6+.5,b);
  check(label+' '+i+' title and caption fit within frame',b.title.y>=b.box.y+7&&(!b.caption||b.caption.b<=b.box.b-7),b);
  check(label+' '+i+' caption directly follows title',!b.caption||(b.caption.y>=b.title.b-1&&b.caption.y-b.title.b<=5),b);
  check(label+' '+i+' caption aligns with title',!b.caption||Math.abs(b.title.x-b.caption.x)<=1,b);
  if(b.isWait)check(label+' take consequence is not truncated',b.captionOverflow<=1,b);
 }
 await p.screenshot({path:path.join(out,label+'.png'),animations:'disabled'});
}
try{
 for(const [width,height,label] of [[320,640,'tiny'],[360,640,'small'],[390,844,'phone'],[480,900,'wide'],[1440,900,'desktop'],[900,500,'short-desktop']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});const p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
  let f=await open(p,fixture());await measure(p,f,label+'-idle');
  await f.locator('[data-card-kind="cutMaster"]').click();await f.locator('.bp-cell').nth(4).click();await measure(p,f,label+'-attack');
  check(label+' selected attack has card inspection',await f.locator('.bp-info').isVisible());
  if(label==='short-desktop'){
   const host=await p.locator('iframe.portrait-frame-screen').elementHandle();
   await p.setViewportSize({width,height:700});await f.waitForFunction(()=>innerHeight===700);
   const before=await p.evaluate(()=>localStorage.getItem('9zone-v10-run'));
   for(const h of [500,640,700]){
    await p.setViewportSize({width,height:h});await f.waitForFunction(h=>innerHeight===Math.max(640,h),h);
    check('resize '+h+' keeps iframe identity',await host.evaluate(e=>e===document.querySelector('iframe.portrait-frame-screen')));
    check('resize '+h+' keeps selected attack',await f.locator('[data-card-kind="cutMaster"]').evaluate(e=>e.classList.contains('main')));
    check('resize '+h+' leaves save unchanged',await p.evaluate(()=>localStorage.getItem('9zone-v10-run'))===before);
    check('resize '+h+' uses fitting only below boundary',await host.evaluate((e,h)=>h<640?e.style.height==='640px':e.style.height==='',h));
   }
   await p.setViewportSize({width,height});await f.waitForFunction(()=>innerHeight===640);
  }
  await f.locator('[data-card-kind="loadPower"]').click();await measure(p,f,label+'-prepare');
  await f.getByTestId('bp-swing').click();await f.locator('[data-card-kind="cutMaster"]').click();await f.locator('.bp-cell').nth(4).click();
  check(label+' paid preparation still restricts energy',await f.getByTestId('bp-swing').isDisabled());await measure(p,f,label+'-unaffordable');
  const twoStrikes=fixture();twoStrikes.battle.strikes=2;f=await open(p,twoStrikes);
  await f.locator('[data-card-kind="cutMaster"]').click();await f.locator('.bp-cell').nth(4).click();await measure(p,f,label+'-two-strikes');
  if(width===390){await p.setViewportSize({width:844,height:390});await f.locator('.bp-battle').waitFor();check('rotated battle remains mounted under rotation guidance',await f.getByTestId('bp-take').isVisible());await p.setViewportSize({width,height});await measure(p,f,label+'-rotated-back');}
  const pitch=playV10Action(fixture(),{type:'take'});f=await open(p,pitch);await measure(p,f,label+'-next-pitch');await p.clock.resume();
  let hit=fixture();hit.battle.pending.zone=4;hit=setAimZone(hit,4);hit=playV10Action(hit,{type:'card',id:'basic'});
  f=await open(p,hit);check(label+' hit reaches next batter',hit.phase==='between');await measure(p,f,label+'-next-batter');await p.clock.resume();
  await ctx.close();
 }
 check('no uncaught errors',errors.length===0,errors);check('no failed resources',failures.length===0,failures);completed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({completed,checks,errors,failures},null,2));await browser.close();}
const failed=checks.filter(c=>!c.ok);console.log(`${checks.length-failed.length}/${checks.length} action layout checks passed`);for(const c of failed)console.log('FAIL',c.name,JSON.stringify(c.detail));if(failed.length)process.exitCode=1;
