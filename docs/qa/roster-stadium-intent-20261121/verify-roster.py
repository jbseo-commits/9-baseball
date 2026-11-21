from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path('/workspace/9-baseball/docs/qa/roster-stadium-intent-20261121');key='9zone-playable-v1:9zone-v10-run'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=b.new_page();p.goto('http://127.0.0.1:4200/')
 fixtures=p.evaluate('''async()=>{const E=await import('/src/duel/engine.js');const found={};for(let seed=0;seed<4;seed++)for(const tutorial of [false,true]){const s=E.createV10Duel(seed,{tutorial});for(const n of s.runMap.nodes){const id=n.opponent?.artId;if(!id||found[id])continue;const q=structuredClone(s);q.runMap.reachableIds=[n.id];found[id]={seed,tutorial,node:n.id,state:E.enterV10Node(q,n.id)};}}return found;}''');p.close();results=[]
 for w,h,dpr in [(844,390,1),(844,390,3),(1440,900,1),(667,375,2)]:
  c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,is_mobile=w<1000,has_touch=True);a=c.new_page();bad=[];a.on('pageerror',lambda e:bad.append(str(e)));a.on('response',lambda r:bad.append(str(r.status)+r.url) if r.status>=400 else None)
  for id,f in fixtures.items():
   print(w,h,dpr,id,flush=True)
   a.goto('http://127.0.0.1:4198/?battleUi=vnext&battlePlay=1&seed=20261119');a.evaluate('([k,s])=>sessionStorage.setItem(k,JSON.stringify(s))',[key,f['state']]);a.reload();a.wait_for_selector('.bv-public-intent',timeout=5000);a.wait_for_function("[...document.querySelectorAll('.bv-actor img')].every(i=>i.complete&&i.naturalWidth>0)");a.wait_for_timeout(100)
   r=a.evaluate('''()=>{let e=document.querySelector('.bv-public-intent'),p=document.querySelector('.bv-actor-pitcher'),r=e.getBoundingClientRect(),a=p.getBoundingClientRect();return {id:p.dataset.rosterArt,badge:r.toJSON(),actor:a.toJSON(),knowledge:e.dataset.knowledge,style:e.getAttribute('style'),world:document.querySelector('.bv-world').style.transform};}''');assert r['id']==id,(r['id'],id);assert r['badge']['x']>=0 and r['badge']['right']<=w and r['badge']['y']>=0,r;results.append({'viewport':[w,h,dpr],**r})
   if w==844 and dpr==1:a.screenshot(path=str(out/(id+'-ready.png')))
  assert not bad,bad;c.close()
 b.close();(out/'roster-render-qa.json').write_text(json.dumps({'note':'Controlled fixture: real generated opponent/node contracts; reachability overridden only in QA to render all21, not claimed campaign wins. Production has no QA injection.','runs':results},indent=2));print('PASS',len(results),'actual registered render cases')
