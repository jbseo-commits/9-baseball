import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {presentationElapsed} from '../src/duel/animation-speed.js';
import {rosterPitcherActor} from '../src/duel/battle-vnext/roster-actor.js';
import {
  COURSE_LOCK_LEAD_MS,PROPOSED_COURSE_PLANE,createCoursePlan,courseTimeline,
  courseFrameAt,courseTarget,courseFlightAt,
} from '../src/duel/battle-vnext/course-presentation.js';

const baseTimeline={pitchReleaseAt:600,impactAt:900,releaseAt:980,settleAt:1200,duration:1400};
const planFor=(zones=[1,4,8],visualSeed='public-run-token')=>createCoursePlan(
  zones.map((zone,i)=>({zone,weight:i+1})),{visualSeed});

describe('isolated public course plan',()=>{
  it('uses only public zone/weight values and ignores hidden-probability differences',()=>{
    const read0=[
      {zone:0,weight:3,hiddenProbability:0},
      {zone:4,weight:1,hiddenProbability:1},
      {zone:9,weight:2,hiddenProbability:0},
    ];
    const read1=read0.map(item=>({...item,hiddenProbability:item.hiddenProbability?0:1}));
    const a=createCoursePlan(read0,{visualSeed:'public-read'});
    const b=createCoursePlan(read1,{visualSeed:'public-read'});
    expect(a).toEqual(b);
    expect(a.pool).toEqual([{zone:0,weight:3},{zone:4,weight:1},{zone:9,weight:2}]);
    expect(a.scanSequence).toHaveLength(3);
    expect(new Set(a.scanSequence)).toEqual(new Set([0,4,9]));
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.pool)).toBe(true);
    expect(a.pool.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(a.scanSequence)).toBe(true);
  });

  it('replays a deterministic weighted permutation and excludes public zero/invalid weights and out-of-range zones',()=>{
    const candidates=[
      {zone:8,weight:4},{zone:1,weight:1},{zone:6,weight:0},
      {zone:10,weight:5},{zone:-1,weight:2},{zone:4,weight:-3},
    ];
    const first=createCoursePlan(candidates,{visualSeed:7919});
    const replay=createCoursePlan(candidates,{visualSeed:7919});
    expect(replay.scanSequence).toEqual(first.scanSequence);
    expect(first.pool.map(x=>x.zone)).toEqual([1,8]);
    expect(first.scanSequence).toHaveLength(2);
    expect(first.scanSequence).toContain(1);
    expect(first.scanSequence).toContain(8);
  });

  it('supports one public candidate including outside zone 9, but fails closed for empty or invalid plans',()=>{
    const single=createCoursePlan([{zone:9,weight:0.25}],{visualSeed:'only'});
    expect(single.valid).toBe(true);
    expect(single.scanSequence).toEqual([9]);
    expect(createCoursePlan([], {visualSeed:'empty'})).toMatchObject({valid:false,pool:[],scanSequence:[]});
    expect(createCoursePlan([{zone:3,weight:1}],{})).toMatchObject({valid:false,pool:[],scanSequence:[]});
    expect(createCoursePlan([{zone:3,weight:1}],null)).toMatchObject({valid:false,pool:[],scanSequence:[]});
    expect(createCoursePlan([{zone:3,weight:1}],{visualSeed:Infinity})).toMatchObject({valid:false,pool:[],scanSequence:[]});
    expect(createCoursePlan(null,{visualSeed:'bad'})).toMatchObject({valid:false,pool:[],scanSequence:[]});
  });
});

describe('public lock and destination isolation',()=>{
  it('derives lock at public pitch release minus the lead, clamped to zero',()=>{
    expect(COURSE_LOCK_LEAD_MS).toBe(260);
    const timeline=courseTimeline(baseTimeline);
    expect(timeline.courseLockAt).toBe(340);
    expect(Object.isFrozen(timeline)).toBe(true);
    expect(courseTimeline({...baseTimeline,pitchReleaseAt:200}).courseLockAt).toBe(0);
    expect(courseTimeline({...baseTimeline,impactAt:500,pitchReleaseAt:600})).toBeNull();
    expect(courseTimeline(null)).toBeNull();
  });

  it('never asks for hidden destination before lock, across different private states and a throwing getter',()=>{
    const publicCandidates=[{zone:0,weight:2},{zone:5,weight:1}];
    const privateZero=createCoursePlan(publicCandidates.map(x=>({...x,hiddenProbability:0})),{visualSeed:'same-public-token'});
    const privateOne=createCoursePlan(publicCandidates.map(x=>({...x,hiddenProbability:1})),{visualSeed:'same-public-token'});
    const t=courseTimeline(baseTimeline),throws=vi.fn(()=>{throw new Error('hidden state unavailable');});
    const reveals=vi.fn(()=>5);
    for(const elapsed of [0,100,t.courseLockAt-1]){
      const a=courseFrameAt({elapsed,timeline:t,plan:privateZero,getDestination:throws});
      const b=courseFrameAt({elapsed,timeline:t,plan:privateOne,getDestination:reveals});
      expect(a).toEqual(b);
      expect(a.stage).toBe('scan');
      expect(a).toHaveProperty('scanZone');
      expect(a.targetZone).toBeNull();
      expect(a).not.toHaveProperty('grade');
      expect(a).not.toHaveProperty('damage');
    }
    expect(throws).not.toHaveBeenCalled();
    expect(reveals).not.toHaveBeenCalled();
    expect(privateZero.scanSequence).toEqual(privateOne.scanSequence);
  });

  it('first calls the destination getter at lock and fails closed outside the public pool',()=>{
    const plan=planFor([1,5]);
    const t=courseTimeline(baseTimeline),getDestination=vi.fn(()=>5);
    const before=courseFrameAt({elapsed:t.courseLockAt-1,timeline:t,plan,getDestination});
    expect(before).toMatchObject({stage:'scan',targetZone:null});
    expect(getDestination).not.toHaveBeenCalled();
    expect(courseFrameAt({elapsed:t.courseLockAt,timeline:t,plan,getDestination})).toMatchObject({stage:'locked',targetZone:5});
    expect(getDestination).toHaveBeenCalledTimes(1);
    expect(courseFrameAt({elapsed:t.impactAt-1,timeline:t,plan,getDestination})).toMatchObject({stage:'locked',targetZone:5});
    expect(courseFrameAt({elapsed:t.impactAt,timeline:t,plan,getDestination})).toMatchObject({stage:'impact',targetZone:5});

    const impossible=courseFrameAt({elapsed:t.courseLockAt,timeline:t,plan,getDestination:()=>8});
    expect(impossible).toMatchObject({stage:'unresolved',targetZone:null});
    expect(impossible).not.toHaveProperty('grade');
    expect(impossible).not.toHaveProperty('damage');
    expect(courseFrameAt({elapsed:t.courseLockAt,timeline:t,plan,getDestination:()=>{throw Error('not durable');}}))
      .toMatchObject({stage:'unresolved',targetZone:null});
  });

  it('reduced motion holds without scanning or exposing a lock target before impact',()=>{
    const plan=planFor([2,7]),t={...courseTimeline(baseTimeline),impactAt:60,duration:60,courseLockAt:0};
    const getDestination=vi.fn(()=>7);
    const before=courseFrameAt({elapsed:59,timeline:t,plan,getDestination,reduced:true});
    expect(before).toMatchObject({stage:'hold',scanZone:null,targetZone:null,progress:0});
    expect(getDestination).not.toHaveBeenCalled();
    const impact=courseFrameAt({elapsed:60,timeline:t,plan,getDestination,reduced:true});
    expect(impact).toMatchObject({stage:'impact',scanZone:null,targetZone:7,progress:1});
    expect(getDestination).toHaveBeenCalledTimes(1);
    expect(impact).not.toHaveProperty('grade');
    expect(impact).not.toHaveProperty('damage');
  });

  it('invalid frame inputs fail closed without consulting the destination',()=>{
    const getter=vi.fn(()=>4),plan=planFor();
    expect(courseFrameAt({elapsed:NaN,timeline:courseTimeline(baseTimeline),plan,getDestination:getter}))
      .toMatchObject({stage:'hidden',scanZone:null,targetZone:null});
    expect(courseFrameAt({elapsed:3,timeline:null,plan,getDestination:getter}))
      .toMatchObject({stage:'hidden',scanZone:null,targetZone:null});
    expect(courseFrameAt({elapsed:3,timeline:courseTimeline(baseTimeline),plan:{valid:false},getDestination:getter}))
      .toMatchObject({stage:'hidden',scanZone:null,targetZone:null});
    expect(courseFrameAt(null)).toMatchObject({stage:'hidden',scanZone:null,targetZone:null});
    expect(getter).not.toHaveBeenCalled();
  });
});

describe('diagnostic target plane and continuous incoming flight',()=>{
  it('maps all ten zone centers to the fixed proposed plane and validates inputs',()=>{
    expect(PROPOSED_COURSE_PLANE).toEqual({xMin:729,xMax:939,yMin:449.0625,yMax:772.5,approved:false});
    expect(Object.isFrozen(PROPOSED_COURSE_PLANE)).toBe(true);
    for(let zone=0;zone<9;zone+=1){
      const target=courseTarget(zone);
      const u=(zone%3+0.5)/3,v=(Math.floor(zone/3)+0.5)/3;
      expect(target).toEqual({zone,u,v,x:729+u*210,y:449.0625+v*323.4375});
      expect(Object.isFrozen(target)).toBe(true);
    }
    expect(courseTarget(9)).toEqual({zone:9,u:1.5,v:0.5,x:1044,y:610.78125});
    expect(courseTarget(10)).toBeNull();
    expect(courseTarget(0,{xMin:1,xMax:1,yMin:0,yMax:1})).toBeNull();
  });

  it('starts at each of the 20 registered pitcher release origins and reaches exact impact at all six host rates',()=>{
    const roster=JSON.parse(readFileSync('src/duel/battle-vnext/roster-registration.json','utf8'));
    const layout=JSON.parse(readFileSync('assets/production-art/mockup-rebuild/layout.json','utf8'));
    const timeline={pitchReleaseAt:600,impactAt:900,duration:1400};
    const targets=Array.from({length:10},(_,zone)=>courseTarget(zone)),rates=[0.25,0.5,0.75,1,1.5,2];
    const entries=Object.entries(roster);
    expect(entries).toHaveLength(20);
    for(const [artId,registered] of entries){
      const anchor=registered.anchor,k=(registered.visibleWorldHeight||300)/registered.visibleHeight;
      const foot=registered.worldFoot||layout.actors.pitcher.worldFoot;
      const origin=rosterPitcherActor(artId,'review-only.png').release;
      expect(origin.x).toBeCloseTo(foot.x+(registered.release.x-anchor.x)*k,10);
      expect(origin.y).toBeCloseTo(foot.y+(registered.release.y-anchor.y)*k,10);
      for(const target of targets) for(const rate of rates){
        const playback={startedAt:1000,rate,timeline};
        const atPresentation=virtual=>presentationElapsed(playback,1000+virtual/rate);
        const start=courseFlightAt({elapsed:atPresentation(timeline.pitchReleaseAt),timeline,origin,target});
        const middle=courseFlightAt({elapsed:atPresentation((timeline.pitchReleaseAt+timeline.impactAt)/2),timeline,origin,target});
        const impact=courseFlightAt({elapsed:atPresentation(timeline.impactAt),timeline,origin,target});
        const late=courseFlightAt({elapsed:timeline.impactAt+250,timeline,origin,target});
        expect(start).toMatchObject({stage:'flight',ball:origin,progress:0});
        expect(middle.progress).toBeCloseTo(0.5,10);
        expect(middle.ball.x).toBeCloseTo((origin.x+target.x)/2,10);
        expect(middle.ball.y).toBeCloseTo((origin.y+target.y)/2,10);
        expect(impact).toEqual({stage:'impact',ball:{x:target.x,y:target.y},progress:1});
        expect(late).toEqual(impact); // Callback lateness holds T; it has no result trajectory.
        expect(impact).not.toHaveProperty('damage');
        expect(impact).not.toHaveProperty('grade');
      }
    }
  });

  it('has no ball before release and fails closed on malformed flight inputs',()=>{
    const timeline={pitchReleaseAt:600,impactAt:900},origin={x:10,y:20},target={x:90,y:80};
    expect(courseFlightAt({elapsed:599,timeline,origin,target})).toEqual({stage:'waiting',ball:null,progress:0});
    expect(courseFlightAt({elapsed:600,timeline,origin,target})).toEqual({stage:'flight',ball:origin,progress:0});
    expect(courseFlightAt({elapsed:100,timeline,origin:null,target})).toMatchObject({stage:'hidden',ball:null});
    expect(courseFlightAt(null)).toMatchObject({stage:'hidden',ball:null});
    expect(courseFlightAt({elapsed:100,timeline:{...timeline,impactAt:500},origin,target})).toMatchObject({stage:'hidden',ball:null});
  });
});
