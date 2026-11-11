/* Public-only host plumbing for the still-gated course presentation. No UI
 * consumes this snapshot yet; exact engine probabilities never enter its plan. */
import {knownPitchZones} from '../engine.js';
import {zoneFace,bandFace} from './view-model.js';
import {courseTimeline,createCoursePlan} from './course-presentation.js';

const freezeCandidates=candidates=>Object.freeze(candidates.map(candidate=>Object.freeze(candidate)));

function displayedWeight(face){
  if(typeof face!=='string')return 1;
  if(face==='확정')return 100;
  if(face==='자주')return 3;
  if(face==='가끔')return 2;
  if(face==='드묾'||face==='희박')return 1;
  const exact=/^(\d+(?:\.\d+)?)%$/.exec(face);
  if(exact)return Math.max(1,Number(exact[1]));
  const range=/^(\d+(?:\.\d+)?)[~–-](\d+(?:\.\d+)?)%$/.exec(face);
  if(range)return Math.max(1,(Number(range[1])+Number(range[2]))/2);
  // Eligibility is decided only by the public live/known selectors. An
  // unfamiliar display label therefore gets a neutral floor instead of being
  // treated as proof of impossible/zero probability.
  return 1;
}

/** Capture only already-displayed public faces, live zones, and earned clues. */
export function capturePublicCourseSnapshot(before,next){
  if(before?.version!==10||next?.version!==10||!before.battle||!next.battle
      ||next.last?.kind==='skill'||!next.battle.revealed
      ||!Number.isInteger(before.stats?.pitches)||!Number.isInteger(next.stats?.pitches)
      ||next.stats.pitches!==before.stats.pitches+1)return null;
  const nodeId=before.runMap?.currentNodeId;
  if(typeof nodeId!=='string'||!nodeId)return null;
  const pitchCounter=next.stats.pitches;
  // Match the VM's frozen, displayed intent. Recomputing the repertoire from
  // counters/configuration can disagree with the grid currently on screen.
  const live=new Set(before.battle.intent?.repertoire||[0,1,2,3,4,5,6,7,8]);
  const known=new Set(knownPitchZones(before));
  const candidates=[];
  for(let zone=0;zone<9;zone+=1){
    if(!live.has(zone)||!known.has(zone))continue;
    const face=zoneFace(before,zone);
    if(face==='안 던짐'||face==='단서 밖')continue;
    candidates.push({zone,weight:displayedWeight(face)});
  }
  // Zone 9 is represented by the displayed outside-band face rather than the
  // in-zone repertoire. A known “inside only” clue excludes it; a rounded 0%
  // face alone never does.
  if(known.has(9))candidates.push({zone:9,weight:displayedWeight(bandFace(before))});
  return Object.freeze({
    nodeId,
    pitchCounter,
    visualSeed:`course:${nodeId}:${pitchCounter}`,
    candidates:freezeCandidates(candidates),
  });
}

function acceptedDestination(next){
  let read=false,value=null;
  return ()=>{
    if(!read){
      read=true;
      const zone=next?.battle?.revealed?.zone;
      if(Number.isInteger(zone)&&zone>=0&&zone<=9)value=zone;
    }
    return value;
  };
}

/** Build gated playback data only after the accepted pitch is durably saved. */
export function coursePresentationFor({execution,next,timeline,live=false,durableSaved=false}={}){
  const snapshot=execution?.courseSnapshot;
  // Reduced motion keeps the existing immediate result presentation. It does
  // not acquire a new scan/lock/flight path or change its impact deadline.
  if(!live||!durableSaved||timeline?.duration<=60||next?.version!==10||next.last?.kind==='skill'
      ||!next.battle?.revealed||!snapshot?.candidates?.length
      ||snapshot.nodeId!==next.runMap?.currentNodeId
      ||snapshot.pitchCounter!==next.stats?.pitches)return null;
  const plan=createCoursePlan(snapshot.candidates,{visualSeed:snapshot.visualSeed});
  const timed=courseTimeline(timeline);
  if(!plan.valid||!timed)return null;
  const aimed=execution?.committedPlan?.cards?.[0]?.aimZone;
  return Object.freeze({
    timeline:timed,
    course:Object.freeze({plan,aimZone:Number.isInteger(aimed)&&aimed>=0&&aimed<=8?aimed:4,getDestination:acceptedDestination(next)}),
  });
}
