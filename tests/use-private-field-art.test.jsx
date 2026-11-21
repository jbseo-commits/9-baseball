// @vitest-environment happy-dom
import {it,expect,vi,afterEach} from 'vitest';
import {renderHook,act,cleanup} from '@testing-library/react';
vi.mock('../src/duel/battle-vnext/private-field-art.js',()=>({loadPrivateFieldArt:vi.fn(),disposePrivateFieldArt:vi.fn()}));
import {loadPrivateFieldArt,disposePrivateFieldArt} from '../src/duel/battle-vnext/private-field-art.js';
import usePrivateFieldArt from '../src/duel/battle-vnext/use-private-field-art.js';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('defers atomic adoption until deciding and disposes when class leaves',async()=>{
 let resolve;loadPrivateFieldArt.mockImplementation(()=>new Promise(r=>resolve=r));const a={url:'blob:a'};
 const v=renderHook(({enabled,deciding})=>usePrivateFieldArt(enabled?'contact':null,deciding),{initialProps:{enabled:true,deciding:false}});await act(async()=>resolve(a));expect(v.result.current).toBeNull();v.rerender({enabled:true,deciding:true});expect(v.result.current).toBe(a);v.rerender({enabled:true,deciding:false});expect(v.result.current).toBe(a);v.rerender({enabled:false,deciding:true});expect(v.result.current).toBeNull();expect(disposePrivateFieldArt).toHaveBeenCalledWith(a);
});
it('late old request can never replace a newer actor and all owned blobs are released',async()=>{
 const requests=[];loadPrivateFieldArt.mockImplementation(()=>new Promise(r=>requests.push(r)));const v=renderHook(({enabled})=>usePrivateFieldArt(enabled?'contact':null,true),{initialProps:{enabled:true}});v.rerender({enabled:false});v.rerender({enabled:true});await act(async()=>requests[1]({url:'blob:new'}));await act(async()=>requests[0]({url:'blob:old'}));expect(v.result.current.url).toBe('blob:new');expect(disposePrivateFieldArt).toHaveBeenCalledWith({url:'blob:old'});v.unmount();expect(disposePrivateFieldArt).toHaveBeenCalledWith({url:'blob:new'});
});

it('times out slow candidates and never adopts them afterwards',async()=>{
 vi.useFakeTimers();let resolve;loadPrivateFieldArt.mockImplementation(()=>new Promise(r=>resolve=r));const v=renderHook(()=>usePrivateFieldArt('contact',true));act(()=>vi.advanceTimersByTime(4501));expect(loadPrivateFieldArt.mock.calls[0][0].signal.aborted).toBe(true);await act(async()=>resolve({url:'blob:slow'}));expect(v.result.current).toBeNull();expect(disposePrivateFieldArt).toHaveBeenCalledWith({url:'blob:slow'});v.unmount();vi.useRealTimers();
});
