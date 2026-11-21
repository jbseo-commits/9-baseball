from playwright.sync_api import sync_playwright
from pathlib import Path
import json
q=Path('/workspace/field-harness-qa');out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for cid,mode,w in [('slugger','loaded',667),('contact','loaded',844),('slugger','missing',844)]:
  c=b.new_context(viewport={'width':w,'height':375 if w==667 else 390},has_touch=True);a=c.new_page();a.set_default_timeout(6000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
  def art(r):
   if mode=='missing':r.fulfill(status=404);return
   u=r.request.url
   if '/slugger-motion-v2/' in u:f=Path('/workspace/slugger-motion-qa')/('synthetic.json' if u.endswith('json') else 'synthetic.webp')
   elif '/contact-motion-v1/' in u:f=Path('/workspace/private-field-qa')/('contact.json' if u.endswith('json') else 'contact.webp')
   else:f=Path('/workspace/private-field-qa/ready.png')
   r.fulfill(status=200,content_type='application/json' if u.endswith('json') else 'image/png' if u.endswith('png') else 'image/webp',body=f.read_bytes())
  for path in ['slugger-motion-v2','contact-motion-v1','emerald-ready-v1']:a.route('**/'+path+'/*',art)
  a.goto('http://127.0.0.1:4251/field-harness.html');a.evaluate('()=>{localStorage.setItem("9zone-normal-review-v1:9zone-v10-run","normal-save-sentinel");localStorage.setItem("9zone-v10-run","production-save-sentinel");localStorage.setItem("9zone-normal-review-v1:9zone-hitter-career-v1","career-sentinel")}');before=a.evaluate('JSON.stringify({...localStorage})');a.get_by_role('button',name='슬러거 vs 에메랄드' if cid=='slugger' else '컨택 중심 타격 vs 에메랄드',exact=True).tap();a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(700)
  actor=a.locator('[data-actor=batter]');assert (actor.get_attribute('data-batter-kind')=='review-'+cid+'-atlas')==(mode=='loaded');assert a.locator('[data-roster-art="boss-01-emerald-tyrant"]').count();assert bool(a.locator('.bv-private-ready').count())==(mode=='loaded');assert '검수 경기' in a.locator('aside').inner_text();a.screenshot(path=str(q/(cid+'-'+mode+'-ready.png')))
  hp=int(a.get_by_test_id('pitcher-health').get_attribute('aria-valuenow'));a.locator('.bv-hand-handle').tap();a.wait_for_timeout(250);a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="4"]').tap();a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(1500);afterhp=int(a.get_by_test_id('pitcher-health').get_attribute('aria-valuenow'));assert afterhp<hp;a.screenshot(path=str(q/(cid+'-'+mode+'-hit.png')));assert a.evaluate('JSON.stringify({...localStorage})')==before;assert not errors
  a.get_by_role('button',name='검수 선택으로',exact=True).tap();assert a.get_by_role('button',name='슬러거 vs 에메랄드',exact=True).count();a.reload();assert a.get_by_role('button',name='슬러거 vs 에메랄드',exact=True).count();assert a.evaluate('JSON.stringify({...localStorage})')==before
  out.append({'class':cid,'mode':mode,'width':w,'hpBefore':hp,'hpAfter':afterhp,'normalStorageUnchanged':True,'reloadReturnsChooser':True,'errors':errors});c.close();print('PASS',cid,mode,flush=True)
 c=b.new_context();a=c.new_page()
 def host(r):
  response=c.request.get(r.request.url.replace('http://not-local.invalid','http://127.0.0.1:4251'));r.fulfill(response=response)
 a.route('http://not-local.invalid/**',host);a.goto('http://not-local.invalid/field-harness.html');a.wait_for_timeout(300);assert 'localhost에서만' in a.locator('body').inner_text();assert not a.get_by_role('button').count();out.append({'nonLocalBlocked':True});b.close();(q/'browser.json').write_text(json.dumps(out,indent=2));print('PASS host gate')
