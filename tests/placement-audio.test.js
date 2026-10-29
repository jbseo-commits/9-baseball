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
