from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
q=Path('/workspace/private-field-qa');fixtures=json.loads((q/'fixtures.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';out=json.loads((q/'browser.json').read_text()) if os.environ.get('RESUME') else []
matrix=[('baseline',844,'contact','hit'),('loaded',844,'contact','hit'),('loaded',667,'contact','hit'),('loaded',1440,'contact','hit'),('loaded',844,'contact','take'),('loaded',667,'contact','whiff'),('reduced',667,'contact','hit'),('loaded',844,'emerald','hit'),('loaded',667,'emerald','take'),('reduced',667,'emerald','hit'),('loaded',844,'slugger','hit')]+[(m,667,'contact',None)for m in ['missing','json-corrupt','anchor','texture-corrupt','render-error','slow']]+[(m,667,'emerald',None)for m in ['missing','texture-corrupt','render-error']]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode,w,who,action in matrix[len(out):]:
  h=900 if w==1440 else 375 if w==667 else 390;c=b.new_context(viewport={'width':w,'height':h},has_touch=True,reduced_motion='reduce' if mode=='reduced' else 'no-preference',**({'record_video_dir':str(q/'videos'),'record_video_size':{'width':w,'height':h}} if mode=='loaded' and ((who=='contact' and w==844 and action=='hit') or (who=='emerald' and w==667)) else {}));a=c.new_page();a.set_default_timeout(6000);errors=[];requests=[];external=[];a.on('pageerror',lambda e:errors.append(str(e)));a.on('request',lambda r:external.append(r.url) if 'invalid.example' in r.url else None)
  def route(r):
   requests.append(r.request.url);url=r.request.url
   if mode=='missing':r.fulfill(status=404);return
   if mode=='slow':a.wait_for_timeout(5000)
   name='contact.json' if url.endswith('.json') else 'ready.png' if url.endswith('.png') else 'contact.webp';body=(q/name).read_bytes();mime='application/json' if name.endswith('json') else 'image/png' if name.endswith('png') else 'image/webp'
   if mode=='json-corrupt' and name.endswith('json'):body=b'<html>'
   if mode=='anchor' and name.endswith('json'):body=body.replace(b'65',b'66')
   if mode=='texture-corrupt' and not name.endswith('json'):body=b'invalid'
   r.fulfill(status=200,content_type=mime,body=body)
  a.route('**/contact-motion-v1/*',route);a.route('**/emerald-ready-v1/*',route)
  def slug(r):
   name='synthetic.json' if r.request.url.endswith('.json') else 'synthetic.webp';r.fulfill(status=200,content_type='application/json' if name.endswith('json') else 'image/webp',body=Path('/workspace/slugger-motion-qa',name).read_bytes())
  a.route('**/slugger-motion-v2/*',slug)
  port=4247 if mode=='baseline' else 4246;a.goto(f'http://127.0.0.1:{port}/');s=fixtures[who];a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(5700 if mode=='slow' else 800)
  loaded=mode in ['loaded','reduced','render-error'];actor=a.locator('[data-actor=batter]');expected='review-contact-atlas' if who=='contact' else 'review-slugger-atlas' if who=='slugger' else None
  if who!='emerald':assert (actor.get_attribute('data-batter-kind')==expected)==loaded,(mode,who,requests)
  else:assert bool(a.locator('.bv-private-ready').count())==loaded
  assert a.get_by_test_id('pitcher-health').count()==1;assert a.locator('.bv-intent-badge').count()==0
  geometry=a.locator('.bv-scene').evaluate('(e)=>({style:e.getAttribute("style"),world:e.querySelector(".bv-world").getAttribute("style"),pitcher:e.querySelector("[data-actor=pitcher]").getAttribute("style")})');label=f'{mode}-{w}-{who}-{action}';a.screenshot(path=str(q/(label+'-ready.png')))
  if mode=='render-error':
   if who=='contact':actor.locator('img').dispatch_event('error');assert actor.get_attribute('data-batter-kind') is None
   else:a.locator('.bv-private-ready').dispatch_event('error');assert not a.locator('.bv-private-ready').count()
  post=None;trace=[]
  if action:
   target=a.get_by_test_id('pitcher-details-target');target.focus();a.keyboard.press('Enter');a.wait_for_timeout(100);assert a.get_by_role('dialog').count();a.keyboard.press('Escape');a.wait_for_timeout(150)
   if action!='take':a.locator('.bv-hand-handle').tap();a.wait_for_timeout(250);a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="'+('8' if action=='whiff' else '4')+'"]').tap()
   a.evaluate('''()=>{window.trace=[];let end=performance.now()+3300;function f(t){const a=document.querySelector('[data-actor=batter]'),s=document.querySelector('.bv-scene');if(a)trace.push({t,frame:a.dataset.frame,phase:s.dataset.phase,ready:!!document.querySelector('.bv-private-ready'),kind:a.dataset.batterKind});if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''');a.evaluate('''(key)=>{window.committed=[];const save=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){save.call(this,k,v);if(k===key){const s=JSON.parse(v);if(s.battle?.revealed)window.committed.push({last:s.last,revealed:s.battle.revealed,combat:s.v10.lastCombat});}}}''',key);a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(1400);a.screenshot(path=str(q/(label+'-crossing.png')));a.wait_for_timeout(1400);trace=a.evaluate('trace');post=a.evaluate('committed.at(-1)');assert post['revealed'] is not None
   if who=='emerald':assert not any(t['ready'] for t in trace if t['phase']!='deciding')
   a.screenshot(path=str(q/(label+'-result.png')));a.wait_for_timeout(1500);saved=a.evaluate('(k)=>localStorage.getItem(k)',key);a.reload();a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(200);restored=a.evaluate('(k)=>localStorage.getItem(k)',key);(q/'reload-before.json').write_text(saved);(q/'reload-after.json').write_text(restored);assert restored==saved,(label,[k for k in json.loads(saved) if json.loads(saved)[k]!=json.loads(restored).get(k)])
  assert not errors and not external,(label,errors,external)
  out.append({'label':label,'geometry':geometry,'requests':requests,'result':post,'trace':trace,'errors':errors,'video':a.video.path() if a.video else None});c.close();(q/'browser.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('PASS',label,flush=True)
 b.close()
assert out[0]['result']==out[1]['result'];assert out[0]['geometry']==out[1]['geometry'];assert out[1]['result']['revealed']['zone']==4
print('PASS exact centre baseline result/camera; fixtures only, not actual candidate acceptance')
