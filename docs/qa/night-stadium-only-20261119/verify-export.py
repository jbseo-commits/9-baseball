from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json,time
p=Path(__file__).resolve().parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);runs={}
 for name,w,h,reduced in [('phone',844,390,False),('desktop',1440,900,False),('reduced',844,390,True)]:
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=name!='desktop',has_touch=True,device_scale_factor=1,reduced_motion='reduce' if reduced else 'no-preference');a=c.new_page();errors=[];bad=[];a.on('pageerror',lambda e:errors.append(str(e)));a.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
  a.goto('http://127.0.0.1:4180/dist/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-hand-handle');a.locator('.bv-hand-handle').click();a.wait_for_timeout(500)
  assert '붉은 여우' in a.locator('.bv-hud-opponent').inner_text()
  local=a.evaluate('Object.fromEntries(Object.entries(localStorage))')
  state=lambda:a.evaluate('JSON.parse(sessionStorage.getItem("9zone-playable-v1:9zone-v10-run"))')
  initial=state();a.screenshot(path=str(p/f'export-{name}-ready.png'))
  # Actual card controller, no state/RNG or deadline overrides.
  a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="2"]').click();a.get_by_test_id('bp-swing').click();a.wait_for_timeout(80);swing_result=state()
  frames=[];times=[];start=time.monotonic()
  if name=='phone':
   while time.monotonic()-start<3.2:
    frames.append(Image.open(__import__('io').BytesIO(a.screenshot())).convert('RGB'));times.append(round((time.monotonic()-start)*1000));a.wait_for_timeout(90)
   frames[0].save(p/'export-gameplay.gif',save_all=True,append_images=frames[1:]+[frames[-1]],duration=[max(30,y-x) for x,y in zip(times,times[1:])]+[100,1200],loop=0)
  else:a.wait_for_timeout(3400)
  swing=state();assert swing['stats']['pitches']==initial['stats']['pitches']+1
  a.screenshot(path=str(p/f'export-{name}-swing.png'))
  assert not a.get_by_test_id('bp-swing').is_disabled();a.get_by_test_id('bp-swing').click();a.wait_for_timeout(80);take_result=state();a.wait_for_timeout(3400);take=state();assert take['stats']['pitches']==swing['stats']['pitches']+1
  a.screenshot(path=str(p/f'export-{name}-take.png'))
  a.reload();a.wait_for_selector('.bv-hand-handle');assert state()==take
  a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(100);assert '가로' in a.evaluate('getComputedStyle(document.body,"::before").content')
  a.set_viewport_size({'width':w,'height':h});a.wait_for_timeout(100)
  assert local==a.evaluate('Object.fromEntries(Object.entries(localStorage))');assert not errors and not bad,(errors,bad)
  runs[name]={'viewport':[w,h],'reducedMotion':reduced,'initial':initial,'swingEngineResult':swing_result['last'],'takeEngineResult':take_result['last'],'afterCardSwing':swing,'afterTake':take,'resume':True,'rotationGate':True,'localStorageUnchanged':True,'errors':errors,'httpErrors':bad,'gifCaptureTimesMs':times};c.close()
 (p/'export-verification.json').write_text(json.dumps(runs,ensure_ascii=False,indent=2));b.close()
print('PASS final dist real card/swing/take/results/resume/rotation/reduced/no404')
