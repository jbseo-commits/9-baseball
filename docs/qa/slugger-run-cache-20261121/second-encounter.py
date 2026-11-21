from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/slugger-run-cache-qa');key='9zone-normal-review-v1:9zone-v10-run';runs=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h,reduced in [(667,375,True)]:
  c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,reduced_motion='reduce' if reduced else 'no-preference',record_video_dir=str(q/'videos'),record_video_size={'width':w,'height':h});a=c.new_page();a.set_default_timeout(6000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)));requests=[]
  def art(r):
   requests.append(r.request.url);f=Path('/workspace/slugger-motion-qa')/('synthetic.json' if r.request.url.endswith('.json') else 'synthetic.webp');r.fulfill(status=200,content_type='application/json' if f.suffix=='.json' else 'image/webp',body=f.read_bytes())
  a.route('**/slugger-motion-v2/*',art);a.goto('http://127.0.0.1:4262/');assert a.evaluate('localStorage.length')==0;a.screenshot(path=str(q/f'{w}-title.png'));a.get_by_role('button',name='새로운 게임',exact=True).click();assert a.get_by_role('radio',name='슬러거',exact=True).get_attribute('aria-checked')=='true';assert a.get_by_text('이번 검수 잠김',exact=True).count()==3;a.screenshot(path=str(q/f'{w}-selection.png'));a.get_by_test_id('start-pack-go').click();a.get_by_role('button',name='다음',exact=True).click();a.get_by_role('button',name='다음',exact=True).click();a.get_by_role('button',name='플레이 시작',exact=True).click();a.wait_for_timeout(400)
  initial=a.evaluate('(k)=>{const s=JSON.parse(localStorage.getItem(k));return {seed:s.initialSeed,deck:s.deck.map(c=>c.kind),hitter:s.v10.hitterClass}}',key);assert len(initial['deck'])==9;assert initial['hitter']['id']=='slugger-v1';events=[];prep=set();resumed=True;encounters=set();urls=set()
  for step in range(500):
   # Navigation/progress only. No pending/RNG/destination used by play policy.
   st=a.evaluate('(k)=>{const s=JSON.parse(localStorage.getItem(k));return {phase:s.phase,pitches:s.stats.pitches,act:s.runMap.nodes.find(n=>n.id===s.runMap.currentNodeId)?.act}}',key);phase=st['phase'];print(w,step,st,flush=True)
   if phase in ['won','lost']:
    a.wait_for_timeout(2000);a.screenshot(path=str(q/f'{w}-terminal.png'));break
   if a.get_by_test_id('event-leave').count():a.get_by_test_id('event-leave').click();a.wait_for_timeout(300);continue
   if phase=='map':a.screenshot(path=str(q/f'{w}-map-{step}.png'));a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(600);continue
   if phase=='reward':
    a.screenshot(path=str(q/f'{w}-reward-{step}.png'));opts=a.locator('.bp-offer[data-card-kind]');events.append({'reward':opts.all_text_contents()});opts.first.click();relic=a.locator('.bp-relic-offers .bp-offer');
    if relic.count():relic.first.click()
    if a.get_by_test_id('bp-stop-go').is_enabled():a.get_by_test_id('bp-stop-go').click()
    else:a.get_by_test_id('bp-stop-skip').click()
    a.wait_for_timeout(400);continue
   if phase in ['rest','shop','locker','training']:a.get_by_test_id('bp-stop-skip').click();a.wait_for_timeout(300);continue
   if phase=='event':a.get_by_test_id('event-choice').first.click();a.wait_for_timeout(300);continue
   if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').click();a.wait_for_timeout(400);continue
   if phase=='battle':
    node=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).runMap.currentNodeId',key);encounters.add(node);actor=a.locator('[data-actor=batter]');assert actor.get_attribute('data-batter-kind')=='review-slugger-atlas';urls.add(actor.locator('img').get_attribute('src'));assert len(requests)==2
    if len(encounters)==2:a.screenshot(path=str(q/'second-encounter.png'));break
    if st['pitches']>=3 and not resumed:
     saved=a.evaluate('(k)=>localStorage.getItem(k)',key);career=a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-hitter-career-v1")');a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(400);assert a.evaluate('(k)=>localStorage.getItem(k)',key)==saved;assert a.evaluate('localStorage.getItem("9zone-normal-review-v1:9zone-hitter-career-v1")')==career;resumed=True
    hand=a.locator('.bv-hand-handle')
    if hand.get_attribute('aria-expanded')=='false':hand.click();a.wait_for_timeout(220)
    cells=a.locator('.bv-cell').all_text_contents();score=lambda t:5 if '확정' in t else 3 if '자주' in t else 2 if '가끔' in t else 1 if '드묾' in t else 0
    # Public scout before a narrow power swing; never read hidden pitch.
    played=False
    for kind in ['scout','loadPower','setup']:
     card=a.locator(f'.bv-card[data-card-kind="{kind}"]:not(:disabled)')
     if card.count() and (st['pitches'],kind) not in prep:
      prep.add((st['pitches'],kind));card.first.click()
      if a.get_by_test_id('bp-swing').is_enabled():a.get_by_test_id('bp-swing').click();a.wait_for_timeout(700);events.append({'pitch':st['pitches'],'prepare':kind});played=True;break
    if played:continue
    # An entirely unknown/rare grid is a visible reason to watch; not a guaranteed ball.
    take=max(map(score,cells))<=1 and st['pitches']%3==0
    if take:
     clear=a.get_by_role('button',name='선택 해제 · 지켜보기로 전환');
     if clear.count():clear.click()
     else:a.get_by_test_id('bv-basic-chip').click();a.get_by_role('button',name='선택 해제 · 지켜보기로 전환').click()
     action='take';z=None
    else:
     card=None
     for kind in ['slug','gapHunter','soloShot','place']:
      candidate=a.locator(f'.bv-card.t-swing[data-card-kind="{kind}"]:not(:disabled)')
      if candidate.count():card=candidate.first;break
     if card:action=card.get_attribute('data-card-kind');card.click()
     else:action='basic';a.get_by_test_id('bv-basic-chip').click()
     cells=a.locator('.bv-cell').all_text_contents();z=max(range(9),key=lambda i:(score(cells[i]),i==4));a.locator(f'.bv-cell[data-zone="{z}"]').click()
     if not a.get_by_test_id('bp-swing').is_enabled():a.get_by_test_id('bv-basic-chip').click();a.locator(f'.bv-cell[data-zone="{z}"]').click();action='basic'
    if st['pitches']<2:a.screenshot(path=str(q/f'{w}-decision-{st["pitches"]}.png'))
    a.get_by_test_id('bp-swing').click();a.wait_for_timeout(2800 if not reduced else 500);events.append({'pitch':st['pitches'],'action':action,'publicCells':cells,'aim':z});continue
   a.wait_for_timeout(500)
  final=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);assert len(encounters)==2,(encounters,final['phase']);assert len(urls)==1;assert not errors
  runs.append({'viewport':[w,h],'reduced':reduced,'initial':initial,'secondEncounterReached':True,'encounters':list(encounters),'resourceRequests':requests,'actorUrls':list(urls),'terminal':final['phase'],'act':st['act'],'stats':final['stats'],'last':final['last'],'events':events,'resumeExact':resumed,'errors':errors,'video':a.video.path()});c.storage_state(path=str(q/f'{w}-storage.json'));c.close();(q/'second-encounter.json').write_text(json.dumps(runs,ensure_ascii=False,indent=2))
 b.close()
