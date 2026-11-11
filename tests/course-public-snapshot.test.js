import {describe,it,expect} from 'vitest';
import {
  createV10Duel,enterV10Node,playV10Action,repertoire,knownPitchZones,
} from '../src/duel/engine.js';
import {zoneFace,bandFace} from '../src/duel/battle-vnext/view-model.js';
import {captureExecution} from '../src/duel/presentation-snapshot.js';
import {capturePublicCourseSnapshot,coursePresentationFor} from '../src/duel/battle-vnext/course-public-snapshot.js';
import {courseFrameAt} from '../src/duel/battle-vnext/course-presentation.js';
import {presentationFor,presentationTimeline} from '../src/duel/presentation.js';

function battleState(seed=1){return enterV10Node(createV10Duel(seed),'a1-entry');}
function publicOnlyState(base,{level=0,probabilities,scouted=false,knownZone=null}={}){
  const relics=level===0?[]:level===1?['scope']:['scope','hawkEye'];
  return {...base,deck:[],relics,battle:{...base.battle,pending:knownZone==null?null:{zone:knownZone},scouted,
    intent:{...base.battle.intent,probabilities}}};
}
function acceptedPitch(before){return {...before,stats:{...before.stats,pitches:before.stats.pitches+1},
  battle:{...before.battle,revealed:{action:'take'}}};}
function probabilitiesFor(live,value,outside=.1){const p=Array(10).fill(0);for(const zone of live)p[zone]=value;p[9]=outside;return p;}

describe('public course snapshot capture',()=>{
  it('captureExecution adds a deeply immutable public candidate snapshot and a node/pitch visual token',()=>{
    const before=battleState(1),next=playV10Action(before,{type:'take'}),execution=captureExecution(before,next);
    const snapshot=execution.courseSnapshot;
    expect(snapshot).toMatchObject({nodeId:'a1-entry',pitchCounter:next.stats.pitches,visualSeed:`course:a1-entry:${next.stats.pitches}`});
    expect(snapshot.candidates.length).toBeGreaterThan(0);
    expect(snapshot.candidates.every(x=>Number.isInteger(x.zone)&&x.zone>=0&&x.zone<=9&&x.weight>0)).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.candidates)).toBe(true);
    expect(snapshot.candidates.every(Object.isFrozen)).toBe(true);
    expect(snapshot).not.toHaveProperty('probabilities');
    expect(snapshot).not.toHaveProperty('pending');
    expect(snapshot).not.toHaveProperty('zone');
    expect(snapshot).not.toHaveProperty('seed');
  });

  it('uses the live repertoire actually displayed by the frozen intent rather than recomputing a different grid',()=>{
    const before=battleState(1);
    before.battle.intent={...before.battle.intent,repertoire:[0,1,2,3,4,5,6,7,8]};
    const snapshot=capturePublicCourseSnapshot(before,acceptedPitch(before));
    expect(snapshot.candidates.map(x=>x.zone)).toEqual([0,1,2,3,4,5,6,7,8,9]);
  });

  it.each([0,1])('same READ%i public face labels produce the same plan despite differing hidden probabilities',level=>{
    const base=battleState(3),live=repertoire(base);
    const a=publicOnlyState(base,{level,probabilities:probabilitiesFor(live,.1,.1)});
    const b=publicOnlyState(base,{level,probabilities:probabilitiesFor(live,.12,.12)});
    expect(live.map(zone=>zoneFace(a,zone))).toEqual(live.map(zone=>zoneFace(b,zone)));
    expect(bandFace(a)).toBe(bandFace(b));
    const sa=capturePublicCourseSnapshot(a,acceptedPitch(a)),sb=capturePublicCourseSnapshot(b,acceptedPitch(b));
    expect(sa.candidates).toEqual(sb.candidates);
    expect(sa.visualSeed).toBe(sb.visualSeed);
  });

  it('keeps a publicly eligible rounded 0% face at floor weight 1, including hidden-zero versus tiny-positive cases',()=>{
    const base=battleState(2),live=repertoire(base),zone=live[0];
    const p0=probabilitiesFor(live,.1,.1),p1=[...p0];p0[zone]=0;p1[zone]=0.001;
    const a=publicOnlyState(base,{level:2,probabilities:p0}),b=publicOnlyState(base,{level:2,probabilities:p1});
    expect(zoneFace(a,zone)).toBe('0%');expect(zoneFace(b,zone)).toBe('0%');
    const sa=capturePublicCourseSnapshot(a,acceptedPitch(a)),sb=capturePublicCourseSnapshot(b,acceptedPitch(b));
    expect(sa.candidates).toEqual(sb.candidates);
    expect(sa.candidates.find(x=>x.zone===zone)).toEqual({zone,weight:1});
  });

  it('excludes only zones publicly outside the live repertoire or earned-known set, while allowing known outside-zone 9',()=>{
    const base=battleState(4),live=repertoire(base);
    const inside=publicOnlyState(base,{level:0,probabilities:probabilitiesFor(live,.1,.1),scouted:true,knownZone:4});
    const insideKnown=knownPitchZones(inside),insideLive=repertoire(inside);
    const insideSnapshot=capturePublicCourseSnapshot(inside,acceptedPitch(inside));
    expect(insideSnapshot.candidates.map(x=>x.zone)).toEqual([...insideLive].filter(z=>insideKnown.includes(z)));
    expect(insideSnapshot.candidates.some(x=>x.zone===9)).toBe(false);

    const outside=publicOnlyState(base,{level:0,probabilities:probabilitiesFor(live,.1,0),scouted:true,knownZone:9});
    expect(knownPitchZones(outside)).toEqual([9]);
    expect(capturePublicCourseSnapshot(outside,acceptedPitch(outside)).candidates).toEqual([{zone:9,weight:1}]);
  });

  it('does not create a course snapshot for a preparation or a non-pitch',()=>{
    const before=battleState(1),id=before.battle.hand.find(cardId=>before.deck.find(card=>card.id===cardId)?.kind==='scout');
    expect(id).toBeTruthy();
    const prepared=playV10Action(before,{type:'card',id});
    expect(prepared.stats.pitches).toBe(before.stats.pitches);
    expect(captureExecution(before,prepared,{selected:id}).courseSnapshot).toBeNull();
    expect(capturePublicCourseSnapshot(before,{...acceptedPitch(before),stats:before.stats})).toBeNull();
  });
});

describe('gated durable course playback',()=>{
  it('retains the actual reduced-motion host result timing without attaching new course playback',()=>{
    const before=battleState(1),next=playV10Action(before,{type:'take'}),execution=captureExecution(before,next);
    const timeline=presentationTimeline(presentationFor(next),true);
    expect(timeline).toMatchObject({duration:60,impactAt:8});
    expect(coursePresentationFor({execution,next,timeline,live:true,durableSaved:true})).toBeNull();
    expect(timeline).toMatchObject({duration:60,impactAt:8});
  });
  it('attaches only after the durable live-pitch gate and reads the accepted zone once at/after lock',()=>{
    const before=battleState(5),next=playV10Action(before,{type:'take'}),execution=captureExecution(before,next);
    let reads=0;const actual=next.battle.revealed.zone;
    const nextWithLazyZone={...next,battle:{...next.battle,revealed:{...next.battle.revealed,get zone(){reads+=1;return actual;}}}};
    const timeline={pitchReleaseAt:600,impactAt:900,duration:1400};
    expect(coursePresentationFor({execution,next:nextWithLazyZone,timeline,live:true,durableSaved:false})).toBeNull();
    expect(coursePresentationFor({execution,next:nextWithLazyZone,timeline,live:false,durableSaved:true})).toBeNull();
    const attached=coursePresentationFor({execution,next:nextWithLazyZone,timeline,live:true,durableSaved:true});
    expect(attached.timeline.courseLockAt).toBe(340);
    expect(attached.course.plan.valid).toBe(true);
    expect(reads).toBe(0);
    const beforeLock=courseFrameAt({elapsed:339,timeline:attached.timeline,plan:attached.course.plan,getDestination:attached.course.getDestination});
    expect(beforeLock.targetZone).toBeNull();expect(reads).toBe(0);
    const locked=courseFrameAt({elapsed:340,timeline:attached.timeline,plan:attached.course.plan,getDestination:attached.course.getDestination});
    expect(locked.targetZone).toBe(actual);expect(reads).toBe(1);
    expect(attached.course.getDestination()).toBe(actual);expect(reads).toBe(1);
    expect(coursePresentationFor({execution:{...execution,committedPlan:{cards:[{aimZone:7}]}},next:nextWithLazyZone,timeline,live:true,durableSaved:true}).course.aimZone).toBe(7);
  });

  it('allows a separately accepted isolated memory preview but never treats the URL flag as a save',()=>{
    const before=battleState(9),next=playV10Action(before,{type:'take'}),execution=captureExecution(before,next);
    const timeline={pitchReleaseAt:600,impactAt:900,duration:1400};
    const args={execution,next,timeline,live:true,durableSaved:false};
    expect(coursePresentationFor(args)).toBeNull();
    expect(coursePresentationFor({...args,previewAccepted:false})).toBeNull();
    expect(coursePresentationFor({...args,previewAccepted:true})?.course.plan.valid).toBe(true);
  });

  it('does not attach for preparation, missing snapshots, mismatched pitch/node, or invalid course timelines',()=>{
    const before=battleState(1),next=playV10Action(before,{type:'take'}),execution=captureExecution(before,next);
    const args={execution,next,timeline:{pitchReleaseAt:600,impactAt:900},live:true,durableSaved:true};
    expect(coursePresentationFor({...args,execution:{...execution,courseSnapshot:null}})).toBeNull();
    expect(coursePresentationFor({...args,execution:{...execution,courseSnapshot:{...execution.courseSnapshot,pitchCounter:999}}})).toBeNull();
    expect(coursePresentationFor({...args,next:{...next,runMap:{...next.runMap,currentNodeId:'old-node'}}})).toBeNull();
    expect(coursePresentationFor({...args,timeline:{impactAt:900}})).toBeNull();
  });
});
