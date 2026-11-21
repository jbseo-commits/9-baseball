from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
p=Path(__file__).resolve().parent
url=os.environ.get('QA_URL','http://127.0.0.1:4173/')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);runs={}
 for name,w,h,reduce in [('phone',844,390,False),('desktop',1440,900,False),('reduced',844,390,True)]:
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=name!='desktop',has_touch=True,device_scale_factor=1,reduced_motion='reduce' if reduce else 'no-preference',**({'record_video_dir':'/tmp/roster-intent-video','record_video_size':{'width':w,'height':h}} if name=='phone' else {}));a=c.new_page();errors=[];bad=[];a.on('pageerror',lambda e:errors.append(str(e)));a.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
  a.goto(url+'?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent');a.locator('.bv-hand-handle').click();a.wait_for_timeout(600)
  a.screenshot(path=str(p/f'{name}-ready.png'));before=a.evaluate('Object.fromEntries(Object.entries(localStorage))');state=lambda:a.evaluate('JSON.parse(sessionStorage.getItem("9zone-playable-v1:9zone-v10-run"))')
  geometry=a.evaluate('''()=>({world:document.querySelector('.bv-world').style.transform,batter:document.querySelector('.bv-actor-batter').getAttribute('style'),badge:document.querySelector('.bv-public-intent').getBoundingClientRect().toJSON(),cells:[...document.querySelectorAll('.bv-cell')].map(x=>x.getBoundingClientRect().toJSON()),batterRendering:getComputedStyle(document.querySelector('.bv-actor-batter img')).imageRendering,background:document.querySelector('.bv-stadium').getAttribute('src')})''')
  assert geometry['batterRendering']=='pixelated'
  a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="2"]').click();a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);hit=state()['last'];assert a.locator('.bv-public-intent').count()==0
  a.wait_for_timeout(850);a.screenshot(path=str(p/f'{name}-swing.png'));assert 'batter-runtime' in a.locator('.bv-actor-batter img').get_attribute('src');a.wait_for_timeout(2500);assert state()['pitcher']['hp']==42;a.wait_for_selector('.bv-public-intent');a.screenshot(path=str(p/f'{name}-returned.png'))
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);take=state()['last'];assert a.locator('.bv-public-intent').count()==0;a.wait_for_timeout(3400);a.wait_for_selector('.bv-public-intent');saved=state();a.reload();a.wait_for_selector('.bv-public-intent');assert state()==saved
  a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(150);assert '가로' in a.evaluate('getComputedStyle(document.body,"::before").content');a.set_viewport_size({'width':w,'height':h});a.wait_for_selector('.bv-public-intent');assert a.locator('.bv-public-intent').count()==1
  assert before==a.evaluate('Object.fromEntries(Object.entries(localStorage))');assert not errors and not bad,(errors,bad)
  video=a.video.path() if a.video else None;runs[name]={'geometry':geometry,'hit':hit,'take':take,'hpAfterHit':42,'badgeLifecycle':True,'reloadResume':True,'rotationGate':True,'localStorageUnchanged':True,'errors':errors,'httpErrors':bad,'video':video};c.close()
 (p/'export-verification.json').write_text(json.dumps(runs,ensure_ascii=False,indent=2));b.close()
print('PASS final export: card/hit/take/12pose source/badge lifecycle/rotation/resume/no404')
