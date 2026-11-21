from pathlib import Path
from playwright.sync_api import sync_playwright
import json,math
out=Path(__file__).resolve().parent/'evidence';cases=json.loads((out/'cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';runs={};frameSize=json.loads((Path(__file__).resolve().parents[3]/'assets/production-art/pitch-juice-v1/manifest.json').read_text())['effects']['ball']['frameSize'][0]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(844,390),(667,375),(1440,900)]:
  for case in (list(cases) if w==844 else ['0','8','9','onyx']):
   for action in (['take','hit','whiff'] if case=='4' else ['take']):
    label=f'{w}-{case}-{action}';c=b.new_context(viewport={'width':w,'height':h});a=c.new_page();a.goto('http://127.0.0.1:4215/');s=cases[case]['state'];a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(1000)
    if action!='take':
     a.locator('.bv-hand-handle').click();a.wait_for_timeout(350);a.get_by_role('button',name='기본 스윙',exact=False).first.click();a.locator('.bv-cell[data-zone="'+('4' if action=='hit' else '0')+'"]').click()
    assert not a.locator('.bv-ball-sprite').count()
    a.evaluate('''()=>{window.trace=[];let end=performance.now()+3000;function f(t){let s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){let r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat),v=k=>parseFloat(s.style.getPropertyValue(k));trace.push({t,phase:s.dataset.phase,x:r.x+p[0],y:r.y+p[1],width:parseFloat(b.style.width),scale:v('--bv-world-scale'),release:[v('--bv-release-x'),v('--bv-release-y')],contact:[v('--bv-contact-x'),v('--bv-contact-y')]})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''');a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);zone=post['battle']['revealed']['zone'];assert zone==cases[case]['zone'];a.wait_for_function('window.trace.length>0');a.screenshot(path=str(out/f'{label}-release.png'));a.wait_for_selector('.bv-scene[data-phase="result"]');a.screenshot(path=str(out/f'{label}-impact.png'));a.wait_for_timeout(800);trace=a.evaluate('trace');res=[]
    for v in trace:
     if action=='hit' and v['phase']=='result':continue
     radius=v['width']*10/(frameSize*v['scale']);t=2-12/radius;q=t/(2-t);cx=v['contact'][0]+(110 if zone==9 else (zone%3-1)*50)*v['scale'];cy=v['contact'][1]+(0 if zone==9 else (zone//3-1)*45)*v['scale'];x=v['release'][0]+(cx-v['release'][0])*q;y=v['release'][1]+(cy-v['release'][1])*q;res.append(math.hypot(x-v['x'],y-v['y']))
    assert res and max(res)<.15,(label,max(res,default=999));runs[label]={'actualZone':zone,'kind':post['battle']['revealed']['kind'],'maxPathRadiusResidualCssPx':max(res),'first3':trace[:3],'before':next(v for v in reversed(trace) if v['phase']=='flight'),'after':next(v for v in trace if v['phase']=='result'),'trace':trace};c.close();(out/'courses-runtime.json').write_text(json.dumps(runs,ensure_ascii=False,indent=2));print('PASS',label,flush=True)
 b.close();(out/'courses-runtime.json').write_text(json.dumps(runs,ensure_ascii=False,indent=2));print('PASS',len(runs))
