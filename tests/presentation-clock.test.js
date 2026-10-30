import {describe,it,expect,vi} from 'vitest';
import {startPresentationClock} from '../src/duel/presentation-clock.js';
import {presentationTimeline,presentationFor} from '../src/duel/presentation.js';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {redRushTimeline,withKnockoutHold} from '../src/duel/pitcher-sd.js';
function host(timeline,rate=1){
  let time=0,listener;const stages=[],impact=vi.fn(),settle=vi.fn(),complete=vi.fn(),queue=new Map();let id=0;
  const doc={visibilityState:'visible',addEventListener:(_,fn)=>listener=fn,removeEventListener:()=>{listener=null;}};
  const clock=startPresentationClock(timeline,{rate,now:()=>time,document:doc,setTimer:(fn,ms)=>{queue.set(++id,{fn,at:time+ms});return id;},clearTimer:id=>queue.delete(id),onStage:s=>stages.push(s),onImpact:impact,onSettle:settle,onComplete:complete});
  return {clock,stages,impact,settle,complete,queue,doc,advance(to){time=to;for(const [key,item]of [...queue])if(item.at<=time){queue.delete(key);item.fn();}},resume(to){time=to;listener?.();}};
}
describe('one cancellable presentation clock',()=>{
  const base={impactAt:100,freeze:60,slowmo:70,releaseAt:230,settleAt:500,duration:700};
  it('keeps contact, freeze, release and settle on the same timeline',()=>{
    const h=host(base);h.advance(100);h.advance(160);h.advance(230);h.advance(500);h.advance(700);
    expect(h.stages).toEqual(['windup','impact','slowmo','release','settle',null]);
    expect(h.impact).toHaveBeenCalledTimes(1);expect(h.impact.mock.calls[0][0].audible).toBe(true);expect(h.complete).toHaveBeenCalledTimes(1);expect(h.queue.size).toBe(0);
  });
  it('reconciles a hidden tab without replaying stale cues or stages',()=>{
    const h=host(base);h.doc.visibilityState='hidden';h.resume(680);
    expect(h.stages).toEqual(['windup','settle']);expect(h.impact.mock.calls[0][0].audible).toBe(false);expect(h.settle.mock.calls[0][0].audible).toBe(false);
    h.doc.visibilityState='visible';h.resume(900);h.resume(1000);expect(h.complete).toHaveBeenCalledTimes(1);expect(h.impact).toHaveBeenCalledTimes(1);
  });
  it('cancels every outstanding event on replacement/unmount',()=>{
    const h=host(base);h.clock.cancel();h.advance(900);h.resume(1000);expect(h.impact).not.toHaveBeenCalled();expect(h.complete).not.toHaveBeenCalled();expect(h.queue.size).toBe(0);
  });
  it('handles reduced motion and simultaneous events without double impact',()=>{
    const shot=presentationFor(buildFixture('result-hit').s),t=presentationTimeline(shot,true),h=host(t);
    h.advance(8);h.advance(12);h.advance(35);h.advance(60);expect(h.complete).toHaveBeenCalledTimes(1);expect(h.impact).toHaveBeenCalledTimes(1);expect(h.stages).not.toContain('slowmo');
  });
  it('accepts the existing pitcher/video adapter hold without shortening terminal KO',()=>{
    const t=withKnockoutHold(redRushTimeline(base),true),h=host(t);h.advance(t.impactAt);h.advance(t.duration-1);expect(h.complete).not.toHaveBeenCalled();h.advance(t.duration);expect(h.complete).toHaveBeenCalledTimes(1);
  });
  it('can complete a zero-duration timeline synchronously once',()=>{
    const h=host({impactAt:0,releaseAt:0,settleAt:0,duration:0});expect(h.complete).toHaveBeenCalledTimes(1);expect(h.impact).toHaveBeenCalledTimes(1);h.clock.cancel();expect(h.queue.size).toBe(0);
  });
});

describe('presentation rate is virtual time with wall-clock stale tolerance',()=>{
 const t={impactAt:100,freeze:60,slowmo:70,releaseAt:230,settleAt:500,duration:700};
 for(const rate of [.25,.5,2])it(`${rate}x schedules one impact and completion at the scaled physical times`,()=>{
  const h=host(t,rate);h.advance(100/rate-1);expect(h.impact).not.toHaveBeenCalled();h.advance(100/rate);expect(h.impact).toHaveBeenCalledTimes(1);expect(h.impact.mock.calls[0][0].elapsed).toBe(100);
  h.advance(700/rate-1);expect(h.complete).not.toHaveBeenCalled();h.advance(700/rate);expect(h.complete).toHaveBeenCalledTimes(1);
 });
 it('does not replay a 130ms stale impact just because slow virtual time is only 32.5ms late',()=>{
  const h=host(t,.25);h.advance(530);expect(h.impact.mock.calls[0][0].late).toBe(130);expect(h.impact.mock.calls[0][0].audible).toBe(false);
 });
 it('invalid rates retain the one-times clock and cancellation never emits scheduled audio',()=>{
  const h=host(t,0);expect(h.clock.rate).toBe(1);h.advance(99);expect(h.impact).not.toHaveBeenCalled();h.clock.cancel();h.advance(1000);expect(h.impact).not.toHaveBeenCalled();
 });
});
