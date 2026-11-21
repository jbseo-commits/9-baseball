from pathlib import Path
from playwright.sync_api import sync_playwright
import json,math,os
p=Path(__file__).resolve().parent;root=p.parents[2];ballSize=json.loads((root/'assets/production-art/pitch-juice-v1/manifest.json').read_text())['effects']['ball']['frameSize'][0];url=os.environ.get('QA_URL','http://127.0.0.1:4211/');key='9zone-tide-playtest-v1:9zone-v10-run';runs={}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(844,390),(667,375)]:
  for action in ['hit','take','whiff']:
   label=f'{w}-{action}';c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=1);a=c.new_page();a.goto(url+'?battleUi=vnext&tidePlaytest=1');a.get_by_role('button',name='새 타이드 런 시작').click();a.get_by_role('button',name='이 구장으로 간다').click();a.wait_for_selector('.bv-tide-wave');a.wait_for_timeout(300)
   if action!='take':a.locator('.bv-hand-handle').click();a.wait_for_timeout(450);a.locator('.bv-card[data-card-kind="place"]').first.click();a.locator('.bv-cell[data-zone="'+('5' if action=='hit' else '0')+'"]').click()
   a.evaluate('''()=>{window.trace=[];const end=performance.now()+3300;function f(t){const s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){const r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat),v=k=>parseFloat(s.style.getPropertyValue(k));window.trace.push({t,phase:s.dataset.phase,x:r.x+p[0],y:r.y+p[1],width:r.width,cssWidth:parseFloat(b.style.width),scale:v('--bv-world-scale'),release:[v('--bv-release-x'),v('--bv-release-y')],contact:[v('--bv-contact-x'),v('--bv-contact-y')],wave:!!document.querySelector('.bv-tide-wave')})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
   a.get_by_test_id('bp-swing').click();a.wait_for_timeout(80);s=a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k))',key);assert s['battle']['revealed']['kind']=={'hit':'hit','take':'called','whiff':'whiff'}[action],s['last'];assert s['v10']['lastCombat']['encounter']['bonus']==0
   a.wait_for_selector('.bv-ball-sprite');a.screenshot(path=str(p/f'{label}-release.png'));a.wait_for_selector('.bv-scene[data-phase="result"]');a.screenshot(path=str(p/f'{label}-impact.png'));a.wait_for_timeout(2200);trace=a.evaluate('window.trace');residual=[]
   for v in trace:
    assert not v['wave'];
    if action=='hit' and v['phase']=='result':continue
    radius=v['cssWidth']*10/(ballSize*v['scale']);t=2-12/radius;q=t/(2-t);x=v['release'][0]+(v['contact'][0]-v['release'][0])*q;y=v['release'][1]+(v['contact'][1]-v['release'][1])*q+64*t*(t-1)/(2-t)*v['scale'];residual.append(math.hypot(x-v['x'],y-v['y']))
   assert max(residual)<.1,(label,max(residual));assert a.locator('.bv-ball-sprite').count()==0
   runs[label]={'outcome':s['last'],'bonus':0,'maxPathRadiusResidualCssPx':max(residual),'first3':trace[:3],'beforeImpact':next(v for v in reversed(trace) if v['phase']=='flight'),'afterImpact':next(v for v in trace if v['phase']=='result'),'trace':trace};c.close()
 b.close();(p/'flight-verification.json').write_text(json.dumps(runs,ensure_ascii=False,indent=2));print('PASS6 actualsame-seed hit/take/whiff sharedincoming/continuouspass/radius/wavehidden')
