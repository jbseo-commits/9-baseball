from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json,io
p=Path(__file__).resolve().parent
url='http://127.0.0.1:5173/docs/qa/main-hand-night-20261119/index.html'
report={}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for label in ['main','night']:
  page=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
  requests=[];page.on('request',lambda r:requests.append(r.url));errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url+('?view=main' if label=='main' else ''));page.wait_for_function('window.fixtureReady');f=page.frames[1];f.wait_for_selector('.bv-hand-handle');page.wait_for_timeout(300)
  assert f.locator('.battle-vnext').get_attribute('data-hand-open')=='false'
  page.screenshot(path=str(p/(label+'-closed.png')))
  frames=[Image.open(io.BytesIO(page.screenshot())).convert('RGB')]*5
  f.locator('.bv-hand-handle').tap()
  f.evaluate('()=>{window.studyAnimations=document.getAnimations().filter(a=>a.effect?.target?.closest(".bv-hand-area"));studyAnimations.forEach(a=>a.pause())}')
  timeline=[]
  for t in range(0,651,50):
   f.evaluate('(t)=>studyAnimations.forEach(a=>a.currentTime=t)',t)
   frames.append(Image.open(io.BytesIO(page.screenshot())).convert('RGB'))
   timeline.append(f.locator('.bv-card-slot').evaluate_all('(es)=>es.map(e=>({id:e.dataset.cardId,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y}))'))
  f.evaluate('()=>studyAnimations.forEach(a=>a.finish())');page.wait_for_timeout(100)
  frames += [Image.open(io.BytesIO(page.screenshot())).convert('RGB')]*22
  frames[0].save(p/(label+'-hand.gif'),save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=False)
  page.screenshot(path=str(p/(label+'-open.png')))
  if label=='night':
   badge=f.locator('[data-public-intent]');assert badge.get_attribute('data-certain')=='false';assert badge.get_attribute('data-clipped')=='false';assert badge.is_visible()
   assert badge.bounding_box()['y']+badge.bounding_box()['height']<=float(badge.get_attribute('data-head-y'))
   f.evaluate("document.querySelector('.battle-vnext').dataset.phase='flight'");page.wait_for_timeout(30);assert badge.is_hidden()
   f.evaluate("document.querySelector('.battle-vnext').dataset.phase='deciding'");page.wait_for_timeout(30);assert badge.is_visible()
  cards=f.locator('.bv-card-slot').evaluate_all('''es=>es.map(e=>{const s=getComputedStyle(e),a=e.querySelector('.bv-card-art');return{id:e.dataset.cardId,name:e.querySelector('.bv-card-name')?.textContent,rect:e.getBoundingClientRect().toJSON(),delay:s.transitionDelay,duration:s.transitionDuration,transform:s.transform,art:a?getComputedStyle(a).backgroundImage:null}})''')
  resources=[x for x in requests if any(t in x for t in ['BattleView.jsx','HandDock.jsx','BattleCard.jsx','atbat-card-art.js','folded-hand.css','reference.css'])]
  assert all(any(t in x for x in resources) for t in ['BattleView.jsx','HandDock.jsx','BattleCard.jsx','atbat-card-art.js','folded-hand.css','reference.css']),resources
  for _ in range(8): f.locator('.bv-hand-handle').tap()
  page.wait_for_timeout(500);assert f.locator('.bv-card-slot').count()==5
  f.locator('.bv-hand-handle').focus();page.keyboard.press('Enter');page.wait_for_timeout(400);page.keyboard.press('Escape');page.wait_for_timeout(400)
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
  notice=f.evaluate('getComputedStyle(document.body,"::before").content');assert '가로' in notice
  page.screenshot(path=str(p/(label+'-portrait.png')))
  page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(200);f.locator('.bv-hand-handle').tap();page.wait_for_timeout(600);page.screenshot(path=str(p/(label+'-desktop.png')))
  if label=='night':
   page.set_viewport_size({'width':844,'height':180});page.wait_for_timeout(100);assert f.locator('[data-public-intent]').get_attribute('data-clipped')=='true';assert f.locator('[data-public-intent]').is_hidden()
   page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(100);assert f.locator('[data-public-intent]').is_visible()
  page.emulate_media(reduced_motion='reduce');f.locator('.bv-hand-handle').tap();page.wait_for_timeout(20)
  duration=f.locator('.bv-hand-area').evaluate('e=>getComputedStyle(e).transitionDuration');assert duration=='0s',duration
  assert not errors,errors
  report[label]={'cards':cards,'resources':resources,'timeline':timeline,'errors':errors,'portraitNotice':notice,'reducedDuration':duration}
  page.close()
 b.close()
assert report['main']['cards']==report['night']['cards'],'Card geometry/content mismatch'
# CSS transitions include real event-to-pause latency; settled cards are exact; timeline captures retained without claiming pixel-identical intermediate timing.
a=Image.open(p/'main-open.png');c=Image.open(p/'night-open.png');pair=Image.new('RGB',(844,780));pair.paste(a,(0,0));pair.paste(c,(0,390));pair.save(p/'comparison.png')
(p/'verification.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('PASS: exact final card order/geometry/art/style; main components loaded; orientation/replay/reduced motion')
