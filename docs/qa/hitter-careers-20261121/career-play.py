from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re,time
out=Path('/workspace/careers-finalqa');key='9zone-normal-review-v1:9zone-v10-run';profile='9zone-normal-review-v1:9zone-hitter-career-v1';events=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':667,'height':375},reduced_motion='reduce',record_video_dir=str(out/'videos'),record_video_size={'width':667,'height':375});a=c.new_page();a.set_default_timeout(5000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.goto('http://127.0.0.1:4222/');a.get_by_role('button',name='새로운 게임',exact=True).click();
 if a.get_by_role('button',name='처음부터 시작',exact=True).count():a.get_by_role('button',name='처음부터 시작',exact=True).click()
 a.wait_for_timeout(300);a.screenshot(path=str(out/'cold-selection.png'));assert a.get_by_role('radio',name='컨택 히터',exact=True).get_attribute('aria-checked')=='true';assert a.get_by_role('radio',name='슬러거',exact=True).get_attribute('aria-disabled')=='true';a.get_by_test_id('start-pack-go').click();a.get_by_role('button',name='다음',exact=True).click();a.get_by_role('button',name='다음',exact=True).click();a.get_by_role('button',name='플레이 시작',exact=True).click();a.wait_for_timeout(350)
 for step in range(500):
  # Only phase/progress for navigation; decisions below use visible cells and hand.
  state=a.evaluate('(k)=>{let s=JSON.parse(localStorage.getItem(k));return {phase:s.phase,pitches:s.stats.pitches,seed:s.initialSeed}}',key);phase=state['phase']
  progress=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',profile);values={k:sum(r[k] for r in progress['runs'].values()) for k in ['longHits','takenBalls','runs']}
  print(step,phase,values,flush=True);c.storage_state(path=str(out/'checkpoint-storage.json'))
  if all(values[k]>=n for k,n in [('longHits',3),('takenBalls',5),('runs',3)]):break
  if a.get_by_test_id('event-leave').count():a.get_by_test_id('event-leave').click();a.wait_for_timeout(200);continue
  if phase=='map':
   a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(350);continue
  if phase in ['lost','won']:
   a.reload();a.get_by_role('button',name='새로운 게임',exact=True).click();a.get_by_role('radio',name='컨택 히터',exact=True).click();a.get_by_test_id('start-pack-go').click();a.wait_for_timeout(350);continue
  if phase=='reward':
   options=a.locator('.bp-offer[data-card-kind]');target=options.filter(has=a.locator('[data-no-match]'))
   # Prefer an offered power card for long hits, otherwise actual branch 0.
   chosen=a.locator('.bp-offer[data-card-kind="slug"],.bp-offer[data-card-kind="eyeLevel"],.bp-offer[data-card-kind="quickWrists"]');(chosen.first if chosen.count() else options.first).click()
   relic=a.locator('.bp-relic-offers .bp-offer');
   if relic.count():relic.first.click()
   if a.get_by_test_id('bp-stop-go').is_enabled():a.get_by_test_id('bp-stop-go').click()
   else:a.get_by_test_id('bp-stop-skip').click()
   a.wait_for_timeout(350);continue
  if phase in ['rest','shop','locker','training']:
   a.get_by_test_id('bp-stop-skip').click();a.wait_for_timeout(350);continue
  if phase=='event':
   a.get_by_test_id('event-choice').filter(has_not=a.locator(':disabled')).first.click();a.get_by_test_id('event-leave').click();a.wait_for_timeout(300);continue
  if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').click();a.wait_for_timeout(300);continue
  if phase=='battle':
   # First earn the public take milestone; then use public zone labels only.
   if values['takenBalls']<5:
    clear=a.get_by_role('button',name='선택 해제 · 지켜보기로 전환');
    if clear.count():clear.click()
    a.get_by_test_id('bp-swing').click();action='take'
   else:
    handle=a.locator('.bv-hand-handle');
    if handle.get_attribute('aria-expanded')=='false':handle.click();a.wait_for_timeout(180)
    scout=a.locator('.bv-card[data-card-kind="scout"]:not(:disabled)')
    if scout.count() and not a.locator('.bv-card[data-card-kind="cutMaster"],.bv-card[data-card-kind="defend"],.bv-card[data-card-kind="slug"]').count():
     scout.first.click()
     if a.get_by_test_id('bp-swing').is_enabled():a.get_by_test_id('bp-swing').click();a.wait_for_timeout(300);continue
    attack=a.locator('.bv-card.t-swing:not(:disabled)[data-card-kind="slug"]')
    if not attack.count():attack=a.locator('.bv-card.t-swing:not(:disabled)[data-card-kind="cutMaster"],.bv-card.t-swing:not(:disabled)[data-card-kind="defend"],.bv-card.t-swing:not(:disabled)[data-card-kind="quickWrists"]')
    if not attack.count():attack=a.locator('.bv-card.t-swing:not(:disabled)')
    if attack.count():attack.first.click();action=attack.first.get_attribute('data-card-kind')
    else:a.get_by_test_id('bv-basic-chip').click();action='basic'
    cells=a.locator('.bv-cell').all_text_contents();scores=[5 if '확정' in t else 3 if '자주' in t else 2 if '가끔' in t else 1 if '드묾' in t else 0 for t in cells];z=max(range(9),key=lambda i:(scores[i],i==4));a.locator(f'.bv-cell[data-zone="{z}"]').click();
    if not a.get_by_test_id('bp-swing').is_enabled():a.get_by_test_id('bv-basic-chip').click();a.locator(f'.bv-cell[data-zone="{z}"]').click();action='basic'
    a.get_by_test_id('bp-swing').click()
   a.wait_for_timeout(400);events.append({'step':step,'seed':state['seed'],'action':action,'before':values});continue
  a.wait_for_timeout(500)
 a.screenshot(path=str(out/'last-game.png'));a.reload();a.get_by_role('button',name='새로운 게임',exact=True).click()
 if a.get_by_role('button',name='처음부터 시작',exact=True).count():a.get_by_role('button',name='처음부터 시작',exact=True).click()
 a.wait_for_timeout(300);a.screenshot(path=str(out/'earned-selection.png'));(out/'profile.json').write_text(json.dumps(a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',profile),indent=2));(out/'play-improved.json').write_text(json.dumps({'events':events,'errors':errors,'video':a.video.path()},indent=2));c.storage_state(path=str(out/'browser-storage.json'));c.close();b.close()
