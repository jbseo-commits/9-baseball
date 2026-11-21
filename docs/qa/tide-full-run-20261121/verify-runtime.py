from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,math
out=Path(__file__).resolve().parent;url=os.environ.get('QA_URL','http://127.0.0.1:4211/');key='9zone-tide-playtest-v1:9zone-v10-run';evidence={}
def state(a):return a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k))',key)
def settled(a):
 a.wait_for_function("!document.querySelector('.bv-scene')?.dataset.fxStage",timeout=15000)
 a.wait_for_timeout(700)
def launch(a):
 a.goto(url+'?battleUi=vnext&tidePlaytest=1');a.get_by_role('button',name='새 타이드 런 시작').click();a.get_by_role('button',name='이 구장으로 간다').click();a.wait_for_selector('.bv-tide-wave');a.wait_for_function("[...document.querySelectorAll('.bv-actor img')].every(i=>i.complete&&i.naturalWidth>0)");a.wait_for_timeout(300)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,w,h,reduce in [('phone',844,390,False),('small',667,375,False),('reduced',844,390,True)]:
  c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce' if reduce else 'no-preference',**({'record_video_dir':'/tmp/tide-run-video','record_video_size':{'width':w,'height':h}} if name=='phone' else {}));a=c.new_page();errors=[];bad=[];a.on('pageerror',lambda e:errors.append(str(e)));a.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
  a.goto(url);a.evaluate("localStorage.setItem('9zone-v10-run','normal-sentinel');localStorage.setItem('ninezone.shotMode.v1','1');sessionStorage.setItem('9zone-animation-rate','0.25')");before=a.evaluate('Object.fromEntries(Object.entries(localStorage))');launch(a);s0=state(a);assert s0['initialSeed']==4 and s0['v10']['opponent']['artId']=='tide-vesper';assert a.get_by_role('combobox',name='애니메이션 배속').input_value()=='1';assert '낮은 코스 선호' in a.locator('.bv-public-intent').get_attribute('aria-label');a.screenshot(path=str(out/f'{name}-ready.png'))
  # Genuine take at normal1x. Hidden fields below are QA oracle only, never production UI.
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(80);taken=state(a);assert a.locator('.bv-tide-wave').count()==0
  if not reduce:a.screenshot(path=str(out/f'{name}-windup.png'))
  settled(a)
  if state(a)['phase']=='between':a.get_by_test_id('bp-next').click();settled(a)
  a.wait_for_selector('.bv-tide-wave');cue=a.locator('.bv-public-intent').get_attribute('aria-label');assert '높은 코스 선호' in cue and '이번 안타 +5' in cue;assert a.locator('.bv-tide-wave').get_attribute('data-ready')=='true';a.screenshot(path=str(out/f'{name}-take-ready-bonus.png'))
  a.locator('.bv-hand-handle').click();a.wait_for_timeout(400);scout=a.locator('.bv-card[data-card-kind="scout"]')
  if scout.count():scout.first.click();a.get_by_test_id('bp-swing').click();settled(a);assert state(a)['battle']['pitchCount']==1
  # Actual state remains unchanged; select a valid input using test oracle to cover hit branch.
  pre=state(a);zone=pre['battle']['pending']['zone'];assert zone<9,('seed4 second pitch unexpectedlyoutside',zone)
  if a.locator('.bv-hand-handle').get_attribute('aria-expanded')=='false':a.locator('.bv-hand-handle').click();a.wait_for_timeout(400)
  a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator(f'.bv-cell[data-zone="{zone}"]').click()
  a.evaluate('''()=>{window.trace=[];const end=performance.now()+3300;function f(t){const s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){const r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat),v=k=>parseFloat(s.style.getPropertyValue(k));window.trace.push({t,phase:s.dataset.phase,x:r.x+p[0],y:r.y+p[1],width:r.width,cssWidth:parseFloat(b.style.width),scale:v('--bv-world-scale'),release:[v('--bv-release-x'),v('--bv-release-y')],contact:[v('--bv-contact-x'),v('--bv-contact-y')]})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(80);hit=state(a);assert hit['battle']['revealed']['kind']=='hit',hit['last'];assert hit['v10']['lastCombat']['encounter']['bonus']==5,hit['v10']['lastCombat'];assert a.locator('.bv-tide-wave').count()==0
  if not reduce:a.wait_for_selector('.bv-ball-sprite');a.screenshot(path=str(out/f'{name}-flight.png'))
  settled(a);assert before==a.evaluate('Object.fromEntries(Object.entries(localStorage))');assert a.evaluate("sessionStorage.getItem('9zone-animation-rate')")=='0.25'
  saved=state(a);a.reload();a.get_by_role('button',name='검수 런 이어하기').click();a.wait_for_timeout(400);assert state(a)==saved
  a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(100);assert '가로' in a.evaluate('getComputedStyle(document.body,"::before").content');a.set_viewport_size({'width':w,'height':h});a.wait_for_timeout(100)
  assert not errors and not bad,(errors,bad)
  evidence[name]={'initialCueLow':True,'afterTakeCue':cue,'actualTake':taken['last'],'actualHit':hit['last'],'bonus':5,'prepareKeptEligibility':True,'savedPhase':saved['phase'],'localStorageUnchanged':True,'animationPreferenceUnchanged':True,'reloadResume':True,'rotation':True,'errors':errors,'httpErrors':bad,'video':a.video.path() if a.video else None};c.close()
 b.close();(out/'runtime-verification.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2));print('PASS actual landing/map/Tide/take/scout/hit+5/resume/storage/rotation/normal+reduced')
