import {getAudioContext,getMasterNode} from '../audio.js';
import {animationRate} from '../animation-speed.js';
import {PLACEMENT} from './placement-motion.js';

/* This bus owns every source it schedules. Mute/reselect/execute can stop even
   future oscillators; the ordinary fire-and-forget judgement cue stays separate. */
export function playPlacementSound({elapsed=0,reduced=false,pan=0,rate=1,timing=PLACEMENT}={}){
  const speed=animationRate(rate);
  let sources=[],bus,panner,stopped=false;
  const cancel=()=>{if(stopped)return;stopped=true;for(const node of sources){try{node.stop();node.disconnect();}catch{}}try{bus?.disconnect();panner?.disconnect();}catch{}};
  try{
    if((elapsed-timing.lockAt)/speed>100)return cancel;
    const ctx=getAudioContext();if(!ctx)return cancel;
    bus=ctx.createGain();bus.gain.value=.64;bus.connect(getMasterNode());
    const output=ctx.createStereoPanner?.();if(output){output.pan.value=Math.max(-.5,Math.min(.5,pan));output.connect(bus);panner=output;}
    const destination=output||bus,base=ctx.currentTime+.006;
    const tone=(start,duration,freq,end,gain,type='sine')=>{
      if((elapsed-start)/speed>24)return;
      const t=base+Math.max(0,start-elapsed)/speed/1000,osc=ctx.createOscillator(),env=ctx.createGain();
      osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration);
      env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(gain,t+.004);env.gain.exponentialRampToValueAtTime(.0001,t+duration);
      osc.connect(env);env.connect(destination);sources.push(osc);osc.start(t);osc.stop(t+duration+.015);osc.onended=()=>{osc.disconnect();env.disconnect();};
    };
    const air=(start,duration,gain,frequency)=>{
      if((elapsed-start)/speed>24)return;
      const t=base+Math.max(0,start-elapsed)/speed/1000,src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/data.length);
      src.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;
      env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(gain,t+duration*.3);env.gain.exponentialRampToValueAtTime(.0001,t+duration);
      src.connect(filter);filter.connect(env);env.connect(destination);sources.push(src);src.start(t);src.stop(t+duration+.01);src.onended=()=>{src.disconnect();filter.disconnect();env.disconnect();};
    };
    if(reduced){tone(elapsed,.055,240,120,.045,'triangle');return cancel;}
    // Lift: air and a soft material peel. Lock: low body + one hard seating edge
    // and two quiet contacts. Never multiply this mix by the covered-cell count.
    air(0,.17,.042,1500);tone(0,.12,260,560,.018,'triangle');
    if(timing.formAt)tone(timing.formAt-60,.065,390,620,.026,'triangle');
    air(timing.lockAt,.045,.085,2100);tone(timing.lockAt,.17,118,48,.13);
    tone(timing.lockAt+8,.055,1150,540,.036,'triangle');
    tone(timing.lockAt+28,.045,760,460,.022,'triangle');
    tone(timing.lockAt+62,.09,380,190,.025,'triangle');
    return cancel;
  }catch{cancel();return ()=>{};} // Audio failure must not affect placement.
}
