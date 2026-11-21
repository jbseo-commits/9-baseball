from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path(__file__).resolve().parent;cases=json.loads((out/'cases.json').read_text());key='9zone-normal-review-v1:9zone-v10-run';evidence={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,v in cases.items():
  c=b.new_context(viewport={'width':667,'height':375},record_video_dir=str(out/'videos'),record_video_size={'width':667,'height':375});a=c.new_page();errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.goto('http://127.0.0.1:4217/');a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,v['state']]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(1000);a.locator('.bv-hand-handle').click();a.wait_for_timeout(300);a.locator('[data-card-kind="'+v['kind']+'"].bv-card').first.click();a.locator('.bv-cell[data-zone="'+str(v['aim'])+'"]').click();a.wait_for_timeout(400);a.screenshot(path=str(out/(name+'-plan.png')))
  chip=a.locator('[data-testid="bp-forecast-hit"]').all_text_contents();text=a.locator('.bv-view').inner_text() if a.locator('.bv-view').count() else a.locator('body').inner_text()
  if name=='outside-confirmed':assert '45%' in text,text
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(1600);actual=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert actual['battle']['revealed']==v['expected'];assert actual['v10']['lastCombat']['damage']==v['damage'];a.screenshot(path=str(out/(name+'-result.png')));a.wait_for_timeout(1500);assert not errors
  evidence[name]={'seed':v['seed'],'method':'legal seeded normal-route checkpoint; real UI input; targeted QA, not fresh unassisted encounter','card':v['kind'],'chip':chip,'result':actual['battle']['revealed'],'combat':actual['v10']['lastCombat'],'errors':errors,'video':a.video.path()};c.close();(out/'case-verification.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2));print('PASS',name,flush=True)
 b.close()
