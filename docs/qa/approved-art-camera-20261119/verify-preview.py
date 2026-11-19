from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parent
rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for name,w,h in [('phone',390,844),('landscape',844,390),('desktop',1440,900)]:
  page=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((p/'index.html').read_text());page.wait_for_function('window.measurement')
  for mode in ['native','camera']:
   page.locator('#'+mode).click();page.wait_for_timeout(100)
   page.screenshot(path=str(p/(name+'-'+mode+'.png')),full_page=True)
   r=page.evaluate('window.measurement');r['viewport']=[w,h];r['errors']=errors;rows.append(r)
   assert not r['smoothing'] and not errors
   if mode=='camera':
    expected=next(x['snapshot']['camera'] for x in json.loads((p/'camera-measurements.json').read_text()) if x['viewport']==[w,h])
    for key in ['scale','x','y']: assert abs(r[key]-expected[key])<1e-9, (key,r,expected)
  page.close()
 b.close()
(p/'preview-measurements.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows))
