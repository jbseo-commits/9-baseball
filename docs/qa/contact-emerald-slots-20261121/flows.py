from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/private-field-qa');fixtures=json.loads((q/'fixtures.json').read_text());out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode in ['fresh','production','legacy']:
  c=b.new_context(viewport={'width':667,'height':375},has_touch=True);a=c.new_page();a.set_default_timeout(6000);req=[];a.on('request',lambda r:req.append(r.url) if '/contact-motion-v1/' in r.url or '/emerald-ready-v1/' in r.url else None);a.goto('http://127.0.0.1:'+('4248' if mode=='production' else '4246')+'/');key=('' if mode=='production' else '9zone-normal-review-v1:')+'9zone-v10-run'
  if mode=='fresh':
   a.get_by_role('button',name='새로운 게임',exact=True).tap();a.screenshot(path=str(q/'fresh-selection.png'));a.get_by_test_id('start-pack-go').tap();a.get_by_role('button',name='다음',exact=True).tap();a.get_by_role('button',name='다음',exact=True).tap();a.get_by_role('button',name='플레이 시작',exact=True).tap();a.get_by_test_id('bp-map-go').tap()
  else:
   s=fixtures['contact']
   if mode=='legacy':s=json.loads(json.dumps(s));s['v10'].pop('hitterClass',None)
   a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem(k.replace("9zone-v10-run","9zone-welcome-v1"),"seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).tap()
  a.wait_for_timeout(500);s=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key)
  if mode=='fresh':assert s['v10']['hitterClass']['id']=='slugger-v1'
  assert not req,(mode,req);assert a.get_by_test_id('pitcher-health').count()==1;assert a.locator('[data-actor=batter]').get_attribute('data-batter-kind') is None
  a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(100);a.set_viewport_size({'width':667,'height':375});a.wait_for_timeout(300);assert a.get_by_test_id('pitcher-health').count()==1
  out.append({'mode':mode,'noCandidateRequests':True,'rotation':True,'class':s['v10'].get('hitterClass')});c.close();print('PASS',mode,flush=True)
 b.close()
(q/'flows.json').write_text(json.dumps(out,indent=2))
