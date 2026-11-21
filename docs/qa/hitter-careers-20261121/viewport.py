from playwright.sync_api import sync_playwright
from pathlib import Path
import json
out=Path('/workspace/careers-qa');results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(844,390),(1440,900),(390,844)]:
  c=b.new_context(viewport={'width':w,'height':h});a=c.new_page();a.goto('http://127.0.0.1:4222/');a.get_by_role('button',name='새로운 게임',exact=True).click();a.wait_for_timeout(500);rects=a.locator('.hc-player').evaluate_all('(xs)=>xs.map(x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})');assert all(r['x']>=0 and r['x']+r['w']<=w+1 for r in rects);a.get_by_test_id('start-pack-go').scroll_into_view_if_needed();a.screenshot(path=str(out/f'selection-{w}x{h}.png'));results.append({'size':[w,h],'rects':rects,'startAccessible':a.get_by_test_id('start-pack-go').is_visible()});c.close()
 c=b.new_context(viewport={'width':667,'height':375});a=c.new_page();requests=[];a.on('request',lambda r:requests.append(r.url) if '/roster-v2/' in r.url else None);a.goto('http://127.0.0.1:4223/?normalRun=1');a.get_by_role('button',name='새로운 게임',exact=True).click();a.wait_for_timeout(600);assert not requests;assert a.locator('.hc-portrait[data-art="neutral-silhouette"]').count()==4;results.append({'productionQueryGate':True,'portraitRequests':requests});c.close();b.close()
(out/'viewport.json').write_text(json.dumps(results,indent=2));print('PASS',len(results))
