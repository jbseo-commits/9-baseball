import {beforeEach,afterEach,it,expect,vi} from 'vitest';
let ctx,sources;
const param=()=>({value:0,setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()});
const node=()=>({connect:vi.fn(),disconnect:vi.fn(),gain:param(),pan:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),delayTime:param()});
const source=()=>{const n={...node(),start:vi.fn(),stop:vi.fn()};sources.push(n);return n;};
beforeEach(()=>{vi.useFakeTimers();vi.resetModules();sources=[];ctx={currentTime:10,sampleRate:1000,resume:()=>Promise.resolve(),destination:{},createDynamicsCompressor:node,createGain:node,createStereoPanner:node,createBiquadFilter:node,createDelay:node,createOscillator:source,createBufferSource:source,createBuffer:(_,n)=>({getChannelData:()=>new Float32Array(n)})};vi.stubGlobal('AudioContext',vi.fn(function(){return ctx}));});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('slows only cue note onsets, preserves pitch/envelopes, and cancels scheduled future sources on abort',async()=>{
 const {cue}=await import('../src/duel/audio.js'),c=new AbortController();cue('grandSlam',{rate:.25,signal:c.signal});
 const last=sources.find(n=>n.frequency.setValueAtTime.mock.calls[0]?.[0]===1152);
 expect(last.start).toHaveBeenCalledWith(10.008+.62/.25);expect(last.stop.mock.calls[0][0]-last.start.mock.calls[0][0]).toBeCloseTo(.34+.025);
 c.abort();for(const n of sources){expect(n.stop).toHaveBeenLastCalledWith();expect(n.disconnect).toHaveBeenCalled();}
});
it('keeps ordinary cue deadlines and ignores an already cancelled preview scope',async()=>{
 const {cue}=await import('../src/duel/audio.js'),c=new AbortController();c.abort();cue('homer',{rate:.25,signal:c.signal});expect(sources).toHaveLength(0);
 cue('pitch');const last=sources.find(n=>n.frequency.setValueAtTime.mock.calls[0]?.[0]===110);expect(last.start).toHaveBeenCalledWith(10.008+.14);
});
it('releases the abort listener and source nodes after a scoped cue finishes',async()=>{
 const {cue}=await import('../src/duel/audio.js'),c=new AbortController(),remove=vi.spyOn(c.signal,'removeEventListener');cue('homer',{rate:.25,signal:c.signal});
 vi.advanceTimersByTime(5000);expect(remove).toHaveBeenCalledWith('abort',expect.any(Function));expect(sources.every(n=>n.disconnect.mock.calls.length>0)).toBe(true);
});
