from playwright.sync_api import sync_playwright
from pathlib import Path
import json
out=Path(__file__).resolve().parent
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':667,'height':375});a.goto('http://127.0.0.1:4217/');a.get_by_role('button',name='새로운 게임',exact=True).click();a.wait_for_timeout(1000)
 print(a.get_by_role('radio').evaluate_all('(els)=>els.map(e=>({name:e.ariaLabel,rect:e.getBoundingClientRect().toJSON(),opacity:getComputedStyle(e).opacity}))'))
 a.screenshot(path=str(out/'four-classes-667-settled.png'))
 b.close()
