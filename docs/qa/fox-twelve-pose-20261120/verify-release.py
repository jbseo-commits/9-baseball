from playwright.sync_api import sync_playwright
from pathlib import Path
import json
p=Path(__file__).resolve().parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
 a.goto('http://127.0.0.1:4192/?battleUi=vnext&battlePlay=1&seed=20261119');a.wait_for_selector('.bv-public-intent');a.wait_for_timeout(1500)
 a.evaluate('''()=>{window.samples=[];let end=performance.now()+6500;function sample(t){const e=document.querySelector('.bv-actor-pitcher'),s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(e){const r=e.getBoundingClientRect(),v=b?.getBoundingClientRect();window.samples.push({t,pose:e.dataset.pose,box:{x:r.x,y:r.y,width:r.width,height:r.height},ball:v?{x:v.x,y:v.y,width:v.width,height:v.height,pivot:b.style.transformOrigin}:null,release:[parseFloat(s.style.getPropertyValue('--bv-release-x')),parseFloat(s.style.getPropertyValue('--bv-release-y'))],badge:!!document.querySelector('.bv-public-intent')})}if(t<end)requestAnimationFrame(sample)}requestAnimationFrame(sample)}''')
 a.get_by_test_id('bp-swing').click()
 a.wait_for_function("document.querySelector('.bv-actor-pitcher')?.dataset.pose==='frame-8'",polling='raf',timeout=8000)
 a.screenshot(path=str(p/'phone-release.png'));a.wait_for_timeout(3000);data=a.evaluate('window.samples');(p/'release-samples.json').write_text(json.dumps(data,indent=2))
 first=next(x for x in data if x['ball']);assert first['pose']=='frame-8',first
 # Actual DOM actor projection: source hand94,33 is registered cell230,59.
 r=first['box'];hand=[r['x']+r['width']*230/256,r['y']+r['height']*59/256];v=first['ball'];pivot=[float(x.replace('px','')) for x in v['pivot'].split()];ball=[v['x']+pivot[0],v['y']+pivot[1]];distance=sum((x-y)**2 for x,y in zip(hand,ball))**.5;assert distance<2,(hand,ball,distance)
 # All actor boxes stay constant; only atlas crop changes. Ignore shared camera impact shake by measuring pre-impact and recovery separately.
 boxes={tuple(round(x['box'][k],3) for k in ['x','y','width','height']) for x in data if x['pose'] in ['frame-5','frame-6','frame-7','frame-8']};assert len(boxes)==1,boxes
 result={'firstBallPose':first['pose'],'handScreen':hand,'ballScreen':ball,'distancePx':distance,'observedPoses':sorted(set(x['pose'] for x in data)),'plantedPreImpactBoxes':list(boxes),'sourceLeadCell':[194,248],'realBrowserClock':True};(p/'release-verification.json').write_text(json.dumps(result,indent=2));print(result);b.close()
