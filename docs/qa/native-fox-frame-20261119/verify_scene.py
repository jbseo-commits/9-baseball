"""Meaningful standalone artifact gates; requires Pillow and Playwright/Chromium."""
from pathlib import Path
import base64
import hashlib
import io
import json
import subprocess
from PIL import Image
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent
before=(root/'stadium-native.png').read_bytes()
subprocess.run(['python3',str(root/'build_scene.py')],check=True,capture_output=True)
assert before==(root/'stadium-native.png').read_bytes(), 'non-deterministic generation'
native=Image.open(io.BytesIO(before)).convert('RGBA')
manifest=json.loads((root/'manifest.json').read_text())
assert native.size==(320,180)
assert hashlib.sha256(before).hexdigest()==manifest['sha256']
assert len(set(native.getdata()))==30
assert all(a==255 for *rgb,a in native.getdata())
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for name,w,h in [('phone',390,844),('small-phone',320,568),('landscape',844,390),('desktop',1440,900)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        errors=[]; requests=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        page.set_content((root/'preview.html').read_text())
        page.wait_for_function('window.sceneReady===true')
        report=page.evaluate('''()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,scale:window.studyScale,smoothing:c.getContext('2d').imageSmoothingEnabled,overflow:document.documentElement.scrollWidth>innerWidth,png:c.toDataURL()}}''')
        rendered=Image.open(io.BytesIO(base64.b64decode(report.pop('png').split(',')[1]))).convert('RGBA')
        assert rendered.tobytes()==native.tobytes(),'canvas differs from authored PNG'
        assert report['scale'] in [1,2,3,4]
        assert report['w']==320*report['scale'] and report['h']==180*report['scale']
        assert report['x']==int(report['x']) and report['y']==int(report['y'])
        assert not report['overflow'] and not report['smoothing']
        assert not errors and not any(u.startswith(('http:','https:')) for u in requests)
        page.screenshot(path=str(root/f'{name}.png'),full_page=True)
        crop=Image.open(io.BytesIO(page.locator('canvas').screenshot())).convert('RGBA')
        assert crop.tobytes()==native.resize(crop.size,Image.Resampling.NEAREST).tobytes(),'display is not nearest integer scaling'
        if name=='phone': crop.save(root/'native-1x-capture.png')
        page.get_by_role('button').click()
        assert page.evaluate('window.studyScale')==1
        results.append({'viewport':[w,h],'dpr':1,'name':name,**report,'consoleErrors':errors,'networkRequests':0,'nativeRGBAEqual':True,'displayNearestEqual':True})
        page.close()
    browser.close()
(root/'verification.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
