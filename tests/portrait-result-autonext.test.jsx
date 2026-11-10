// @vitest-environment happy-dom
// @vitest-environment-options {"happyDOM":{"width":1024,"height":768}}
import React from 'react';import{render,screen,fireEvent,cleanup,act}from'@testing-library/react';
import{beforeEach,afterEach,it,expect,vi}from'vitest';
import BallparkBattle,{AUTO_NEXT_MS,AUTO_NEXT_RETRY_MS}from'../src/duel/BallparkBattle.jsx';
import{buildFixture}from'../src/duel/battle-vnext/fixtures.js';
const query='(orientation: portrait) and (pointer: coarse)';let covered,finePortrait,oldApi,listeners;
beforeEach(()=>{vi.useFakeTimers();window.history.replaceState({},'','/?battleUi=vnext');covered=false;finePortrait=false;oldApi=false;listeners=new Set();vi.spyOn(window,'matchMedia').mockImplementation(q=>{
 const base={matches:q===query?covered:q==='(orientation: portrait)'?finePortrait:false};const add=(...a)=>listeners.add(a.at(-1)),remove=(...a)=>listeners.delete(a.at(-1));return oldApi?{...base,addListener:add,removeListener:remove}:{...base,addEventListener:add,removeEventListener:remove};
});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();window.history.replaceState({},'','/');});
const tick=ms=>act(()=>vi.advanceTimersByTime(ms));
const notice=(value,emit=true)=>act(()=>{covered=value;if(emit)for(const fn of [...listeners])fn();});
function open(extra={},fixture='result-take'){const f=buildFixture(fixture),onNext=vi.fn(),props={...f,pitcher:f.s.pitcher,vnextReview:f,onNext,...extra};return{...render(<BallparkBattle {...props}/>),onNext,props};}
const unfold=()=>fireEvent.click(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
const fold=()=>fireEvent.click(screen.getByRole('button',{name:'손패 접기',exact:true}));
it('a result mounted under the rotation notice waits until landscape returns',()=>{covered=true;const v=open();tick(5000);expect(v.onNext).not.toHaveBeenCalled();notice(false);tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it.each(['result-take','result-hit'])('%s: rotation just before the deadline cancels progression and returns with a fresh beat',fixture=>{const v=open({},fixture);tick(AUTO_NEXT_MS-10);notice(true);tick(3000);expect(v.onNext).not.toHaveBeenCalled();notice(false);tick(AUTO_NEXT_MS-1);expect(v.onNext).not.toHaveBeenCalled();tick(1);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('the callback rechecks current coverage even before a delayed media notification',()=>{const v=open();tick(AUTO_NEXT_MS-1);notice(true,false);tick(1+AUTO_NEXT_RETRY_MS);expect(v.onNext).not.toHaveBeenCalled();notice(true);notice(false);tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('rotation cancels an existing retry after a temporarily rejected next',()=>{const v=open();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);notice(true);tick(2500);expect(v.onNext).toHaveBeenCalledTimes(1);notice(false);tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(2);});
it('repeated rotations do not leak subscriptions or resume an earlier deadline',()=>{const v=open();notice(true);notice(false);tick(700);notice(true);tick(500);notice(false);tick(700);notice(true);tick(2000);expect(v.onNext).not.toHaveBeenCalled();expect(listeners.size).toBe(1);notice(false);tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('landscape return still waits while the optional hand remains open',()=>{const v=open();unfold();notice(true);tick(2000);notice(false);tick(2000);expect(v.onNext).not.toHaveBeenCalled();fold();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('landscape return still waits for an open inspector',()=>{const v=open();fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));notice(true);notice(false);tick(2000);expect(v.onNext).not.toHaveBeenCalled();fireEvent.click(screen.getByTestId('bp-inspect-back'));tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('the notice also pauses an unsupported-art fallback requested as vnext',()=>{covered=true;const v=open({vnextReview:null});expect(document.querySelector('.bp-battle')).not.toBeNull();tick(2200);expect(v.onNext).not.toHaveBeenCalled();notice(false);tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('explicit legacy keeps its existing deadline and does not subscribe to the vnext notice',()=>{window.history.replaceState({},'','/?battleUi=legacy');covered=true;const v=open();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);expect(listeners.size).toBe(0);});
it('fine-pointer portrait has no coarse-pointer notice and keeps normal progression',()=>{finePortrait=true;const v=open();tick(AUTO_NEXT_MS);expect(v.onNext).toHaveBeenCalledTimes(1);});
it('lesson mode remains manual even after the notice clears',()=>{covered=true;const v=open({autoLesson:true});notice(false);tick(5000);expect(v.onNext).not.toHaveBeenCalled();});
it('unmount removes listeners and pending next callbacks',()=>{const v=open();expect(listeners.size).toBe(1);v.unmount();expect(listeners.size).toBe(0);notice(true);tick(5000);expect(v.onNext).not.toHaveBeenCalled();});
it('older media-query listener APIs also pause and unsubscribe',()=>{oldApi=true;const v=open();notice(true);tick(2200);expect(v.onNext).not.toHaveBeenCalled();v.unmount();expect(listeners.size).toBe(0);});
