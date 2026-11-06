const fs=require('node:fs'),http=require('node:http');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname;
(async()=>{
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});fs.createReadStream(root+'/gallery.html').pipe(res)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  for(const [layout,width,height] of [['desktop',1440,810],['phone',844,390]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>document.querySelectorAll('#character option').length===20);await page.selectOption('#layout',layout);await page.uncheck('#effects');await page.check('#groundGuide');
   for(const [slug,pose] of [['onyx-eclipse',2],['regular-05-violet-sting',6]]){
    const index=await page.evaluate(slug=>D.characters.findIndex(c=>c.slug===slug),slug);await page.selectOption('#character',String(index));
    await page.evaluate(p=>{const c=window.__galleryReview.snapshot().character;window.__galleryReview.setTime(c.phase_ms[p])},pose);
    for(const comparison of ['before','after']){
     await page.selectOption('#comparison',comparison);await page.waitForFunction(()=>document.querySelector('#pitcher').complete&&document.querySelector('#pitcher').naturalWidth>0);await page.screenshot({path:`${root}/references/showcase-${slug}-${layout}-${comparison}.png`,animations:'disabled'});
    }
   }await page.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
