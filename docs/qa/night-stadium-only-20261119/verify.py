from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parent;root=p.parents[2]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);runs={}
 for variant in ['baseline','night']:
  a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1);errors=[];bad=[];a.on('pageerror',lambda e:errors.append(str(e)));a.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
  if variant=='baseline':a.route('**/night-stadium/stadium-registered.webp',lambda route:route.fulfill(path=str(root/'assets/production-art/mockup-rebuild/stadium.avif'),content_type='image/avif'))
  a.goto('http://127.0.0.1:5173/?battleUi=vnext&battlePlay=1&seed=3');a.wait_for_selector('.bv-hand-handle');a.locator('.bv-hand-handle').tap();a.wait_for_timeout(450)
  if variant=='night':
   a.screenshot(path=str(p/'after.png'))
   data=a.evaluate('''()=>({actor:[...document.querySelectorAll('.bv-actor')].map(e=>({kind:e.dataset.actor,rect:e.getBoundingClientRect().toJSON(),src:e.querySelector('img')?.getAttribute('src')})),world:document.querySelector('.bv-world').style.transform,cards:[...document.querySelectorAll('.bv-card-slot')].map(e=>({id:e.dataset.cardId,rect:e.getBoundingClientRect().toJSON()}))})''');assert data==json.loads((p/'before.json').read_text());(p/'after.json').write_text(json.dumps(data,indent=2))
  # Actual same main controller: select a real card, aim, execute, allow original next flow.
  a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="2"]').click();a.get_by_test_id('bp-swing').click();a.wait_for_timeout(3500)
  state=a.evaluate('Object.fromEntries(Object.entries(sessionStorage))');runs[variant]={'storage':state,'errors':errors,'httpErrors':bad}
  a.screenshot(path=str(p/(variant+'-result.png')))
  # Rotation and desktop retain same real flow, then reload resumes existing isolated playable storage.
  a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(150);assert '가로' in a.evaluate('getComputedStyle(document.body,"::before").content')
  a.set_viewport_size({'width':1440,'height':900});a.wait_for_timeout(200)
  if variant=='night':a.screenshot(path=str(p/'desktop.png'))
  a.reload();a.wait_for_selector('.bv-hand-handle');assert a.evaluate('Object.fromEntries(Object.entries(sessionStorage))')==state
  assert not errors and not bad,(errors,bad);a.close()
 assert runs['baseline']['storage']==runs['night']['storage'],'same input produced different state'
 (p/'flow-verification.json').write_text(json.dumps(runs,indent=2));b.close()
print('PASS unchanged geometry, identical real-play state, resume, rotation, no404/errors')
