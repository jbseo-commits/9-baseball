from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
p=Path(__file__).resolve().parent;url=os.environ.get('QA_URL','http://127.0.0.1:4211/');key='9zone-tide-playtest-v1:9zone-v10-run'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);a.goto(url+'?tidePlaytest=1&battleUi=legacy&experiment=defense');a.get_by_role('button',name='새 타이드 런 시작').click();a.get_by_role('button',name='이 구장으로 간다').click();a.wait_for_selector('.bv-tide-wave')
 for i in range(3):
  a.wait_for_selector('.bv-tide-wave');a.get_by_test_id('bp-swing').click();a.wait_for_timeout(3200)
  s=a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k))',key)
  if s['phase']=='between':a.get_by_test_id('bp-next').click();a.wait_for_timeout(1000)
 a.wait_for_selector('.bv-tide-wave');before=a.locator('.bv-public-intent').get_attribute('aria-label');assert a.locator('.bv-public-intent').get_attribute('data-certain')=='false';assert a.locator('.bv-band.is-actual').count()==0
 a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);assert a.locator('.bv-band.is-actual').count()==0;assert a.locator('.bv-tide-wave').count()==0
 a.wait_for_selector('.bv-scene[data-phase="result"]');a.wait_for_selector('.bv-band.is-actual');s=a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k))',key);assert s['battle']['revealed']['zone']==9 and s['battle']['revealed']['kind']=='ball';a.screenshot(path=str(p/'natural-outside-result.png'));a.wait_for_timeout(2200);assert a.locator('.bv-ball-sprite').count()==0
 (p/'outside-verification.json').write_text(json.dumps({'method':'natural seed4 fourth pitch after3real takes, nostate/target/RNG edits','conflictingLegacyDefenseParametersStillPilot':True,'beforePublicCue':before,'noActualZoneBeforeImpact':True,'revealed':s['battle']['revealed'],'last':s['last']},ensure_ascii=False,indent=2));b.close();print('PASS naturaloutside, actualzoneonlyafterimpact, conflictingquerygate')
