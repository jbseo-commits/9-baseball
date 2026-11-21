from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/ground-qa');cases=json.loads((q/'cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h,zone,mode,action in [(667,375,'4','normal','swing'),(667,375,'5','normal','take'),(667,375,'8','normal','swing'),(667,375,'9','normal','take'),(844,390,'4','normal','swing'),(1440,900,'4','normal','swing'),(667,375,'4','reduced','swing')]:
  c=b.new_context(viewport={'width':w,'height':h},has_touch=True,reduced_motion='reduce' if mode=='reduced' else 'no-preference',**({'record_video_dir':str(q/'videos'),'record_video_size':{'width':w,'height':h}} if w==667 and zone=='4' and mode=='normal' else {}));a=c.new_page();a.set_default_timeout(6000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
  a.route('**/emerald-ready-v1/*',lambda r:r.fulfill(status=404))
  def slug(r):
   f=Path('/workspace/slugger-motion-qa')/('synthetic.json' if r.request.url.endswith('json') else 'synthetic.webp');r.fulfill(status=200,content_type='application/json' if r.request.url.endswith('json') else 'image/webp',body=f.read_bytes())
  a.route('**/slugger-motion-v2/*',slug);a.goto('http://127.0.0.1:4257/');a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,cases[zone]]);a.reload();a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(700);tell=a.get_by_test_id('emerald-ground-tell');assert tell.is_visible();assert tell.inner_text()=='낮음 선호';assert not a.locator('.bv-private-ready').count();assert not a.locator('.bv-intent-badge').count();assert a.get_by_test_id('pitcher-health').count()==1;assert a.locator('[data-actor=batter]').get_attribute('data-batter-kind')=='review-slugger-atlas'
  markup=tell.evaluate('(e)=>e.outerHTML');bounds=tell.bounding_box();zoneTop=a.locator('.bv-cell').first.bounding_box()['y'];assert bounds['y']+bounds['height']<=zoneTop,(w,bounds,zoneTop);assert tell.evaluate('(e)=>getComputedStyle(e).pointerEvents')=='none'
  if mode=='reduced':assert tell.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
  label=f'{w}-{zone}-{mode}';a.screenshot(path=str(q/(label+'-ready.png')));a.evaluate('window.originalTell=document.querySelector("[data-testid=emerald-ground-tell]")');a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200);assert tell.is_visible()
  if zone=='4':
   a.locator('.bv-card[data-card-kind="loadPower"]').tap();a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(120);assert tell.is_visible();assert not a.locator('.bv-ball-sprite .fx-ball').count();a.wait_for_timeout(1500);assert a.evaluate('originalTell===document.querySelector("[data-testid=emerald-ground-tell]")');a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200)
  if action=='swing':a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="4"]').tap()
  else:
   # Closing hand returns to the existing take action, no hidden-course UI.
   a.locator('.bv-hand-handle').tap();a.wait_for_timeout(100)
  a.evaluate('''(key)=>{window.trace=[];window.committed=[];const save=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){save.call(this,k,v);if(k===key){const s=JSON.parse(v);if(s.battle?.revealed)committed.push(s.battle.revealed)}};let end=performance.now()+3500;function f(t){const e=document.querySelector('[data-testid=emerald-ground-tell]'),s=document.querySelector('.bv-scene');if(e)trace.push({t,phase:s.dataset.phase,visibility:getComputedStyle(e).visibility,balls:document.querySelectorAll('.bv-ball-sprite .fx-ball').length});if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''',key);a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(1700);trace=a.evaluate('trace');result=a.evaluate('committed.at(-1)');assert result['zone']==int(zone);assert not any(t['visibility']=='visible' for t in trace if t['phase']!='deciding');assert all(t['balls']<=1 for t in trace);a.screenshot(path=str(q/(label+'-result.png')));assert not errors
  out.append({'width':w,'mode':mode,'fixtureZoneAfterCommit':result['zone'],'result':result['kind'],'markup':markup,'bounds':bounds,'zoneTop':zoneTop,'errors':errors,'trace':trace,'video':a.video.path() if a.video else None});c.close();(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('PASS',label,flush=True)
 b.close()
assert all(v['markup']==out[0]['markup'] for v in out if v['width']==667);print('PASS identical public tell across centre/right/low/outside')
