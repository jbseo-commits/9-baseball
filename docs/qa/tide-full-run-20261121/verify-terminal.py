from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
p=Path(__file__).resolve().parent;url=os.environ.get('QA_URL','http://127.0.0.1:4211/');key='9zone-tide-playtest-v1:9zone-v10-run'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);a.goto(url+'?battleUi=vnext&tidePlaytest=1');a.get_by_role('button',name='새 타이드 런 시작').click();a.get_by_role('button',name='이 구장으로 간다').click();a.wait_for_selector('.bv-tide-wave');a.get_by_role('combobox',name='애니메이션 배속').select_option('2');actions=[]
 for i in range(60):
  a.wait_for_function('''k=>{const s=JSON.parse(sessionStorage.getItem(k));return ['battle','between','lost','won','reward'].includes(s.phase)&&!document.querySelector('.bv-scene')?.dataset.fxStage}''',arg=key,timeout=15000)
  s=a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k))',key)
  if s['phase'] in ['lost','won','reward']:break
  if s['phase']=='between':a.get_by_test_id('bp-next').click();a.wait_for_timeout(150);continue
  a.get_by_test_id('bp-swing').click();a.wait_for_timeout(100);n=a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k))',key);actions.append({'pitch':n['stats']['pitches'],'last':n['last'],'phase':n['phase']});a.wait_for_timeout(1300)
 else:raise AssertionError('terminal not reached')
 assert s['phase'] in ['lost','won','reward'];a.wait_for_timeout(1500);a.screenshot(path=str(p/'canonical-terminal.png'));buttons=a.locator('button').all_text_contents();a.reload();a.get_by_role('button',name='검수 런 이어하기').click();a.wait_for_timeout(300);assert a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k)).phase',key)==s['phase'];a.reload();a.get_by_role('button',name='새 타이드 런 시작').click();a.wait_for_timeout(200);assert a.evaluate('(k)=>JSON.parse(sessionStorage.getItem(k)).stats.pitches',key)==0
 (p/'terminal-verification.json').write_text(json.dumps({'method':'actual landing→canonical map→Tide; real watch controls only, 2x presentation speed for QA, no state edits/no forced results','terminal':s['phase'],'actions':actions,'buttons':buttons,'terminalResume':True,'freshRestart':True},ensure_ascii=False,indent=2));print('PASS actual canonical run terminal',s['phase'],len(actions),'pitches');b.close()
