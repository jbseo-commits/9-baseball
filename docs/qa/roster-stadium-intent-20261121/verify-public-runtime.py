from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path(__file__).resolve().parent;key='9zone-playable-v1:9zone-v10-run';runs=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':844,'height':390},device_scale_factor=1,is_mobile=True,has_touch=True);p=c.new_page()
 for zone in range(10):
  p.goto('http://127.0.0.1:4199/?battleUi=vnext&battlePlay=1&seed=20261119');p.wait_for_selector('.bv-public-intent')
  # Controlled QA state only: existing upgraded card, legal all-zone repertoire;
  # private target is read here as test oracle, never passed to production UI.
  p.evaluate('''([k,z])=>{let s=JSON.parse(sessionStorage.getItem(k));s.battle.pending.zone=z;s.battle.intent.repertoire=[0,1,2,3,4,5,6,7,8];let id=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='scout');s.deck.find(c=>c.id===id).plus=true;sessionStorage.setItem(k,JSON.stringify(s));}''',[key,zone]);p.reload();p.wait_for_selector('.bv-public-intent');assert p.locator('.bv-public-intent').get_attribute('data-certain')=='false'
  p.locator('.bv-hand-handle').click();p.wait_for_timeout(450);p.locator('.bv-card[data-card-kind="scout"]').first.click();p.get_by_test_id('bp-swing').click();p.wait_for_selector('.bv-public-intent[data-certain="true"]');p.wait_for_timeout(500)
  active=p.locator('.bv-public-intent .bv-intent-nine i').evaluate_all('(xs)=>xs.flatMap((e,i)=>e.dataset.active==="true"?[i]:[])');text=p.locator('.bv-public-intent').inner_text();assert active==([] if zone==9 else [zone]);assert ('볼' in text)==(zone==9)
  before=p.locator('.bv-public-intent').get_attribute('style');p.wait_for_timeout(200);assert p.locator('.bv-public-intent').get_attribute('style')==before
  if zone in [0,4,8,9]:p.screenshot(path=str(out/f'public-exact-{zone}.png'))
  runs.append({'fixtureTarget':zone,'activePublicCells':active,'label':p.locator('.bv-public-intent').get_attribute('aria-label'),'stableReadyPosition':before})
  p.evaluate('(k)=>sessionStorage.removeItem(k)',key)
 b.close();(out/'public-runtime.json').write_text(json.dumps({'note':'QA injected legal all-zone pitch targets and existing upgraded scout; each exact disclosure earned by actual card click. Not natural random sightings.','runs':runs},indent=2));print('PASS10 actual browser earned targets')
