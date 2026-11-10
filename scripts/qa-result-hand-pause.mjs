// Timed real-input regression. The engine is a QA oracle, never a player policy.
import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL}from'node:url';
import * as E from '../src/duel/engine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5390/',out=process.env.QA_OUT||'/tmp/qa-result-hand-pause',checks=[],errors=[];await fs.mkdir(out,{recursive:true});
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail}),save=p=>p.evaluate(()=>localStorage.getItem('9zone-v10-run'));
const fixtures={take:E.playV10Action(E.enterV10Node(E.createV10Duel(3),'a1-entry'),{type:'take'})};
for(let seed=1;seed<100&&!fixtures.hit;seed++){let s=E.enterV10Node(E.createV10Duel(seed),'a1-entry');if(s.battle.pending.zone===9)continue;s=E.setAimZone(s,s.battle.pending.zone);const id=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='place');if(!id)continue;const hit=E.playV10Action(s,{type:'card',id});if(hit.phase==='between')fixtures.hit=hit;}
if(!fixtures.hit)throw Error('No legal between fixture');
const proxyUrl=base.startsWith('https:')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY),u=proxyUrl?new URL(proxyUrl):null,proxy=u?{server:u.protocol+'//'+u.host,...(u.username?{username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}:{})}:undefined;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox'],...(proxy?{proxy}:{})});
const activate=(p,el)=>p.viewportSize().width<1000?el.tap():el.click();
async function page(state,w,h){
 const p=await browser.newPage({viewport:{width:w,height:h},hasTouch:w<1000,isMobile:w<1000});p.on('pageerror',e=>errors.push(e.message));const t=new Date('2026-11-11T00:00:00Z');await p.clock.install({time:t});await p.clock.pauseAt(t);
 await p.addInitScript(s=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem('9zone-v10-run',JSON.stringify(s));localStorage.setItem('9zone-bp-coach-v1','done');sessionStorage.setItem('qa-seeded','1');}},state);
 await p.goto(base);await activate(p,p.getByRole('button',{name:/^이어하기/}));await p.evaluate(()=>document.fonts.ready);return p;
}
const next=s=>s.phase==='between'?E.advanceV10Batter(s):E.advanceV10Pitch(s);
try{
 for(const [w,h]of[[568,320],[667,375],[844,390],[1280,720]])for(const[kind,state]of Object.entries(fixtures)){
  const tag=`${w} ${kind}`,p=await page(state,w,h),initial=await save(p);await p.clock.runFor(900);await activate(p,p.getByRole('button',{name:'손패 펼치기',exact:true}));
  check(tag+' opening hand keeps exact saved result',await save(p)===initial);
  if(kind==='take'&&w<1000){await p.evaluate(()=>Promise.allSettled([...document.images].map(i=>i.decode())));await p.screenshot({path:path.join(out,`battle-hand-reading-${w}.png`),animations:'disabled'});}
  await p.clock.runFor(4400);const held=await save(p)===initial;check(tag+' open hand holds exact result beyond first deadline and retries',held,{handOpen:await p.locator('.battle-vnext').getAttribute('data-hand-open'),phase:JSON.parse(await save(p)).phase});
  if(!held){await p.close();continue;}
  await activate(p,p.getByRole('button',{name:'경기 정보 및 메뉴'}));await p.clock.runFor(1500);check(tag+' nested inspector holds state',await save(p)===initial);await p.keyboard.press('Escape');await p.clock.runFor(1500);check(tag+' closing inspector still waits for open hand',await save(p)===initial&&await p.locator('.battle-vnext').getAttribute('data-hand-open')==='true');
  await p.keyboard.press('Escape');await p.clock.runFor(1099);check(tag+' folded hand waits a fresh full beat',await save(p)===initial);await p.clock.runFor(1);check(tag+' auto-next resumes exact engine state',await save(p)===JSON.stringify(next(state)));await p.clock.runFor(1500);check(tag+' old retry cannot advance again',await save(p)===JSON.stringify(next(state)));await p.close();
 }
 // A deliberate next action is still available during optional inspection.
 for(const[kind,state]of Object.entries(fixtures)){
  const p=await page(state,667,375);await p.clock.runFor(200);await activate(p,p.getByRole('button',{name:'손패 펼치기',exact:true}));await activate(p,p.getByTestId('bp-next'));await p.clock.runFor(1600);check(kind+' manual next advances exactly once with hand open',await save(p)===JSON.stringify(next(state)));await p.close();
 }
 // View state is transient; reload must neither reseed nor inherit a stuck pause.
 {const state=fixtures.take,p=await page(state,568,320),initial=await save(p);await p.clock.runFor(200);await activate(p,p.getByRole('button',{name:'손패 펼치기',exact:true}));await p.reload();await activate(p,p.getByRole('button',{name:/^이어하기/}));check('reload keeps exact result and starts folded',await save(p)===initial&&await p.locator('.battle-vnext').getAttribute('data-hand-open')==='false');await p.clock.runFor(1100);check('reload has no stale drawer pause',await save(p)===JSON.stringify(next(state)));await p.close();}
}catch(e){check('aborted',false,e.message);}finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify({base,method:'Actual touch/mouse controls; explicit paused clock advances measured intervals. Legal engine fixtures; hidden pending used only to construct a between-result QA fixture, not a player policy.',checks,errors,failed:checks.filter(c=>!c.ok).length},null,2));}
console.log(`${checks.filter(c=>c.ok).length}/${checks.length}, ${errors.length} page errors`);if((checks.some(c=>!c.ok)||errors.length)&&process.env.QA_REPORT_ONLY!=='1')process.exitCode=1;
