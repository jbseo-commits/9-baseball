/* Public host sampler. No renderer, clock, RNG, save writes or art imports.
 * Contact evidence is diagnostic; nominal overlap never activates contact FX. */
import {courseFrameAt,courseFlightAt,courseTarget} from './course-presentation.js';
import {ZONE_WORDS} from '../ballpark-copy.js';
const freeze=Object.freeze,finite=Number.isFinite;
const validZone=n=>Number.isInteger(n)&&n>=0&&n<=9;
const point=p=>p&&finite(p.x)&&finite(p.y);
const blank=()=>freeze({phase:'hidden',course:null,locationLabel:null,outcome:null,contact:null});
const text=v=>typeof v==='string'&&v.length>0;
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);

// Accessors, boolean flags and callbacks cannot claim painted-barrel registration.
function dataRecord(value){
  try{
    if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value))||!Object.isFrozen(value))return null;
    const descriptors=Object.getOwnPropertyDescriptors(value),out=Object.create(null);
    for(const key of Reflect.ownKeys(descriptors)){const d=descriptors[key];if(!('value' in d))return null;out[key]=d.value;}
    return out;
  }catch{return null;}
}
function contactAudit(evidence,zone,target){
  const e=dataRecord(evidence),p=dataRecord(e?.point);
  if(!e||!p||e.type!=='RENDERED_CONTACT_GEOMETRY'||e.version!==1||e.zone!==zone
    ||!hash(e.sourceSha256)||!hash(e.maskSha256)||!text(e.frameId)||!text(e.transformId)||!text(e.reportId)
    ||e.planeId!=='PROPOSED_COURSE_PLANE/v1-unapproved'||p.x!==target.x||p.y!==target.y
    ||e.radius!==8||e.maskAlpha!==128||e.runtimeApproved!==false)return null;
  const overlap=e.verdict==='OVERLAP'&&e.status==='NOMINAL_GEOMETRY_PASS'&&e.maskRole==='bat-barrel';
  const miss=e.verdict==='NO_OVERLAP'&&e.status==='NOMINAL_GEOMETRY_FAIL'&&['bat-barrel','whole-actor'].includes(e.maskRole);
  if(!overlap&&!miss)return null;
  return freeze({status:overlap?'nominal-overlap':'unsupported',
    evidenceRef:freeze({reportId:e.reportId,sourceSha256:e.sourceSha256,frameId:e.frameId,
      transformId:e.transformId,planeId:e.planeId,zone,runtimeApproved:false})});
}
function landedOutcome(result,targetZone,target,getEvidence,playbackAction){
  const kind=result?.kind,label=result?.label,actualZone=result?.actualZone;
  const action=playbackAction??result?.action;
  const zoneMatches=validZone(actualZone)&&actualZone===targetZone;
  let type='other',contact='not-applicable',evidenceRef=null;
  if(!zoneMatches){type='outcome-mismatch';contact='unsupported';}
  else if(action==='take')type=kind==='ball'?'take-ball':kind==='called'?'take-called':'other';
  else if(kind==='ball'||kind==='called')type=kind==='ball'?'take-ball':'take-called';
  else if(kind==='whiff')type='whiff';
  else if(['hit','foul','out','sacrifice'].includes(kind)){
    if(actualZone===9&&kind!=='foul')return freeze({type:'outside-contact-unsupported',kind,label:text(label)?label:null,actualZone,zoneMatches,contact:'unsupported',evidenceRef:null});
    const audit=contactAudit(getEvidence(),actualZone,target);
    contact=audit?.status||'unsupported';evidenceRef=audit?.evidenceRef||null;
    type=kind==='foul'&&actualZone===9?'outside-foul':'in-zone-contact';
  }
  return freeze({type,kind:text(kind)?kind:null,label:text(label)?label:null,
    actualZone:validZone(actualZone)?actualZone:null,zoneMatches,contact,evidenceRef});
}
/** Native host shape: playback.course.{plan,getDestination}, playback.timeline.
 * origin is supplied separately by scene. Flat public DTOs remain diagnostic.
 * No result/evidence property is touched before landed impact. */
export function courseRenderModel(input={}){
  if(!input||typeof input!=='object')return blank();
  const {playback,elapsed,landed=false,reduced=false}=input;
  if(!playback||!finite(elapsed)||elapsed<0||reduced||playback.action==='prepare')return blank();
  const timeline=playback.timeline,publicCourse=playback.course??playback;
  if(!timeline||!finite(timeline.impactAt)||timeline.impactAt<0
    ||!finite(timeline.pitchReleaseAt)||timeline.pitchReleaseAt<0||timeline.pitchReleaseAt>timeline.impactAt
    ||!finite(timeline.courseLockAt)||timeline.courseLockAt<0||timeline.courseLockAt>timeline.pitchReleaseAt)return blank();
  const frame=courseFrameAt({elapsed,timeline,plan:publicCourse.plan,getDestination:publicCourse.getDestination});
  if(['hidden','unresolved','hold'].includes(frame.stage))return blank();
  const target=frame.targetZone==null?null:courseTarget(frame.targetZone);
  const origin=target?(input.origin??playback.origin):null;
  const flight=target&&point(origin)?courseFlightAt({elapsed,timeline,origin,target}):null;
  const impactReached=elapsed>=timeline.impactAt,isLanded=landed===true&&impactReached;
  const phase=frame.stage==='scan'?'scan':impactReached?(isLanded?'landed':'arrival')
    :elapsed<timeline.pitchReleaseAt?'locked':'flight';
  const locationZone=frame.targetZone??frame.scanZone;
  const locationLabel=locationZone===9?'존 밖':ZONE_WORDS[locationZone]||null;
  const course=freeze({phase,scanZone:frame.scanZone,targetZone:frame.targetZone,locationLabel,
    ball:flight?.ball??null,progress:flight?.progress??frame.progress,
    scanIndex:frame.scanIndex,scanCount:frame.scanCount,scanAge:frame.scanAge,previousZone:frame.previousZone,lockAge:frame.lockAge,
    geometry:!target?'unresolved':flight?'available':'unavailable-origin'});
  const getEvidence=()=>{try{return input.contactEvidence??playback.contactEvidence;}catch{return null;}};
  const result=isLanded?input.result:null;
  const outcome=result?landedOutcome(result,frame.targetZone,target,getEvidence,playback.action):null;
  return freeze({phase,course,locationLabel,outcome,contact:outcome?.contact??null});
}
