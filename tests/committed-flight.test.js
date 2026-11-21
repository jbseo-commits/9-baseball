import {tideFlightAt} from '../src/duel/battle-vnext/tide-flight.js';
import {describe,it,expect,vi} from 'vitest';
import {committedContact,releasedContact} from '../src/duel/battle-vnext/committed-flight.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import registration from '../src/duel/battle-vnext/roster-registration.json';
import {ATBAT_COMPOSITION as composition} from '../src/duel/battle-vnext/atbat-composition.js';
const C=composition.contact;
function playback(zone,action='take',actor=rosterPitcherActor('tide-vesper','x')){
 const timeline=rosterTimeline({duration:2000},actor,false,{delivery:true});
 return {timeline,pitchReleaseAt:timeline.pitchReleaseAt,action,course:{getDestination:()=>zone,getContact:()=>false,aimZone:4}};
}
describe('authorized resolved incoming course',()=>{
 it('does not read target before release, while deciding, prepare or reduced',()=>{
  const getDestination=vi.fn(()=>2),p=playback(2);p.course.getDestination=getDestination;
  for(const [elapsed,phase,pb] of [[0,'deciding',p],[p.pitchReleaseAt-1,'flight',p],[p.pitchReleaseAt,'deciding',p],[2000,'result',{...p,action:'prepare'}],[2000,'result',{...p,timeline:{duration:60}}]]){
   expect(releasedContact(pb,elapsed,phase,C)).toBeNull();
  }
  expect(getDestination).not.toHaveBeenCalled();
  expect(releasedContact(p,p.pitchReleaseAt,'flight',C)).toEqual(committedContact(2,C));expect(getDestination).toHaveBeenCalledTimes(1);
 });
 it('does not read contact kind before impact',()=>{const p=playback(2),spy=vi.fn(()=>false);p.course.getContact=spy;sceneEffectAt({elapsed:p.timeline.impactAt-1,playback:p,phase:'flight',composition});expect(spy).not.toHaveBeenCalled();sceneEffectAt({elapsed:p.timeline.impactAt,playback:p,phase:'flight',composition});expect(spy).toHaveBeenCalledTimes(1);});
 it('has no aim/result fallback and rejects bad/missing getters',()=>{
  for(const getter of [undefined,()=>-1,()=>10,()=>NaN,()=>{throw Error('stale')}]){
   const p=playback(2);p.course.getDestination=getter;
   expect(releasedContact(p,1200,'flight',C)).toBeNull();
   expect(sceneEffectAt({playback:p,elapsed:1200,phase:'flight',result:{actualZone:2},composition}).committed).toBeUndefined();
  }
 });
 it('retains the explicit Tide pilot profile while using its committed actual endpoint',()=>{const p=playback(8),c={...composition,flightProfile:'tide-drop'};for(const elapsed of [p.pitchReleaseAt+70,p.timeline.impactAt+70]){const v=sceneEffectAt({playback:p,elapsed,phase:elapsed>p.timeline.impactAt?'result':'flight',result:{kind:'called'},composition:c}),expected=tideFlightAt(elapsed,p.pitchReleaseAt,p.timeline.impactAt,c.release,committedContact(8,C));expect(v.ball).toEqual(expected.ball);expect(v.radius).toBe(expected.radius);}});
 it('orders ten distinct points around authored contact, outside as category only',()=>{
  expect(committedContact(4,C)).toEqual(C);expect(committedContact(0,C).x).toBeLessThan(C.x);expect(committedContact(0,C).y).toBeLessThan(C.y);expect(committedContact(8,C).x).toBeGreaterThan(C.x);expect(committedContact(8,C).y).toBeGreaterThan(C.y);expect(committedContact(9,C).x).toBeGreaterThan(committedContact(5,C).x);
  expect(new Set(Array.from({length:10},(_,z)=>JSON.stringify(committedContact(z,C)))).size).toBe(10);
 });
 for(const id of Object.keys(registration))it(`${id}: registered hand, all courses, action-independent flight/pass and exact hit origin`,()=>{
  const actor=rosterPitcherActor(id,'x'),comp={...composition,release:actor.release};
  for(let zone=0;zone<10;zone++){
   const p=playback(zone,'take',actor),a=p.timeline.impactAt,r=p.pitchReleaseAt,T=committedContact(zone,C);
   expect(a-r).toBe(300);
   const at=(elapsed,action='take',phase='flight',kind='called')=>sceneEffectAt({elapsed,playback:{...p,action,course:{...p.course,aimZone:zone===4?0:4}},phase,result:{kind,actualZone:zone,aimZone:4,coverage:[4]},composition:comp});
   expect(at(r).ball).toEqual(actor.release);expect(at(a).ball).toEqual(T);
   for(const dt of [0,16.667,33.333,150,299]){const v=at(r+dt);expect(at(r+dt,'swing').ball).toEqual(v.ball);expect(at(r+dt,'swing').radius).toEqual(v.radius);if(dt>0)expect(v.ball).not.toEqual(actor.release);}
   for(const dt of [-.001,0,.001,16,100]){const v=at(a+dt,'take','result');for(const [action,kind] of [['take','called'],['swing','whiff']]){const after=at(a+dt,action,'result',kind);expect(after.ball).toEqual(v.ball);expect(after.radius).toBe(v.radius);}}
   expect(at(a+30).ball).toEqual(at(a+30,'take','result').ball); // delayed noncontact phase remains continuous
   const hitPlayback={...p,action:'swing',course:{...p.course,getContact:()=>true}};
   expect(sceneEffectAt({elapsed:a+30,playback:hitPlayback,phase:'flight',composition:comp}).ball).toEqual(T);
   for(const kind of ['hit','foul','out','sacrifice']){const hit=at(a,'swing','result',kind);expect(hit.ball).toEqual(T);expect(hit.contactPoint).toEqual(T);expect(hit.radius).toBe(12);}
   const end=at(a+180,'take','result');expect(end.hidden).toBe(true);expect(Number.isFinite(end.radius)).toBe(true);
  }
 });
});
