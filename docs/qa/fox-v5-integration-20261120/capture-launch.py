from pathlib import Path
from playwright.sync_api import sync_playwright
import json,base64
p=Path(__file__).resolve().parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);a.goto('http://127.0.0.1:4196/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent');a.wait_for_timeout(500);a.get_by_test_id('bp-swing').click();a.wait_for_function("document.querySelector('.bv-ball-sprite .fx-ball') && document.querySelector('.bv-scene').dataset.phase==='flight'",polling='raf');client=a.context.new_cdp_session(a)
 def capture(name):
  before=a.evaluate("({phase:document.querySelector('.bv-scene').dataset.phase,pose:document.querySelector('.bv-actor-pitcher').dataset.pose})");raw=client.send('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'];(p/name).write_bytes(base64.b64decode(raw));after=a.evaluate("({phase:document.querySelector('.bv-scene').dataset.phase,pose:document.querySelector('.bv-actor-pitcher').dataset.pose})");return {'before':before,'after':after}
 evidence={'launch':capture('phone-launch-visible.png')};a.wait_for_timeout(50);evidence['forward']=capture('phone-forward-visible.png');(p/'launch-capture-timing.json').write_text(json.dumps(evidence,indent=2));assert evidence['launch']['before']['phase']=='flight';b.close()
