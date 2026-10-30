import motion from '../../../assets/production-art/mockup-rebuild/motion.json';
import batterAtlas from '../../../assets/production-art/mockup-rebuild/batter-atlas.avif';
import pitcherAtlas from '../../../assets/production-art/mockup-rebuild/pitcher-atlas.avif';

export const PILOT_MOTION=motion;
export const PILOT_ACTORS=Object.freeze({batter:batterAtlas,pitcher:pitcherAtlas});
export function actorEvent(actor){
  const m=motion[actor],k=m.worldHeight/m.sourceHeight;
  return {x:m.worldFoot.x+(m.event.x-m.anchor.x)*k,y:m.worldFoot.y+(m.event.y-m.anchor.y)*k};
}
export const MOTION_CONTACT=Object.freeze(actorEvent('batter'));
export const MOTION_RELEASE=Object.freeze(actorEvent('pitcher'));
const clamp=n=>Math.max(0,Math.min(1,n));

/* Pose choice reads the one host clock. It never advances or judges a pitch.
   The 14 cells are authored drawings; no limb warp / image rotation. */
export function motionAt({elapsed=0,timeline=null,action='take',landed=false,knockedOut=false,reduced=false,readyCoil=false}={}){
  if(!timeline||reduced)return {batter:0,pitcher:knockedOut?3:readyCoil?4:0};
  const t=Math.max(0,elapsed),a=timeline.impactAt,release=timeline.releaseAt,end=timeline.duration;
  if(t>=end)return {batter:0,pitcher:knockedOut?3:0};
  if(action==='prepare')return {batter:0,pitcher:0};
  const p=clamp(t/Math.max(1,a));
  const pitcher=knockedOut&&landed&&t>=timeline.settleAt?3:p<.18?(readyCoil?4:0):p<.45?4:p<.60?1:t<timeline.settleAt?2:0;
  if(action!=='swing')return {batter:0,pitcher};
  if(!landed||t<a)return {batter:Math.min(7,Math.floor(p*8)),pitcher};
  if(t<a+(timeline.freeze||0))return {batter:8,pitcher};
  if(t<release+70)return {batter:9,pitcher};
  const returnAt=Math.max(release+90,end-300);
  if(t<returnAt)return {batter:10,pitcher};
  const r=clamp((t-returnAt)/Math.max(1,end-returnAt));
  return {batter:r<.28?11:r<.56?12:r<.84?13:0,pitcher};
}

/* Exactly the engine's Chebyshev coverage-distance definition. No aim-only
   approximation, pending roll, or second zone grid. */
export function nearCoverage(result){
  if(!result||result.actualZone<0||result.actualZone>8||!Number.isInteger(result.actualZone))return null;
  const z=result.actualZone,coverage=(result.coverage||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<=8);
  const distance=n=>Math.max(Math.abs(Math.floor(n/3)-Math.floor(z/3)),Math.abs(n%3-z%3));
  const closest=coverage.slice().sort((a,b)=>distance(a)-distance(b)||a-b)[0];
  return closest!=null&&distance(closest)===1?{from:closest,to:z,distance:1}:null;
}
