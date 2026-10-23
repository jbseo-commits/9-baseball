/* First-experience browser checks. Same external Playwright setup as qa-zone-first.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const arg=(k,f)=>{const i=process.argv.indexOf('--'+k);return i<0?f:process.argv[i+1];};
const out=arg('out','/tmp/zone-first-learning'),target=new URL(arg('url','http://127.0.0.1:5173/'));
target.searchParams.set('showcase','zone-first');target.searchParams.delete('learn');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],failures=[];
const check=(name,value)=>{checks.push({name,ok:!!value});assert.ok(value,name);};
let completed=false;
try{
  for(const [width,height,label,motion] of [[360,640,'small','no-preference'],[390,844,'phone','no-preference'],[1440,900,'desktop','no-preference'],[700,690,'desktop-low','no-preference'],[390,844,'reduced','reduce']]){
    const c=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:motion});
    const p=await c.newPage();p.on('pageerror',e=>errors.push(label+': '+e.message));
    p.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
    await p.goto(target.href);await p.locator('.zf-board').waitFor();
    const shot=name=>p.screenshot({path:path.join(out,label+'-'+name+'.png'),animations:'disabled'});
    const layout=async name=>{
      check(label+' '+name+' no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      check(label+' '+name+' shell fits',await p.locator('.zf-shell').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
      check(label+' '+name+' action fits',await p.locator('.zf-go').evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight+1&&r.height>=44}));
      check(label+' '+name+' board above dock',await p.evaluate(()=>document.querySelector('.zf-board').getBoundingClientRect().bottom<=document.querySelector('.zf-dock').getBoundingClientRect().top));
      check(label+' '+name+' dock content fits',await p.locator('.zf-dock').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
    };
    const swing=async(z=5)=>{await p.locator('.zf-zone').nth(z).click();await p.getByRole('button',{name:'타격!',exact:true}).click();};
    const result=()=>p.locator('[data-zf-next]').waitFor();
    check(label+' first screen hides HP/hand/counts',await p.locator('.zf-hp,.zf-hand,.zf-card,.zf-counts').count()===0);
    check(label+' only one battle action',await p.locator('.zf-actions button').count()===1);
    await layout('first');await shot('first');
    if(label==='small'){
      await swing(4);await result();check('miss does not unlock HP',await p.locator('.zf-hp').count()===0);
      check('miss does not celebrate exact reading',await p.locator('.zf-read-hit').count()===0);
      check('miss explains coverage',/범위 밖/.test(await p.locator('.zf-explanation').innerText()));
      await p.getByRole('button',{name:/같은 공 다시 도전/}).click();
    }
    await swing();
    if(motion!=='reduce'){
      check(label+' flight is current',/공 날아옴/.test(await p.locator('[aria-current="step"]').innerText()));
      check(label+' hides result before impact',await p.locator('.zf-explanation,.zf-read-hit').count()===0);
      check(label+' zones locked in flight',await p.locator('.zf-zone').evaluateAll(es=>es.every(e=>e.disabled)));
    }
    await result();await layout('result');
    check(label+' actual exact read',await p.locator('.zf-read-hit').count()===1);
    check(label+' result explains aim and outcome',/바깥쪽 노림 → 실제 바깥쪽 → 정확 적중/.test(await p.locator('.zf-explanation').innerText()));
    if(motion==='reduce')check('reduced motion suppresses glow',await p.locator('.zf-zone.landed').evaluate(e=>getComputedStyle(e).animationName)==='none');
    await shot('result');await p.locator('[data-zf-next]').click();
    check(label+' second lesson reveals HP only',await p.locator('.zf-hp').count()===1&&await p.locator('.zf-card,.zf-counts').count()===0);
    const hp=Number(await p.getByRole('meter').getAttribute('aria-valuenow'));
    await swing();await result();check(label+' actual HP decreases',Number(await p.getByRole('meter').getAttribute('aria-valuenow'))<hp);
    await p.locator('[data-zf-next]').click();await layout('skill');await shot('skill');
    check(label+' introduces one preparation',await p.locator('.zf-card').count()===1);
    await p.locator('[data-kind="setup"]').click();await p.getByRole('button',{name:'준비 사용',exact:true}).click();
    check(label+' prep does not throw a pitch',await p.locator('.zf-preview').getAttribute('data-step')==='plan');
    check(label+' real concentration remains visible',/집중 \+1/.test(await p.locator('.zf-prepared').innerText()));
    await swing();await result();await p.getByRole('button',{name:/내 덱으로 시작/}).click();
    check(label+' real hand visible immediately',await p.locator('.zf-hand .zf-card').count()===5);
    await layout('normal');await shot('normal');
    await p.getByRole('button',{name:'전투 정보'}).click();await p.getByRole('button',{name:'처음부터 배우기'}).click();
    check(label+' learning can restart',await p.locator('.zf-preview').getAttribute('data-lesson')==='0');
    if(motion!=='reduce'){await swing();await p.getByRole('button',{name:'건너뛰기'}).click();await p.waitForTimeout(1700);}
    else await p.getByRole('button',{name:'건너뛰기'}).click();
    check(label+' skip discards pending result',await p.locator('.zf-preview').getAttribute('data-step')==='plan'&&await p.locator('.zf-hand .zf-card').count()===5);
    if(label==='phone'){
      await p.getByRole('button',{name:'전투 정보'}).click();await p.getByRole('button',{name:'처음부터 배우기'}).click();
      await p.setViewportSize({width:844,height:390});
      await p.locator('.zf-go').scrollIntoViewIfNeeded();check('landscape action reachable',await p.locator('.zf-go').isVisible());
      await p.setViewportSize({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));await layout('rotated-back');
    }
    await c.close();
  }
  check('no uncaught errors',errors.length===0);check('no failed asset requests',failures.length===0);completed=true;
}finally{
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({completed,checks,errors,failures},null,2));
  await browser.close();
}
console.log(`${checks.length} first-experience browser checks passed`);
