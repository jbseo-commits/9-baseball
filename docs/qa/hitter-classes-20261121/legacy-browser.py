from playwright.sync_api import sync_playwright
from pathlib import Path
import json
out=Path(__file__).resolve().parent;cases=json.loads((out/'legacy-cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';results={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,v in cases.items():
  c=b.new_context(viewport={'width':667,'height':375});a=c.new_page();a.goto('http://127.0.0.1:4217/');a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,v['state']]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(500);a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(1000);n=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert n['v10']['startPack']==v['state']['v10']['startPack'];assert n['deck']==v['deck'];assert n['battle']['hand']==v['hand'];results[name]={'mapResume':True,'exactDeck':True,'exactOpeningHand':True,'oldId':n['v10']['startPack']['pack']};c.close()
 b.close()
(out/'legacy-browser.json').write_text(json.dumps(results,indent=2));print('PASS',results)
