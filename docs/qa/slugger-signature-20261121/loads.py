from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json
q=Path('/workspace/slugger-signature-qa');s=json.loads((q/'cases.json').read_text())['slug-hit']['state'];Image.new('RGB',(256,256),'navy').save(q/'wrong-size.webp');out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode in ['missing','corrupt','wrong-size','redirect','slow','partial','other-class','production']:
  c=b.new_context(viewport={'width':667,'height':375});a=c.new_page();requests=[];held=[];errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   requests.append(r.request.url)
   if mode=='slow':held.append(r);return
   if mode=='missing' or (mode=='partial' and not r.request.url.endswith('/slug.webp')):r.fulfill(status=404,body='missing');return
   if mode=='redirect':r.fulfill(status=302,headers={'location':'https://example.invalid/no'});return
   data=b'not a webp' if mode=='corrupt' else (q/('wrong-size.webp' if mode=='wrong-size' else 'synthetic.webp')).read_bytes();r.fulfill(status=200,content_type='image/webp',body=data)
  a.route('**/slugger-cards-v1/*.webp',route);a.goto('http://127.0.0.1:'+('4232' if mode=='production' else '4231')+'/');key=('' if mode=='production' else '9zone-normal-review-v1:')+'9zone-v10-run';state=json.loads(json.dumps(s))
  if mode=='other-class':state=json.loads(Path('/workspace/slugger-qa/old-cases.json').read_text())['contact-v1']
  a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem(k.replace("9zone-v10-run","9zone-welcome-v1"),"seen")}',[key,state]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(1900);a.locator('.bv-hand-handle').click();a.wait_for_timeout(200)
  count=a.locator('[data-art="private-slugger"]').count();assert count>0 if mode=='partial' else count==0,(mode,count)
  if mode in ['other-class','production']:assert not requests
  else:assert len(requests)==3
  if mode=='slow':
   for r in held:
    try:r.fulfill(status=200,content_type='image/webp',body=(q/'synthetic.webp').read_bytes())
    except Exception:pass
   a.wait_for_timeout(300);assert a.locator('[data-art="private-slugger"]').count()==0
  assert not errors;a.screenshot(path=str(q/(mode+'-hand.png')));out.append({'mode':mode,'privateCards':count,'requests':requests,'errors':errors});c.close();print('PASS',mode,flush=True)
 b.close()
(q/'loads.json').write_text(json.dumps(out,indent=2))
