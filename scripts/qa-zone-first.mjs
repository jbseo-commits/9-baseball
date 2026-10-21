/* Interactive preview QA. Playwright is supplied externally, as in qa-shots.mjs.
   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium
   node scripts/qa-zone-first.mjs --url https://host/base/ --out /tmp/zone-first-qa */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const arg=(key,fallback)=>{const i=process.argv.indexOf('--'+key);return i<0?fallback:process.argv[i+1];};
const base=arg('url','http://127.0.0.1:5173/'),out=arg('out','/tmp/zone-first-qa');
const target=new URL(base);target.searchParams.set('showcase','zone-first');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],failures=[];
let completed=false;
const check=(name,value)=>{checks.push({name,ok:!!value});assert.ok(value,name);};
const shot=(p,label)=>p.screenshot({path:path.join(out,label+'.png'),animations:'disabled'});
const box=el=>el.boundingBox();
const stable=(a,b)=>['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<1);
try{
  for(const [width,height,label] of [[360,640,'smallest'],[375,667,'small'],[390,844,'phone'],[1440,900,'desktop']]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
    const p=await context.newPage();p.on('pageerror',e=>errors.push(label+': '+e.message));
    p.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
    await p.goto(target.href);await p.locator('.zf-board').waitFor();
    check(label+' hides hand initially',await p.locator('.zf-card').count()===0);
    check(label+' nine zones',await p.locator('.zf-zone').count()===9);
    check(label+' no horizontal page overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    check(label+' shell has no internal vertical overflow',await p.locator('.zf-shell').evaluate(el=>el.scrollHeight<=el.clientHeight+1));
    const original=await box(p.locator('.zf-board'));
    check(label+' actions fit viewport',(await box(p.locator('.zf-actions'))).y+(await box(p.locator('.zf-actions'))).height<=height+1);
    await shot(p,label+'-aim');
    await p.getByRole('button',{name:/손패 보기/}).click();
    await p.getByRole('button',{name:'손패 접기',exact:true}).click();
    check(label+' hand can be folded without selecting',await p.locator('.zf-preview').getAttribute('data-step')==='aim');
    await p.getByRole('button',{name:/손패 보기/}).click();await p.locator('[data-kind="place"]').click();
    check(label+' card-first has no guessed coverage',await p.locator('.zf-zone.covered').count()===0);
    check(label+' card-first has no guessed aim',await p.locator('.zf-zone[aria-pressed="true"]').count()===0);
    check(label+' card-first cannot attack before aiming',await p.getByRole('button',{name:'코스를 선택하세요',exact:true}).isDisabled());
    check(label+' card-first board remains fixed',stable(original,await box(p.locator('.zf-board'))));
    await shot(p,label+'-card-first');await p.getByRole('button',{name:'처음부터',exact:true}).click();
    await p.locator('.zf-zone').nth(2).click();
    check(label+' hand opens',await p.locator('.zf-hand').isVisible());
    check(label+' board stays fixed with hand',stable(original,await box(p.locator('.zf-board'))));
    const board=await box(p.locator('.zf-board')),hand=await box(p.locator('.zf-hand'));
    check(label+' cards do not cover zones',board.y+board.height<=hand.y);
    await shot(p,label+'-hand');
    if(width<500){
      const cdp=await context.newCDPSession(p),y=hand.y+45,startX=width-32;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:startX,y}]});
      for(let i=1;i<=10;i++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:startX-i*22,y}]});
        await p.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await p.waitForFunction(()=>document.querySelector('.zf-hand')?.scrollLeft>10);
      check(label+' native touch swipe scrolls hand',await p.locator('.zf-hand').evaluate(el=>el.scrollLeft>10));
      await cdp.detach();
    }else{
      await p.locator('.zf-hand').hover();await p.mouse.wheel(300,0);
      await p.waitForFunction(()=>document.querySelector('.zf-hand')?.scrollLeft>10);
      check(label+' horizontal wheel scrolls hand',await p.locator('.zf-hand').evaluate(el=>el.scrollLeft>10));
    }
    await p.locator('[data-kind="place"]').click();
    check(label+' hand folds after selection',await p.locator('.zf-hand').count()===0);
    check(label+' board stays fixed after selection',stable(original,await box(p.locator('.zf-board'))));
    await p.locator('.zf-zone').nth(5).click();
    check(label+' direct re-aim',await p.locator('.zf-zone').nth(5).getAttribute('aria-pressed')==='true');
    await p.getByRole('button',{name:'＋ 지원 추가'}).click();
    await p.locator('[data-kind="gapHunter"]').click();await p.locator('.zf-zone').nth(4).click();
    check(label+' support keeps main aim',await p.locator('.zf-zone').nth(5).getAttribute('aria-pressed')==='true');
    await p.getByRole('button',{name:'좌중간 가르기 지원 제거'}).click();
    await p.getByRole('button',{name:'전투 정보'}).click();await p.locator('.zf-dialog').waitFor();
    await p.getByRole('button',{name:'닫기',exact:true}).click();
    await shot(p,label+'-ready');
    const hp=await p.getByRole('meter').getAttribute('aria-valuenow');
    await p.getByRole('button',{name:'타격! 에너지 1'}).click();
    check(label+' freezes HP during flight',await p.getByRole('meter').getAttribute('aria-valuenow')===hp);
    check(label+' no early result',await p.locator('.zf-result-card').count()===0);
    check(label+' locks take during flight',await p.locator('.zf-take').isDisabled());
    await p.locator('[data-step="result"]').waitFor();
    check(label+' real damage reaches HP',Number(await p.getByRole('meter').getAttribute('aria-valuenow'))<Number(hp));
    check(label+' result board fixed',stable(original,await box(p.locator('.zf-board'))));
    await p.waitForFunction(()=>[...document.images].every(im=>im.complete));
    await shot(p,label+'-result');
    check(label+' next button remains gold while hovered',await p.locator('[data-zf-next]').evaluate(el=>getComputedStyle(el).backgroundColor==='rgb(244, 197, 108)'));
    await p.locator('[data-zf-next]').click();check(label+' next turn returns to aiming',await p.locator('.zf-preview').getAttribute('data-step')==='aim');
    check(label+' no production save written',await p.evaluate(()=>localStorage.getItem('9zone-v10-run')===null));
    await context.close();
  }
  const packsContext=await browser.newContext({viewport:{width:360,height:640},isMobile:true,hasTouch:true}),packsPage=await packsContext.newPage();
  await packsPage.goto(target.href);await packsPage.locator('.zf-board').waitFor();
  const packsBoard=await box(packsPage.locator('.zf-board'));
  for(const [id,name] of [['link','연결 야구'],['hold','버티기'],['power','한 방 승부']]){
    await packsPage.getByRole('button',{name:'전투 정보'}).click();
    await packsPage.getByRole('button',{name:new RegExp(name+'.*이 덱으로 다시 시작')}).click();
    check(id+' deck explicitly starts a fresh battle',await packsPage.locator('.zf-preview').getAttribute('data-step')==='aim');
    check(id+' deck name is visible',(await packsPage.locator('.zf-footnote').innerText()).includes(name));
    check(id+' deck keeps board fixed',stable(packsBoard,await box(packsPage.locator('.zf-board'))));
    await packsPage.getByRole('button',{name:/손패 보기/}).click();
    check(id+' deck critical card text fits',await packsPage.locator('.zf-card').evaluateAll(cards=>cards.every(c=>[...c.querySelectorAll('strong,.zf-card-effect,.zf-card-warning')].every(el=>el.getBoundingClientRect().bottom<=c.getBoundingClientRect().bottom))));
    check(id+' deck has no shell overflow',await packsPage.locator('.zf-shell').evaluate(el=>el.scrollHeight<=el.clientHeight+1));
    await shot(packsPage,'deck-'+id+'-hand');
  }
  await packsPage.locator('[data-kind="loadPower"]').click();
  check('preparation is usable before aiming',await packsPage.getByRole('button',{name:'준비 사용 에너지 1'}).isEnabled());
  await packsPage.getByRole('button',{name:'준비 사용 에너지 1'}).click();await packsPage.locator('[data-kind="place"]').click();
  check('power preparation stays visible',(await packsPage.locator('.zf-notice').innerText()).includes('파워 +18'));
  check('preparation does not silently choose a zone',await packsPage.locator('.zf-zone[aria-pressed="true"]').count()===0);
  await shot(packsPage,'prepared-before-aim');await packsContext.close();
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),p=await context.newPage();
  await p.goto(target.href);await p.locator('.zf-board').waitFor();
  check('reduced motion has no decorative animation',await p.locator('.zf-board').evaluate(el=>getComputedStyle(el).animationName==='none'));
  await p.getByRole('button',{name:/지켜보기/}).click();await p.locator('[data-step="result"]').waitFor();
  check('reduced-motion pitch completes',await p.locator('[data-step="result"]').count()===1);
  await p.setViewportSize({width:844,height:390});
  check('landscape preserves existing rotation guide',(await p.evaluate(()=>getComputedStyle(document.body,'::after').content)).includes('휴대폰을 세로로'));
  await p.setViewportSize({width:390,height:844});
  check('rotation returns to usable preview',await p.locator('[data-zf-next]').isVisible());
  await context.close();
  check('no uncaught browser errors',errors.length===0);check('no failed resources',failures.length===0);
  completed=true;
}finally{
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,completed,checks,errors,failures},null,2));
  await browser.close();
}
console.log(`${checks.length}/${checks.length} preview browser checks passed`);
