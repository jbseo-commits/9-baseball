from playwright.sync_api import sync_playwright
from pathlib import Path
import json
q=Path('/workspace/slugger-qa');s=json.loads((q/'checkpoint-fixtures.json').read_text())['checkpoints']['boss-reward-act1'];key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for n in [0,1]:
  c=b.new_context(viewport={'width':667,'height':375});a=c.new_page();a.goto('http://127.0.0.1:4226/');a.evaluate('([k,s])=>{localStorage.setItem(k,JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',[key,s]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(1400);assert a.locator('.bp-class-branch').count()==2;o=a.locator('.bp-offer.reward-card').nth(n);kind=o.get_attribute('data-card-kind');label=o.locator('.bp-class-branch').inner_text();o.click();a.screenshot(path=str(q/f'branch-{n}.png'));relic=a.locator('.bp-relic-offers .bp-offer');
  if relic.count():relic.first.click()
  a.get_by_test_id('bp-stop-go').click();a.wait_for_timeout(500);v=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert v['deck'][-1]['kind']==kind;assert v['rewards'][-1]['classBranch']==label;assert a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-hitter-career-v1")') is None;out.append({'branch':label,'card':kind,'method':'supplementary legal reward checkpoint, actual UI selection, no career credit'});c.close()
 b.close()
(q/'branches.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(out)
