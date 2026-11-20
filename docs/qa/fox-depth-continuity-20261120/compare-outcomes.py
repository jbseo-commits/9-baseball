from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);runs={}
 for action in ['hit','take','miss']:
  states=[]
  for port in [4195,4194]:
   c=b.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);a=c.new_page();a.goto(f'http://127.0.0.1:{port}/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent')
   if action!='take':
    a.locator('.bv-hand-handle').click();a.wait_for_timeout(600);a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="'+('2' if action=='hit' else '6')+'"]').click()
   a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);states.append(a.evaluate('JSON.parse(sessionStorage.getItem("9zone-playable-v1:9zone-v10-run"))'));c.close()
  assert states[0]==states[1],action;runs[action]={'entireAcceptedEngineStateEqual':True,'last':states[1]['last'],'hp':states[1]['pitcher']['hp']}
 b.close();(p/'outcome-comparison.json').write_text(json.dumps(runs,indent=2,ensure_ascii=False));print('PASS exact whole accepted engine state, baseline vs new, hit/take/miss')
