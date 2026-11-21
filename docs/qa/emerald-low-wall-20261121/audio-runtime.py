from playwright.sync_api import sync_playwright
from pathlib import Path
import json
q=Path('/workspace/emerald-qa');s=json.loads((q/'cases.json').read_text())['take']['state'];results={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode in ['muted','enabled','cancel','reduced']:
  c=b.new_context(viewport={'width':667,'height':375},reduced_motion='reduce' if mode=='reduced' else 'no-preference');c.add_init_script('''(()=>{window.voice=[];const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){const n=original.call(this),rec={frequency:null,starts:[],stops:[]};const set=n.frequency.setValueAtTime.bind(n.frequency);n.frequency.setValueAtTime=(v,t)=>{rec.frequency=v;return set(v,t)};const start=n.start.bind(n),stop=n.stop.bind(n);n.start=(t)=>{rec.starts.push(t);voice.push(rec);return start(t)};n.stop=(t)=>{rec.stops.push(t??null);return stop(t)};return n}})()''');a=c.new_page();a.goto('http://127.0.0.1:4230/');a.evaluate('(s)=>{localStorage.setItem("9zone-normal-review-v1:9zone-v10-run",JSON.stringify(s));localStorage.setItem("9zone-normal-review-v1:9zone-welcome-v1","seen")}',s);a.reload();a.get_by_role('button',name='이어하기',exact=True).click();a.wait_for_timeout(700)
  if mode!='muted':a.get_by_role('button',name='효과음 켜기').click()
  a.evaluate('voice=[]');a.get_by_test_id('bp-swing').click()
  if mode=='cancel':a.wait_for_timeout(1020);a.get_by_role('button',name='효과음 끄기').click()
  a.wait_for_timeout(2400);v=a.evaluate('voice');pitch=[x for x in v if x['frequency']==220 and abs(x['stops'][0]-x['starts'][0]-.185)<.001]
  if mode in ['muted','reduced']:assert not pitch
  else:assert len(pitch)==1,(mode,v)
  if mode=='cancel':assert all(None in x['stops'] for x in pitch),(mode,pitch)
  results[mode]=pitch;c.close()
 b.close();(q/'audio-runtime.json').write_text(json.dumps(results,indent=2));print('PASS mute/enabled/cancel actual WebAudio nodes; no listening claim')
