export const BATTER_MOTION_V3_SEQUENCE=[
  'ready',
  'load',
  'trigger',
  'swing-start',
  'swing-mid',
  'contact',
  'follow-through-early',
  'follow-through-late',
  'finish',
  'settle',
];

export const BATTER_MOTION_V3_HIT_GRADES=new Set([
  'dead-center','solid','jammed','lucky','extra','homer','grand-slam',
]);

export const BATTER_MOTION_V3_MISS_GRADES=new Set([
  'near-miss','near-miss-k','chase','chase-k','fooled','strikeout',
]);

const POWER_HIT_GRADES=new Set(['dead-center','extra','homer','grand-slam']);
const HOME_RUN_GRADES=new Set(['homer','grand-slam']);
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const rounded=value=>Math.max(0,Math.round(value));

/*
 * V3 keeps contact aligned to the presentation impact while inserting two
 * authored bridge silhouettes around the fastest part of the swing.
 * Home runs deliberately leave contact sooner, travel through both authored
 * follow-through poses, then hold the finish. The stronger cadence makes the
 * body read as carrying momentum through the ball instead of posing at impact.
 */
export function batterMotionV3Timeline(shot){
  if(!shot)return [{pose:'ready',at:0}];
  const grade=shot.grade||'';
  const motion=shot.motion||{};
  const impact=motion.syncToPitcher?Math.max(220,Number(motion.impactAt)||260):clamp(Number(motion.impactAt)||260,220,390);
  const settleAt=Math.max(impact+500,Number(motion.settleAt)||impact+610);
  const duration=Math.max(settleAt+150,Number(motion.duration)||settleAt+300);

  const loadAt=rounded(motion.syncToPitcher?Math.max(42,impact-320):clamp(impact*0.18,42,72));
  const triggerAt=rounded(motion.syncToPitcher?Math.max(loadAt+42,impact-200):clamp(impact*0.39,88,148));
  const swingStartAt=rounded(Math.max(triggerAt+42,impact-118));
  const swingMidAt=rounded(Math.max(swingStartAt+38,impact-58));

  if(BATTER_MOTION_V3_HIT_GRADES.has(grade)){
    const power=POWER_HIT_GRADES.has(grade),homer=HOME_RUN_GRADES.has(grade);
    const baseHold=Math.max(150,(Number(motion.freeze)||0)+(Number(motion.slowmo)||0)*0.50);
    const contactHold=rounded(homer?clamp(baseHold+12,145,190):clamp(baseHold+(power?22:0),150,245));
    const followEarlyAt=impact+contactHold;
    const followWindow=Math.max(1,settleAt-followEarlyAt);
    const followLateAt=followEarlyAt+rounded(clamp(followWindow*(homer?.27:power?.33:.28),homer?90:105,homer?150:180));
    const finishGap=homer?115:power?130:110;
    const finishCap=homer?170:power?205:190;
    const finishAt=Math.max(followLateAt+finishGap,Math.min(settleAt-(homer?180:110),followLateAt+finishCap));
    return [
      {pose:'ready',at:0},
      {pose:'load',at:loadAt},
      {pose:'trigger',at:triggerAt},
      {pose:'swing-start',at:swingStartAt},
      {pose:'swing-mid',at:swingMidAt},
      {pose:'contact',at:rounded(impact)},
      {pose:'follow-through-early',at:rounded(followEarlyAt)},
      {pose:'follow-through-late',at:rounded(followLateAt)},
      {pose:'finish',at:rounded(finishAt)},
      {pose:'settle',at:rounded(settleAt)},
      {pose:'ready',at:rounded(duration)},
    ];
  }

  if(BATTER_MOTION_V3_MISS_GRADES.has(grade)){
    const followEarlyAt=impact+92;
    const followLateAt=followEarlyAt+115;
    const finishAt=Math.max(followLateAt+105,Math.min(settleAt-120,followLateAt+175));
    return [
      {pose:'ready',at:0},
      {pose:'load',at:loadAt},
      {pose:'trigger',at:triggerAt},
      {pose:'swing-start',at:swingStartAt},
      {pose:'swing-mid',at:swingMidAt},
      {pose:'follow-through-early',at:rounded(followEarlyAt)},
      {pose:'follow-through-late',at:rounded(followLateAt)},
      {pose:'finish',at:rounded(finishAt)},
      {pose:'settle',at:rounded(settleAt)},
      {pose:'ready',at:rounded(duration)},
    ];
  }

  return [{pose:'ready',at:0},{pose:'settle',at:rounded(settleAt)},{pose:'ready',at:rounded(duration)}];
}

export function batterMotionV3PoseAt(shot,elapsedMs){
  const timeline=batterMotionV3Timeline(shot);
  const elapsed=Math.max(0,Number(elapsedMs)||0);
  let pose=timeline[0].pose;
  for(const keyframe of timeline){
    if(keyframe.at>elapsed)break;
    pose=keyframe.pose;
  }
  return pose;
}
