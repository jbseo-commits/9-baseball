from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/slugger-run-cache-qa');raw=Path('/workspace/slugger-motion-qa/synthetic.json').read_text();tex=Path('/workspace/slugger-motion-qa/synthetic.webp').read_bytes();cases=json.load(open('/workspace/slugger-qa/old-cases.json'));key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode in ['resume','fresh','late-flight','late-prep','timeout','invalid','other']:
  c=b.new_context(viewport={'width':667 if mode!='resume' else 844,'height':375 if mode!='resume' else 390},has_touch=True);a=c.new_page();a.set_default_timeout(9000);req=[];held=[];errs=[];a.on('pageerror',lambda e:errs.append(str(e)))
  a.add_init_script('''window.actorSamples=[];function sample(){const e=document.querySelector('[data-actor=batter]');if(e)actorSamples.push({t:performance.now(),kind:e.dataset.batterKind||'generic',frame:e.dataset.frame,phase:document.querySelector('.bv-scene')?.dataset.phase});requestAnimationFrame(sample)}requestAnimationFrame(sample)''')
  def route(r):
   req.append(r.request.url)
   if mode in ['late-flight','late-prep','timeout'] and r.request.url.endswith('.json'):held.append(r);return
   if mode=='invalid':r.fulfill(status=200,content_type='application/json',body='{}');return
   r.fulfill(status=200,content_type='application/json' if r.request.url.endswith('.json') else 'image/webp',body=raw if r.request.url.endswith('.json') else tex)
  a.route('**/slugger-motion-v2/*',route);a.goto('http://127.0.0.1:4262/');a.get_by_role('button',name='새로운 게임',exact=True).wait_for()
  if mode=='fresh':
   assert not req;a.get_by_role('button',name='새로운 게임',exact=True).tap();a.wait_for_timeout(600);assert len(req)==2;assert a.get_by_role('radio',name='슬러거',exact=True).get_attribute('aria-checked')=='true';a.get_by_test_id('start-pack-go').tap();a.get_by_role('button',name='다음',exact=True).tap();a.get_by_role('button',name='다음',exact=True).tap();a.get_by_role('button',name='플레이 시작',exact=True).tap();a.wait_for_timeout(400);a.get_by_test_id('bp-map-go').tap()
  else:
   s=cases['contact-v1' if mode=='other' else 'slugger-v1'];a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem(k.replace("9zone-v10-run","9zone-welcome-v1"),"seen")}',[key,s]);a.reload();a.wait_for_timeout(600)
   assert len(req)==(0 if mode=='other' else 1 if mode in ['late-flight','late-prep','timeout','invalid'] else 2),(mode,req)
   a.get_by_role('button',name='이어하기',exact=True).tap()
  actor=a.locator('[data-actor=batter]');actor.wait_for();a.wait_for_timeout(500)
  if mode in ['resume','fresh']:
   samples=a.evaluate('actorSamples');assert samples and all(x['kind']=='review-slugger-atlas' for x in samples),(mode,samples[:5]);assert len(req)==2
  elif mode=='other':assert not req
  else:assert actor.get_attribute('data-batter-kind') is None
  a.screenshot(path=str(q/(mode+'-ready.png')))
  if mode in ['late-flight','late-prep']:
   a.locator('.bv-hand-handle').tap();a.wait_for_timeout(250)
   if mode=='late-prep':
    card=a.locator('.bv-card[data-card-kind="loadPower"]:not(:disabled)').first
    print('PREP',a.locator('.bv-card').all_text_contents(),flush=True);card.tap()
   else:a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="4"]').tap()
   a.get_by_test_id('bp-swing').tap();held[0].fulfill(status=200,content_type='application/json',body=raw);a.wait_for_timeout(100)
   trace=a.evaluate('actorSamples');assert all(x['kind']=='generic' for x in trace if x['phase']!='deciding'),(mode,trace[-5]);a.wait_for_timeout(2100)
   if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').tap()
   a.wait_for_timeout(300);assert actor.get_attribute('data-batter-kind')=='review-slugger-atlas'
  if mode=='timeout':
   a.wait_for_timeout(5000);held[0].fulfill(status=200,content_type='application/json',body=raw);a.wait_for_timeout(200);assert actor.get_attribute('data-batter-kind') is None;assert len(req)==1
  assert not errs;out.append({'mode':mode,'requests':req,'firstSamples':a.evaluate('actorSamples.slice(0,4)'),'noPageErrors':True});c.close();print('PASS',mode,flush=True);(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 b.close()
