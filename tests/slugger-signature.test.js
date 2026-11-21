import {it,expect,vi,afterEach} from 'vitest';
import {sluggerCardPath,loadSluggerCardArt,disposeCardArt} from '../src/duel/battle-vnext/slugger-card-art.js';
import {sluggerFeedback} from '../src/duel/battle-vnext/slugger-feedback.js';
afterEach(()=>vi.restoreAllMocks());
it('fixed three landscape paths only, disabled never fetches',async()=>{
 expect(sluggerCardPath('slug','/preview/')).toBe('/preview/slugger-cards-v1/slug.webp');for(const bad of ['../slug','constructor','power','https://a'])expect(sluggerCardPath(bad)).toBeNull();
 const fetcher=vi.fn();expect(await loadSluggerCardArt('slug',{fetcher})).toBeNull();expect(fetcher).not.toHaveBeenCalled();
});
it('fetch/decode dimensions/redirect/format fail independently with no URL authority',async()=>{
 const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:approved-test');
 const fetcher=vi.fn(async()=>({ok:true,redirected:false,blob:async()=>new Blob(['test'],{type:'image/webp'})}));
 const options={enabled:true,fetcher,decoder:async()=>({width:384,height:256})};const art=await loadSluggerCardArt('gapHunter',options);expect(art).toMatchObject({size:'contain',privateSlugger:true});expect(fetcher.mock.calls[0][1].redirect).toBe('error');disposeCardArt(art);expect(revoke).toHaveBeenCalled();
 for(const size of [{width:256,height:256},{width:384,height:255}])expect(await loadSluggerCardArt('slug',{...options,decoder:async()=>size})).toBeNull();
 for(const response of [{ok:false},{ok:true,redirected:true},{ok:true,blob:async()=>new Blob(['bad'],{type:'text/html'})}])expect(await loadSluggerCardArt('slug',{...options,fetcher:async()=>response})).toBeNull();
 expect(await loadSluggerCardArt('loadPower',{...options,decoder:async()=>{throw Error('bad bytes')}})).toBeNull();
});
it('slow and aborted decode fall back and release blob, never adopt late image',async()=>{
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:slow');const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});let resolve;
 const promise=loadSluggerCardArt('slug',{enabled:true,timeout:10,fetcher:async()=>({ok:true,blob:async()=>new Blob(['x'],{type:'image/webp'})}),decoder:()=>new Promise(r=>{resolve=r})});expect(await promise).toBeNull();expect(revoke).toHaveBeenCalledWith('blob:slow');resolve({width:384,height:256});
 const c=new AbortController();c.abort();const fetcher=vi.fn();expect(await loadSluggerCardArt('slug',{enabled:true,signal:c.signal,fetcher})).toBeNull();expect(fetcher).not.toHaveBeenCalled();
});
const hit={enabled:true,execution:{action:'swing',cards:[{kind:'slug',role:'main'}]},playback:{action:'swing',timeline:{duration:2000}},result:{kind:'hit'},phase:'result',elapsed:1250,effect:{committed:true,contactPoint:{x:800,y:450},ball:{x:802,y:449},age:10}};
it('only selected main true hit at committed contact; no false power on assist/foul/take/miss/preview',()=>{
 expect(sluggerFeedback(hit)).toMatchObject({kind:'slug',point:{x:800,y:450}});
 for(const kind of ['whiff','called','ball','foul','sacrifice','out'])expect(sluggerFeedback({...hit,result:{kind}})).toBeNull();
 for(const patch of [{enabled:false},{reduced:true},{phase:'flight'},{effect:{...hit.effect,age:-1}},{effect:{...hit.effect,age:231}},{effect:{...hit.effect,committed:false}},{result:{kind:'hit',assistOnly:true}},{playback:{action:'take',timeline:{duration:2000}}},{execution:{action:'swing',cards:[{kind:'slug',role:'support'}]}}])expect(sluggerFeedback({...hit,...patch})).toBeNull();
 expect(sluggerFeedback({...hit,execution:{action:'swing',cards:[{kind:'gapHunter',role:'main'}]}}).kind).toBe('gapHunter');
});
it('loadPower only actual prepare playback, finite and reduced-motion safe',()=>{
 const p={...hit,execution:{action:'prepare',preparation:{name:'힘 모으기'},cards:[{role:'main',kind:'loadPower'}]},playback:{action:'prepare',timeline:{duration:800}},elapsed:100};expect(sluggerFeedback(p).kind).toBe('loadPower');
 for(const patch of [{elapsed:601},{playback:null},{reduced:true},{execution:{...p.execution,preparation:null}},{playback:{action:'swing',timeline:{duration:2000}}}])expect(sluggerFeedback({...p,...patch})).toBeNull();
});

it('freeze has no invented direction; outgoing accent starts only on real displacement',()=>{
 expect(sluggerFeedback({...hit,effect:{...hit.effect,ball:{x:800,y:450}}})).toBeNull();
 expect(sluggerFeedback({...hit,playback:{...hit.playback,timeline:{duration:2000,freeze:120}},effect:{...hit.effect,age:100}})).toBeNull();
 expect(sluggerFeedback({...hit,playback:{...hit.playback,timeline:{duration:2000,freeze:120}},effect:{...hit.effect,age:140}}).progress).toBeCloseTo(20/230);
});
