from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parent;state=json.loads(Path('/tmp/earned-outside.json').read_text())
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
 a.add_init_script('sessionStorage.setItem("9zone-playable-v1:9zone-v10-run",'+json.dumps(json.dumps(state))+');')
 a.goto('http://127.0.0.1:4190/dist/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-intent-outside');badge=a.locator('.bv-public-intent');assert badge.inner_text()=='볼\n!';assert badge.get_attribute('aria-label')=='공개 의도 · 존 밖 볼 확정';assert a.locator('.bv-intent-nine [data-active]').count()==0
 a.wait_for_function("[...document.querySelectorAll('.bv-actor img')].length===2 && [...document.querySelectorAll('.bv-actor img')].every(i=>i.complete&&i.naturalWidth>0)");a.wait_for_timeout(2500)
 a.screenshot(path=str(p/'confirmed-outside.png'));a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);assert a.locator('.bv-public-intent').count()==0;a.wait_for_timeout(3400);a.wait_for_selector('.bv-public-intent');assert a.locator('.bv-intent-outside').count()==0
 (p/'outside-verification.json').write_text(json.dumps({'fixture':'controlled outside pitch, then legal scout via playV10Action; earned resumed state. Not a naturally encountered draw.','source':'existing public knownPitchZones=[9]','badge':'볼!','noInsideHighlight':True,'flightHidden':True,'nextDecisionRestoredWithoutStaleOutside':True,'viewport':[844,390]},ensure_ascii=False,indent=2));b.close()
print('PASS extracted ZIP outside earned-clue badge/flight/reset')
