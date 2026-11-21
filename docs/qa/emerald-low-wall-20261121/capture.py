from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
q=Path('/workspace/emerald-qa');cases=json.loads((q/'cases.json').read_text());out=[];key='9zone-normal-review-v1:9zone-v10-run'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height,mode in [(844,390,'normal'),(667,375,'normal'),(1440,900,'normal'),(667,375,'reduced'),(844,390,'alt')]:
  for name,v in cases.items():
   if mode in ['reduced','alt'] and name!='hit':continue
   c=b.new_context(viewport={'width':width,'height':height},reduced_motion='reduce' if mode=='reduced' else 'no-preference',record_video_dir=str(q/'videos'),record_video_size={'width':width,'height':height});a=c.new_page();errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.goto('http://127.0.0.1:4230/');a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,v['state']]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(500)
   cue=a.locator('.bv-pitch-personality');assert cue.get_attribute('data-profile')=='low-wall';box=cue.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width
   label=f'{width}-{mode}-{name}';a.screenshot(path=str(q/(label+'-ready.png')))
   if v['action']!='take':
    a.locator('.bv-hand-handle').click();a.wait_for_timeout(250);a.get_by_test_id('bv-basic-chip').click();a.locator('.bv-cell[data-zone="'+str(v['aim'])+'"]').click()
   a.evaluate('''()=>{window.trace=[];let end=performance.now()+6500;function f(t){let s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){let r=b.getBoundingClientRect();trace.push({t,phase:s.dataset.phase,x:r.x,y:r.y,w:r.width,cue:!!document.querySelector('.bv-pitch-personality'),balls:document.querySelectorAll('.bv-ball-sprite .fx-ball').length})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
   if mode=='alt':a.get_by_label('애니메이션 배속').select_option('0.5')
   a.get_by_test_id('bp-swing').click()
   if mode=='alt':a.keyboard.up('Alt')
   a.wait_for_timeout(100);post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);(q/'debug-post.json').write_text(json.dumps(post,ensure_ascii=False));assert post['last']==v['expected']['last'],(label,post['last'],v['expected']['last']);assert post['battle']['revealed']==v['expected']['result'];assert post['v10']['lastCombat']==v['expected']['combat'];a.wait_for_timeout(4300 if mode=='alt' else 3000);trace=a.evaluate('trace');assert not errors
   if mode!='reduced':assert trace and all(t['balls']==1 and not t['cue'] for t in trace)
   a.screenshot(path=str(q/(label+'-result.png')));out.append({'label':label,'result':post['last'],'trace':trace,'errors':errors,'video':a.video.path(),'cueBox':box});c.close();(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('PASS',label,flush=True)
 b.close()
