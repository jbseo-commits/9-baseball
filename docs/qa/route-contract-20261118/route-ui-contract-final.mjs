import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE
  ?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5199/';
const fixturePaths=process.argv.slice(2);
if(!fixturePaths.length)throw new Error('Pass synthetic-map-deck17/18-seed0.json files');
const out=process.env.QA_OUT||'/tmp/route-contract-20261118/ui';
await fs.mkdir(out,{recursive:true});
const checks=[],previews=[],errors=[];
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
const saved=p=>p.evaluate(()=>localStorage.getItem('9zone-v10-run'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
 for(const fixturePath of fixturePaths){
  const fixture=JSON.parse(await fs.readFile(fixturePath,'utf8'));
  if(!['synthetic-boundary-only','synthetic-final-boss-map'].includes(fixture.fixtureType))throw new Error(`not an identified synthetic fixture: ${fixturePath}`);
  const state=fixture.state;
  for(const width of [568,844]){
   const height=width===568?320:390,tag=`deck${state.deck.length} ${width}x${height}`;
   const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
   p.on('pageerror',e=>errors.push({tag,message:e.message}));
   await p.addInitScript(s=>{
     localStorage.setItem('9zone-v10-run',JSON.stringify(s));
     localStorage.setItem('9zone-welcome-v1','done');
     localStorage.setItem('9zone-bp-coach-v1','done');
     localStorage.setItem('9zone-hint-chase','done');
   },state);
   await p.goto(base,{waitUntil:'domcontentloaded'});
   await p.getByRole('button',{name:/^이어하기/}).tap();
   await p.waitForTimeout(200);
   const loaded=JSON.parse(await saved(p)||'null');
   check(tag+' title 이어하기 loads map save',loaded?.phase==='map'&&loaded?.deck?.length===state.deck.length,{phase:loaded?.phase,deck:loaded?.deck?.length});
   check(tag+' map graph preserved on load',JSON.stringify({nodes:loaded?.runMap?.nodes,edges:loaded?.runMap?.edges})===JSON.stringify({nodes:state.runMap.nodes,edges:state.runMap.edges}));
   const targets=fixture.fixtureType==='synthetic-final-boss-map'?
    [['finalBoss',state.runMap.nodes.find(n=>n.id==='a3-boss')]]:[
     ['regular',state.runMap.nodes.find(n=>n.act===1&&n.type==='battle')],
     ['elite',state.runMap.nodes.find(n=>n.act===1&&n.type==='elite')],
     ['boss',state.runMap.nodes.find(n=>n.act===1&&n.type==='boss')],
     ['shop',state.runMap.nodes.find(n=>n.act===1&&n.type==='shop')],
    ];
   for(const [kind,node] of targets){
     if(!node)throw new Error(`seed 0 fixture missing ${kind} node`);
     const beforeSelection=await saved(p);
     await p.locator(`[data-node="${node.id}"]`).tap();
     const info=p.locator('.bp-minfo');
     const text=(await info.innerText()).replace(/\s+/g,' ').trim();
     const lineSelector=await info.locator('.bp-mrw').count()?'.bp-mrw':'.bp-mline';
     const line=(await info.locator(lineSelector).innerText()).replace(/\s+/g,' ').trim();
     const expected={regular:'이기면 카드 3장 중 1장',elite:'이기면 카드 4장 중 1장 · 시그니처',boss:'이기면 다음 막 · 시그니처',shop:'새 카드를 들인다.',finalBoss:'이기면 런 완주'}[kind];
     const shown=line===expected;
     previews.push({tag,kind,nodeId:node.id,nodeType:node.type,expected,line,previewText:text,shown});
     check(`${tag} ${kind} preview text matches current capacity contract`,state.deck.length<18||kind==='finalBoss'?shown:line.includes('카드 추가 불가'),{nodeId:node.id,line,previewText:text});
     const now=await saved(p);
     check(`${tag} ${kind} preview selection leaves save unchanged`,now===beforeSelection);
     const go=p.getByTestId('bp-map-go'),box=await go.boundingBox();
     const goState={disabled:await go.isDisabled(),height:box?.height,x:box?.x,y:box?.y,right:box?box.x+box.width:null,bottom:box?box.y+box.height:null};
     previews.at(-1).go=goState;
     if(kind==='regular'||kind==='finalBoss')check(`${tag} reachable ${kind} action target is >=44px and in viewport`,!!box&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,goState);
     else if(kind!=='finalBoss')check(`${tag} non-reachable ${kind} stays preview-only`,goState.disabled,goState);
     if(fixture.fixtureType==='synthetic-boundary-only'){
       const promisesCard=/(?:이기면\s*)?카드\s+[34]장\s*중\s*1장/.test(line);
       if(state.deck.length===17)check(`${tag} ${kind} preserves baseline copy at 17`,line===expected,{line,expected});
       else if(state.deck.length===18&&kind!=='boss'){
         check(`${tag} ${kind} has no false card-count promise at 18`,!promisesCard,{line});
         check(`${tag} ${kind} states card addition is unavailable at 18`,line.includes('카드 추가 불가'),{line});
       }else if(state.deck.length===18&&kind==='boss'){
         check(`${tag} boss has no false card-count promise at 18`,!promisesCard,{line});
         check(`${tag} boss states card addition is unavailable at 18`,line.includes('카드 추가 불가'),{line});
       }
       if(state.deck.length===17&&kind==='shop')check(`${tag} shop preserves baseline copy at 17`,line===expected,{line,expected});
       if(state.deck.length===18&&kind==='shop'){
         check(`${tag} shop removes unavailable-card promise at 18`,line!=='새 카드를 들인다.',{line});
         check(`${tag} shop states card addition is unavailable at 18`,line.includes('카드 추가 불가'),{line});
       }
     }
     if(kind==='finalBoss')check(`${tag} final boss copy states run completion`,line.includes('런 완주'),{line});
   }
   const beforeRotate=await saved(p);
   await p.setViewportSize({width:390,height:844});
   await p.waitForTimeout(120);
   const prompt=await p.evaluate(()=>getComputedStyle(document.body,'::before').content.includes('가로'));
   check(tag+' portrait rotation prompt appears',prompt);
   check(tag+' portrait prompt leaves save unchanged',await saved(p)===beforeRotate);
   await p.setViewportSize({width,height});
   await p.waitForTimeout(120);
   check(tag+' landscape return leaves save unchanged',await saved(p)===beforeRotate);
   await p.close();
  }
 }
}catch(e){check('harness aborted',false,e.stack||e.message);}
finally{
 await browser.close();
 const report={base,fixtures:fixturePaths,method:'Playwright Chromium touch emulation; localStorage receives labeled synthetic boundary saves; previews are read from actual map UI; viewport resizing is not physical rotation.',previews,checks,errors,failed:checks.filter(c=>!c.ok).length};
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(`${checks.filter(c=>c.ok).length}/${checks.length}, ${errors.length} page errors; report ${path.join(out,'report.json')}`);
 if(checks.some(c=>!c.ok)||errors.length)process.exitCode=1;
}
