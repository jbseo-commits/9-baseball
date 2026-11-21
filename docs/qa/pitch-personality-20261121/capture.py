from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
out=Path('/workspace/personality-qa');cases=json.loads((out/'cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';url=os.environ.get('QA_URL','http://127.0.0.1:4216/');tag=os.environ.get('QA_TAG','after');runs=json.loads((out/(tag+'.json')).read_text()) if (out/(tag+'.json')).exists() else {}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in ([(844,390),(667,375),(1440,900)] if tag=='after' else [(844,390),(667,375)]):
  for name in (list(cases) if w==844 and tag=='after' else list(cases)[:3]):
   for action in ((['take','hit','whiff'] if cases[name]['zone']<9 else ['take','whiff']) if w==844 and tag=='after' and name in list(cases)[:3]+['gale-inside','tide-high','cobalt-two-strikes'] else ['take']):
    label=f'{tag}-{w}-{name}-{action}'
    if label in runs:continue
    c=b.new_context(viewport={'width':w,'height':h},record_video_dir=str(out/'videos'),record_video_size={'width':w,'height':h});a=c.new_page();errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.goto(url);s=cases[name]['state'];a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(900);a.screenshot(path=str(out/(label+'-cue.png')))
    if action!='take':
     a.locator('.bv-hand-handle').click();a.wait_for_timeout(350);a.get_by_role('button',name='기본 스윙',exact=False).first.click();z=cases[name]['zone'];a.locator('.bv-cell[data-zone="'+str(z if action=='hit' else (z+4)%9)+'"]').click()
    cue=a.locator('.bv-pitch-personality').get_attribute('data-profile') if a.locator('.bv-pitch-personality').count() else None
    a.evaluate('''()=>{window.trace=[];let end=performance.now()+3200;function f(t){let s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){let r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat);trace.push({t,phase:s.dataset.phase,x:r.x+p[0],y:r.y+p[1],width:parseFloat(b.style.width),cue:!!document.querySelector('.bv-pitch-personality'),balls:document.querySelectorAll('.bv-ball-sprite .fx-ball').length})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''');a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);a.wait_for_function('trace.length>0');a.screenshot(path=str(out/(label+'-release.png')));a.wait_for_selector('.bv-scene[data-phase="result"]');a.screenshot(path=str(out/(label+'-impact.png')));a.wait_for_timeout(1500);trace=a.evaluate('trace');assert trace and all(v['balls']==1 and not v['cue'] for v in trace);assert not errors
    runs[label]={'cue':cue,'actualZone':post['battle']['revealed']['zone'],'result':post['battle']['revealed'],'last':post['last'],'combat':post.get('v10',{}).get('lastCombat'),'trace':trace,'video':a.video.path()};c.close();(out/(tag+'.json')).write_text(json.dumps(runs,ensure_ascii=False,indent=2));print('PASS',label,flush=True)
 b.close()
