// @vitest-environment happy-dom
// @vitest-environment-options {"happyDOM":{"width":1024,"height":768}}
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import BallparkBattle,{AUTO_NEXT_MS,AUTO_NEXT_RETRY_MS} from '../src/duel/BallparkBattle.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';

beforeEach(()=>{vi.useFakeTimers();window.history.replaceState({},'','/?battleUi=vnext');});
afterEach(()=>{cleanup();vi.useRealTimers();window.history.replaceState({},'','/');});
const tick=ms=>act(()=>vi.advanceTimersByTime(ms));
function open(id='result-take'){
 const f=buildFixture(id),onNext=vi.fn(),props={...f,pitcher:f.s.pitcher,vnextReview:f,onNext};
 return {...render(<BallparkBattle {...props}/>),props,onNext};
}
const unfold=()=>fireEvent.click(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
const fold=()=>fireEvent.click(screen.getByRole('button',{name:'손패 접기',exact:true}));

it.each(['result-take','result-hit'])('%s: reading the open hand cancels a nearly due auto-next; closing starts a fresh beat',id=>{
 const v=open(id);tick(AUTO_NEXT_MS-10);unfold();tick(AUTO_NEXT_MS*4);
 expect(document.querySelector('.battle-vnext').dataset.handOpen).toBe('true');expect(v.onNext).not.toHaveBeenCalled();
 fold();tick(AUTO_NEXT_MS-1);expect(v.onNext).not.toHaveBeenCalled();tick(1);expect(v.onNext).toHaveBeenCalledTimes(1);
});
it('closed hand keeps the existing first deadline and retry interval',()=>{
 const v=open();tick(AUTO_NEXT_MS-1);expect(v.onNext).not.toHaveBeenCalled();tick(1);expect(v.onNext).toHaveBeenCalledTimes(1);
 tick(AUTO_NEXT_RETRY_MS-1);expect(v.onNext).toHaveBeenCalledTimes(1);tick(1);expect(v.onNext).toHaveBeenCalledTimes(2);
});
it('opening after a temporarily rejected next cancels the already-running retry',()=>{
 const v=open();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);tick(100);unfold();tick(AUTO_NEXT_RETRY_MS*5);
 expect(v.onNext).toHaveBeenCalledTimes(1);fold();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(2);
});
it('Escape folds the optional inspection and resumes without changing the result',()=>{
 const v=open();const text=screen.getByTestId('bv-result-line').textContent;unfold();tick(AUTO_NEXT_MS*2);
 fireEvent.keyDown(window,{key:'Escape'});expect(screen.getByRole('button',{name:'손패 펼치기',exact:true})).toBe(document.activeElement);
 expect(screen.getByTestId('bv-result-line').textContent).toBe(text);tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);
});
it('closing a nested inspector does not resume while its underlying hand is still open',()=>{
 const v=open();unfold();fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));tick(AUTO_NEXT_MS*2);
 fireEvent.click(screen.getByTestId('bp-inspect-back'));expect(document.querySelector('.battle-vnext').dataset.handOpen).toBe('true');tick(AUTO_NEXT_MS*2);
 expect(v.onNext).not.toHaveBeenCalled();fold();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);
});
it('explicit next still executes once while the optional inspection is open',()=>{
 const v=open();unfold();fireEvent.click(screen.getByTestId('bp-next'));fireEvent.click(screen.getByTestId('bp-next'));tick(AUTO_NEXT_MS*3);
 expect(v.onNext).toHaveBeenCalledTimes(1);
});
it('renderer fallback does not inherit a stale pause and returning starts folded',()=>{
 const v=open();unfold();v.rerender(<BallparkBattle {...v.props} vnextReview={null}/>);expect(document.querySelector('.bp-battle')).not.toBeNull();
 tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);v.rerender(<BallparkBattle {...v.props}/>);
 expect(document.querySelector('.battle-vnext').dataset.handOpen).toBe('false');tick(AUTO_NEXT_RETRY_MS);expect(v.onNext).toHaveBeenCalledTimes(2);
});
it('unmounting while reading leaves no pending automatic action',()=>{
 const v=open();unfold();v.unmount();tick(AUTO_NEXT_MS*4);expect(v.onNext).not.toHaveBeenCalled();
});
