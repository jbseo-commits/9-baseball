import {it,expect,vi,beforeEach} from 'vitest';
import {playPlacementSound} from '../src/duel/battle-vnext/placement-audio.js';
import {getAudioContext,getMasterNode} from '../src/duel/audio.js';
import {PLACEMENT} from '../src/duel/battle-vnext/placement-motion.js';
vi.mock('../src/duel/audio.js',()=>({getAudioContext:vi.fn(),getMasterNode:vi.fn()}));
const param=()=>({value:0,setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn()});
let sources,nodes;
function node(){const n={connect:vi.fn(),disconnect:vi.fn(),gain:param(),frequency:param(),pan:param(),Q:{value:0}};nodes.push(n);return n;}
function source(){const n={...node(),start:vi.fn(),stop:vi.fn()};sources.push(n);return n;}
beforeEach(()=>{sources=[];nodes=[];getAudioContext.mockReturnValue({currentTime:10,sampleRate:1000,createGain:node,createStereoPanner:node,createBiquadFilter:node,createOscillator:source,createBufferSource:source,createBuffer:(_,size)=>({getChannelData:()=>new Float32Array(size)})});getMasterNode.mockReturnValue({});});
it('schedules the material lift and one lock mix from the same visual lock beat',()=>{
 playPlacementSound();expect(sources.length).toBe(7);
 const starts=sources.map(n=>n.start.mock.calls[0][0]);expect(starts.filter(t=>t>=10+.006+PLACEMENT.lockAt/1000)).toHaveLength(5);
 expect(Math.min(...starts)).toBeCloseTo(10.006);
});
it('cancels every scheduled future source and disconnects the bus, including an immediate second cancellation',()=>{
 const stop=playPlacementSound();stop();stop();
 for(const n of sources){expect(n.stop).toHaveBeenCalledTimes(2);expect(n.disconnect).toHaveBeenCalledTimes(1);}
 expect(nodes[0].disconnect).toHaveBeenCalledTimes(1);
});
it('mute after the lock does not replay old sounds, and reduced motion has one short sound without a flight',()=>{
 playPlacementSound({elapsed:PLACEMENT.lockAt+101});expect(sources).toHaveLength(0);
 playPlacementSound({reduced:true});expect(sources).toHaveLength(1);expect(sources[0].frequency.setValueAtTime.mock.calls[0][0]).toBe(240);
});
it('audio/context failure is contained and never changes the placement flow',()=>{
 getAudioContext.mockReturnValue(null);expect(()=>playPlacementSound()()).not.toThrow();
 getAudioContext.mockImplementationOnce(()=>{throw Error('unavailable')});expect(()=>playPlacementSound()()).not.toThrow();
});

it('slow motion scales cue onsets without changing their tone or envelope lengths',()=>{
 playPlacementSound({rate:.25});const low=sources.find(n=>n.frequency.setValueAtTime.mock.calls.some(c=>c[0]===118));
 const t=low.start.mock.calls[0][0];expect(t).toBeCloseTo(10.006+PLACEMENT.lockAt/.25/1000);expect(low.stop.mock.calls[0][0]-t).toBeCloseTo(.185);
});

it('wide pieces get one formation cue and one low seating body at their shared later lock',async()=>{
 const{WIDE_PLACEMENT}=await import('../src/duel/battle-vnext/placement-motion.js');
 const cancel=playPlacementSound({timing:WIDE_PLACEMENT,rate:.5});
 const bodies=sources.filter(n=>n.frequency.setValueAtTime.mock.calls[0]?.[0]===118);expect(bodies).toHaveLength(1);expect(bodies[0].start.mock.calls[0][0]).toBeCloseTo(10.006+.680/.5);
 expect(sources.some(n=>n.frequency.setValueAtTime.mock.calls[0]?.[0]===390)).toBe(true);cancel();expect(sources.every(n=>n.stop.mock.calls.length===2)).toBe(true);
});

it('normalizes the sum of squared voice gain targets across simultaneous receipts and returns budget on cancel',()=>{
 const stop1=playPlacementSound(),bus1=nodes[0];const next=nodes.length,stop2=playPlacementSound(),bus2=nodes[next];
 expect(bus1.gain.value).toBeCloseTo(.64/Math.sqrt(2));expect(bus2.gain.value).toBeCloseTo(.64/Math.sqrt(2));
 const third=nodes.length,stop3=playPlacementSound(),bus3=nodes[third];
 expect([bus1,bus2,bus3].reduce((s,b)=>s+b.gain.value**2,0)).toBeCloseTo(.64**2);
 stop2();expect(bus1.gain.value).toBeCloseTo(.64/Math.sqrt(2));expect(bus3.gain.value).toBeCloseTo(.64/Math.sqrt(2));stop1();expect(bus3.gain.value).toBeCloseTo(.64);stop3();
});
it('moves the stereo image from the actual source toward the registered target on the shared lock beat',()=>{
 playPlacementSound({pan:.4,targetPan:-.2,rate:.5});const pan=nodes.find(n=>n.pan.setValueAtTime.mock.calls.length);
 expect(pan).toBeDefined();expect(pan.pan.setValueAtTime).toHaveBeenCalledWith(.4,10.006);expect(pan.pan.linearRampToValueAtTime).toHaveBeenCalledWith(-.2,10.006+PLACEMENT.lockAt/.5/1000);
});

it('releases the overlap budget when sources naturally finish, without waiting for a UI timer',()=>{
 playPlacementSound();const old=sources.slice(),next=nodes.length;const stop=playPlacementSound(),bus=nodes[next];
 for(const s of old)s.onended();expect(bus.gain.value).toBeCloseTo(.64);stop();
});

it('automates native AudioParams smoothly and renormalizes after natural endings',()=>{
 const ctx=getAudioContext();ctx.createGain=()=>{const n=node();n.gain.setTargetAtTime=vi.fn();n.gain.cancelScheduledValues=vi.fn();return n;};
 playPlacementSound();const bus1=nodes[0],old=sources.slice(),next=nodes.length;const stop=playPlacementSound(),bus2=nodes[next];
 expect(bus1.gain.cancelScheduledValues).toHaveBeenLastCalledWith(10);expect(bus1.gain.setTargetAtTime).toHaveBeenLastCalledWith(.64/Math.sqrt(2),10,.012);
 expect(bus2.gain.setTargetAtTime).toHaveBeenLastCalledWith(.64/Math.sqrt(2),10,.012);for(const s of old)s.onended();
 expect(bus2.gain.setTargetAtTime).toHaveBeenLastCalledWith(.64,10,.012);stop();
});
