// Independent browser placement check against measured game-camera metadata + source alpha bounds.
const fs=require('node:fs'),http=require('node:http');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname;
(async()=>{
 const source=JSON.parse(fs.readFileSync(root+'/reports/pose-qa.json','utf8'));
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});fs.createReadStream(root+'/gallery.html').pipe(res)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const rows=[],errors=[];
 try{
  for(const [mode,w,h] of [['desktop',1440,810],['phone',844,390]]){
   const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(`http://127.0.0.1:${server.address().port}/gallery.html`);
   await page.waitForFunction(()=>document.querySelectorAll('#character option').length===20);
   await page.selectOption('#layout',mode); await page.selectOption('#comparison','after');
   for(let n=0;n<20;n++){
    await page.selectOption('#character',String(n));
    await page.waitForFunction(()=>[...document.querySelectorAll('#poses img')].every(i=>i.complete&&i.naturalWidth>0));
    const result=await page.evaluate(({source,n,mode})=>{
     const cap=D.captures[mode],c=D.characters[n],checks=source.find(q=>q.slug===c.slug).poses,rows=[];
     for(let i=0;i<12;i++){
      window.__galleryReview.setTime(c.phase_ms[i]);
      const area=document.querySelector('#screen').getBoundingClientRect(),actor=document.querySelector('#pitcher').getBoundingClientRect();
      const k=area.width/cap.viewport.width,s=actor.width/512;
      const anchorX=actor.x-area.x+c.anchor[0]*s,anchorY=actor.y-area.y+c.anchor[1]*s;
      const b=checks[i].alpha_bbox,actual=[actor.x-area.x+b[0]*s,actor.y-area.y+b[1]*s,actor.x-area.x+b[2]*s,actor.y-area.y+b[3]*s];
      const z=cap.zone,overlap=Math.max(0,Math.min(actual[2],(z.x+z.width)*k)-Math.max(actual[0],z.x*k))*Math.max(0,Math.min(actual[3],(z.y+z.height)*k)-Math.max(actual[1],z.y*k));
      const expectedHeight=(cap.actorHeightReference*342/640)/c.scale_basis_height*512*k;
      rows.push({slug:c.slug,mode,phase:c.phases[i],anchor_error_px:Math.max(Math.abs(anchorX-(cap.rubberScreen?.contact||cap.moundScreen).x*k),Math.abs(anchorY-(cap.rubberScreen?.contact||cap.moundScreen).y*k)),height_error_px:Math.abs(actor.height-expectedHeight),plate_ratio_error_px:Math.abs(area.height-area.width*cap.viewport.height/cap.viewport.width),alpha_viewport_fit:actual[0]>=0&&actual[1]>=0&&actual[2]<=area.width&&actual[3]<=area.height,zone_alpha_bbox_overlap_area:overlap});
     }
     return rows;
    },{source,n,mode});
    rows.push(...result);
   }
   await page.close();
  }
  const failed=rows.filter(x=>x.anchor_error_px>.15||x.height_error_px>.15||x.plate_ratio_error_px>.15||!x.alpha_viewport_fit||x.zone_alpha_bbox_overlap_area>0);
  const report={status:failed.length===0&&errors.length===0?'passed':'failed',browser_projection_checks:rows.length,characters:20,drawings:240,layouts:2,max_anchor_error_px:Math.max(...rows.map(x=>x.anchor_error_px)),max_height_error_px:Math.max(...rows.map(x=>x.height_error_px)),max_plate_ratio_error_px:Math.max(...rows.map(x=>x.plate_ratio_error_px)),failures:failed,page_errors:errors,rows};
  fs.writeFileSync(root+'/reports/browser-projection-qa.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,rows:undefined},null,2));
  if(report.status!=='passed')process.exitCode=1;
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
