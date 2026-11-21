"""Supplementary browser transition coverage from explicitly engine-oracle-generated saves. Not a full browser victory."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
out=Path(__file__).resolve().parent;data=json.loads((out/'checkpoint-fixtures.json').read_text());checks=data['checkpoints'];evidence={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(844,390),(667,375)]:
  for name in ['map-act2','map-act3','event','shop','locker','rest','training','boss-reward-act1','boss-reward-act2','final-boss-last-decision']:
   c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True);a=c.new_page();a.goto('http://127.0.0.1:4214/');a.evaluate('(s)=>{localStorage.setItem("9zone-normal-review-v1:9zone-v10-run",JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',checks[name]);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(600);before=a.locator('body').inner_text();a.screenshot(path=str(out/f'checkpoint-{w}-{name}.png'))
   if name.startswith('map'):
    a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(1600);assert a.locator('.bv-public-intent').is_visible()
   elif name=='event':
    a.get_by_test_id('event-choice').last.click();a.wait_for_timeout(150);saved=a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-v10-run")');a.reload();a.get_by_role('button',name='이어하기',exact=True).click();assert a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-v10-run")')==saved;assert a.locator('.bp-map').count()
   elif name.startswith('boss-reward'):
    a.locator('.bp-relic-offers .bp-offer').first.click();a.get_by_test_id('bp-stop-go').click();a.wait_for_timeout(900);assert a.locator('.bp-map').count();assert ('2막' if name.endswith('1') else '3막') in a.locator('body').inner_text()
   elif name=='rest':
    a.get_by_test_id('bp-rest-upgrade').click();a.locator('.bp-offers .bp-offer').first.click();a.get_by_test_id('bp-stop-go').click();a.wait_for_timeout(500);assert a.locator('.bp-map').count()
   elif name=='final-boss-last-decision':
    a.locator('.bv-hand-handle').click();a.wait_for_timeout(300);a.get_by_role('button',name='기본 스윙',exact=False).first.click();texts=a.locator('.bv-cell').all_text_contents();weights=[]
    import re
    for i,t in enumerate(texts):
     ns=re.findall(r'\d+',t);v=sum(map(int,ns))/len(ns) if ns else 65 if '자주' in t else 35 if '가끔' in t else 10 if '드묾' in t else 0;weights.append((v,i))
    z=max(weights)[1];a.locator(f'.bv-cell[data-zone="{z}"]').click();a.get_by_test_id('bp-swing').click();a.wait_for_timeout(4000);a.screenshot(path=str(out/f'checkpoint-{w}-final-boss-after.png'))
    assert a.locator('.bp-end.won').count()
    for el in [*a.locator('.bp-endstats div').all(),a.get_by_test_id('bp-end-again'),a.get_by_role('button',name='타이틀',exact=True)]:
     r=el.bounding_box();assert r and r['y']>=0 and r['y']+r['height']<=h+1,(name,r,h)
    a.get_by_test_id('bp-end-again').click();a.get_by_role('radio',name='버티기',exact=True).click();a.get_by_test_id('start-pack-go').click();a.wait_for_timeout(1200);assert a.locator('.bp-map').count()
   else:
    if a.locator('.bp-offers .bp-offer').count():a.locator('.bp-offers .bp-offer').first.click();a.get_by_test_id('bp-stop-go').click()
    else:a.get_by_test_id('bp-stop-skip').click()
    a.wait_for_timeout(700);assert a.locator('.bp-map').count()
   print('PASS',w,name,flush=True);evidence[f'{w}-{name}']={'method':'supplementary checkpoint, not cold-title earned progression','before':before,'after':a.locator('body').inner_text()};c.close()
 b.close()
(out/'checkpoint-verification.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2));print('PASS checkpoint UI transitions',len(evidence))
