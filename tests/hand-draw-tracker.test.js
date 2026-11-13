import {it,expect} from 'vitest';
import {createHandDrawTracker} from '../src/duel/battle-vnext/hand-draw.js';
const receipt=(...ids)=>Object.freeze({ids:Object.freeze(ids)});
const update=(t,fields={})=>t.update({context:'node-a',phase:'deciding',ids:['a','b'],receipt:null,enabled:true,...fields});
it('opens on entry without fabricating new draws from a restored hand; does not reopen for aim/selection/rerender',()=>{
 const t=createHandDrawTracker(),first=update(t);expect(first.open).toBe(true);expect(first.batch.kind).toBe('hand');
 expect(update(t)).toBeNull();expect(update(t,{ids:['a','b']})).toBeNull();
});
it('waits for deciding and preserves result draws across the next pitch receipt, in actual order',()=>{
 const t=createHandDrawTracker();update(t);update(t,{phase:'flight',receipt:receipt('SECRET')});
 const r=receipt('c');expect(update(t,{phase:'result',receipt:r,ids:['a','b','c']})).toBeNull();
 const event=update(t,{receipt:receipt('d'),ids:['a','b','c','d']});
 expect(event.batch).toMatchObject({kind:'draw',ids:['c','d']});expect(update(t,{receipt:r})).toBeNull();
});
it('reopens on a zero-draw next decision and handles a same-phase prep draw/recycled same ID once',()=>{
 const t=createHandDrawTracker();update(t);update(t,{phase:'result'});
 expect(update(t)).toEqual({open:true,batch:null});
 const r=receipt('a');expect(update(t,{receipt:r}).batch).toMatchObject({kind:'draw',ids:['a']});expect(update(t,{receipt:r})).toBeNull();
 expect(update(t,{receipt:receipt('a')}).batch.ids).toEqual(['a']);
});
it('filters removed instances, resets across opponent nodes, and does not observe receipt fields before reveal',()=>{
 const t=createHandDrawTracker();update(t);
 const blocked={get ids(){throw Error('preimpact read');}};
 expect(()=>update(t,{phase:'flight',receipt:blocked})).not.toThrow();
 const r=update(t,{receipt:receipt('missing','b'),ids:['a','b']});expect(r.batch.ids).toEqual(['b']);
 expect(update(t,{context:'node-b'}).open).toBe(true);
 const disabled=createHandDrawTracker();expect(update(disabled,{enabled:false,receipt:blocked})).toBeNull();
});
