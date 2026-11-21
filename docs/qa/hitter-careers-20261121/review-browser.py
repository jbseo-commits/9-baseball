from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json,io
out=Path('/workspace/careers-qa');cases=json.loads((out/'reward-cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';profile='9zone-normal-review-v1:9zone-hitter-career-v1';results=[];url='http://127.0.0.1:4222/'
classes=[('slugger-v1','슬러거'),('contact-v1','컨택 히터'),('bad-ball-v1','배드볼 히터'),('spray-v1','스프레이 히터')]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for idx,(cid,name) in enumerate(classes):
  w,h=(844,390) if idx%2 else (667,375)
  c=b.new_context(viewport={'width':w,'height':h},storage_state=str(out/'browser-storage.json'),record_video_dir=str(out/'class-videos'),record_video_size={'width':w,'height':h});a=c.new_page();errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.goto(url);a.get_by_role('button',name='새로운 게임',exact=True).click()
  if a.get_by_role('button',name='처음부터 시작',exact=True).count():a.get_by_role('button',name='처음부터 시작',exact=True).click()
  assert a.get_by_role('radio',name=name,exact=True).get_attribute('aria-disabled')=='false';a.get_by_role('radio',name=name,exact=True).click();a.screenshot(path=str(out/(cid+'-select.png')));a.get_by_test_id('start-pack-go').click();a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(1300);a.screenshot(path=str(out/(cid+'-fresh-battle.png')))
  a.locator('.bv-hand-handle').click();a.locator('.bv-card.t-swing').first.click();a.locator('.bv-cell[data-zone="4"]').click()
  if not a.get_by_test_id('bp-swing').is_enabled():a.get_by_test_id('bv-basic-chip').click();a.locator('.bv-cell[data-zone="4"]').click()
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(1800);a.screenshot(path=str(out/(cid+'-fresh-result.png')));saved=a.evaluate('(k)=>localStorage.getItem(k)',key);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(400);assert a.evaluate('(k)=>localStorage.getItem(k)',key)==saved
  results.append({'class':cid,'freshTitleToFirstResult':True,'resumeExact':True,'viewport':[w,h],'video':a.video.path(),'errors':errors});c.close()
 for cid,name in classes:
  for branch in [0,1]:
   c=b.new_context(viewport={'width':667,'height':375},reduced_motion='reduce',record_video_dir=str(out/'reward-videos'),record_video_size={'width':667,'height':375});a=c.new_page();a.goto(url);v=cases[cid];a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,v['state']]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(250);before=a.evaluate('(k)=>localStorage.getItem(k)',profile);a.locator('.bv-hand-handle').click()
   (a.get_by_test_id('bv-basic-chip') if v['id']=='basic' else a.locator('.bv-card[data-card-kind="'+v['kind']+'"]').first).click();a.locator('.bv-cell[data-zone="'+str(v['aim'])+'"]').click();a.get_by_test_id('bp-swing').click();a.wait_for_timeout(400)
   if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').click()
   a.locator('.bp-offer.reward-card').first.wait_for();a.wait_for_timeout(400);assert a.locator('.bp-class-branch').count()==2;a.screenshot(path=str(out/(cid+'-reward-'+str(branch)+'.png')));off=a.locator('.bp-offer.reward-card').nth(branch);kind=off.get_attribute('data-card-kind');label=off.locator('.bp-class-branch').inner_text();off.click();a.get_by_test_id('bp-stop-go').click();after=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert after['rewards'][-1]['classBranch']==label;assert after['deck'][-1]['kind']==kind;assert a.evaluate('(k)=>localStorage.getItem(k)',profile)==before
   results.append({'class':cid,'branch':label,'card':kind,'method':'legal public-policy engine checkpoint; actual final swing and reward UI, no career credit','seed':v['seed'],'video':a.video.path(),'noCareerCredit':True});c.close()
 # Fixed-path optional portrait adapter, local approved actor clone only.
 buf=io.BytesIO();Image.open('/workspace/9-baseball/assets/pixel-batter-review-v1/batter-runtime.webp').crop((0,0,768,768)).save(buf,format='WEBP',lossless=True);body=buf.getvalue()
 for mode in ['loaded','missing','corrupt']:
  c=b.new_context(viewport={'width':667,'height':375});a=c.new_page();requests=[]
  def route(r):
   requests.append(r.request.url);r.fulfill(status=404 if mode=='missing' else 200,content_type='image/webp',body=body if mode=='loaded' else b'bad')
  a.route('**/roster-v2/*',route);a.goto(url);a.get_by_role('button',name='새로운 게임',exact=True).click();a.wait_for_timeout(700);assert a.locator('.hc-portrait[data-art="owner-portrait"]').count()==(4 if mode=='loaded' else 0);assert a.locator('.hc-portrait[data-art="neutral-silhouette"]').count()==(0 if mode=='loaded' else 4)
  assert sorted(x.split('/roster-v2/')[-1] for x in requests)==['bad-ball.webp','contact.webp','slugger.webp','spray.webp'];results.append({'portraitFixture':mode,'requests':requests,'count':4});c.close()
 b.close()
(out/'review-browser.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('PASS',len(results))
