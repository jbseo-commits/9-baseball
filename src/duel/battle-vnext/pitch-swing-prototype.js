import {samplePitchFlight} from './pitch-trajectory.js';

export const SWING_LEAD_MS=160;
export const MIN_SWIPE_PIXELS=12;
export const CONTACT_RADIUS=22;
export const SWIPE_MULTIPLIER=Object.freeze({small:1,medium:1.5,large:3});
const PROFILES=Object.freeze(['fastball','slider','curve']);

/** Categorize the measured horizontal drag as a prototype input, not an engine rule. */
export function classifySwipe(distance,width){
  if(!Number.isFinite(distance)||!Number.isFinite(width)||width<=0)throw new TypeError('Finite swipe distance and positive width required');
  if(Math.abs(distance)<MIN_SWIPE_PIXELS)return null;
  const ratio=Math.abs(distance)/width;
  if(ratio<0.12)return 'small';
  if(ratio<0.28)return 'medium';
  return 'large';
}

/** Uniform independent profile choice; does not touch game RNG. */
export function profileFromCrypto(cryptoObject=globalThis.crypto){
  if(!cryptoObject?.getRandomValues)throw new Error('Secure randomness unavailable');
  const word=new Uint32Array(1);cryptoObject.getRandomValues(word);
  return PROFILES[Math.floor(word[0]/0x100000000*PROFILES.length)];
}

export function sampleAtOrAfterArrival(descriptor,elapsed){
  if(elapsed<descriptor.releaseAt)return null;
  if(elapsed<=descriptor.impactAt)return samplePitchFlight(descriptor,elapsed);
  const end=samplePitchFlight(descriptor,descriptor.impactAt),dt=elapsed-descriptor.impactAt;
  return {...end,position:{x:end.position.x+end.tangent.x*dt,y:end.position.y+end.tangent.y*dt},radius:end.radius+18*dt/(descriptor.impactAt-descriptor.releaseAt)};
}

/** Outcome uses only the actual ball sample at the actual bat-contact time. */
export function judgePrototypeContact({descriptor,contactAt,target,swipe}){
  if(!Number.isFinite(contactAt)||!Number.isFinite(target?.x)||!Number.isFinite(target?.y)||!['small','medium','large'].includes(swipe))throw new TypeError('Valid actual contact, target, and swipe required');
  if(contactAt<descriptor.releaseAt)return {result:'miss',position:null,distance:Infinity,timingErrorMs:contactAt-descriptor.impactAt,multiplier:SWIPE_MULTIPLIER[swipe]};
  const sample=sampleAtOrAfterArrival(descriptor,contactAt);
  const distance=Math.hypot(sample.position.x-target.x,sample.position.y-target.y);
  const timingErrorMs=contactAt-descriptor.impactAt;
  const overlap=distance<=CONTACT_RADIUS;
  const result=!overlap?'miss':swipe==='small'?'cut-foul':'contact';
  return {result,position:sample.position,radius:sample.radius,distance,timingErrorMs,multiplier:SWIPE_MULTIPLIER[swipe]};
}

export function scorePrototypeResult({score=0,strikes=0,result,multiplier=1}){
  if(!Number.isFinite(score)||!Number.isInteger(strikes)||strikes<0||strikes>3||!['contact','cut-foul','miss','take'].includes(result)||!Number.isFinite(multiplier))throw new TypeError('Invalid prototype score state');
  if(result==='contact')return {score:score+100*multiplier,strikes:0};
  if(result==='cut-foul')return {score,strikes:Math.min(2,strikes+1)};
  return {score,strikes:Math.min(3,strikes+1)};
}

export function prototypeSwingPoseTimeline({inputAt,contactAt,duration=1800}){
  return {impactAt:contactAt,releaseAt:contactAt+160,settleAt:contactAt+650,duration:Math.max(duration,contactAt+900),freeze:35,slowmo:0,delivery:{pitchReleaseAt:inputAt}};
}
