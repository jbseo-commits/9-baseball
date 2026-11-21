from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path(__file__).resolve().parent/'evidence';key='9zone-normal-review-v1:9zone-v10-run';runs=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':844,'height':390},record_video_dir=str(out/'baseline-video'),record_video_size={'width':844,'height':390});a=c.new_page();a.goto('http://127.0.0.1:4214/');a.get_by_role('button',name='새로운 게임',exact=True).click();a.get_by_role('radio',name='버티기',exact=True).click();a.get_by_test_id('start-pack-go').click()
 for name in ['다음','다음','플레이 시작']:a.get_by_role('button',name=name,exact=True).click()
 a.wait_for_timeout(1400);a.get_by_test_id('bp-map-go').click();a.wait_for_timeout(1500)
 for n in range(5):
  if not a.get_by_test_id('bp-swing').count():break
  pre=a.evaluate('(k)=>localStorage.getItem(k)',key);(out/f'pre-{n}.json').write_text(pre)
  if n%2:
   a.locator('.bv-hand-handle').click();a.wait_for_timeout(400);a.locator('.bv-card.t-swing:not(:disabled)').first.click();a.locator('.bv-cell[data-zone="4"]').click()
  a.evaluate('''()=>{window.trace=[];let end=performance.now()+3300;function f(t){let s=document.querySelector('.bv-scene'),b=document.querySelector('.bv-ball-sprite .fx-ball');if(b){let r=b.getBoundingClientRect(),p=b.style.transformOrigin.split(' ').map(parseFloat);trace.push({t,phase:s.dataset.phase,x:r.x+p[0],y:r.y+p[1],width:parseFloat(b.style.width)})}if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''');a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);post=a.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key);a.wait_for_selector('.bv-ball-sprite');a.screenshot(path=str(out/f'before-{n}-release.png'));a.wait_for_selector('.bv-scene[data-phase="result"]');a.screenshot(path=str(out/f'before-{n}-impact.png'));a.wait_for_timeout(2200);runs.append({'n':n,'result':post['battle']['revealed'],'last':post['last'],'trace':a.evaluate('trace')});
  if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').click();a.wait_for_timeout(500)
 video=a.video.path();c.close();b.close();(out/'baseline.json').write_text(json.dumps({'video':video,'runs':runs},ensure_ascii=False,indent=2));print(video);print([(r['n'],r['result']) for r in runs])
