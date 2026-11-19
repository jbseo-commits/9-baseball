from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json,io
p=Path(__file__).resolve().parent
assets={}
for f in (p/'assets').glob('*.png'):
 im=Image.open(f).convert('RGBA');assert im.size==(96,96);assert set(im.getchannel('A').getdata())<={0,255};assets[f.name]={'size':im.size,'bbox':im.getbbox()}
report=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for label,w,h in [('landscape',844,390),('portrait',390,844),('desktop',1440,900)]:
  page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=1);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:5173/docs/qa/red-fox-single-pitch-20261119/index.html');page.wait_for_function('window.shotReady');f=page.frames[2]
  for t in [0,500,850,1100,1260,1600,2200]:
   page.evaluate('(t)=>seekShot(t)',t);e=page.evaluate('shotEvidence');assert e['externalBalls']==(1 if 1100<=t<1580 else 0);assert e['sourceScale']==1
   assert f.locator('[data-public-intent]').is_visible()==(t<500)
   if label=='landscape':page.screenshot(path=str(p/('pose-'+e['pose']+'.png')))
  assert f.locator('.battle-vnext').evaluate('e=>e.inert')
  page.evaluate('resetShot()');assert not f.locator('.battle-vnext').evaluate('e=>e.inert');assert page.evaluate('shotEvidence.pose')=='set'
  for _ in range(15):page.evaluate('replayShot()')
  page.evaluate('resetShot()');page.wait_for_timeout(100);assert page.evaluate('shotEvidence.phase')=='ready'
  page.evaluate('replayShot()');page.wait_for_timeout(100);page.set_viewport_size({'width':w+1,'height':h});page.wait_for_timeout(100);assert page.evaluate('shotEvidence.phase')=='ready';page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100)
  page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100);page.evaluate('replayShot()');assert page.evaluate('shotEvidence.pose')=='recover';assert page.evaluate('shotEvidence.externalBalls')==0;assert not page.evaluate('shotEvidence.rafActive')
  page.evaluate('resetShot()')
  if label!='portrait':
   page.locator('#replay').focus();page.keyboard.press('Enter');page.wait_for_timeout(50);assert page.evaluate('shotEvidence.pose')=='recover'
   page.locator('#reset').focus();page.keyboard.press('Space');assert page.evaluate('shotEvidence.phase')=='ready'
  assert f.locator('.bv-ball-sprite').count()==0
  assert f.locator('.bv-action-dock').evaluate_all('es=>es.length>0&&es.every(e=>e.inert)')
  page.screenshot(path=str(p/(label+'-ready.png')))
  if label=='portrait':assert '가로' in f.evaluate('getComputedStyle(document.body,"::before").content')
  assert not errors,errors;report.append({'viewport':[w,h],'errors':errors,'replay15':True,'resizeReset':True,'reducedRecover':True})
  if label=='landscape':
   page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(100);page.evaluate('resetShot()');f.locator('.bv-hand-handle').tap();page.wait_for_timeout(450);assert not page.evaluate('!!document.fullscreenElement');assert page.locator('#tools').is_visible();frames=[]
   for t in list(range(0,2201,50))+[2200]*20:
    page.evaluate('(t)=>seekShot(t)',t);frames.append(Image.open(io.BytesIO(page.screenshot())).convert('RGB'))
   frames[0].save(p/'single-pitch.gif',save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=False)
  page.close()
 b.close()
(p/'verification.json').write_text(json.dumps({'assets':assets,'browser':report},indent=2));print('PASS six assets, phases, replay, reset, resize, reduced motion, portrait, GIF')
