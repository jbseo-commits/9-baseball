from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/slugger-motion-qa');raw=(q/'synthetic.json').read_text();texture=(q/'synthetic.webp').read_bytes();s=json.loads(Path('/workspace/slugger-qa/old-cases.json').read_text())['slugger-v1'];out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode in ['fresh','late','reduced','production']:
  c=b.new_context(viewport={'width':667,'height':375},reduced_motion='reduce' if mode=='reduced' else 'no-preference',record_video_dir=str(q/'videos'),record_video_size={'width':667,'height':375});a=c.new_page();a.set_default_timeout(8000);requests=[];held=[];errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   requests.append(r.request.url)
   if mode=='late' and r.request.url.endswith('.json'):held.append(r);return
   r.fulfill(status=200,content_type='application/json' if r.request.url.endswith('.json') else 'image/webp',body=raw if r.request.url.endswith('.json') else texture)
  a.route('**/slugger-motion-v2/*',route);a.goto('http://127.0.0.1:'+('4229' if mode=='production' else '4228')+'/')
  key=('' if mode=='production' else '9zone-normal-review-v1:')+'9zone-v10-run'
  if mode=='fresh':
   a.get_by_role('button',name='새로운 게임',exact=True).click();a.get_by_test_id('start-pack-go').click();a.get_by_role('button',name='다음',exact=True).click();a.get_by_role('button',name='다음',exact=True).click();a.get_by_role('button',name='플레이 시작',exact=True).click();a.get_by_test_id('bp-map-go').click()
  else:
   a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem(k.replace("9zone-v10-run","9zone-welcome-v1"),"seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click()
  a.wait_for_timeout(700)
  if mode=='production':assert not requests;out.append({'mode':mode,'requests':requests});c.close();continue
  actor=a.locator('[data-actor=batter]');assert (actor.get_attribute('data-batter-kind') is not None)==(mode!='late')
  a.screenshot(path=str(q/f'{mode}-ready.png'));a.locator('.bv-hand-handle').click();a.wait_for_timeout(250);a.get_by_test_id('bv-basic-chip').click();a.locator('.bv-cell[data-zone="4"]').click();a.get_by_test_id('bp-swing').click()
  if mode=='late':
   a.wait_for_timeout(250);assert len(held)==1;held[0].fulfill(status=200,content_type='application/json',body=raw);a.wait_for_timeout(450);assert actor.get_attribute('data-batter-kind') is None
  a.wait_for_timeout(3000 if mode!='reduced' else 500);a.screenshot(path=str(q/f'{mode}-result.png'))
  if mode=='late' and a.locator('.bv-scene').get_attribute('data-phase')!='deciding':assert actor.get_attribute('data-batter-kind') is None
  if mode=='reduced':assert actor.get_attribute('data-frame')=='0'
  saved=a.evaluate('(k)=>localStorage.getItem(k)',key)
  if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').click()
  a.wait_for_timeout(600);assert actor.get_attribute('data-batter-kind')=='review-slugger-atlas'
  a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(100);a.set_viewport_size({'width':667,'height':375});a.wait_for_timeout(300);assert actor.get_attribute('data-batter-kind')=='review-slugger-atlas';assert not errors;out.append({'mode':mode,'loadedNextDecision':True,'noMidflightSwap':mode=='late','result':json.loads(saved)['last'],'requests':requests,'errors':errors,'video':a.video.path()});c.close();print('PASS',mode,flush=True)
 b.close()
(q/'flows.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('PASS production no requests')
