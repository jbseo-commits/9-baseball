/* Production interaction checks for real 2/3-energy turns and legacy resume.
   Fixtures pin a visible hand, not a larger budget for new-game checks. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createV10Duel,enterV10Node} from '../src/duel/engine.js';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const url=arg('url','http://127.0.0.1:5183/9-baseball/'),out=arg('out','/tmp/two-energy');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],failures=[];let completed=false;
const check=(name,ok)=>{checks.push({name,ok:!!ok});assert.ok(ok,name);};
const ui=async p=>{await p.waitForFunction(()=>document.querySelector('.title-screen,iframe'));const el=p.locator('iframe.portrait-frame-screen');return await el.count()?(await el.elementHandle()).contentFrame():p;};
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('9zone-v10-run')));
function fixture(){
 let s=createV10Duel(1);const kinds=['rally','place','scout','laser','wall','setup','place','watch','slug'];
 s.deck=kinds.map((kind,i)=>({id:'q'+i,kind}));s.nextId=kinds.length;s=enterV10Node(s,'a1-entry');
 s.battle.hand=s.deck.slice(0,5).map(c=>c.id);s.battle.draw=s.deck.slice(5).map(c=>c.id);s.battle.discard=[];
 s.battle.pending={zone:9,roll:.5,powerRoll:.5};return s;
}
async function open(p,s){
 await p.goto(url);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-hint-chase','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},s);
 await p.reload();const f=await ui(p);await f.getByRole('button',{name:'이어하기',exact:true}).click();await f.locator('.bp-battle').waitFor();return f;
}
async function next(f){await f.getByTestId('bp-next').waitFor();await f.getByTestId('bp-next').click();await f.locator('[data-battle-step="plan"]').waitFor();}
try{
 for(const [width,height,label] of [[360,640,'small'],[390,844,'phone'],[1440,900,'desktop']]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});const p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
  let f=await open(p,fixture());
  const energy=()=>f.getByTestId('bp-energy').getAttribute('aria-label');
  const card=k=>f.locator(`[data-card-kind="${k}"]`);
  const aim=z=>f.locator('.bp-cell').nth(z).click();
  check(label+' opens at 2/2',await energy()==='에너지 2/2');
  check(label+' ordinary row badge costs 2',await card('rally').locator('.bp-card-cost').innerText()==='2');
  await card('rally').click();await aim(4);
  check(label+' row alone is affordable',await f.getByTestId('bp-swing').isEnabled());
  check(label+' point support warns of budget',/지원 비용 초과/.test(await card('place').innerText()));
  check(label+' selecting spends no energy',(await state(p)).battle.energy===2);
  await p.screenshot({path:path.join(out,label+'-row.png'),animations:'disabled'});
  await f.getByTestId('bp-take').click();
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('9zone-v10-run')).phase==='pitch');
  check(label+' take reserves without refilling',(await state(p)).battle.energy===2&&(await state(p)).battle.takeEnergyBonus===1);
  await next(f);check(label+' real next pitch has 3/3',await energy()==='에너지 3/3');
  await card('rally').click();await aim(4);await card('place').click();await aim(5);
  check(label+' boosted pitch permits row plus point',await f.locator('.bp-card.support').count()===1&&await f.getByTestId('bp-swing').isEnabled());
  check(label+' preview says cost 3',/비용 3 · 남음 0/.test(await f.getByTestId('bp-energy').innerText()));
  await f.getByTestId('bp-swing').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('9zone-v10-run')).stats.pitches===2);
  check(label+' real action consumes exactly 3',(await state(p)).battle.energy===0);
  await p.reload();f=await ui(p);await f.getByRole('button',{name:'이어하기',exact:true}).waitFor();
  // Resume legitimately auto-advances after 1.1s. Hold that clock while checking
  // the restored result, then release it; do not mistake the next pitch for a refill on load.
  await p.clock.install();await p.clock.pauseAt(new Date());
  await f.getByRole('button',{name:'이어하기',exact:true}).click();await f.locator('.bp-battle').waitFor();
  check(label+' spent boosted save resumes at 0/3',await energy()==='에너지 0/3');
  await p.clock.resume();

  f=await open(p,fixture());await card('scout').click();await f.getByTestId('bp-swing').click();
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('9zone-v10-run')).battle.energy===1);
  await card('rally').click();await aim(4);
  check(label+' paid prep blocks expensive row',await f.getByTestId('bp-swing').isDisabled());
  await card('place').click();await aim(4);
  check(label+' paid prep leaves point affordable',await f.getByTestId('bp-swing').isEnabled());
  f=await open(p,fixture());await card('laser').click();await aim(4);
  check(label+' signature keeps three zones for cost 1',await card('laser').locator('.bp-card-cost').innerText()==='1'&&await f.locator('.bp-cell.cover').count()===3);
  await card('place').click();await aim(5);
  check(label+' signature plus point fits base budget',await f.locator('.bp-card.support').count()===1&&await f.getByTestId('bp-swing').isEnabled());
  await card('wall').click();await aim(4);
  check(label+' wide signature costs 2 and covers five',await card('wall').locator('.bp-card-cost').innerText()==='2'&&await f.locator('.bp-cell.cover').count()===5);
  check(label+' HUD and actions fit screen',await f.evaluate(()=>{const a=document.querySelector('[data-testid=bp-swing]').getBoundingClientRect();return a.bottom<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1;}));
  const legacy=fixture();legacy.battle.energy=4;legacy.battle.energyCap=4;
  f=await open(p,legacy);check(label+' old current pitch remains 4/4',await energy()==='에너지 4/4');
  await f.getByTestId('bp-take').click();await next(f);
  check(label+' old save enters new 3/3 after take',await energy()==='에너지 3/3');
  await ctx.close();
 }
 check('no uncaught errors',errors.length===0);check('no failed resources',failures.length===0);completed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({completed,checks,errors,failures},null,2));await browser.close();}
console.log(`${checks.length} two-energy browser checks passed`);
