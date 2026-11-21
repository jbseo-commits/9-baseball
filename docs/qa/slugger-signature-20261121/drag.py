from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/slugger-signature-qa');v=json.loads((q/'cases.json').read_text())['slug-hit'];out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for late in [False,True]:
  c=b.new_context(viewport={'width':667,'height':375});a=c.new_page();held=[]
  def route(r):
   if late:held.append(r)
   else:r.fulfill(status=200,content_type='image/webp',body=(q/'synthetic.webp').read_bytes())
  a.route('**/slugger-cards-v1/*.webp',route);a.goto('http://127.0.0.1:4231/');a.evaluate('(s)=>{localStorage.setItem("9zone-normal-review-v1:9zone-v10-run",JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',v['state']);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(150 if late else 700);a.locator('.bv-hand-handle').click();a.wait_for_timeout(150);card=a.locator('[data-card-kind="slug"]').first;box=card.bounding_box();cell=a.locator('.bv-cell[data-zone="'+str(v['aim'])+'"]').bounding_box();a.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);a.mouse.down();a.mouse.move(box['x']-30,box['y']+20,steps=3);a.wait_for_timeout(80);before=a.locator('.bv-drag-art').evaluate('(e)=>({image:e.style.backgroundImage,size:getComputedStyle(e).backgroundSize})')
  if late:
   for r in held:r.fulfill(status=200,content_type='image/webp',body=(q/'synthetic.webp').read_bytes())
   a.wait_for_timeout(150)
  a.mouse.move(cell['x']+cell['width']/2,cell['y']+cell['height']/2,steps=5);a.wait_for_timeout(50);after=a.locator('.bv-drag-art').evaluate('(e)=>({image:e.style.backgroundImage,size:getComputedStyle(e).backgroundSize})');assert before==after
  if not late:assert after['size']=='contain'
  a.screenshot(path=str(q/f'drag-{late}.png'));a.mouse.up();a.wait_for_timeout(450);assert a.locator('[data-card-kind="slug"][data-selection="main"]').count()>=1
  out.append({'late':late,'stableArt':True,'size':after['size'],'selection':'main'});c.close();print('PASS drag',late,flush=True)
 b.close()
(q/'drag.json').write_text(json.dumps(out,indent=2))
