import {describe,it,expect,vi} from 'vitest';
import {presentationElapsed} from '../src/duel/animation-speed.js';
import {createCoursePlan,courseTimeline,courseTarget} from '../src/duel/battle-vnext/course-presentation.js';
import {courseRenderModel} from '../src/duel/battle-vnext/course-render-model.js';
import {createV10Duel,enterV10Node,playV10Action} from '../src/duel/engine.js';
import {captureExecution} from '../src/duel/presentation-snapshot.js';
import {coursePresentationFor} from '../src/duel/battle-vnext/course-public-snapshot.js';
import {courseBatterFrameAt,COURSE_BATTER_FRAMES} from '../src/duel/battle-vnext/course-batter-sequence.js';

const timeline=courseTimeline({pitchReleaseAt:600,impactAt:900,duration:1400});
const planFor=zone=>createCoursePlan(Array.from({length:10},(_,i)=>({zone:i,weight:1})),{visualSeed:'render-model'});
const playbackFor=(zone,extra={})=>({startedAt:1000,rate:1,timeline,plan:planFor(zone),getDestination:()=>zone,
  origin:Object.freeze({x:100,y:200}),...extra});
const evidenceFor=(zone,patch={})=>Object.freeze({type:'RENDERED_CONTACT_GEOMETRY',version:1,zone,
  sourceSha256:'a'.repeat(64),maskSha256:'b'.repeat(64),frameId:'course-4',transformId:'whole-cell-v1',
  planeId:'PROPOSED_COURSE_PLANE/v1-unapproved',point:Object.freeze({x:courseTarget(zone).x,y:courseTarget(zone).y}),
  radius:8,maskRole:'bat-barrel',maskAlpha:128,verdict:'OVERLAP',status:'NOMINAL_GEOMETRY_PASS',
  runtimeApproved:false,reportId:'diagnostic-only',...patch});

describe('native host boundary regression',()=>{
  it('accepts the existing nested course playback and a separate world release point',()=>{
    const flat=playbackFor(9),playback={startedAt:1000,rate:1,timeline,action:'swing',course:{plan:flat.plan,getDestination:flat.getDestination}};
    expect(courseRenderModel({playback,origin:flat.origin,elapsed:timeline.impactAt,landed:false}))
      .toMatchObject({phase:'arrival',locationLabel:'존 밖',course:{targetZone:9,ball:{x:1044,y:610.78125}}});
  });
  it('does not access result/evidence property getters before landed impact',()=>{
    const playback=playbackFor(4);
    Object.defineProperty(playback,'contactEvidence',{get(){throw Error('early evidence property');}});
    const input={playback,elapsed:timeline.impactAt,landed:false};
    Object.defineProperty(input,'result',{get(){throw Error('early result property');}});
    expect(()=>courseRenderModel(input)).not.toThrow();
  });
  it('keeps preparation on the existing path and rejects invalid release timing',()=>{
    expect(courseRenderModel({playback:playbackFor(4,{action:'prepare'}),elapsed:500})).toMatchObject({phase:'hidden'});
    for(const pitchReleaseAt of [-1,NaN,901])expect(courseRenderModel({playback:playbackFor(4,{timeline:{...timeline,pitchReleaseAt}}),elapsed:500})).toMatchObject({phase:'hidden'});
  });
  it('reads the landed result object once at the host boundary',()=>{
    const input={playback:playbackFor(4),elapsed:timeline.impactAt,landed:true};
    const read=vi.fn(()=>({kind:'foul',label:'파울',actualZone:4}));
    Object.defineProperty(input,'result',{get:read});
    expect(courseRenderModel(input).outcome.kind).toBe('foul');expect(read).toHaveBeenCalledTimes(1);
  });
});

describe('unwired public course render model',()=>{
  it('keeps the scan on PRE, maps zone 9 to middle PRE, delays whiff follow-through, and never swings on take',()=>{
    const swing={...playbackFor(9),action:'swing'};
    for(let zone=0;zone<9;zone+=1){
      const target={phase:'flight',targetZone:zone,scanZone:null};
      expect(courseBatterFrameAt({course:target,playback:{...swing,course:target},elapsed:880})).toBe([0,3,6][Math.floor(zone/3)]);
    }
    expect(courseBatterFrameAt({course:{phase:'flight',targetZone:9,scanZone:null},playback:swing,elapsed:880})).toBe(3);
    expect(courseBatterFrameAt({course:{phase:'scan',targetZone:null,scanZone:8},playback:swing,elapsed:880})).toBeNull();
    const whiff={type:'whiff',kind:'whiff',label:'헛스윙',actualZone:9,zoneMatches:true,contact:'not-applicable'};
    const landed={phase:'landed',targetZone:9,scanZone:null};
    expect(courseBatterFrameAt({course:landed,playback:swing,elapsed:timeline.impactAt+99,outcome:whiff})).toBe(3);
    expect(courseBatterFrameAt({course:landed,playback:swing,elapsed:timeline.impactAt+100,outcome:whiff})).toBe(10);
    expect(courseBatterFrameAt({course:landed,playback:{...swing,action:'take'},elapsed:timeline.impactAt,outcome:whiff})).toBeNull();
    expect(COURSE_BATTER_FRAMES.outsideContact).toBe(10);
    expect(COURSE_BATTER_FRAMES.outsidePost).toBe(11);
  });

  it('does not use a contact or outgoing pose for unsupported outside foul',()=>{
    const playback={...playbackFor(9),action:'swing'},course={phase:'landed',targetZone:9,scanZone:null};
    const result={kind:'foul',label:'파울',actualZone:9};
    const outcome=courseRenderModel({playback,elapsed:timeline.impactAt,landed:true,result});
    expect(outcome).toMatchObject({outcome:{type:'outside-foul',contact:'unsupported'}});
    expect(courseBatterFrameAt({course,playback,elapsed:timeline.impactAt+500,outcome:outcome.outcome})).toBeNull();
  });

  it('never reads result fields or registration evidence until landed at/after impact',()=>{
    const result=new Proxy({}, {get(){throw Error('early result read');}});
    const contactEvidence=new Proxy({}, {get(){throw Error('early evidence read');}});
    const model=courseRenderModel({playback:playbackFor(4,{contactEvidence}),elapsed:timeline.impactAt-1,result});
    expect(model.phase).toBe('flight');
    expect(model.outcome).toBeNull();
    expect(model.contact).toBeNull();
    expect(()=>courseRenderModel({playback:playbackFor(4,{contactEvidence}),elapsed:timeline.impactAt,landed:false,result})).not.toThrow();
  });

  it('keeps all ten public locations tied to the locked zone and calls the outside location 존 밖',()=>{
    for(let zone=0;zone<=9;zone+=1){
      const playback=playbackFor(zone);
      const model=courseRenderModel({playback,elapsed:timeline.courseLockAt});
      expect(model.course.targetZone).toBe(zone);
      expect(model.locationLabel).toBeTruthy();
      if(zone===9)expect(model.locationLabel).toBe('존 밖');
      const arriving=courseRenderModel({playback,elapsed:timeline.impactAt+100,landed:false,
        result:{kind:'foul',label:'파울',actualZone:zone}});
      expect(arriving.locationLabel).toBe(model.locationLabel);
      expect(arriving.outcome).toBeNull();
    }
  });

  it('reads no destination before LOCK, uses only the public target, and late landed callbacks hold at T',()=>{
    const getter=vi.fn(()=>9),playback=playbackFor(9,{getDestination:getter});
    expect(courseRenderModel({playback,elapsed:timeline.courseLockAt-1}).course.targetZone).toBeNull();
    expect(getter).not.toHaveBeenCalled();
    const locked=courseRenderModel({playback,elapsed:timeline.courseLockAt});
    expect(locked.course.targetZone).toBe(9);
    expect(locked.course.locationLabel).toBe('존 밖');
    const late=courseRenderModel({playback,elapsed:timeline.impactAt+250,landed:false});
    expect(late.course.ball).toEqual(courseTarget(9) && {x:courseTarget(9).x,y:courseTarget(9).y});
    expect(late.course.phase).toBe('arrival');
  });

  it('keeps take-ball, take-called, and whiff distinct without presenting a swing contact',()=>{
    const playback=playbackFor(3,{contactEvidence:vi.fn(()=>true)});
    const sample=result=>courseRenderModel({playback,elapsed:timeline.impactAt,landed:true,result});
    expect(sample({action:'take',kind:'ball',label:'볼',actualZone:3})).toMatchObject({outcome:{type:'take-ball'},contact:'not-applicable'});
    expect(sample({action:'take',kind:'called',label:'루킹 스트라이크',actualZone:3})).toMatchObject({outcome:{type:'take-called'},contact:'not-applicable'});
    expect(sample({kind:'whiff',label:'헛스윙',actualZone:3})).toMatchObject({outcome:{type:'whiff'},contact:'not-applicable'});
  });

  it('marks outside foul unsupported without registration and preserves the landed engine kind and label',()=>{
    const playback=playbackFor(9);
    const model=courseRenderModel({playback,elapsed:timeline.impactAt,landed:true,
      result:{kind:'foul',label:'엔진 파울',actualZone:9}});
    expect(model.locationLabel).toBe('존 밖');
    expect(model.outcome).toEqual({type:'outside-foul',kind:'foul',label:'엔진 파울',actualZone:9,zoneMatches:true,contact:'unsupported',evidenceRef:null});
    expect(model.contact).toBe('unsupported');
  });

  it('requires matching landed location and explicit immutable registration evidence for contact',()=>{
    const registration=evidenceFor(4);
    const playback=playbackFor(4,{contactEvidence:registration});
    const matching=courseRenderModel({playback,elapsed:timeline.impactAt,landed:true,
      result:{kind:'hit',label:'단타',actualZone:4}});
    expect(matching.outcome).toMatchObject({type:'in-zone-contact',contact:'nominal-overlap',evidenceRef:{runtimeApproved:false}});
    const mismatch=courseRenderModel({playback,elapsed:timeline.impactAt,landed:true,
      result:{kind:'hit',label:'단타',actualZone:2}});
    expect(mismatch.outcome).toMatchObject({type:'outcome-mismatch',zoneMatches:false,contact:'unsupported'});
  });

  it('freezes its output without freezing caller data and falls back to null for reduced or invalid playback',()=>{
    const result={kind:'hit',label:'단타',actualZone:2},playback=playbackFor(2,{contactEvidence:new Set([2])});
    const model=courseRenderModel({playback,elapsed:timeline.impactAt,landed:true,result});
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.course)).toBe(true);
    expect(Object.isFrozen(model.outcome)).toBe(true);
    expect(Object.isFrozen(result)).toBe(false);
    expect(Object.isFrozen(playback)).toBe(false);
    expect(courseRenderModel({playback,elapsed:timeline.impactAt,reduced:true,result})).toMatchObject({phase:'hidden',course:null,outcome:null});
    expect(courseRenderModel({playback:{...playback,plan:{valid:false}},elapsed:timeline.impactAt,result})).toMatchObject({phase:'hidden',course:null});
  });

  it('samples six host rates from the same playback epoch and reaches the original T',()=>{
    const rates=[0.25,0.5,0.75,1,1.5,2],startedAt=1000,playback=playbackFor(7,{startedAt});
    const target=courseTarget(7);
    for(const rate of rates){
      const sampledPlayback={...playback,rate};
      const hostTime=startedAt+timeline.impactAt/rate;
      const elapsed=presentationElapsed(sampledPlayback,hostTime);
      const model=courseRenderModel({playback:sampledPlayback,elapsed,landed:false});
      expect(elapsed).toBeCloseTo(timeline.impactAt,8);
      expect(model.phase).toBe('arrival');
      expect(model.course.ball).toEqual({x:target.x,y:target.y});
    }
  });

  it('does not promote arbitrary flags, mutable maps, wider balls, shifted targets, or whole-actor overlap to contact evidence',()=>{
    const callable=vi.fn(()=>true);
    const invalid=[true,Object.freeze({4:true}),new Map([[4,true]]),new Set([4]),callable,
      evidenceFor(4,{runtimeApproved:true}),evidenceFor(4,{radius:100}),
      evidenceFor(4,{point:Object.freeze({x:courseTarget(4).x+1,y:courseTarget(4).y})}),
      evidenceFor(4,{maskRole:'whole-actor'}),evidenceFor(4,{sourceSha256:'not-a-sha'})];
    for(const contactEvidence of invalid){
      const sample=courseRenderModel({playback:playbackFor(4,{contactEvidence}),elapsed:timeline.impactAt,landed:true,result:{kind:'hit',label:'안타',actualZone:4}});
      expect(sample.contact).toBe('unsupported');expect(sample.outcome.evidenceRef).toBeNull();
    }
    expect(callable).not.toHaveBeenCalled();
  });

  it('rejects evidence accessors without invoking them and exposes missing release geometry honestly',()=>{
    const read=vi.fn(()=>{throw Error('evidence accessor');});
    const record={...evidenceFor(4)};Object.defineProperty(record,'point',{get:read});Object.freeze(record);
    const sample=courseRenderModel({playback:playbackFor(4,{contactEvidence:record}),elapsed:timeline.impactAt,landed:true,result:{kind:'hit',actualZone:4}});
    expect(sample.contact).toBe('unsupported');expect(read).not.toHaveBeenCalled();
    const missing=courseRenderModel({playback:playbackFor(4,{origin:null}),elapsed:700});
    expect(missing).toMatchObject({phase:'flight',course:{geometry:'unavailable-origin',ball:null}});
    expect(courseRenderModel({playback:playbackFor(4,{action:'take'}),elapsed:900,landed:true,result:{kind:'unknown',label:'?',actualZone:4}}))
      .toMatchObject({outcome:{type:'other',kind:'unknown'},contact:'not-applicable'});
  });

  it('does not inherit a forged audit through __proto__ or accept symbolic accessors',()=>{
    const forged=Object.create(null);
    Object.defineProperty(forged,'__proto__',{value:evidenceFor(4),enumerable:true});Object.freeze(forged);
    const read=vi.fn(()=>{throw Error('symbol accessor');});
    const symbolic={...evidenceFor(4)};Object.defineProperty(symbolic,Symbol('hidden'),{get:read});Object.freeze(symbolic);
    for(const contactEvidence of [forged,symbolic])expect(courseRenderModel({playback:playbackFor(4,{contactEvidence}),elapsed:900,landed:true,result:{kind:'hit',actualZone:4}}).contact).toBe('unsupported');
    expect(read).not.toHaveBeenCalled();
  });

  it('preserves real accepted outside foul, whiff and take results through the existing save-boundary factory',()=>{
    for(const [action,roll,kind] of [['swing',.01,'foul'],['swing',.5,'whiff'],['take',.01,'ball']]){
      const before=enterV10Node(createV10Duel(1),'a1-entry');
      before.battle.pending={zone:9,roll,powerRoll:.1};
      const next=playV10Action(before,action==='take'?{type:'take'}:{type:'card',id:'basic'});
      expect(next.battle.revealed.kind).toBe(kind);
      const execution=captureExecution(before,next),accepted=coursePresentationFor({execution,next,timeline,live:true,durableSaved:true});
      expect(accepted).not.toBeNull();
      const playback={...accepted,action,startedAt:1000,rate:1};
      const result={...next.battle.revealed,actualZone:next.battle.revealed.zone};
      const copy=JSON.stringify(next);
      const sample=courseRenderModel({playback,origin:{x:834,y:300},elapsed:timeline.impactAt,landed:true,result});
      expect(sample.locationLabel).toBe('존 밖');expect(sample.outcome).toMatchObject({kind,label:result.label,actualZone:9});
      expect(sample.contact).toBe(kind==='foul'?'unsupported':'not-applicable');
      expect(JSON.stringify(next)).toBe(copy);
    }
  });
});
