// @vitest-environment happy-dom
import {it,expect,vi,afterEach} from 'vitest';import {renderHook,act,cleanup} from '@testing-library/react';
vi.mock('../src/duel/battle-vnext/slugger-card-art.js',()=>({SLUGGER_CARD_KINDS:['slug','gapHunter','loadPower'],loadSluggerCardArt:vi.fn(),disposeCardArt:vi.fn()}));
import {loadSluggerCardArt,disposeCardArt} from '../src/duel/battle-vnext/slugger-card-art.js';import useSluggerCardArt from '../src/duel/battle-vnext/use-slugger-card-art.js';
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('partial failure preserves loaded siblings and unmount releases owned blobs',async()=>{
 loadSluggerCardArt.mockImplementation(async k=>k==='gapHunter'?null:{url:'blob:'+k});const v=renderHook(()=>useSluggerCardArt(true));await act(async()=>{});expect(Object.keys(v.result.current)).toEqual(['slug','loadPower']);v.unmount();expect(disposeCardArt.mock.calls.map(c=>c[0])).toContainEqual({url:'blob:slug'});expect(disposeCardArt.mock.calls.map(c=>c[0])).toContainEqual({url:'blob:loadPower'});
});
it('stale aborted class cannot adopt after a new eligible class or leak its blobs',async()=>{
 const resolve=[];loadSluggerCardArt.mockImplementation(()=>new Promise(r=>resolve.push(r)));const v=renderHook(({enabled})=>useSluggerCardArt(enabled),{initialProps:{enabled:true}});v.rerender({enabled:false});expect(v.result.current).toEqual({});v.rerender({enabled:true});await act(async()=>{for(let i=3;i<6;i++)resolve[i]({url:'blob:new'+i})});await act(async()=>{for(let i=0;i<3;i++)resolve[i]({url:'blob:old'+i})});expect(v.result.current.slug.url).toBe('blob:new3');expect(disposeCardArt.mock.calls.map(c=>c[0])).toContainEqual({url:'blob:old0'});
});
