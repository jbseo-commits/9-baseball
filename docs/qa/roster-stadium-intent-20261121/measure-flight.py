from pathlib import Path
from playwright.sync_api import sync_playwright
import json,math
p=Path(__file__).resolve().parent;root=p.parents[2];ballSize=json.loads((root/'assets/production-art/pitch-juice-v1/manifest.json').read_text())['effects']['ball']['frameSize'][0]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);runs={}
 for action,w,h in [(a,w,h) for w,h in [(844,390),(1440,900)] for a in ['hit','take','miss']]:
  label=('phone-' if w==844 else 'desktop-')+action
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=w==844,has_touch=True,device_scale_factor=1,**({'record_video_dir':'/tmp/roster-intent-take-video','record_video_size':{'width':844,'height':390}} if action=='take' and w==844 else {}));a=c.new_page();a.goto('http://127.0.0.1:4199/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent');a.wait_for_timeout(600)
  if action!='take':
   a.locator('.bv-hand-handle').click();a.wait_for_timeout(600);a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="'+('2' if action=='hit' else '6')+'"]').click()
  a.evaluate('''()=>{window.trace=[];const end=performance.now()+3100;function f(t){const s=document.querySelector('.bv-scene'),e=document.querySelector('.bv-actor-pitcher'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){const r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat),v=k=>parseFloat(s.style.getPropertyValue(k));window.trace.push({t,phase:s.dataset.phase,pose:e.dataset.pose,x:r.x+p[0],y:r.y+p[1],width:r.width,cssWidth:parseFloat(b.style.width),edgeFilter:document.querySelector('.bv-ball-sprite').style.filter,scale:v('--bv-world-scale'),release:[v('--bv-release-x'),v('--bv-release-y')],contact:[v('--bv-contact-x'),v('--bv-contact-y')]})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(50);accepted=a.evaluate('JSON.parse(sessionStorage.getItem("9zone-playable-v1:9zone-v10-run"))');a.wait_for_function("document.querySelector('.bv-actor-pitcher')?.dataset.pose==='frame-8'",polling='raf');a.screenshot(path=str(p/f'{label}-release.png'));a.wait_for_selector('.bv-scene[data-phase="result"]');a.screenshot(path=str(p/f'{label}-impact.png'));a.wait_for_timeout(2200);trace=a.evaluate('window.trace');state=accepted;first=trace[:3];before=next(x for x in reversed(trace) if x['phase']=='flight');after=next(x for x in trace if x['phase']=='result')
  residual=[]
  for v in trace:
   if action=='hit' and v['phase']=='result':continue
   radius=v['cssWidth']*10/(ballSize*v['scale']);progress=radius/6-1;endpoint=[v['contact'][0],v['contact'][1]];expected=[v['release'][i]+(endpoint[i]-v['release'][i])*progress for i in range(2)];residual.append(math.hypot(expected[0]-v['x'],expected[1]-v['y']))
  assert all('drop-shadow' in v['edgeFilter'] for v in trace);assert max(residual)<.1,(action,max(residual));assert all(first[i+1]['width']>=first[i]['width'] for i in range(2));assert (state['last']['kind']=='hit' if action=='hit' else ('헛스윙' if action=='miss' else '루킹') in state['last']['text']),state['last'];assert a.locator('.bv-ball-sprite').count()==0
  video=a.video.path() if a.video else None;runs[label]={'first3':first,'beforeImpactSample':before,'afterImpactSample':after,'maxPositionDiameterRayResidualPx':max(residual),'last':state['last'],'video':video,'trace':trace};c.close()
 b.close();(p/'flight-verification.json').write_text(json.dumps(runs,indent=2,ensure_ascii=False));print({k:{'firstX':[x['x'] for x in v['first3']],'width':[x['width'] for x in v['first3']],'rayResidual':v['maxPositionDiameterRayResidualPx'],'last':v['last']['kind']} for k,v in runs.items()})
