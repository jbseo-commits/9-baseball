import {it,expect,vi,afterEach} from 'vitest';
import {contactMotionEligible,privateFieldReview,privateFieldPaths,validateContactMotion,loadPrivateFieldArt,decodePrivateTexture} from '../src/duel/battle-vnext/private-field-art.js';
import {ATBAT_COMPOSITION as C} from '../src/duel/battle-vnext/atbat-composition.js';
const raw=()=>({sourceWidth:192,sourceHeight:192,columns:4,rows:4,anchor:{x:65,y:175},frames:Array.from({length:14},(_,id)=>({id})),event:{x:173,y:86}});
afterEach(()=>vi.unstubAllEnvs());
it('requires review compile, review runtime and exact saved Contact identity without unlocking anything',()=>{
 for(const flag of ['','1'])for(const review of [false,true])for(const id of ['contact-v1','slugger-v1','power'])for(const version of [undefined,1,2]){vi.stubEnv('VITE_NORMAL_REVIEW',flag);expect(contactMotionEligible(review,{id,version})).toBe(flag==='1'&&review&&id==='contact-v1'&&version===1);expect(privateFieldReview(review)).toBe(flag==='1'&&review);}
 expect(privateFieldPaths('other')).toBeNull();expect(privateFieldPaths('contact','/r/')).toEqual({json:'/r/contact-motion-v1/contact.json',texture:'/r/contact-motion-v1/contact.webp'});expect(privateFieldPaths('emerald','/r/')).toEqual({texture:'/r/emerald-ready-v1/ready.png'});
});
it('strict private schema and independent registered anchor cannot move game contact/world geometry',()=>{
 const m=validateContactMotion({...raw(),worldFoot:{x:0,y:0},worldHeight:2,event:{x:0,y:0},url:'https://evil.test'});expect(m.worldFoot).toEqual(C.batter.worldFoot);expect(m.worldHeight).toBe(1100);expect(m.anchor).toEqual({x:65,y:175});expect(m.event).toEqual({x:173,y:86});expect(m.url).toBeUndefined();
 const at=meta=>({x:meta.worldFoot.x+(meta.event.x-meta.anchor.x)*meta.worldHeight/meta.sourceHeight,y:meta.worldFoot.y+(meta.event.y-meta.anchor.y)*meta.worldHeight/meta.sourceHeight});expect(at(m)).toEqual(C.contact);
 for(const b of [null,{}, {...raw(),anchor:{x:52.5,y:175}},{...raw(),sourceWidth:256},{...raw(),frames:[]},{...raw(),event:{x:Infinity,y:0}},{...raw(),frames:Array(14).fill({contact:{x:NaN,y:0}})}])expect(validateContactMotion(b)).toBeNull();
});
it('safe JSON/decode paths, errors, dimensions, abort and disposal; no external metadata URL',async()=>{
 const fetcher=vi.fn(async()=>({ok:true,text:async()=>JSON.stringify({...raw(),url:'https://evil.test'})})),decode=vi.fn(async()=>({width:768,height:768,url:'blob:a'}));
 expect(await loadPrivateFieldArt({kind:'contact',fetcher,decode})).toMatchObject({kind:'review-contact-atlas',classId:'contact-v1'});expect(decode.mock.calls[0][0]).toBe('./contact-motion-v1/contact.webp');expect(fetcher.mock.calls[0][1].redirect).toBe('error');
 for(const response of [{ok:false},{ok:true,redirected:true},{ok:true,text:async()=>'<html>'},{ok:true,text:async()=>'x'.repeat(33000)}])expect(await loadPrivateFieldArt({kind:'contact',fetcher:async()=>response,decode})).toBeNull();
 const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});expect(await loadPrivateFieldArt({kind:'emerald',decode})).toBeNull();expect(revoke).toHaveBeenCalledWith('blob:a');
 const ac=new AbortController();expect(await loadPrivateFieldArt({kind:'contact',fetcher,signal:ac.signal,decode:async()=>{ac.abort();return {width:768,height:768,url:'blob:late'};}})).toBeNull();expect(revoke).toHaveBeenCalledWith('blob:late');
 expect(await loadPrivateFieldArt({kind:'emerald',decode:async()=>({width:256,height:256,url:'blob:ready'})})).toMatchObject({kind:'review-emerald-ready'});expect(await loadPrivateFieldArt({kind:'contact',fetcher,decode:async()=>{throw Error('decode');}})).toBeNull();revoke.mockRestore();
});

it('abort settles an indefinitely pending image decode and immediately releases its blob',async()=>{
 const ac=new AbortController(),remove=vi.fn(),revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{}),create=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:pending');let finish;
 vi.stubGlobal('Image',class{removeAttribute=remove;decode(){return new Promise(r=>finish=r);}});vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,blob:async()=>new Blob(['x'],{type:'image/webp'})})));
 const pending=decodePrivateTexture('/fixed.webp',ac.signal);const rejected=expect(pending).rejects.toThrow('texture aborted');await Promise.resolve();await Promise.resolve();await Promise.resolve();ac.abort();await rejected;expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:pending');expect(remove).toHaveBeenCalledWith('src');finish?.();await Promise.resolve();expect(revoke).toHaveBeenCalledTimes(1);create.mockRestore();revoke.mockRestore();vi.unstubAllGlobals();
});
