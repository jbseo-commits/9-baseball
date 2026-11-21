from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/slugger-signature-qa');cases=json.loads((q/'cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h,mode in [(667,375,'normal'),(844,390,'normal'),(1440,900,'normal'),(667,375,'reduced')]:
  for name,v in cases.items():
   if w!=667 and name not in ['slug-hit','gapHunter-hit','loadPower-prepare']:continue
   if mode=='reduced' and name not in ['slug-hit','loadPower-prepare']:continue
   c=b.new_context(viewport={'width':w,'height':h},reduced_motion='reduce' if mode=='reduced' else 'no-preference',record_video_dir=str(q/'videos'),record_video_size={'width':w,'height':h});a=c.new_page();errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.route('**/slugger-cards-v1/*.webp',lambda r:r.fulfill(status=200,content_type='image/webp',body=(q/'synthetic.webp').read_bytes()));a.goto('http://127.0.0.1:4231/');a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,v['state']]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(650);a.locator('.bv-hand-handle').click();a.wait_for_timeout(350);label=f'{w}-{mode}-{name}';a.screenshot(path=str(q/(label+'-hand.png')))
   target=a.locator('[data-card-kind="'+v['kind']+'"]');assert target.locator('[data-art="private-slugger"]').count()>=1
   assert target.first.locator('.bv-card-art').evaluate('(e)=>getComputedStyle(e).backgroundSize')=='contain'
   a.evaluate('''()=>{window.fx=[];let end=performance.now()+6500;function f(t){let e=document.querySelector('[data-testid=slugger-feedback]'),s=document.querySelector('.bv-scene');if(e)fx.push({t,kind:e.dataset.kind,phase:s.dataset.phase});if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
   if v['action']!='take':
    target.first.click()
    if v['action']!='prepare':a.locator('.bv-cell[data-zone="'+str(v['aim'])+'"]').click();a.wait_for_timeout(450)
   if v['action']=='take':a.locator('.bv-hand-handle').click()
   a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert post['last']==v['expected']['last'],(label,post['last'],v['expected']['last']);assert post['battle'].get('revealed')==v['expected'].get('result');assert post['v10'].get('lastCombat')==v['expected'].get('combat');a.wait_for_timeout(2800);fx=a.evaluate('fx');assert not errors
   want=mode!='reduced' and (name.endswith('-hit') or name=='loadPower-prepare');assert bool(fx)==want,(label,fx)
   a.screenshot(path=str(q/(label+'-after.png')));out.append({'label':label,'fx':fx,'result':post['last'],'errors':errors,'video':a.video.path()});c.close();(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('PASS',label,flush=True)
 b.close()
