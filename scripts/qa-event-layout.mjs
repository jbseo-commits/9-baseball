// Road-event layout contract on the shipped landscape viewports (plus desktop).
// Usage: PLAYWRIGHT_MODULE=<playwright index> BASE_URL=http://127.0.0.1:4173/ node scripts/qa-event-layout.mjs
// QA_REPORT_ONLY=1 records failures without throwing (baseline capture).
// Fixtures are engine-generated saves; setup reads the pending pitch for speed. Not a human playthrough.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as E from '../src/duel/engine.js';
import {validateV10State} from '../src/duel/v10-storage.js';

const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out=process.env.QA_OUT||'/tmp/qa-event-layout',base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const reportOnly=process.env.QA_REPORT_ONLY==='1',wanted=Number(process.env.QA_EVENTS||6);
const failures=[],report=[];
const check=(ok,message)=>{if(ok)return;if(reportOnly)failures.push(message);else assert.fail(message);};

function eventFixtures(count){
  const found=[],titles=new Set();
  for(let seed=1;seed<600&&found.length<count;seed++){
    let s=E.enterV10Node(E.createV10Duel(seed),'a1-entry');
    for(let i=0;i<180&&['battle','pitch','between'].includes(s.phase);i++){
      if(s.phase==='pitch')s=E.advanceV10Pitch(s);
      else if(s.phase==='between')s=E.advanceV10Batter(s);
      else{const z=s.battle.pending?.zone;s=Number.isInteger(z)&&z<9?E.playV10Action(E.setAimZone(s,z),{type:'card',id:'basic'}):E.playV10Action(s,{type:'take'});}
    }
    if(s.phase!=='reward')continue;
    s=E.claimV10Reward(s,{type:'skip'});
    const node=s.runMap.reachableIds.map(id=>s.runMap.nodes.find(n=>n.id===id)).find(n=>n.type==='event');
    if(!node)continue;
    s=E.enterV10Node(s,node.id);
    if(s.phase!=='event'||!validateV10State(s))continue;
    found.push({seed,state:s});
  }
  assert(found.length>0,'at least one validated event fixture');
  return found;
}

await fs.mkdir(out,{recursive:true});
const fixtures=eventFixtures(wanted);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
  for(const [width,height] of [[568,320],[667,375],[844,390],[1280,720],[1440,900]]){
    for(const [index,fixture] of fixtures.entries()){
      const tag=`${width}x${height} seed ${fixture.seed}`;
      const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<1000});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(s=>{localStorage.setItem('9zone-v10-run',JSON.stringify(s));for(const k of ['9zone-welcome-v1','9zone-bp-coach-v1'])localStorage.setItem(k,'done');},fixture.state);
      await page.goto(base);
      await page.getByRole('button',{name:'이어하기',exact:true}).click();
      await page.locator('.ev-root').waitFor();
      await page.waitForTimeout(900);
      const choices=page.getByTestId('event-choice'),count=await choices.count();
      check(count>=2,`${tag}: the event offers choices`);
      const rows=[];
      for(let i=0;i<count;i++){
        await choices.nth(i).scrollIntoViewIfNeeded();
        rows.push(await choices.nth(i).evaluate(e=>{
          const r=e.getBoundingClientRect(),list=e.parentElement.getBoundingClientRect();
          const leaves=[...e.querySelectorAll('*')].filter(k=>!k.childElementCount&&k.textContent.trim());
          const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
          return {height:r.height,
            textInside:leaves.every(k=>{const b=k.getBoundingClientRect();return b.top>=r.top-1&&b.bottom<=r.bottom+1&&b.left>=r.left-1&&b.right<=r.right+1;}),
            inList:r.top>=list.top-1&&r.bottom<=list.bottom+1,inViewport:r.top>=0&&r.bottom<=innerHeight+1,hit:e.contains(hit)};
        }));
      }
      rows.forEach((row,i)=>{
        check(row.textInside,`${tag}: choice ${i} keeps its label, effect and chips inside the card`);
        check(row.inList&&row.inViewport,`${tag}: choice ${i} scrolls fully into view`);
        check(row.hit,`${tag}: choice ${i} is hit-testable at its centre`);
      });
      const shell=await page.evaluate(()=>{
        const deck=document.querySelector('.ev-deck'),r=deck.getBoundingClientRect();
        return {deck:r.toJSON(),deckHit:deck.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)),
          page:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},
          visibleChoices:[...document.querySelectorAll('.ev-choice')].filter(e=>{const b=e.getBoundingClientRect(),l=e.parentElement.getBoundingClientRect();return b.top>=l.top-1&&b.bottom<=l.bottom+1;}).length};
      });
      check(shell.deck.top>=0&&shell.deck.bottom<=height+1&&shell.deck.height>=44&&shell.deckHit,`${tag}: the deck button stays in the viewport and tappable`);
      check(shell.page.w<=width&&shell.page.h<=height,`${tag}: the page itself does not scroll`);
      check(errors.length===0,`${tag}: no page errors (${errors[0]||''})`);
      if(index===0){await choices.first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`event-${width}x${height}.png`),animations:'disabled'});}
      if(!reportOnly&&index===0){
        const saved=await page.evaluate(()=>localStorage.getItem('9zone-v10-run'));
        await page.locator('.ev-list').evaluate(e=>{e.scrollTop=e.scrollHeight;e.scrollTop=0;});
        assert.equal(await page.evaluate(()=>localStorage.getItem('9zone-v10-run')),saved,`${tag}: scrolling does not resolve the event`);
        await page.locator('.ev-choice:not([disabled])').last().click();
        await page.locator('.ev-root.is-result').waitFor();
        await page.getByTestId('event-leave').click();
        await page.locator('.bp-map').waitFor();
      }
      report.push({size:[width,height],seed:fixture.seed,choices:rows,...shell});
      await page.close();
    }
  }
}finally{
  await browser.close();
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2));
}
if(reportOnly)console.log(failures.length?`BASELINE ${failures.length} failures:\n`+failures.join('\n'):'BASELINE clean');
else console.log(`PASS event: five sizes x ${fixtures.length} events, readable choices, reachable deck button, resolve and return to map`);
