from playwright.sync_api import sync_playwright
from pathlib import Path
import json
q=Path('/workspace/emerald-prepare-qa');out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode,w in [('baseline',667),('fixed',667),('fixed',844),('reduced',667),('missing',667)]:
  c=b.new_context(viewport={'width':w,'height':375 if w==667 else 390},has_touch=True,reduced_motion='reduce' if mode=='reduced' else 'no-preference');a=c.new_page();a.set_default_timeout(7000);errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
  def art(r):
   if '/emerald-ready-v1/' in r.request.url:
    if mode=='missing':r.fulfill(status=404);return
    f=Path('/workspace/private-field-qa/ready.png');mime='image/png'
   else:f=Path('/workspace/slugger-motion-qa')/('synthetic.json' if r.request.url.endswith('json') else 'synthetic.webp');mime='application/json' if r.request.url.endswith('json') else 'image/webp'
   r.fulfill(status=200,content_type=mime,body=f.read_bytes())
  a.route('**/slugger-motion-v2/*',art);a.route('**/emerald-ready-v1/*',art);a.goto('http://127.0.0.1:'+('4253' if mode=='baseline' else '4252')+'/field-harness.html');a.get_by_role('button',name='슬러거 vs 에메랄드',exact=True).tap();a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(700);assert a.locator('[data-actor=batter]').get_attribute('data-batter-kind')=='review-slugger-atlas';assert bool(a.locator('.bv-private-ready').count())==(mode!='missing');a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200)
  prep=a.locator('.bv-card.t-prepare');print('prep',mode,prep.count(),flush=True);assert prep.count();kind=prep.first.get_attribute('data-card-kind');prep.first.tap();a.wait_for_timeout(50)
  a.evaluate('''()=>{window.trace=[];window.until=performance.now()+3500;function f(t){const s=document.querySelector('.bv-scene'),a=document.querySelector('[data-actor=pitcher]'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(s)trace.push({t,phase:s.dataset.phase,ready:!!document.querySelector('.bv-private-ready'),frame:a?.dataset.frame,ball:!!b,kind:document.querySelector('[data-actor=batter]')?.dataset.batterKind,hp:document.querySelector('[data-testid=pitcher-health]')?.getAttribute('aria-valuenow')});if(t<until)requestAnimationFrame(f)}requestAnimationFrame(f)}''');a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(120);a.screenshot(path=str(q/f'{mode}-{w}-prepare.png'));a.wait_for_timeout(1800);prepTrace=a.evaluate('trace');active=[t for t in prepTrace if t['phase']!='deciding'];assert active,(mode,'no prepare playback observed');assert not any(t['ball'] for t in prepTrace);assert all(t['frame']=='0' for t in prepTrace)
  if mode=='baseline':assert any(not t['ready'] for t in active)
  elif mode=='missing':assert not any(t['ready'] for t in prepTrace)
  else:assert all(t['ready'] for t in prepTrace)
  assert a.get_by_test_id('pitcher-health').count()==1;assert not a.locator('.bv-intent-badge').count();a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200);a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="4"]').tap();hp=int(a.get_by_test_id('pitcher-health').get_attribute('aria-valuenow'));a.evaluate('()=>{trace=[];until=performance.now()+4000}');a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(1400);a.screenshot(path=str(q/f'{mode}-{w}-hit.png'));hpAfter=int(a.get_by_test_id('pitcher-health').get_attribute('aria-valuenow'));a.wait_for_timeout(600);flight=a.evaluate('trace');assert hpAfter<hp;assert not any(t['ready'] for t in flight if t['phase']!='deciding');assert all(t['kind']=='review-slugger-atlas' for t in flight);assert not errors
  out.append({'mode':mode,'width':w,'prepareCard':kind,'prepareTrace':prepTrace,'flightTrace':flight,'hpBefore':hp,'hpAfter':hpAfter,'errors':errors});c.close();print('PASS',mode,w,flush=True);(q/'browser.json').write_text(json.dumps(out,indent=2))
 b.close()
assert out[0]['hpAfter']==out[1]['hpAfter'];print('PASS unchanged prepared centre damage')
