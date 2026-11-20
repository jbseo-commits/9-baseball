from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
import json,hashlib,math
p=Path(__file__).resolve().parent;root=p.parents[2]
r=json.loads((root/'src/duel/battle-vnext/roster-registration.json').read_text())['regular-07-red-fox'];k=r['visibleWorldHeight']/r['visibleHeight'];R={a:r['worldFoot'][a]+(r['release'][a]-r['anchor'][a])*k for a in ['x','y']}
b=json.loads((root/'assets/pixel-batter-review-v1/batter-runtime.json').read_text());C={'x':200+(b['event']['x']-210)*1100/768,'y':960+(b['event']['y']-700)*1100/768}
im=Image.open(root/'assets/pixel-batter-review-v1/batter-night-poses.webp').convert('RGBA').crop((480,0,640,160))
# Bat occupies source y52..65; extremum is inspected against the actual source image.
tip=max(x for y in range(52,66) for x in range(115,160) if im.getpixel((x,y))[3]>0);tipWorld=200+(tip-36)*4*1100/768
results={'releaseWorld':R,'contactWorld':C,'batRightmostSourceX':tip,'batRightmostWorldX':tipWorld,'contactMinusReleaseX':C['x']-R['x'],'tipMinusReleaseX':tipWorld-R['x'],'baselineZipSha256':hashlib.sha256(Path('/workspace/fox-twelve-pose-playable.zip').read_bytes()).hexdigest(),'runs':{}}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for action in ['swing','take']:
  c=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1);a=c.new_page();a.goto('http://127.0.0.1:4193/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent');a.wait_for_timeout(600)
  if action=='swing':
   a.locator('.bv-hand-handle').click();a.wait_for_timeout(600);a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="2"]').click()
  a.evaluate('''()=>{window.trace=[];let end=performance.now()+3300;function f(t){const s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball'),e=document.querySelector('.bv-actor-pitcher');if(b){const r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat);window.trace.push({t,phase:s.dataset.phase,pose:e.dataset.pose,x:r.x+p[0],y:r.y+p[1],width:r.width,height:r.height})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
  a.get_by_test_id('bp-swing').click();a.wait_for_function("document.querySelector('.bv-actor-pitcher')?.dataset.pose==='frame-8'",polling='raf');a.screenshot(path=str(p/f'{action}-release.png'));a.wait_for_selector('.bv-scene[data-phase="result"]');a.screenshot(path=str(p/f'{action}-contact.png'));a.wait_for_timeout(2200);trace=a.evaluate('window.trace');first=trace[:3];lastFlight=next(x for x in reversed(trace) if x['phase']=='flight');firstResult=next(x for x in trace if x['phase']=='result');results['runs'][action]={'first3':first,'deltaX':[first[i+1]['x']-first[i]['x'] for i in range(2)],'deltaY':[first[i+1]['y']-first[i]['y'] for i in range(2)],'lastFlight':lastFlight,'firstResult':firstResult,'trace':trace};c.close()
 browser.close()
(p/'geometry-and-browser.json').write_text(json.dumps(results,indent=2));print(json.dumps({k:v for k,v in results.items() if k!='runs'},indent=2));print({k:{x:v[x] for x in ['first3','deltaX','deltaY','lastFlight','firstResult']} for k,v in results['runs'].items()})
