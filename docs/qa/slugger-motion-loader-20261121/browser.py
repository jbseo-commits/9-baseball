from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/slugger-motion-qa');raw=(q/'synthetic.json').read_text();texture=(q/'synthetic.webp').read_bytes();cases=json.loads(Path('/workspace/slugger-qa/old-cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 matrix=[('baseline',844,390,'slugger-v1'),('loaded',844,390,'slugger-v1'),('loaded',667,375,'slugger-v1'),('old-slugger',844,390,'slugger-v1'),('missing',844,390,'slugger-v1'),('json-corrupt',844,390,'slugger-v1'),('anchor',844,390,'slugger-v1'),('texture-missing',844,390,'slugger-v1'),('texture-corrupt',844,390,'slugger-v1'),('redirect',844,390,'slugger-v1'),('render-error',844,390,'slugger-v1')]+[('other',667,375,i)for i in ['contact-v1','bad-ball-v1','spray-v1']]
 for mode,w,h,cid in matrix:
  c=b.new_context(viewport={'width':w,'height':h},record_video_dir=str(q/'videos'),record_video_size={'width':w,'height':h});a=c.new_page();a.set_default_timeout(8000);requests=[];errors=[];external=[];a.on('pageerror',lambda e:errors.append(str(e)));a.on('request',lambda r:external.append(r.url) if 'invalid.example' in r.url else None)
  def route(r):
   requests.append(r.request.url);isjson=r.request.url.endswith('.json')
   if mode=='missing' or (mode=='texture-missing' and not isjson):r.fulfill(status=404);return
   if mode=='redirect':r.fulfill(status=302,headers={'Location':'https://invalid.example/no.webp'});return
   body=raw if isjson else texture
   if mode=='json-corrupt' and isjson:body='<html>'
   if mode=='anchor' and isjson:body=raw.replace('52.5','53.5')
   if mode=='texture-corrupt' and not isjson:body=b'not webp'
   r.fulfill(status=200,content_type='application/json' if isjson else 'image/webp',body=body)
  a.route('**/slugger-motion-v2/*',route);url='http://127.0.0.1:'+('4226' if mode=='baseline' else '4228')+'/';a.goto(url);s=json.loads(json.dumps(cases[cid]));
  if mode=='old-slugger':s['v10']['hitterClass'].pop('buildVersion',None)
  a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(900)
  loaded=mode in ['loaded','old-slugger','render-error'];actor=a.locator('[data-actor=batter]');assert (actor.get_attribute('data-batter-kind')=='review-slugger-atlas')==loaded,(mode,requests)
  geometry=a.locator('.bv-scene').evaluate('(e)=>({style:e.getAttribute("style"),motion:e.dataset.motion,world:e.querySelector(".bv-world").getAttribute("style"),actor:e.querySelector("[data-actor=batter]").getAttribute("style")})');assert geometry['motion']=='authored';a.screenshot(path=str(q/f'{mode}-{w}-{cid}-ready.png'))
  if mode=='render-error':actor.locator('img').dispatch_event('error');assert actor.get_attribute('data-batter-kind') is None;assert actor.get_attribute('style')==geometry['actor']
  result=None;trace=[]
  if mode in ['baseline','loaded','old-slugger']:
   a.locator('.bv-hand-handle').click();a.wait_for_timeout(250);a.get_by_test_id('bv-basic-chip').click();a.locator('.bv-cell[data-zone="4"]').click();a.evaluate('''()=>{window.framesSeen=[];const end=performance.now()+3200;function f(t){let a=document.querySelector('[data-actor=batter]'),s=document.querySelector('.bv-scene'),ball=document.querySelector('.bv-ball-sprite .fx-ball');if(a)framesSeen.push({t,frame:a.dataset.frame,phase:s.dataset.phase,kind:a.dataset.batterKind,ball:ball?.getBoundingClientRect().toJSON()});if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''');a.get_by_test_id('bp-swing').click();a.wait_for_timeout(3000);trace=a.evaluate('framesSeen');post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);result={'last':post['last'],'combat':post['v10']['lastCombat'],'revealed':post['battle']['revealed']};a.screenshot(path=str(q/f'{mode}-{w}-{cid}-result.png'));saved=a.evaluate('(k)=>localStorage.getItem(k)',key);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(400);assert a.evaluate('(k)=>localStorage.getItem(k)',key)==saved
  assert not errors and not external,(mode,errors,external)
  if mode in ['baseline','other']:assert not requests
  out.append({'mode':mode,'viewport':[w,h],'class':cid,'geometry':geometry,'requests':requests,'errors':errors,'externalRequests':external,'result':result,'trace':trace,'video':a.video.path()});c.close();print('PASS',mode,w,cid,flush=True);(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 b.close()
base=out[0];same=next(x for x in out if x['mode']=='loaded' and x['viewport'][0]==844);assert base['geometry']==same['geometry'];assert base['result']==same['result'];print('PASS exact baseline geometry and outcome')
