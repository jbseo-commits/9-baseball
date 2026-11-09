// Real-browser regression: an overhanging folded hand must never scroll the
// whole field when cards receive focus. No fixture/save injection or engine edits.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE to an installed Playwright module.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const output=process.env.QA_OUT||'/tmp/qa-battle-focus-anchor';
const base=process.env.BASE_URL||'http://127.0.0.1:5173/';
const sizes=process.env.QA_SMALL_ONLY?[[844,390]]:[[667,320],[667,375],[844,300],[844,390],[1440,900]];
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
const report=[],failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message);};

try{
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:true});
    const page=await context.newPage(),row={size:[width,height],states:[],errors:[]};
    page.on('pageerror',e=>row.errors.push(e.message));
    await page.addInitScript(()=>{for(const key of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(key,'done');});
    const url=new URL(base);url.searchParams.set('battleUi','vnext');url.searchParams.set('seed','3');url.searchParams.set('battleSpeed','2');
    await page.goto(url.href);
    const touch=async locator=>{
      await locator.waitFor({state:'visible'});
      await page.waitForFunction(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return x>=0&&y>=0&&x<innerWidth&&y<innerHeight&&e.contains(document.elementFromPoint(x,y));},await locator.elementHandle());
      const r=await locator.boundingBox();assert.ok(r);
      await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);
    };
    await touch(page.getByRole('button',{name:'새로운 게임',exact:true}));
    await touch(page.locator('[data-pack="power"]'));
    await touch(page.getByTestId('start-pack-go'));
    await touch(page.getByTestId('bp-map-go'));
    await page.locator('.battle-vnext[data-phase="deciding"]').waitFor();
    const capture=async(label,shot=false)=>{
      const state=await page.evaluate(()=>{
        const root=document.querySelector('.battle-vnext'),hand=document.querySelector('.bv-hand-row');
        const rect=q=>document.querySelector(q)?.getBoundingClientRect().toJSON();
        const s=JSON.parse(localStorage.getItem('9zone-v10-run'));
        return {rootScroll:[root.scrollLeft,root.scrollTop],pageScroll:[scrollX,scrollY],hud:rect('.bv-hud-bar'),zone:rect('.bv-zone'),
          handScroll:hand?.scrollTop,phase:root.dataset.phase,pitches:s.stats.pitches,active:document.activeElement?.className,
          zones:[...document.querySelectorAll('.bv-cell')].map(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})};
      });
      row.states.push({label,...state});
      if(shot)await page.screenshot({path:path.join(output,`battle-${width}x${height}-${label}.png`)});
      check(state.rootScroll.every(n=>n===0),`${width}x${height} ${label}: field scroll ${state.rootScroll}`);
      check(state.pageScroll.every(n=>n===0),`${width}x${height} ${label}: page scroll ${state.pageScroll}`);
      if(label!=='initial')check(Math.abs(state.zone.x-row.states[0].zone.x)<1,`${width}x${height} ${label}: zone moved horizontally`);
      return state;
    };
    await capture('initial');
    await touch(page.getByRole('button',{name:/^지켜보기/}));
    await page.getByTestId('bp-next').waitFor();
    await touch(page.getByTestId('bp-next'));
    await page.locator('.battle-vnext[data-phase="deciding"]').waitFor();
    if(await page.getByRole('button',{name:'손패 접기',exact:true}).count())await touch(page.getByRole('button',{name:'손패 접기',exact:true}));
    await touch(page.getByRole('button',{name:'손패 펼치기',exact:true}));
    const first=page.locator('.bv-card:not(.t-prepare)').first();
    // Keyboard/assistive focus can enter the hand before its unfolding
    // transition finishes. Reproduce that timing without an offscreen tap.
    await first.focus();await capture('opening-focus',true);
    await touch(first);
    await capture('touch-selected',true);
    // Native key handling calls focus/scrollIntoView on the next card. The
    // hand row may scroll, but the field must stay anchored.
    await first.focus();await page.keyboard.press('ArrowDown');
    await capture('keyboard-next',true);
    const handBefore=await page.locator('.bv-hand-row').evaluate(e=>{const r=e.getBoundingClientRect(),last=e.querySelector('.bv-card-slot:last-child .bv-card')?.getBoundingClientRect();return {top:e.scrollTop,lastOutside:last&&(last.y+last.height/2>r.bottom||last.y+last.height/2<r.top)};});
    for(let i=0;i<await page.locator('.bv-card').count();i++)await page.keyboard.press('ArrowDown');
    const handAfter=await page.locator('.bv-hand-row').evaluate(e=>{const a=document.activeElement,r=a?.getBoundingClientRect();return {top:e.scrollTop,cardFocused:a===e.querySelector('.bv-card-slot:last-child .bv-card'),centerHit:r&&a.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
    check(handAfter.cardFocused&&handAfter.centerHit,`${width}x${height}: final keyboard card is visible and hit-testable`);
    if(handBefore.lastOutside)check(handAfter.top>handBefore.top,`${width}x${height}: keyboard reveals cards inside the hand`);
    await capture('keyboard-bottom',true);
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'손패 펼치기',exact:true}).waitFor();
    const folded=await capture('folded',true);
    check(folded.zones.every(Boolean),`${width}x${height}: all zone centers remain hit-testable`);
    // Even a browser/AT reveal request for a visible action must not move the
    // containing field because of offscreen decorative orbit descendants.
    await page.getByRole('button',{name:/^지켜보기/}).evaluate(e=>e.scrollIntoView({block:'nearest',inline:'nearest'}));
    await capture('action-revealed',true);
    const saved=await page.evaluate(()=>localStorage.getItem('9zone-v10-run'));
    await page.reload();await touch(page.getByRole('button',{name:'이어하기',exact:true}));
    await page.locator('.battle-vnext[data-phase="deciding"]').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('9zone-v10-run')),saved,'focus/navigation does not alter the saved run');
    await capture('resumed');
    check(row.errors.length===0,`${width}x${height}: ${row.errors.join('; ')}`);
    report.push(row);await context.close();
  }
}finally{await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify({report,failures},null,2));}
assert.equal(failures.length,0,failures.join('\n'));
console.log(`PASS focus anchor: ${sizes.length} landscape sizes; touch/keyboard/fold/reveal/resume`);
