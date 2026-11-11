// @vitest-environment happy-dom
import React from 'react';
import {render,act,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
vi.mock('../src/duel/audio.js',()=>({cue:vi.fn()}));
import {cue} from '../src/duel/audio.js';
import {useCourseAudio} from '../src/duel/battle-vnext/course-audio.js';
function Host({model,token=1,rate=1,sound=true}){useCourseAudio(model,token==null?null:{token,rate},sound);return null;}
const scan=(index,age=0)=>({phase:'scan',course:{scanIndex:index,scanAge:age,scanCount:12}});
const lock=(age=0)=>({phase:'locked',course:{targetZone:4,lockAge:age}});
beforeEach(()=>{cue.mockClear();Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});});
afterEach(cleanup);
it('emits only the newest render step once, skips stale samples and aborts old nodes',()=>{
 const r=render(<Host model={scan(0)}/>);expect(cue).toHaveBeenCalledTimes(1);
 const first=cue.mock.calls[0][1].signal;
 r.rerender(<Host model={scan(0,16)}/>);expect(cue).toHaveBeenCalledTimes(1);
 r.rerender(<Host model={scan(8,20)} rate={2}/>);expect(cue).toHaveBeenCalledTimes(2);expect(first.aborted).toBe(true);
 r.rerender(<Host model={scan(9,150)} rate={2}/>);expect(cue).toHaveBeenCalledTimes(2);
 r.rerender(<Host model={lock()} rate={2}/>);expect(cue).toHaveBeenCalledTimes(3);expect(cue.mock.calls[2][0]).toBe('courseLock');
 r.rerender(<Host model={{phase:'flight',course:{targetZone:4,lockAge:300}}}/>);expect(cue).toHaveBeenCalledTimes(3);
 const last=cue.mock.calls[2][1].signal;r.unmount();expect(last.aborted).toBe(true);
});
it('consumes muted and hidden samples without catchup, then plays a future step/lock normally',()=>{
 const r=render(<Host model={scan(0)} sound={false}/>);r.rerender(<Host model={scan(0)} sound/>);expect(cue).not.toHaveBeenCalled();
 Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});
 r.rerender(<Host model={scan(4)} sound/>);expect(cue).not.toHaveBeenCalled();
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 r.rerender(<Host model={scan(4,20)} sound/>);expect(cue).not.toHaveBeenCalled();
 r.rerender(<Host model={scan(5)} sound/>);expect(cue).toHaveBeenCalledTimes(1);
 r.rerender(<Host model={lock()} sound/>);expect(cue).toHaveBeenCalledTimes(2);
 r.rerender(<Host model={lock(10)} sound={false}/>);expect(cue.mock.calls[1][1].signal.aborted).toBe(true);
 r.rerender(<Host model={lock(20)} sound/>);expect(cue).toHaveBeenCalledTimes(2);
});
it('has no sound for query-off, reduced/unsupported visual model, or missing accepted token',()=>{
 const r=render(<Host model={null}/>);r.rerender(<Host model={scan(0)} token={null}/>);expect(cue).not.toHaveBeenCalled();
 r.rerender(<Host model={scan(0)} token={2}/>);expect(cue).toHaveBeenCalledTimes(1);
 const signal=cue.mock.calls[0][1].signal;
 r.rerender(<Host model={null} token={null}/>);expect(signal.aborted).toBe(true);
});
it('cancels audible tail immediately when backgrounded and never schedules a replay on visibility alone',()=>{
 const r=render(<Host model={lock()}/>),signal=cue.mock.calls[0][1].signal;
 Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});
 act(()=>document.dispatchEvent(new Event('visibilitychange')));expect(signal.aborted).toBe(true);
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 act(()=>document.dispatchEvent(new Event('visibilitychange')));expect(cue).toHaveBeenCalledTimes(1);r.unmount();
});
