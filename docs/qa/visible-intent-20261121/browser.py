from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/visible-intent-qa');fixtures=json.load(open(q/'fixtures.json'));key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 matrix=[(id,667,375,False)for id in fixtures]+[(id,844,390,False)for id in ['boss-01-emerald-tyrant','boss-02-platinum-halo','boss-03-black-eclipse']]+[('boss-01-emerald-tyrant',1440,900,False),('boss-01-emerald-tyrant',667,375,True)]
 for id,w,h,reduced in matrix:
  c=b.new_context(viewport={'width':w,'height':h},has_touch=True,reduced_motion='reduce' if reduced else 'no-preference');a=c.new_page();a.set_default_timeout(8000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
  a.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(fixtures[id]))+');localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen");')
  def art(r):
   f=Path('/workspace/slugger-motion-qa')/('synthetic.json' if r.request.url.endswith('.json') else 'synthetic.webp');r.fulfill(status=200,content_type='application/json' if f.suffix=='.json' else 'image/webp',body=f.read_bytes())
  a.route('**/slugger-motion-v2/*',art);a.goto('http://127.0.0.1:4264/');a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(700)
  badge=a.locator('.bv-public-intent');hp=a.get_by_test_id('pitcher-health');target=a.get_by_test_id('pitcher-details-target');assert badge.count()==1 and badge.is_visible();assert not a.locator('.bv-pitch-personality').count();bb=badge.bounding_box();hb=hp.bounding_box();tb=target.bounding_box();hud=a.locator('.bv-hud-bar').bounding_box();assert abs(hb['y']-(bb['y']+bb['height'])-4)<1;assert bb['y']>=0 and bb['x']>=0 and bb['x']+bb['width']<=w;assert bb['y']+bb['height']<tb['y'],(id,bb,tb)
  overlap=lambda x,y:x['x']<y['x']+y['width'] and x['x']+x['width']>y['x'] and x['y']<y['y']+y['height'] and x['y']+x['height']>y['y']
  assert not overlap(bb,hud),(id,w,bb,hud)
  record={'id':id,'viewport':[w,h],'reduced':reduced,'badge':bb,'hp':hb,'headTarget':tb,'publicLabel':badge.get_attribute('aria-label'),'noHudOrHeadOverlap':True}
  a.screenshot(path=str(q/f'{id}-{w}-{reduced}-ready.png'))
  if id=='boss-01-emerald-tyrant':
   before=int(hp.get_attribute('aria-valuenow'));pt={'x':tb['x']+tb['width']/2,'y':tb['y']+tb['height']/2};cdp=c.new_cdp_session(a)
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[pt]});a.wait_for_timeout(80);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert not a.get_by_role('dialog').count()
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[pt]});a.wait_for_timeout(550);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert a.get_by_role('dialog').count();a.keyboard.press('Escape');assert not a.get_by_role('dialog').count()
   signature=badge.inner_html();a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200);a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="4"]').tap()
   a.evaluate('()=>{window.intentTrace=[];const end=performance.now()+2000;function f(){const b=document.querySelector(".bv-public-intent");intentTrace.push({phase:document.querySelector(".bv-scene")?.dataset.phase,html:b?.innerHTML,label:b?.getAttribute("aria-label")});if(performance.now()<end)requestAnimationFrame(f)}f()}');a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(350 if not reduced else 60);a.screenshot(path=str(q/f'{id}-{w}-{reduced}-flight.png'));a.wait_for_timeout(1800);trace=a.evaluate('intentTrace');assert all(x['html']==signature for x in trace);assert badge.inner_html()==signature;spot=a.get_by_test_id('bv-result-spotlight').bounding_box() if a.get_by_test_id('bv-result-spotlight').count() else None;assert spot is None and reduced or spot is not None and not overlap(badge.bounding_box(),spot);post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert int(hp.get_attribute('aria-valuenow'))==post['pitcher']['hp'];record.update({'frozenThroughFlightResult':True,'trace':trace,'hpBefore':before,'hpAfter':post['pitcher']['hp'],'holdTouchEscape':True});a.screenshot(path=str(q/f'{id}-{w}-{reduced}-result.png'))
   if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').tap();a.wait_for_timeout(250);assert badge.is_visible()
   a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(100);a.set_viewport_size({'width':w,'height':h});a.wait_for_timeout(200);assert badge.is_visible()
  assert not errors;out.append(record);c.close();(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('PASS',id,w,reduced,flush=True)
 b.close()
