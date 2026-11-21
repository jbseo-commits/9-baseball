"""Real browser inputs. Decision policy reads only visible labels/forecast; never engine or saved pending data."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json,os,time
out=Path(__file__).resolve().parent;url=os.environ.get('QA_URL','http://127.0.0.1:4214/');tag=os.environ.get('QA_TAG','public-1');W=int(os.environ.get('QA_W','844'));H=int(os.environ.get('QA_H','390'))
log=[]
def record(kind,text):
 log.append({'kind':kind,'text':text});print(kind,text[:300],flush=True);(out/(tag+'.json')).write_text(json.dumps(log,ensure_ascii=False,indent=2))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':W,'height':H},is_mobile=True,has_touch=True,record_video_dir='/tmp/normal-public-videos',record_video_size={'width':W,'height':H},**({'storage_state':os.environ['QA_RESUME']} if os.environ.get('QA_RESUME') else {}));a=c.new_page();a.set_default_timeout(5000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.goto(url);
 if os.environ.get('QA_RESUME'):a.get_by_role('button',name='이어하기',exact=True).click()
 else:
  a.get_by_role('button',name='새로운 게임',exact=True).click();a.get_by_role('radio',name='버티기',exact=True).click();a.get_by_test_id('start-pack-go').click();a.get_by_role('button',name='건너뛰기',exact=True).click()
 a.wait_for_timeout(1500)
 def click(sel):
  a.locator(sel).first.evaluate('(e)=>e.click()');a.wait_for_timeout(45)
 def clear():
  if a.locator('.bv-plan-clear:not(:disabled)').count():click('.bv-plan-clear:not(:disabled)')
 def hand():
  if a.locator('.bv-hand-handle[aria-expanded="false"]').count():click('.bv-hand-handle');a.wait_for_timeout(220)
 try:
  for turn in range(160):
   a.wait_for_timeout(300)
   if a.locator('.bp-end').count():
    record('terminal',a.locator('.bp-end').inner_text());a.screenshot(path=str(out/(tag+'-terminal.png')));break
   if a.locator('.ev-root').count():
    record('event',a.locator('.ev-root').inner_text());a.screenshot(path=str(out/(tag+f'-event-{turn}.png')))
    if a.get_by_test_id('event-leave').count():a.get_by_test_id('event-leave').click()
    else:a.get_by_test_id('event-choice').last.click()
    continue
   if a.locator('.bp-map').count():
    nodes=a.locator('.bp-node').evaluate_all('(xs)=>xs.map(x=>({text:x.getAttribute("aria-label"),cls:x.className,disabled:x.disabled}))');record('map',a.locator('.bp-map').inner_text());a.screenshot(path=str(out/(tag+f'-map-{turn}.png')))
    # The map highlights currently reachable options. Prefer rest/event over another fight.
    options=a.locator('.bp-node.reach');
    if not options.count():options=a.locator('.bp-node:not(:disabled)')
    for i in range(options.count()):
     if any(w in (options.nth(i).get_attribute('aria-label') or '') for w in ['휴식','이벤트','상점']):options.nth(i).click();break
    a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(1600);continue
   if a.locator('.bp-choice').count():
    record('stop',a.locator('.bp-choice').inner_text());a.screenshot(path=str(out/(tag+f'-stop-{turn}.png')))
    if a.get_by_test_id('bp-rest-recover').count() and a.get_by_test_id('bp-rest-recover').is_enabled():a.get_by_test_id('bp-rest-recover').click()
    elif a.locator('.bp-relic-offers .bp-offer').count():a.locator('.bp-relic-offers .bp-offer').first.click()
    elif a.locator('.bp-offers .bp-offer').count():a.locator('.bp-offers .bp-offer').first.click()
    if a.get_by_test_id('bp-stop-go').count() and a.get_by_test_id('bp-stop-go').is_enabled():a.get_by_test_id('bp-stop-go').click()
    else:
     skip=a.locator('.bp-verbs.stop button:not(:disabled)').last;skip.click()
    a.wait_for_timeout(1200);continue
   if not a.locator('.bv-scene').count():record('unknown',a.locator('body').inner_text());break
   a.wait_for_function("!document.querySelector('.bv-scene')?.dataset.fxStage",timeout=12000);a.wait_for_timeout(1300)
   if not a.locator('.bv-cell').count():continue
   if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').click();a.wait_for_timeout(500)
   if not a.locator('.bv-cell:not(:disabled)').count():continue
   clear();hand()
   weights=[]
   for i,t in enumerate(a.locator('.bv-cell').all_text_contents()):
    n=re.findall(r'\d+',t);v=sum(map(int,n))/len(n) if n else 65 if '자주' in t else 35 if '가끔' in t else 10 if '드묾' in t else 0;weights.append((v,i))
   zones=[i for v,i in sorted(weights,reverse=True)[:4] if v>0] or [4]
   cards=a.locator('.bv-card:not(:disabled).t-swing').evaluate_all('(xs)=>xs.map(x=>({kind:x.dataset.cardKind,text:x.innerText}))');best=None
   for card in cards:
    kind=card['kind'];clear();hand();sel=f'.bv-card[data-card-kind="{kind}"]:not(:disabled)'
    if not a.locator(sel).count():continue
    click(sel)
    for z in zones:
     click(f'.bv-cell[data-zone="{z}"]');metrics=a.locator('.bv-plan-metrics').inner_text() if a.locator('.bv-plan-metrics').count() else '';nums=re.findall(r'\d+',metrics);chance=(sum(map(int,nums[:2]))/2 if '–' in metrics and len(nums)>1 else int(nums[0]) if nums else 0);damage=int(nums[-1]) if len(nums)>1 else 0
     if a.get_by_test_id('bp-swing').is_enabled():
      # Risk aversion is based only on public coverage ranges and card's visible foul protection.
      score=chance+(15 if '파울 50%' in card['text'] else 0)+damage*.35
      if best is None or score>best[0]:best=(score,kind,z,metrics)
   clear();hand()
   if best:
    click(f'.bv-card[data-card-kind="{best[1]}"]:not(:disabled)');click(f'.bv-cell[data-zone="{best[2]}"]');record('decision',str(best))
   else:
    basic=a.get_by_role('button',name=re.compile('기본 스윙')).first
    if basic.count():basic.click();click(f'.bv-cell[data-zone="{zones[0]}"]');record('decision','basic '+str(zones[0]))
    else:record('decision','take')
   if turn<5:a.screenshot(path=str(out/(tag+f'-plan-{turn}.png')))
   a.get_by_test_id('bp-swing').click();a.wait_for_timeout(1500);record('result',a.locator('.bv-plan').inner_text() if a.locator('.bv-plan').count() else a.locator('body').inner_text());
   if turn<5:a.screenshot(path=str(out/(tag+f'-result-{turn}.png')))
   a.wait_for_timeout(1700)
  record('errors',str(errors));c.storage_state(path=str(out/(tag+'-browser-storage.json')))
  # Retrospective provenance only, after all decisions: no pending data is read by policy.
  seed=a.evaluate("()=>{try{return JSON.parse(localStorage.getItem('9zone-normal-review-v1:9zone-v10-run')).initialSeed}catch{return null}}")
  record('seed',str(seed));record('video',a.video.path());c.close();b.close()
 except Exception as e:
  record('failure',str(e));a.screenshot(path=str(out/(tag+'-failure.png')));record('body',a.locator('body').inner_text());c.storage_state(path=str(out/(tag+'-browser-storage.json')));record('video',a.video.path());c.close();b.close();raise
