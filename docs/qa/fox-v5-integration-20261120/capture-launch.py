from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);a.goto('http://127.0.0.1:4196/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent');a.wait_for_timeout(500);a.get_by_test_id('bp-swing').click();a.wait_for_selector('.bv-ball-sprite .fx-ball',state='visible');a.wait_for_timeout(35);assert a.locator('.bv-ball-sprite .fx-ball').is_visible();a.screenshot(path=str(p/'phone-launch-visible.png'));a.wait_for_timeout(70);a.screenshot(path=str(p/'phone-forward-visible.png'));b.close()
