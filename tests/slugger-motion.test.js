import {it,expect,vi,afterEach} from 'vitest';
import {reviewSluggerEligible,sluggerMotionPaths,validateSluggerMotion,loadSluggerMotion} from '../src/duel/battle-vnext/slugger-motion.js';
import {ATBAT_COMPOSITION as C} from '../src/duel/battle-vnext/atbat-composition.js';
import {actorBox} from '../src/duel/battle-vnext/scene-geometry.js';
import {motionAt} from '../src/duel/battle-vnext/motion-timeline.js';
const raw=()=>({sourceWidth:192,sourceHeight:192,columns:4,rows:4,anchor:{x:52.5,y:175},frames:Array.from({length:14},(_,id)=>({id})),event:{x:160.5,y:86}});
afterEach(()=>vi.unstubAllEnvs());
it('compile+host+exact old/new Slugger identity gates all requests',async()=>{
 for(const flag of ['', '1'])for(const host of [false,true]){vi.stubEnv('VITE_NORMAL_REVIEW',flag);for(const id of ['slugger-v1','contact-v1','power'])for(const version of [undefined,1,2])expect(reviewSluggerEligible(host,{id,version})).toBe(flag==='1'&&host&&version===1&&id==='slugger-v1');}
 const f=vi.fn();expect(await loadSluggerMotion({fetcher:f})).toBeNull();expect(f).not.toHaveBeenCalled();expect(sluggerMotionPaths(true,'/review/')).toEqual({json:'/review/slugger-motion-v2/slugger.json',texture:'/review/slugger-motion-v2/slugger.webp'});
});
it('fixed geometry ignores all external world/URL/contact authority; exact authored box',()=>{
 const m=validateSluggerMotion({...raw(),file:'https://evil.test/a',worldFoot:{x:99999,y:-99999},worldHeight:9999,event:{x:0,y:0}});
 expect(m.worldFoot).toEqual(C.batter.worldFoot);expect(m.worldHeight).toBe(1100);expect(m.event).toEqual({x:160.5,y:86});expect(actorBox(m)).toMatchObject({x:actorBox(C.batter).x,y:actorBox(C.batter).y,width:1100,height:1100});expect(m.file).not.toBe('https://evil.test/a');
 for(const bad of [null,{}, {...raw(),sourceWidth:193},{...raw(),frames:[]},{...raw(),anchor:{x:53,y:175}},{...raw(),event:{x:NaN,y:2}}])expect(validateSluggerMotion(bad)).toBeNull();
});
it('only adopts valid decoded same bytes and quietly rejects response/schema/texture/abort failures',async()=>{
 const decode=vi.fn(async()=>({width:768,height:768,url:'blob:fixture'}));const fetcher=vi.fn(async()=>({ok:true,text:async()=>JSON.stringify(raw())}));
 const a=await loadSluggerMotion({enabled:true,fetcher,decode});expect(a).toMatchObject({kind:'review-slugger-atlas',url:'blob:fixture'});expect(fetcher.mock.calls[0][1].redirect).toBe('error');expect(decode.mock.calls[0][0]).toBe('./slugger-motion-v2/slugger.webp');
 for(const response of [{ok:false},{ok:true,redirected:true},{ok:true,text:async()=>'<html>'},{ok:true,text:async()=>'x'.repeat(33000)},{ok:true,text:async()=>'{}'}])expect(await loadSluggerMotion({enabled:true,fetcher:async()=>response,decode})).toBeNull();
 const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});expect(await loadSluggerMotion({enabled:true,fetcher,decode:async()=>({width:1,height:1,url:'blob:bad'})})).toBeNull();expect(revoke).toHaveBeenCalledWith('blob:bad');
 const ac=new AbortController();expect(await loadSluggerMotion({enabled:true,fetcher,signal:ac.signal,decode:async()=>{ac.abort();return {width:768,height:768,url:'blob:late'};}})).toBeNull();expect(revoke).toHaveBeenCalledWith('blob:late');revoke.mockRestore();
});
it('14 slots retain the existing absolute clock at24/30/60fps and contact/reduced contracts',()=>{
 const m=validateSluggerMotion(raw()),timeline={impactAt:1250,releaseAt:1370,freeze:120,duration:2300,settleAt:2100,delivery:{pitchReleaseAt:950}};
 for(const fps of [24,30,60])for(let n=0;n<fps*2.5;n++){
  const elapsed=n*1000/fps,p=motionAt({elapsed,timeline,action:'swing',landed:elapsed>=1250});expect(m.frames[p.batter].name).toBe(C.batter.frames[p.batter].name);expect(p.batter).toBeGreaterThanOrEqual(0);expect(p.batter).toBeLessThan(14);
 }
 expect(motionAt({elapsed:1250,timeline,action:'swing',landed:true}).batter).toBe(8);expect(motionAt({elapsed:1250,timeline,action:'swing',reduced:true}).batter).toBe(0);
});
