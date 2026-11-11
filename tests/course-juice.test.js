import {describe,it,expect,vi} from 'vitest';
import {createCoursePlan,courseTimeline,courseScanSchedule,courseFrameAt} from '../src/duel/battle-vnext/course-presentation.js';
import {courseAudioEvent} from '../src/duel/battle-vnext/course-audio.js';
const plan=createCoursePlan([0,1,4,8,9].map(zone=>({zone,weight:1})),{visualSeed:'juice'});
const timeline=courseTimeline({pitchReleaseAt:1500,impactAt:1900,duration:2400});
describe('public roulette rhythm',()=>{
 it('repeats only public candidates with increasing dwell and leaves the host timeline unchanged',()=>{
  const before=JSON.stringify(timeline),schedule=courseScanSchedule(plan,timeline);
  expect(schedule.length).toBeGreaterThan(plan.pool.length);
  const dwells=schedule.map((s,i)=>(schedule[i+1]?.at??timeline.courseLockAt)-s.at);
  expect(schedule[0].at).toBe(0);
  for(let i=0;i<schedule.length;i++){
   expect(plan.scanSequence).toContain(schedule[i].zone);
   if(i) {expect(schedule[i].zone).not.toBe(schedule[i-1].zone);expect(dwells[i]).toBeGreaterThan(dwells[i-1]);}
  }
  expect(schedule.at(-1).at).toBeLessThan(timeline.courseLockAt);
  expect(JSON.stringify(timeline)).toBe(before);
 });
 it('shares scan steps/ages without reading the destination; lock age starts at the existing lock',()=>{
  const getter=vi.fn(()=>4),schedule=courseScanSchedule(plan,timeline);
  for(let i=0;i<schedule.length;i++){
   const f=courseFrameAt({elapsed:schedule[i].at+.01,plan,timeline,getDestination:getter});
   expect(f).toMatchObject({stage:'scan',scanZone:schedule[i].zone,scanIndex:i,targetZone:null});
   expect(f.scanAge).toBeCloseTo(.01);expect(f.previousZone).toBe(i?schedule[i-1].zone:null);
  }
  expect(getter).not.toHaveBeenCalled();
  expect(courseFrameAt({elapsed:timeline.courseLockAt+50,plan,timeline,getDestination:getter})).toMatchObject({stage:'locked',targetZone:4,lockAge:50});
 });
 it('does not manufacture roulette motion for a single known candidate or zero/tiny lock window',()=>{
  const single=createCoursePlan([{zone:9,weight:1}],{visualSeed:'only'});
  expect(courseScanSchedule(single,timeline)).toEqual([{at:0,zone:9}]);
  expect(courseScanSchedule(plan,{courseLockAt:0})).toEqual([]);
  expect(courseScanSchedule(plan,{courseLockAt:1})).toHaveLength(1);
  expect(courseScanSchedule(null,timeline)).toEqual([]);
 });
});
describe('one newest neutral course sound from the shared render sample',()=>{
 const sample=(phase,fields={})=>({phase,course:{phase,...fields}});
 it('uses only the newest step and rejects stale, singleton, unresolved, flight or hidden samples',()=>{
  expect(courseAudioEvent(sample('scan',{scanIndex:7,scanAge:10,scanCount:12}),2)).toEqual({key:'scan:7',kind:'courseTick'});
  expect(courseAudioEvent(sample('scan',{scanIndex:7,scanAge:130,scanCount:12}),2)).toBeNull();
  expect(courseAudioEvent(sample('scan',{scanIndex:0,scanAge:0,scanCount:1}),1)).toBeNull();
  expect(courseAudioEvent(sample('locked',{targetZone:9,lockAge:0}),1)).toEqual({key:'lock',kind:'courseLock'});
  for(const phase of ['flight','arrival','landed','hidden','unresolved'])expect(courseAudioEvent(sample(phase,{targetZone:4,lockAge:0}),1)).toBeNull();
  expect(courseAudioEvent(sample('locked',{targetZone:null,lockAge:0}),1)).toBeNull();
  expect(courseAudioEvent(null,1)).toBeNull();
 });
});
