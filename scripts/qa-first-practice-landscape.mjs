import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const playwrightModule=process.env.PLAYWRIGHT_MODULE;
if(!playwrightModule)throw new Error('Set PLAYWRIGHT_MODULE to an installed Playwright module path.');
const {chromium}=await import(pathToFileURL(playwrightModule).href);
const chromiumPath=process.env.CHROMIUM_PATH||undefined;
const baseUrl=process.env.BASE_URL||'http://127.0.0.1:5173/';
const output=process.env.QA_OUT||'/tmp/qa-first-practice-landscape';
const sizes=[[667,375],[844,390],[844,300],[1366,768]];
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:chromiumPath,args:['--no-sandbox']});
const report=[];

async function tap(page,locator,touch){
  await locator.waitFor({state:'visible'});
  if(!touch){await locator.click();return;}
  const r=await locator.boundingBox();
  assert.ok(r,'touch target has a bounding box');
  await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);
}

try{
  for(const [width,height] of sizes){
    const touch=width<1000;
    const context=await browser.newContext({viewport:{width,height},screen:{width,height},deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
    const page=await context.newPage(),row={width,height,states:[],errors:[]};
    page.on('pageerror',e=>row.errors.push(e.message));
    await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
    await tap(page,page.getByRole('button',{name:'첫 타격 연습',exact:true}),touch);
    const preview=page.locator('.zf-preview[data-lesson]');
    await preview.waitFor({state:'visible'});

    const capture=async(label,screenshot=false)=>{
      const state=await page.evaluate(()=>{
        const rect=selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON()||null;
        const field=rect('.zf-field'),board=rect('.zf-board'),prompt=rect('.zf-prompt'),steps=rect('.zf-steps');
        const action=rect('.zf-actions .zf-go'),zones=[...document.querySelectorAll('.zf-zone')].map(e=>{
          const r=e.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return {rect:r.toJSON(),centerHit:e.contains(target)};
        });
        const button=document.querySelector('.zf-actions .zf-go'),r=button?.getBoundingClientRect();
        const hit=r?button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)):false;
        return {lesson:document.querySelector('.zf-preview')?.dataset.lesson,step:document.querySelector('.zf-preview')?.dataset.step,
          viewport:{width:innerWidth,height:innerHeight},pageHeight:document.documentElement.scrollHeight,field,board,prompt,steps,zones,action,actionHit:hit,
          savedRun:localStorage.getItem('9zone-v10-run')};
      });
      row.states.push({label,...state});
      if(screenshot)await page.screenshot({path:path.join(output,`${width}x${height}-${label}.png`),animations:'disabled'});
      if(width>height){
        assert.equal(state.pageHeight,height,`${width}x${height} ${label} has no page scroll`);
        assert.ok(state.board?.top>=0&&state.board.bottom<=height,`${label} board is fully visible`);
        assert.equal(state.zones.length,9,`${label} contains all nine zones`);
        assert.ok(state.zones.every(z=>z.rect.width>=44&&z.rect.height>=44),`${label} zones are at least 44px`);
        assert.ok(state.zones.every(z=>z.centerHit),`${label} zone centers are hit-testable`);
        assert.ok(state.action?.top>=0&&state.action.bottom<=height,`${label} action is fully visible`);
        assert.ok(state.action.height>=46,`${label} action is at least 46px high`);
        assert.ok(state.actionHit,`${label} action is hit-testable`);
        if(height<=520){
          assert.ok(state.prompt?.top>=state.field.top&&state.prompt.bottom<=state.field.bottom,`${label} lesson prompt is inside the field`);
          assert.ok(state.steps?.top>=state.field.top&&state.steps.bottom<=state.field.bottom,`${label} lesson steps are inside the field`);
        }
      }
      assert.equal(state.savedRun,null,'practice does not persist a run');
      return state;
    };

    for(let lesson=0;lesson<3;lesson++){
      assert.equal(await preview.getAttribute('data-lesson'),String(lesson));
      assert.equal(await preview.getAttribute('data-step'),'plan');
      await capture(`lesson${lesson}`,lesson===0||lesson===2);
      if(lesson===2){
        await tap(page,page.locator('.zf-card[data-kind="setup"]'),touch);
        await tap(page,page.getByRole('button',{name:'준비 사용',exact:true}),touch);
        await page.locator('.zf-prepared').waitFor({state:'visible'});
        assert.equal(await preview.getAttribute('data-step'),'plan');
        await capture('prepared');
      }
      await tap(page,page.locator('.zf-zone').nth(5),touch);
      await capture(`aim${lesson}`);
      await tap(page,page.locator('.zf-actions .zf-go'),touch);
      await page.locator('.zf-preview[data-step="flight"]').waitFor({state:'visible'});
      assert.equal(await page.locator('.zf-result-card').count(),0);
      await page.locator('[data-zf-next]').waitFor({state:'visible'});
      assert.equal(await preview.getAttribute('data-step'),'result');
      await capture(`result${lesson}`);
      await tap(page,page.locator('[data-zf-next]'),touch);
    }
    await page.getByTestId('start-pack-go').waitFor({state:'visible'});
    row.finishedAtPack=true;
    await tap(page,page.getByRole('button',{name:'닫기',exact:true}),touch);
    await page.getByRole('button',{name:'첫 타격 연습',exact:true}).waitFor({state:'visible'});
    row.cancelledToTitle=true;
    assert.deepEqual(row.errors,[]);
    report.push(row);
    await context.close();
    console.log(`${width}x${height}: practice flow and geometry passed`);
  }
}finally{
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
}
