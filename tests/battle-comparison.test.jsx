// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import BattleComparison from '../src/duel/battle-vnext/BattleComparison.jsx';
import MemoryPreviewBoundary from '../src/duel/battle-vnext/MemoryPreviewBoundary.jsx';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {COMPARE_MESSAGE,comparisonMode,comparisonScenario,comparisonUrl,validComparisonActivity} from '../src/duel/battle-vnext/compare-config.js';
import {AUTO_NEXT_MS} from '../src/duel/BallparkBattle.jsx';
beforeEach(()=>{window.happyDOM.settings.disableIframePageLoading=true;window.history.replaceState({},'','/?battleUi=vnext&battleCompare=1');localStorage.clear();});
afterEach(()=>{cleanup();window.happyDOM.settings.disableIframePageLoading=false;vi.useRealTimers();vi.restoreAllMocks();window.history.replaceState({},'','/');});
it('requires explicit opt-in and prevents recursive comparison URLs while preserving Pages base',()=>{
 expect(comparisonMode('?battleCompare=1')).toMatchObject({page:false,child:null});
 expect(comparisonMode('?battleUi=vnext&battleCompare=1')).toMatchObject({page:true,child:null});
 expect(comparisonMode('?battleUi=vnext&battleCompare=1&battleCompareChild=legacy')).toMatchObject({page:false,child:'legacy'});
 expect(comparisonMode('?battleUi=vnext&battleCompareChild=other').child).toBeNull();
 const url=comparisonUrl('/9-baseball/previews/test/','legacy','prepare');expect(url.startsWith('/9-baseball/previews/test/?')).toBe(true);expect(url).not.toContain('battleCompare=1');expect(url).toContain('battleCompareChild=legacy');expect(comparisonScenario('unknown')).toBe('watch-read0');
 for(const v of ['legacy','vnext'])expect(comparisonMode('?battleUi=vnext&battleFixture=prepare&battleCompareVariant='+v).standalone).toBe(v);
 expect(comparisonMode('?battleUi=vnext&battleCompareVariant=vnext').standalone).toBeNull();
 window.history.replaceState({},'','/?battleUi=vnext&battleCompare=1&v=aligned-version');
 expect(new URL(comparisonUrl('/preview/','legacy','watch-read0'),location.origin).searchParams.get('v')).toBe('aligned-version');
 expect(new URL(comparisonUrl('/preview/','vnext','prepare',{embedded:false}),location.origin).searchParams.get('v')).toBe('aligned-version');
});
it('accepts activity only from the same-origin parent with the exact schema',()=>{
 const parent={},win={parent,location:{origin:'https://example.test'}};
 const e={source:parent,origin:win.location.origin,data:{type:COMPARE_MESSAGE,version:1,active:true}};
 expect(validComparisonActivity(e,win)).toBe(true);
 expect(validComparisonActivity({...e,origin:'https://other.test'},win)).toBe(false);
 expect(validComparisonActivity({...e,source:{}},win)).toBe(false);
 expect(validComparisonActivity({...e,data:{...e.data,active:'true'}},win)).toBe(false);
 expect(validComparisonActivity({...e,data:{...e.data,version:2}},win)).toBe(false);
});
it('keeps both frames mounted when switching tabs and resets both with a shared scenario',()=>{
 render(<BattleComparison/>);const old=screen.getByTitle('기존 전투 UI'),newer=screen.getByTitle('가로 개선 UI');
 expect(old.closest('section').hasAttribute('inert')).toBe(true);fireEvent.click(screen.getByRole('tab',{name:'A · 기존'}));
 expect(screen.getByTitle('기존 전투 UI')).toBe(old);expect(screen.getByTitle('가로 개선 UI')).toBe(newer);
 expect(newer.closest('section').hasAttribute('inert')).toBe(true);expect(old.tabIndex).toBe(0);
 fireEvent.change(screen.getByRole('combobox',{name:'비교 장면'}),{target:{value:'prepare'}});
 expect(screen.getByTitle('기존 전투 UI').getAttribute('src')).toContain('battleFixture=prepare');
 expect(screen.getByTitle('가로 개선 UI').getAttribute('src')).toContain('battleFixture=prepare');
 const before=screen.getByTitle('기존 전투 UI');fireEvent.click(screen.getByRole('button',{name:'함께 다시 시작'}));expect(screen.getByTitle('기존 전투 UI')).not.toBe(before);
});
it('renders the real legacy actors and wrapper, retaining memory-only saves',()=>{
 localStorage.setItem('9zone-v10-run','sentinel');render(<IntegrationPreview variant="legacy" fixture="watch-read0"/>);
 expect(document.querySelector('.bc-legacy-host .bp-battle')).not.toBeNull();expect(document.querySelector('.battle-vnext')).toBeNull();
 expect(document.querySelector('.bp-batter .batter-sheet-frame')).not.toBeNull();expect(document.querySelector('.bp-pitcher .sprite-stage')).not.toBeNull();expect(localStorage.getItem('9zone-v10-run')).toBe('sentinel');
});
it('renders the selected registered rig in vnext fixtures, including the reference boss',()=>{
 render(<IntegrationPreview fixture="reference-boss"/>);
 expect(document.querySelector('.bv-actor-pitcher').dataset.rosterArt).toBe('boss-01-emerald-tyrant');
 expect(document.querySelector('.bv-actor-pitcher img').getAttribute('src')).toContain('boss-01-emerald-tyrant.avif');
 expect(document.querySelector('.bv-sandbox-art').textContent).toContain('등록 로스터');
});
it('starts an embedded frame locked, ignores unrelated messages, and pauses auto-next when hidden',()=>{
 vi.useFakeTimers();const parent={},original=window.parent;Object.defineProperty(window,'parent',{configurable:true,value:parent});parent.postMessage=vi.fn();
 try{
 render(<IntegrationPreview embedded fixture="result-take"/>);
 act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS+20));expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
 act(()=>window.dispatchEvent(new MessageEvent('message',{source:{},origin:location.origin,data:{type:COMPARE_MESSAGE,version:1,active:true}})));
 act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS+20));expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');
 const send=active=>act(()=>window.dispatchEvent(new MessageEvent('message',{source:parent,origin:location.origin,data:{type:COMPARE_MESSAGE,version:1,active}})));
 send(true);expect(document.querySelector('.battle-vnext').dataset.phase).toBe('result');send(false);
 act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS*2));expect(document.querySelector('.battle-vnext').dataset.phase).toBe('result');
 send(true);act(()=>vi.advanceTimersByTime(AUTO_NEXT_MS+20));expect(document.querySelector('.battle-vnext').dataset.phase).toBe('deciding');
 }finally{Object.defineProperty(window,'parent',{configurable:true,value:original});}
});
it('comparison error recovery never offers to remove a production save',()=>{
 const warn=vi.spyOn(console,'error').mockImplementation(()=>{});const broken=()=>{throw new Error('test');};localStorage.setItem('9zone-v10-run','sentinel');
 render(<MemoryPreviewBoundary>{React.createElement(broken)}</MemoryPreviewBoundary>);
 expect(screen.getByRole('button',{name:'다시 불러오기'})).not.toBeNull();expect(screen.queryByText(/保存|저장된 런 지우고/)).toBeNull();expect(localStorage.getItem('9zone-v10-run')).toBe('sentinel');warn.mockRestore();
});
