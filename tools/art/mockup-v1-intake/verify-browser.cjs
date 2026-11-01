/* Optional browser check. Requires Playwright + Chromium; no game save or engine access.
   Start python -m http.server 5194 --bind 127.0.0.1 in the repository first.
   node tools/art/mockup-v1-intake/verify-browser.cjs
   Outputs local .qa-mockup-intake/ evidence; never updates source art or game state. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const output=path.join(root,'.qa-mockup-intake');

(async()=>{
 await fs.mkdir(output,{recursive:true});
 const reference=await import(pathToFileURL(path.join(root,'docs/design/mockup-v1/reference/scene.js')));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 const errors=[],failed=[],rows=[];
 try{
  const page=await browser.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
  page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:5194/docs/qa/mockup-v1-intake/');
  await page.waitForFunction(()=>window.intakeFormat==='webp');
  for(const [width,height] of [[1440,900],[932,430],[844,390],[740,360],[667,375],[390,844],[320,568]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   for(const format of ['original','webp']){
    await page.locator('#'+format).click();await page.waitForFunction(f=>window.intakeFormat===f,format);
    const geometry=await page.evaluate(()=>{
     const box=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
     return {scene:box(document.getElementById('scene')),camera:window.intakeCamera,
      batter:box(document.getElementById('batter')),pitcher:box(document.getElementById('pitcher')),
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      images:[...document.querySelectorAll('img')].map(el=>({id:el.id,loaded:el.complete&&el.naturalWidth>0,src:el.src})),
      buttons:[...document.querySelectorAll('button')].map(box)};
    });
    assert.equal(geometry.overflow,0);assert(geometry.images.every(i=>i.loaded));
    assert(geometry.buttons.every(b=>b.height>=44));
    const camera=reference.worldCamera(geometry.scene.width,geometry.scene.height);
    for(const key of ['scale','x','y'])assert(Math.abs(camera[key]-geometry.camera[key])<0.001);
    for(const name of ['batter','pitcher']){
     const expected=reference.actorBox(reference.DIAMOND[name]),actual=geometry[name];
     assert(Math.abs(actual.width-expected.width*camera.scale)<0.15);
     assert(Math.abs(actual.height-expected.height*camera.scale)<0.15);
     assert(Math.abs(actual.x-(geometry.scene.x+camera.x+expected.x*camera.scale))<0.15);
     assert(Math.abs(actual.y-(geometry.scene.y+camera.y+expected.y*camera.scale))<0.15);
    }
    rows.push({viewport:[width,height],format,...geometry});
    if(width===844&&height===390||width===1440&&height===900&&format==='webp')
     await page.locator('#scene').screenshot({path:path.join(output,`${width}-${format}.jpg`),type:'jpeg',quality:90});
    if(width===1440&&height===900)await page.locator('#cards').screenshot({path:path.join(output,`cards-${format}.jpg`),type:'jpeg',quality:95});
   }
  }
  await page.locator('#original').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.intakeFormat==='original');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={result:'passed',scope:'static source/derivative comparison; not game integration',viewports:7,formatChecks:rows.length,keyboardToggle:true,pageErrors:errors,failedRequests:failed,rows};
  await fs.writeFile(path.join(output,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({result:report.result,viewports:7,formatChecks:rows.length,keyboardToggle:true,pageErrors:errors.length,failedRequests:failed.length}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
