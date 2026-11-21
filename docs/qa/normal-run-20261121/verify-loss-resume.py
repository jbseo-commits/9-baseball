from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path(__file__).resolve().parent;evidence=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(844,390),(667,375)]:
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,storage_state=str(out/'public-small-browser-storage.json'));a=c.new_page();a.goto('http://127.0.0.1:4214/');a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(400);assert a.locator('.bp-end:not(.won)').count();a.screenshot(path=str(out/f'loss-{w}.png'));saved=a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-v10-run")');a.set_viewport_size({'width':390,'height':844});a.reload();a.set_viewport_size({'width':w,'height':h});a.get_by_role('button',name='이어하기',exact=True).click();assert a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-v10-run")')==saved
  for el in [*a.locator('.bp-endstats div').all(),a.get_by_test_id('bp-end-again')]:
   r=el.bounding_box();assert r and r['y']>=0 and r['y']+r['height']<=h+1,r
  a.get_by_test_id('bp-end-again').click();a.get_by_role('button',name='닫기',exact=True).click();assert a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-v10-run")')==saved
  a.get_by_test_id('bp-end-again').click();a.get_by_role('radio',name='버티기',exact=True).click();a.get_by_test_id('start-pack-go').click();a.wait_for_timeout(1300);assert a.locator('.bp-map').count();assert not a.get_by_role('dialog',name='게임 방법').count();new=a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-v10-run")');assert json.loads(new)['initialSeed']!=json.loads(saved)['initialSeed'];evidence.append({'width':w,'lossSeed':json.loads(saved)['initialSeed'],'restartSeed':json.loads(new)['initialSeed'],'lossResumeExact':True,'packCancelPreserves':True,'introNotRepeated':True});c.close()
 b.close()
(out/'loss-resume-verification.json').write_text(json.dumps(evidence,indent=2));print('PASS',evidence)
