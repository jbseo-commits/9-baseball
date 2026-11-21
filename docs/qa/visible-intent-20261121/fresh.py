from pathlib import Path
from playwright.sync_api import sync_playwright
import json
q=Path('/workspace/visible-intent-qa');out={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':667,'height':375},has_touch=True,record_video_dir=str(q/'videos'),record_video_size={'width':668,'height':376});a=c.new_page();a.set_default_timeout(8000)
 def art(r):
  f=Path('/workspace/slugger-motion-qa')/('synthetic.json' if r.request.url.endswith('.json') else 'synthetic.webp');r.fulfill(status=200,content_type='application/json' if f.suffix=='.json' else 'image/webp',body=f.read_bytes())
 a.route('**/slugger-motion-v2/*',art);a.goto('http://127.0.0.1:4264/');a.get_by_role('button',name='새로운 게임',exact=True).tap();assert a.get_by_text('이번 검수 잠김',exact=True).count()==3;a.get_by_test_id('start-pack-go').tap();a.get_by_role('button',name='다음',exact=True).tap();a.get_by_role('button',name='다음',exact=True).tap();a.get_by_role('button',name='플레이 시작',exact=True).tap();a.wait_for_timeout(300);a.get_by_test_id('bp-map-go').tap();a.wait_for_timeout(1800)
 badge=a.locator('.bv-public-intent');assert badge.is_visible();assert a.locator('[data-actor=batter]').get_attribute('data-batter-kind')=='review-slugger-atlas';out['initial']=badge.get_attribute('aria-label');a.screenshot(path=str(q/'fresh-before.png'));a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200)
 prep=next(a.locator(f'.bv-card[data-card-kind="{kind}"]:not(:disabled)') for kind in ['scout','loadPower','setup'] if a.locator(f'.bv-card[data-card-kind="{kind}"]:not(:disabled)').count());out['prep']=prep.get_attribute('data-card-kind');prep.tap();old=badge.inner_html();a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(60);assert badge.inner_html()==old;a.wait_for_timeout(900);out['afterPublicPrep']=badge.get_attribute('aria-label');a.screenshot(path=str(q/'fresh-after-scout.png'))
 if a.locator('.bv-hand-handle').get_attribute('aria-expanded')=='false':a.locator('.bv-hand-handle').tap();a.wait_for_timeout(200)
 a.get_by_test_id('bv-basic-chip').tap();a.locator('.bv-cell[data-zone="4"]').tap();sig=badge.inner_html();a.get_by_test_id('bp-swing').tap();a.wait_for_timeout(600);assert badge.inner_html()==sig;a.screenshot(path=str(q/'fresh-flight.png'));a.wait_for_timeout(1400);assert badge.inner_html()==sig;a.screenshot(path=str(q/'fresh-result.png'));out['resultFrozen']=True
 if a.get_by_test_id('bp-next').count():a.get_by_test_id('bp-next').tap();a.wait_for_timeout(300);assert badge.is_visible();out['nextDecision']=badge.get_attribute('aria-label')
 out['video']=a.video.path();c.close();b.close();(q/'fresh.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(out)
