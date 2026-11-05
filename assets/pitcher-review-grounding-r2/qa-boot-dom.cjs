const fs=require('node:fs'),http=require('node:http');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname;
(async()=>{
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});fs.createReadStream(root+'/gallery.html').pipe(res)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const rows=[],errors=[];
 try{
  for(const [mode,w,h] of [['desktop',1440,810],['phone',844,390]]){
   const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>document.querySelectorAll('#character option').length===20);await page.selectOption('#layout',mode);
   for(const comparison of ['after','before']){
    await page.selectOption('#comparison',comparison);
    for(let n=0;n<20;n++){
     await page.selectOption('#character',String(n));
     await page.waitForFunction(()=>document.querySelector('#pitcher').complete&&document.querySelector('#pitcher').naturalWidth>0);
     rows.push(...await page.evaluate(({comparison,mode})=>{
      const snap=window.__galleryReview.snapshot(),c=snap.character,cap=snap.capture,points=comparison==='after'?c.grounding.preparation_contacts:c.prior_grounding.preparation_contacts,result=[];
      const inside=(p,poly,t)=>{const a=poly.map((v,i)=>{const w=poly[(i+1)%poly.length],dx=w[0]-v[0],dy=w[1]-v[1];return (dx*(p[1]-v[1])-dy*(p[0]-v[0]))/Math.hypot(dx,dy)});return Math.min(...a)>=-t||Math.max(...a)<=t};
      for(const i of [0,1,2]){
       window.__galleryReview.setTime(c.phase_ms[i]);const actor=document.querySelector('#pitcher').getBoundingClientRect(),screen=document.querySelector('#screen').getBoundingClientRect(),k=screen.width/cap.viewport.width,p=points[i];
       const boot=[actor.x-screen.x+p.x*actor.width/512,actor.y-screen.y+p.y*actor.height/512],poly=cap.rubberScreen.polygon.map(p=>[p[0]*k,p[1]*k]);
       result.push({mode,comparison,slug:c.slug,phase:i,boot_dom_point:boot,rubber_dom_polygon:poly,inside_rubber:inside(boot,poly,.6*k)});
      }return result;
     },{comparison,mode}));
    }
   }
   await page.close();
  }
  const after=rows.filter(r=>r.comparison==='after'),before=rows.filter(r=>r.comparison==='before');const failures=after.filter(r=>!r.inside_rubber);
  const report={status:failures.length===0&&errors.length===0?'passed':'failed',characters:20,after_boot_checks:after.length,before_boot_checks:before.length,before_outside_rubber:before.filter(r=>!r.inside_rubber).length,after_outside_rubber:failures.length,tolerance_capture_px:.6,page_errors:errors,failures,rows};
  fs.writeFileSync(root+'/reports/browser-boot-rubber-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined},null,2));if(report.status!=='passed')process.exitCode=1;
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
