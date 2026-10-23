/* Production browser contract for the asset-led main battle. Fixtures exercise
   presentation; the shipped game never changes pending pitches or RNG. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createV10Duel,enterV10Node} from '../src/duel/engine.js';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const url=arg('url','http://127.0.0.1:5184/'),out=arg('out','/tmp/asset-led');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],failures=[];let completed=false;
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});assert.ok(ok,name+' '+JSON.stringify(detail||''));};
const ui=async p=>{await p.waitForFunction(()=>document.querySelector('.title-screen,iframe'));const el=p.locator('iframe.portrait-frame-screen');return await el.count()?(await el.elementHandle()).contentFrame():p;};
function fixture(){
 let s=createV10Duel(1);const kinds=['place','place','setup','loadPower','slug','flow','watch','bunt','cutMaster'];
 s.deck=kinds.map((kind,i)=>({id:'a'+i,kind}));s.nextId=kinds.length;s=enterV10Node(s,'a1-entry');
 s.battle.hand=s.deck.slice(0,5).map(c=>c.id);s.battle.draw=s.deck.slice(5).map(c=>c.id);s.battle.discard=[];
 s.battle.pending={zone:4,roll:.5,powerRoll:.5};return s;
}
try{
 for(const [width,height,label] of [[360,640,'small'],[375,667,'compact'],[390,844,'phone'],[412,743,'wide-phone'],[1440,900,'desktop']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
  await p.goto(url);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-hint-chase','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},fixture());
  await p.reload();const f=await ui(p);await f.getByRole('button',{name:'이어하기',exact:true}).click();await f.locator('.bp-asset-led').waitFor();
  await f.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
  const shot=name=>p.screenshot({path:path.join(out,label+'-'+name+'.png'),animations:'disabled'});
  check(label+' public words have asset marks',await f.locator('.bp-cell [data-course-mark]').count()===9);
  check(label+' legend is visible',await f.locator('.ba-legend').isVisible());
  const geometry=await f.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,r:r.right};};
   const stage=rect(document.querySelector('.bp-stage')),legend=rect(document.querySelector('.ba-legend'));
   return {cells:[...document.querySelectorAll('.bp-cell')].map(rect),stage,legend,action:rect(document.querySelector('[data-testid=bp-swing]')),height:innerHeight,
    overflow:document.documentElement.scrollWidth-innerWidth,
    step:document.querySelector('.bp-progress').scrollWidth-document.querySelector('.bp-progress').clientWidth,
    frame:getComputedStyle(document.querySelector('.bp-card')).borderImageSource,
    icon:getComputedStyle(document.querySelector('[data-testid=bp-take]'),'::before').backgroundImage};
  });
  check(label+' all nine targets at least 44px',geometry.cells.every(c=>c.w>=44&&c.h>=44),geometry.cells[0]);
  check(label+' legend stays inside arena',geometry.legend.b<=geometry.stage.b&&geometry.legend.x>=0&&geometry.legend.r<=geometry.stage.r,geometry.legend);
  check(label+' action on screen',geometry.action.b<=geometry.height+1,geometry.action);
  check(label+' no horizontal or step overflow',geometry.overflow<=1&&geometry.step<=1,geometry);
  check(label+' illustrated frame and action loaded',geometry.frame.includes('stadium-panel')&&geometry.icon.includes('action-atlas'));
  await shot('plan');
  await f.locator('[data-card-kind="setup"]').click();
  check(label+' preparation has its own action art',await f.getByTestId('bp-swing').evaluate(e=>e.dataset.actionKind==='prepare'&&/svg/.test(getComputedStyle(e,'::before').backgroundImage)));
  // Main + support remain distinct and native selection reaches the real save.
  await f.locator('[data-card-kind="place"]').first().click();await f.locator('.bp-cell').nth(4).click();
  await f.locator('[data-card-kind="place"]').nth(1).click();await f.locator('.bp-cell').nth(5).click();
  check(label+' main aim has its sight',await f.locator('.bp-cell.aim .ba-aim-marker').count()===1);
  check(label+' support shape and order retained',await f.locator('.bp-cell.assist .bp-token').innerText()==='2');
  check(label+' action retains selected name',/정타 노림/.test(await f.locator('.ba-action-caption').innerText()));
  const before=await p.evaluate(()=>localStorage.getItem('9zone-v10-run'));
  await f.getByTestId('bp-inspect-open').click();await f.getByTestId('bp-inspect').waitFor();
  check(label+' inspector keeps hand and selection',await f.locator('.bp-hand').isVisible()&&await f.locator('.bp-card.support').count()===1);
  await f.getByTestId('bp-inspect-back').click();
  check(label+' inspector preserves saved choice',await p.evaluate(()=>localStorage.getItem('9zone-v10-run'))===before);
  await shot('ready');
  await f.getByTestId('bp-swing').click();await f.locator('[data-battle-step="flight"]').waitFor();
  check(label+' flight keeps result seal hidden',await f.locator('.ba-verdict-icon,.ba-exact-label').count()===0);
  await f.locator('.ba-exact-label').waitFor();
  check(label+' contact shows actual exact seal',await f.locator('.ba-verdict-icon.ba-exact').count()===1);
  check(label+' result is explained',/정확 적중/.test(await f.getByTestId('bp-result-explanation').innerText()));
  await shot('result');
  await ctx.close();
 }
 // Reduced motion retains every semantic state without the new contact animation.
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await ctx.newPage();
 await p.goto(url);await p.evaluate(s=>{localStorage.setItem('9zone-v10-run',JSON.stringify(s));localStorage.setItem('9zone-bp-coach-v1','done');},fixture());await p.reload();const f=await ui(p);
 await f.getByRole('button',{name:'이어하기',exact:true}).click();await f.locator('.bp-card.basic').click();await f.locator('.bp-cell').nth(4).click();await f.getByTestId('bp-swing').click();await f.locator('.bp-exact-read').waitFor();
 check('reduced motion suppresses new contact animation',await f.locator('.bp-cell.actual .bp-pitch-mark').evaluate(e=>getComputedStyle(e).animationName)==='none');
 await p.evaluate(s=>localStorage.setItem('9zone-v10-run',JSON.stringify(s)),fixture());await p.reload();const quiet=await ui(p);
 await quiet.getByRole('button',{name:'이어하기',exact:true}).click();await quiet.getByTestId('bp-take').click();await quiet.locator('.ba-verdict-icon').waitFor();
 check('reduced motion keeps result centered on board',await quiet.evaluate(()=>{const a=document.querySelector('.bp-verdict').getBoundingClientRect(),b=document.querySelector('.bp-zone').getBoundingClientRect();return Math.abs((a.left+a.width/2)-(b.left+b.width/2))<2}));
 await ctx.close();
 check('no uncaught errors',errors.length===0,errors);check('no failed resources',failures.length===0,failures);completed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({completed,checks,errors,failures},null,2));await browser.close();}
console.log(`${checks.length} asset-led checks passed`);
