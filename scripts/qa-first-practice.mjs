/* Main release: first practice → real run, plus saved-run preservation. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createV10Duel,enterV10Node,applyStartPack,playV10Action} from '../src/duel/engine.js';
const arg=(k,f)=>{const i=process.argv.indexOf('--'+k);return i<0?f:process.argv[i+1];};
const target=arg('url','http://127.0.0.1:5182/9-baseball/'),out=arg('out','/tmp/first-practice');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],failures=[];
const check=(name,value)=>{checks.push({name,ok:!!value});assert.ok(value,name);};
const ui=async p=>{await p.waitForFunction(()=>document.querySelector('.title-screen,iframe'));const iframe=p.locator('iframe.portrait-frame-screen');return await iframe.count()?(await iframe.elementHandle()).contentFrame():p;};
let completed=false;
try{
 for(const [width,height,label] of [[360,640,'small'],[390,844,'phone'],[1440,900,'desktop']]){
  const c=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
  await p.goto(target);let f=await ui(p);
  await f.locator('.title-screen').waitFor();
  const shot=name=>p.screenshot({path:path.join(out,label+'-'+name+'.png'),animations:'disabled'});
  check(label+' five title entries',await f.locator('.ts-item').count()===5);
  check(label+' practice recommended',await f.getByRole('button',{name:'첫 타격 연습',exact:true}).evaluate(e=>e.classList.contains('lead')));
  await shot('title');await f.getByRole('button',{name:'첫 타격 연습',exact:true}).click();await f.locator('.zf-board').waitFor();
  check(label+' no run created by entering practice',await p.evaluate(()=>localStorage.getItem('9zone-v10-run'))===null);
  const storageBeforeEscape=await p.evaluate(()=>JSON.stringify({...localStorage}));await p.keyboard.press('Escape');
  check(label+' practice Escape does not change main preferences',await p.evaluate(()=>JSON.stringify({...localStorage}))===storageBeforeEscape);
  await shot('practice');
  for(let lesson=0;lesson<3;lesson++){
   if(lesson===2){await f.locator('[data-kind="setup"]').click();await f.getByRole('button',{name:'준비 사용',exact:true}).click();}
   await f.locator('.zf-zone').nth(5).click();await f.getByRole('button',{name:'타격!',exact:true}).click();
   await f.locator('[data-zf-next]').waitFor();
   check(label+' lesson '+lesson+' fits',await f.locator('.zf-shell').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
   await f.locator('[data-zf-next]').click();
  }
  await f.getByRole('dialog',{name:'시작 팩 선택'}).waitFor();
  check(label+' completion opens actual starter selection',await f.getByTestId('start-pack').count()===3);
  await f.getByTestId('start-pack').first().click();await f.getByTestId('start-pack-go').click();await f.getByTestId('bp-map-go').waitFor();
  const guide=f.getByRole('dialog',{name:'게임 방법',exact:true});if(await guide.count())await guide.getByRole('button',{name:'건너뛰기',exact:true}).click();
  check(label+' actual run saved',await p.evaluate(()=>JSON.parse(localStorage.getItem('9zone-v10-run')).phase)==='map');
  await f.getByTestId('bp-map-go').click();await f.getByTestId('bp-swing').waitFor();
  check(label+' real battle planning step',/코스 노리기/.test(await f.locator('.bp-progress [aria-current="step"]').innerText()));
  check(label+' plan area keeps fixed height',await f.locator('.bp-plan').evaluate(e=>e.getBoundingClientRect().height===64));
  check(label+' stage labels fit',await f.locator('.bp-progress').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await shot('battle');await f.getByTestId('bp-take').click();
  await f.getByTestId('bp-result-explanation').waitFor();
  check(label+' actual result explains taken pitch',/^지켜봄 → 실제 /.test(await f.getByTestId('bp-result-explanation').innerText()));
  check(label+' result text fits',await f.getByTestId('bp-result-explanation').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.bp-plan').getBoundingClientRect();return r.bottom<=p.bottom&&r.top>=p.top&&e.scrollWidth<=e.clientWidth+1}));
  await shot('result');
  if(label==='small'){
   let prepared=enterV10Node(applyStartPack(createV10Duel(31),'power'),'a1-entry');
   const required=['setup','loadPower','place'].map(kind=>prepared.deck.find(c=>c.kind===kind).id);
   prepared.battle.hand=[...required,...prepared.deck.map(c=>c.id).filter(id=>!required.includes(id))].slice(0,5);
   prepared.battle.draw=prepared.deck.map(c=>c.id).filter(id=>!prepared.battle.hand.includes(id));prepared.battle.discard=[];
   for(const id of required.slice(0,2))prepared=playV10Action(prepared,{type:'card',id});
   await p.evaluate(s=>localStorage.setItem('9zone-v10-run',JSON.stringify(s)),prepared);await p.reload();f=await ui(p);
   await f.getByRole('button',{name:'이어하기',exact:true}).click();await f.getByTestId('bp-swing').waitFor();
   await f.locator('[data-card-kind="place"]').click();await f.locator('.bp-cell').nth(5).click();
   check('two preparation effects remain visible',/집중/.test(await f.getByTestId('bp-plan-effects').innerText())&&/파워/.test(await f.getByTestId('bp-plan-effects').innerText()));
   check('prepared plan and instructions fit',await f.locator('.bp-plan').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
   check('prepared action remains on screen',await f.getByTestId('bp-swing').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));
   await shot('prepared');await f.getByTestId('bp-take').click();await f.getByTestId('bp-result-explanation').waitFor();
   check('prepared result explanation fits',await f.getByTestId('bp-result-explanation').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.bp-plan').getBoundingClientRect();return r.bottom<=p.bottom&&e.scrollWidth<=e.clientWidth+1}));
   await shot('prepared-result');
  }
  const saved=enterV10Node(createV10Duel(31),'a1-entry');
  await p.evaluate(s=>localStorage.setItem('9zone-v10-run',JSON.stringify(s)),saved);await p.reload();f=await ui(p);
  check(label+' saved run keeps continue recommendation',await f.getByRole('button',{name:'이어하기',exact:true}).evaluate(e=>e.classList.contains('lead')));
  await f.getByRole('button',{name:'설정',exact:true}).click();await f.getByRole('button',{name:'첫 타격 연습',exact:true}).click();
  await f.locator('.zf-zone').nth(5).click();await f.getByRole('button',{name:'타격!',exact:true}).click();
  await f.getByRole('button',{name:'타이틀로 돌아가기'}).click();await p.waitForTimeout(1600);
  check(label+' flight exit leaves original run intact',await p.evaluate(s=>localStorage.getItem('9zone-v10-run')===JSON.stringify(s),saved));
  await f.getByRole('button',{name:'설정',exact:true}).click();await f.getByRole('button',{name:'첫 타격 연습',exact:true}).click();
  await f.getByRole('button',{name:'건너뛰기',exact:true}).click();await f.getByTestId('bp-swing').waitFor();
  check(label+' skip resumes saved pitch',await p.evaluate(s=>JSON.stringify(JSON.parse(localStorage.getItem('9zone-v10-run')).battle.pending)===JSON.stringify(s.battle.pending),saved));
  check(label+' skip does not open new-run picker',await f.getByRole('dialog',{name:'시작 팩 선택'}).count()===0);
  if(label==='small'){
   await f.getByRole('button',{name:'설정 및 도움말'}).click();
   await f.getByRole('dialog',{name:'설정',exact:true}).getByRole('button',{name:'소리 꺼짐'}).click();
   await f.getByRole('button',{name:'첫 타격 연습',exact:true}).click();
   check('practice reflects host sound on',await f.getByRole('button',{name:'소리 끄기'}).count()===1);
   await f.getByRole('button',{name:'소리 끄기'}).click();await f.getByRole('button',{name:'타이틀로 돌아가기'}).click();
   await f.getByRole('button',{name:'설정',exact:true}).click();
   check('practice sound off reaches host settings',await f.getByRole('dialog',{name:'설정',exact:true}).getByRole('button',{name:'소리 꺼짐'}).count()===1);
   await f.getByRole('button',{name:'전략 → 자동전투 체험'}).click();await f.getByTestId('bp-auto-lesson').waitFor();
   await f.getByRole('button',{name:'설정 및 도움말'}).click();await f.getByRole('button',{name:'첫 타격 연습',exact:true}).click();
   await f.getByRole('button',{name:'건너뛰기',exact:true}).click();await f.getByTestId('bp-swing').waitFor();
   check('autobattle sandbox flag cleared on return',await f.getByTestId('bp-auto-lesson').count()===0);
   check('normal progress indicator restored',await f.locator('.bp-progress').count()===1);
   await f.getByTestId('bp-take').click();
   check('main action still persists after sandbox practice',await p.evaluate(s=>JSON.parse(localStorage.getItem('9zone-v10-run')).stats.pitches===s.stats.pitches+1,saved));
  }
  await c.close();
 }
 check('no uncaught errors',errors.length===0);check('no failed resources',failures.length===0);completed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({completed,checks,errors,failures},null,2));await browser.close();}
console.log(`${checks.length} main practice integration checks passed`);
