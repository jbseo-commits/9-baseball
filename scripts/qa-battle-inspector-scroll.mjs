// Actual normal-run inspector: bounded content, inner scrolling and plan/focus
// preservation. No save injection, direct app actions or synthetic DOM clicks.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE to an installed Playwright module.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5173/';
const out=process.env.QA_OUT||'/tmp/qa-battle-inspector-scroll';
const sizes=process.env.QA_SMALL_ONLY?[[667,320]]:[[667,320],[667,375],[844,300],[844,390],[1440,900]];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
const report=[],failures=[];
const check=(value,message)=>{if(!value)failures.push(message);};

try{
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<1000});
    const page=await context.newPage(),row={size:[width,height],tabs:[],errors:[]};
    page.on('pageerror',e=>row.errors.push(e.message));
    await page.addInitScript(()=>{for(const key of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(key,'done');});
    const url=new URL(base);url.searchParams.set('battleUi','vnext');url.searchParams.set('seed','3');
    await page.goto(url.href);
    await page.getByRole('button',{name:'새로운 게임',exact:true}).click();
    await page.locator('[data-pack="power"]').click();
    await page.getByTestId('start-pack-go').click();await page.getByTestId('bp-map-go').click();
    await page.locator('.battle-vnext[data-phase="deciding"]').waitFor();
    // Preserve a real card/zone plan while inspecting, rather than only an
    // empty selection. Arrow/gesture card behavior is covered separately.
    if(await page.getByRole('button',{name:'손패 펼치기',exact:true}).count())await page.getByRole('button',{name:'손패 펼치기',exact:true}).click();
    await page.locator('.bv-card:not(.t-prepare)').first().click();
    await page.locator('.bv-cell[data-zone="4"]').click();
    const beforeSave=await page.evaluate(()=>localStorage.getItem('9zone-v10-run'));
    const opener=page.getByRole('button',{name:'경기 정보 및 메뉴',exact:true});await opener.click();
    const body=page.locator('.bp-inspect-body');
    const metrics=()=>page.evaluate(()=>{
      const body=document.querySelector('.bp-inspect-body'),root=document.querySelector('.battle-vnext');
      const rect=q=>document.querySelector(q).getBoundingClientRect().toJSON();
      const b=body.getBoundingClientRect();
      return {body:b.toJSON(),panel:rect('.bp-inspect'),head:rect('.bp-inspect-head'),tabs:rect('.bp-inspect-tabs'),back:rect('.bp-inspect-back'),status:rect('.bp-inspect-status'),
        scrollTop:body.scrollTop,scrollHeight:body.scrollHeight,clientHeight:body.clientHeight,rootScroll:[root.scrollLeft,root.scrollTop],pageScroll:[scrollX,scrollY]};
    });
    for(const name of ['카드','투수','읽기','이번 공','더미','메뉴']){
      await page.getByRole('tab',{name,exact:true}).click();
      let before=await metrics();
      check(before.scrollTop===0,`${width}x${height} ${name}: a newly selected tab starts at its first line`);
      check(before.body.bottom<=before.panel.bottom+1&&before.body.top>=before.tabs.bottom-1,`${width}x${height} ${name}: body stays inside panel below tabs`);
      check(before.body.bottom<=before.status.top+1&&before.status.bottom<=before.panel.bottom+1,`${width}x${height} ${name}: status remains below the body inside panel`);
      check(before.panel.top>=0&&before.panel.bottom<=height+1,`${width}x${height} ${name}: panel fits viewport`);
      check(before.back.height>=40&&before.tabs.height>=40,`${width}x${height} ${name}: fixed controls remain touch targets`);
      if(name==='메뉴')await page.screenshot({path:path.join(out,`battle-inspector-${width}x${height}.png`)});
      await page.mouse.move(before.body.x+before.body.width/2,Math.min(height-20,before.body.y+25));
      await page.mouse.wheel(0,10000);await page.waitForTimeout(150);
      const after=await metrics();
      if(after.scrollHeight>after.clientHeight+2)check(after.scrollTop>=after.scrollHeight-after.clientHeight-2,`${width}x${height} ${name}: wheel reaches last content`);
      check(Math.abs(after.head.y-before.head.y)<1&&Math.abs(after.tabs.y-before.tabs.y)<1,`${width}x${height} ${name}: only body scrolls`);
      check(after.rootScroll.every(n=>n===0)&&after.pageScroll.every(n=>n===0),`${width}x${height} ${name}: field/page remain anchored`);
      row.tabs.push({name,before,after});
    }
    const menu=await metrics();
    if(menu.scrollHeight>menu.clientHeight+2){
      // Real touch drag after a wheel-to-top reset; never assign scrollTop.
      await page.mouse.wheel(0,-10000);await page.waitForTimeout(150);
      const r=(await metrics()).body,x=r.x+r.width/2,y1=r.bottom-12,y2=r.top+12;
      const cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
      for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/8}]});await page.waitForTimeout(16);}
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);
      row.touch=await metrics();check(row.touch.scrollTop>0,`${width}x${height}: real touch scrolls menu body`);
      await cdp.detach();
    }
    // Tab from the final tab reaches the menu's real bottom controls, causing
    // only the body to reveal them. Do not focus elements through evaluate.
    await page.getByRole('tab',{name:'메뉴',exact:true}).click();
    for(let i=0;i<3;i++)await page.keyboard.press('Tab');
    row.keyboard=await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),b=document.querySelector('.bp-inspect-body').getBoundingClientRect();return {text:e.textContent,inside:!!e.closest('.bp-inspect-body'),visible:r.top>=b.top-1&&r.bottom<=b.bottom+1};});
    check(row.keyboard.inside&&row.keyboard.visible,`${width}x${height}: keyboard reaches visible menu controls`);
    await page.screenshot({path:path.join(out,`battle-inspector-bottom-${width}x${height}.png`)});
    await page.getByTestId('bp-inspect-back').click();
    check(await opener.evaluate(e=>e===document.activeElement),`${width}x${height}: close restores opener focus`);
    assert.equal(await page.evaluate(()=>localStorage.getItem('9zone-v10-run')),beforeSave,'inspection preserves the complete saved plan');
    check(row.errors.length===0,`${width}x${height}: ${row.errors.join('; ')}`);
    report.push(row);await context.close();
  }
}finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify({report,failures},null,2));}
assert.equal(failures.length,0,failures.join('\n'));
console.log(`PASS inspector: ${sizes.length} landscape sizes; six tabs wheel; menu touch/keyboard; save/focus`);
