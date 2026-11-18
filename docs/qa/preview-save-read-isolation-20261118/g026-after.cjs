const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs=require('node:fs');const fixture=JSON.parse(fs.readFileSync('/tmp/preview-save-read-isolation/fixture.json','utf8'));
const base='http://127.0.0.1:5198/';const out='/tmp/preview-save-read-isolation/after.json';
const routes={
 memory:`?battleUi=vnext&battleFixture=cinema-homer`,
 unknown:`?battleUi=vnext&battleFixture=not-a-fixture`,
 emptyFixture:`?battleUi=vnext&battleFixture=`,
 standalone:`?battleUi=vnext&battleFixture=cinema-homer&battleCompareVariant=vnext`,
 childVnext:`?battleUi=vnext&battleFixture=cinema-homer&battleCompareVariant=vnext&battleCompareChild=vnext`,
 childLegacy:`?battleUi=vnext&battleFixture=cinema-homer&battleCompareVariant=legacy&battleCompareChild=legacy`,
 compare:`?battleUi=vnext&battleCompare=1&compareScenario=cinema-homer`,
 invalidChildOrdinary:`?battleUi=vnext&battleCompareChild=invalid`,
 legacy:`?battleUi=legacy`,
 noOptIn:``,
};
const init=(raw)=>{const k='9zone-v10-run';const orig={get:Storage.prototype.getItem,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem};orig.set.call(localStorage,k,raw);window.__g026raw=raw;window.__g026ops=[];window.__g026orig=orig;for(const [m,fn] of [['getItem','get'],['setItem','set'],['removeItem','remove']]){const o=orig[fn];Storage.prototype[m]=function(key,...a){if(String(key)===k)window.__g026ops.push({m,key:String(key),t:performance.now()});return o.call(this,key,...a)}}};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const rows=[];
for(const [name,q] of Object.entries(routes)){
 const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>rows.push({route:name,pageerror:e.message}));await p.addInitScript(init,fixture.raw);await p.goto(base+q,{waitUntil:'domcontentloaded'});await p.waitForTimeout(name==='compare'?1200:650);
 const frames=p.frames();const details=[];for(const frame of frames){try{details.push(await frame.evaluate(()=>({url:location.href,op:window.__g026ops||[],rack:document.querySelector('.v10-relic-rack')?.innerText||null,trigger:document.querySelector('.v10-relic-trigger')?.innerText||null,combat:!!document.querySelector('.duel-combat'),body:(document.body?.innerText||'').slice(0,150),rawUnchanged:window.__g026orig?.get.call(localStorage,'9zone-v10-run')===window.__g026raw})));}catch(e){details.push({url:frame.url(),error:e.message})}}
 rows.push({route:name,url:p.url(),frames:details});await p.close();
}
fs.writeFileSync(out,JSON.stringify({label:'G026 after candidate build; same route matrix and synthetic fixture. Verify exact build/guard source via parent status before interpreting.',fixture:{valid:true,key:fixture.key,rawBytes:fixture.raw.length,relic:fixture.state.relics,event:fixture.state.v10.lastCombat.relicEvents},rows},null,2));console.log(JSON.stringify(rows.map(r=>({route:r.route,frames:r.frames?.map(f=>({url:f.url?.split('?')[1],reads:f.op?.filter(x=>x.m==='getItem').length,writes:f.op?.filter(x=>x.m!=='getItem').length,rack:f.rack,trigger:f.trigger,combat:f.combat,unchanged:f.rawUnchanged,error:f.error}))})),null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
