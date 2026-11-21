// @vitest-environment happy-dom
import {it,expect,vi,afterEach} from 'vitest';
import {renderHook,act,cleanup} from '@testing-library/react';
vi.mock('../src/duel/battle-vnext/slugger-motion.js',()=>({loadSluggerMotion:vi.fn(),disposeSluggerActor:vi.fn()}));
import {loadSluggerMotion,disposeSluggerActor} from '../src/duel/battle-vnext/slugger-motion.js';
import useSluggerMotion from '../src/duel/battle-vnext/use-slugger-motion.js';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('defers atomic adoption until deciding and disposes when class leaves',async()=>{
 let resolve;loadSluggerMotion.mockImplementation(()=>new Promise(r=>resolve=r));const a={url:'blob:a'};
 const v=renderHook(({enabled,deciding})=>useSluggerMotion(enabled,deciding),{initialProps:{enabled:true,deciding:false}});await act(async()=>resolve(a));expect(v.result.current).toBeNull();v.rerender({enabled:true,deciding:true});expect(v.result.current).toBe(a);v.rerender({enabled:true,deciding:false});expect(v.result.current).toBe(a);v.rerender({enabled:false,deciding:true});expect(v.result.current).toBeNull();expect(disposeSluggerActor).toHaveBeenCalledWith(a);
});
it('late old request can never replace a newer actor and all owned blobs are released',async()=>{
 const requests=[];loadSluggerMotion.mockImplementation(()=>new Promise(r=>requests.push(r)));const v=renderHook(({enabled})=>useSluggerMotion(enabled,true),{initialProps:{enabled:true}});v.rerender({enabled:false});v.rerender({enabled:true});await act(async()=>requests[1]({url:'blob:new'}));await act(async()=>requests[0]({url:'blob:old'}));expect(v.result.current.url).toBe('blob:new');expect(disposeSluggerActor).toHaveBeenCalledWith({url:'blob:old'});v.unmount();expect(disposeSluggerActor).toHaveBeenCalledWith({url:'blob:new'});
});
it('run owner survives encounter unmount and supplies first rendered decision without refetch',async()=>{
 const a={url:'blob:run'};loadSluggerMotion.mockResolvedValue(a);
 const {useSluggerMotionResource}=await import('../src/duel/battle-vnext/use-slugger-motion.js');
 const owner=renderHook(()=>useSluggerMotionResource(true));await act(async()=>{});
 const first=renderHook(()=>useSluggerMotion(true,true,owner.result.current));expect(first.result.current).toBe(a);first.unmount();expect(disposeSluggerActor).not.toHaveBeenCalledWith(a);
 const second=renderHook(()=>useSluggerMotion(true,true,owner.result.current));expect(second.result.current).toBe(a);expect(loadSluggerMotion).toHaveBeenCalledTimes(1);second.unmount();owner.unmount();expect(disposeSluggerActor.mock.calls.filter(x=>x[0]===a)).toHaveLength(1);
});
it('managed null suppresses duplicate fetch and late candidate waits through prep/flight',()=>{
 const a={url:'blob:run'};const v=renderHook(({candidate,deciding})=>useSluggerMotion(true,deciding,candidate),{initialProps:{candidate:null,deciding:true}});
 v.rerender({candidate:null,deciding:false});v.rerender({candidate:a,deciding:false});expect(v.result.current).toBeNull();expect(loadSluggerMotion).not.toHaveBeenCalled();v.rerender({candidate:a,deciding:true});expect(v.result.current).toBe(a);
});
it('optional owner deadline aborts and disposes even a noncompliant late result',async()=>{
 vi.useFakeTimers();let finish,signal;loadSluggerMotion.mockImplementation(options=>{signal=options.signal;return new Promise(r=>finish=r);});
 const {useSluggerMotionResource}=await import('../src/duel/battle-vnext/use-slugger-motion.js');const v=renderHook(()=>useSluggerMotionResource(true));act(()=>vi.advanceTimersByTime(5000));expect(signal.aborted).toBe(true);
 const a={url:'blob:late'};await act(async()=>finish(a));expect(v.result.current).toBeNull();expect(disposeSluggerActor).toHaveBeenCalledWith(a);v.unmount();vi.useRealTimers();
});
