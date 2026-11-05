const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=require('node:path').resolve(__dirname,'../../..'),out=__dirname;
const source=JSON.parse(fs.readFileSync(root+'/assets/pitcher-review-grounding-r2/manifest.json'));
const cap=JSON.parse(fs.readFileSync(root+'/assets/pitcher-review-grounding-r2/references/game-camera.json')).captures.find(c=>c.capture==='desktop');
const rubber=cap.rubberScreen.polygon.map(p=>[(p[0]-cap.worldTransform.e)/cap.worldTransform.a,(p[1]-cap.worldTransform.f)/cap.worldTransform.d]);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const rows=[],errors=[],shots=[];
 try{
 for(const [mode,width,height] of [['desktop',1440,810],['phone',844,390]]){
  for(const c of source.characters){
   console.log('Checking',c.slug,mode);
   const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push({id:c.slug,mode,error:String(e)}));
   await page.goto('http://127.0.0.1:5188/?battleUi=vnext&battlePlay=1&seed=3&battleSpeed=0.5');
   await page.waitForSelector('[data-roster-art]');
   const diagnostic=await page.evaluate(async id=>{
    const E=await import('/src/duel/engine.js');
    let state;
    for(let seed=1;seed<120;seed++){
     const run=E.createV10Duel(seed,{tutorial:id==='regular-01-red-rush'}),n=run.runMap.nodes.find(n=>n.opponent?.artId===id);
     if(n){run.runMap.reachableIds=[n.id];state=E.enterV10Node(run,n.id);break;}
    }
    if(!state)throw Error('missing opponent '+id);
    E.saveV10Duel({setItem(k,v){sessionStorage.setItem('9zone-playable-v1:'+k,v)}},state);
    return {label:state.v10.opponent.encounter.label,current:state.battle.intent.encounter.current};
   },c.slug);
   await page.reload();await page.waitForSelector(`[data-roster-art="${c.slug}"]`);
   await page.waitForFunction(()=>{const i=document.querySelector('.bv-actor-pitcher img');return i?.complete&&i.naturalWidth>0});
   const hud=await page.locator('[data-testid="bv-encounter"]').innerText();
   if(!hud.includes(diagnostic.label))throw Error('wrong HUD '+c.slug);
   await page.clock.install({time:new Date('2035-01-01T00:00:00.000Z')});
   await page.clock.pauseAt(new Date('2035-01-01T00:00:00.100Z'));
   for(let phase=0;phase<3;phase++){
    if(phase===1){await page.getByTestId('bp-swing').click();await page.clock.runFor(400);}
    if(phase===2)await page.clock.runFor(380);
    const result=await page.evaluate(({phase,point,rubber})=>{
     const el=document.querySelector('.bv-actor-pitcher');if(!el)throw Error('actor missing at phase '+phase+' page:'+document.body.innerText.slice(0,300));const a=el.getBoundingClientRect(),world=document.querySelector('.bv-world'),r=world.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(world).transform);
     const poly=rubber.map(p=>[r.x+p[0]*m.a,r.y+p[1]*m.d]),p=[a.x+point.x*a.width/512,a.y+point.y*a.height/512];
     const sides=poly.map((v,i)=>{const w=poly[(i+1)%poly.length],dx=w[0]-v[0],dy=w[1]-v[1];return (dx*(p[1]-v[1])-dy*(p[0]-v[0]))/Math.hypot(dx,dy)});
     const image=el.querySelector('img');
     return {phase,pose:el.dataset.pose,inside:Math.min(...sides)>=-.65||Math.max(...sides)<=.65,boot:p,polygon:poly,
      sheet:[image.naturalWidth,image.naturalHeight],actor:{x:a.x,y:a.y,width:a.width,height:a.height},phaseUI:document.querySelector('.battle-vnext').dataset.phase};
    },{phase,point:c.grounding.preparation_contacts[String(phase)],rubber});
    rows.push({id:c.slug,mode,...result});
    if(result.pose!=='frame-'+phase)throw Error(`${c.slug}/${mode}: wrong drawing ${result.pose} for phase ${phase}`);
   }
   if(['regular-03-amber-sinker','regular-05-violet-sting','tide-vesper','copper-sirocco','onyx-eclipse'].includes(c.slug)){
    const file=`${c.slug}-${mode}-lift.png`;await page.screenshot({path:out+'/'+file});shots.push(file);
   }
   await page.clock.fastForward(4500);await page.waitForSelector('.battle-vnext[data-phase="result"]');
   const revealed=await page.evaluate(()=>{const key=Object.keys(sessionStorage).find(k=>k.startsWith('9zone-playable-v1:'));const s=JSON.parse(sessionStorage.getItem(key));return {encounter:s.v10.opponent.encounter.id,hasCombat:!!s.v10.lastCombat,pending:s.battle.pending,phase:s.phase};});
   if(!revealed.hasCombat||revealed.encounter!==c.slug)throw Error('missing actual resolution '+c.slug);
   await page.close();
   fs.writeFileSync(out+'/browser-progress.json',JSON.stringify({rows,errors,screenshots:shots},null,2));
  }
 }
 const failures=rows.filter(r=>!r.inside||r.sheet[0]!==768||r.sheet[1]!==1024);
 const report={status:failures.length||errors.length?'failed':'passed',characters:20,actualBootChecks:rows.length,failures,errors,screenshots:shots,rows,
  method:'Actual App and compact atlas playback at 0.5x; diagnostic direct entry into real generated opponent nodes; photo rubber projected through actual DOM world matrix. No production save touched.'};
 fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined},null,2));
 if(report.status!=='passed')process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
