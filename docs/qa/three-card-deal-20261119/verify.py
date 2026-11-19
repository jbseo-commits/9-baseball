from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import io,json
p=Path(__file__).resolve().parent
report=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for name,w,h in [('portrait',390,844),('landscape',844,390),('desktop',1440,900)]:
  page=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((p/'index.html').read_text());page.wait_for_function('window.dealState')
  for t in range(0,737,16):
   page.evaluate('(t)=>seekDeal(t)',t)
   result=page.evaluate('''()=>{const f=document.querySelector('canvas').getBoundingClientRect(),h=document.querySelector('#hand').getBoundingClientRect(),k=Math.max(f.width/400,f.height/225),x=f.x+(f.width-400*k)/2;const lane={l:x+170*k,r:x+235*k,t:f.top,b:f.bottom};const hits=[...document.querySelectorAll('.card')].filter(c=>{const a=c.getBoundingClientRect();return Math.max(a.left,h.left)<lane.r&&Math.min(a.right,h.right)>lane.l&&Math.max(a.top,h.top)<lane.b&&Math.min(a.bottom,h.bottom)>lane.t});return{hits:hits.length,count:document.querySelectorAll('.card').length,lane}}''')
   assert result['hits']==0,(name,t,result)
   assert result['count']==3
  page.locator('#replay').focus();page.keyboard.press('Enter');page.keyboard.press('Space')
  page.evaluate('()=>{for(let i=0;i<25;i++)deal()}');page.wait_for_timeout(800)
  assert page.locator('.card').count()==3
  assert page.evaluate('document.getAnimations().length')==0
  page.screenshot(path=str(p/(name+'.png')))
  page.evaluate('deal()');page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(800);assert page.locator('.card').count()==3
  page.emulate_media(reduced_motion='reduce');page.locator('#replay').click();assert page.evaluate('document.getAnimations().length')==0
  assert page.locator('.card').count()==3
  page.reload if False else None
  assert not errors,errors
  report.append({'viewport':[w,h],'samples':47,'laneSourceX':[170,235],'count':3,'errors':errors,'rapidReplay':25,'keyboard':True,'rotation':True,'reducedMotion':True})
  page.close()
 page=b.new_page(viewport={'width':390,'height':620},device_scale_factor=1,reduced_motion='reduce');page.set_content((p/'index.html').read_text());page.wait_for_function('window.dealState');assert page.evaluate('document.getAnimations().length')==0;page.close()
 page=b.new_page(viewport={'width':390,'height':620},device_scale_factor=1);page.set_content((p/'index.html').read_text());page.wait_for_function('window.dealState');frames=[]
 for t in list(range(0,851,50))+[1000]*25:
  page.evaluate('(t)=>seekDeal(t)',t)
  frames.append(Image.open(io.BytesIO(page.screenshot())).convert('RGB'))
 frames[0].save(p/'opening-deal.gif',save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=False)
 b.close()
(p/'verification.json').write_text(json.dumps(report,indent=2));print('PASS: all gates; GIF captured')
