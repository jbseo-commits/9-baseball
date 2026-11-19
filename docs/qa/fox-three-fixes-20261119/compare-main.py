from playwright.sync_api import sync_playwright
from pathlib import Path
import json
p=Path('/workspace/9-baseball/docs/qa/fox-three-fixes-20261119');data={}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,port in [('main',5175),('review',4188)]:
  a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1);a.goto(f'http://127.0.0.1:{port}/?battleUi=vnext&battlePlay=1&seed=3');a.wait_for_selector('.bv-hand-handle');a.locator('.bv-hand-handle').click();a.wait_for_timeout(450);a.screenshot(path=str(p/f'comparison-{name}.png'))
  data[name]=a.evaluate('''()=>({world:document.querySelector('.bv-world').style.transform,pitcher:document.querySelector('.bv-actor-pitcher').getBoundingClientRect().toJSON(),zones:[...document.querySelectorAll('.bv-cell')].map(e=>e.getBoundingClientRect().toJSON()),hud:document.querySelector('.bv-hud').getBoundingClientRect().toJSON()})''');a.close()
 assert data['main']==data['review'];(p/'camera-comparison.json').write_text(json.dumps(data,indent=2));b.close()
print('PASS same844x390 camera/pitcher/HUD/zone geometry vs main')
