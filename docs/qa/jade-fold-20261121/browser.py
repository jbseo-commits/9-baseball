from playwright.sync_api import sync_playwright
from pathlib import Path
import json
q=Path('/workspace/jade-fold-qa');cases=json.load(open(q/'fixtures.json'));key='9zone-normal-review-v1:9zone-v10-run';out=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,w,reduced in [('off',667,False),('onA',667,False),('onB',667,False),('off',844,False),('onA',844,False),('onA',667,True)]:
  c=b.new_context(viewport={'width':w,'height':375 if w==667 else 390},has_touch=True,reduced_motion='reduce' if reduced else 'no-preference');a=c.new_page();a.set_default_timeout(8000);a.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(cases[name]))+');localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen");');a.goto('http://127.0.0.1:4274/');a.get_by_role('button',name='이어하기',exact=True).tap();a.wait_for_timeout(900);shell=a.locator('.bv-jade-plate');assert shell.count()==(name!='off');assert a.locator('.bv-public-intent').is_visible();record={'case':name,'w':w,'reduced':reduced,'shell':shell.evaluate('(e)=>e.outerHTML') if shell.count() else None};a.screenshot(path=str(q/f'{name}-{w}-{reduced}.png'));out.append(record);c.close();print('PASS',name,w,reduced,flush=True)
 assert out[1]['shell']==out[2]['shell'];b.close();(q/'browser.json').write_text(json.dumps(out,indent=2))
