const {chromium}=require('playwright'),fs=require('node:fs');const out='/tmp/g026-relic-preview-probe.json';
const routes=[
 ['integration-fixture','?battleUi=vnext&battleFixture=cinema-homer'],
 ['comparison-legacy-child','?battleUi=vnext&battleFixture=cinema-homer&battleCompareChild=legacy'],
 ['comparison-vnext-child','?battleUi=vnext&battleFixture=cinema-homer&battleCompareChild=vnext'],
 ['standalone-legacy','?battleUi=vnext&battleFixture=cinema-homer&battleCompareVariant=legacy'],
 ['comparison-page','?battleUi=vnext&battleCompare=1'],
 ['playable-memory','?battleUi=vnext&battlePlay=1&seed=3'],
 ['ordinary-vnext-main','?battleUi=vnext'],
 ['ordinary-legacy-with-stale-flag','?battleUi=legacy&battlePlay=1'],
 ['ordinary-legacy-main','?battleUi=legacy'],
];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
 for(const [name,q] of routes){const p=await b.newPage({viewport:{width:844,height:390}});
  await p.addInitScript(()=>{localStorage.setItem('9zone-v10-run',JSON.stringify({relics:['firstPitch'],v10:{lastCombat:{relicEvents:['probe']}}}));window.__relicReadAudit=[];const original=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(this===localStorage&&k==='9zone-v10-run')window.__relicReadAudit.push({at:performance.now(),stack:(new Error()).stack?.split('\n').slice(1,5)});return original.call(this,k)};});
  await p.goto('http://127.0.0.1:5199/'+q);await p.waitForTimeout(800);
  const result=await p.evaluate(()=>({url:location.search,reads:window.__relicReadAudit||[],combat:!!document.querySelector('.duel-combat'),battle:!!document.querySelector('.battle-vnext,.bp-battle'),rack:document.querySelector('.v10-relic-rack')?.innerText||null,trigger:document.querySelector('.v10-relic-trigger')?.innerText||null,reward:!!document.querySelector('.reward-screen'),fixture:!!document.querySelector('.bv-fixture-tools'),title:document.querySelector('h1')?.innerText||null}));
  results.push({name,...result});await p.close();}
 await b.close();fs.writeFileSync(out,JSON.stringify({base:'http://127.0.0.1:5199/',seed:{relics:['firstPitch'],v10:{lastCombat:{relicEvents:['probe']}}},method:'preload localStorage sentinel, instrument getItem in every frame, inspect DOM after 800ms',results},null,2));console.log(JSON.stringify(results.map(({name,reads,combat,battle,rack,trigger,reward,fixture})=>({name,reads:reads.length,firstStack:reads[0]?.stack,combat,battle,rack,trigger,reward,fixture})),null,2));console.log('REPORT '+out);
})().catch(e=>{console.error(e);process.exit(1)});
