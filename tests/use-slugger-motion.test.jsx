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
