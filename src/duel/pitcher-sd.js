export const RED_RUSH_ASSET_ID='regular-01-red-rush';
export const RED_RUSH_FRAME_COUNT=120;
export const RED_RUSH_FPS=60;
export const RED_RUSH_DURATION_MS=2000;

const SKILL_GRADES=new Set(['read','lock','expand','signal','survive','draw']);
export const hasPitchVisual=shot=>!!shot&&!SKILL_GRADES.has(shot.grade);

export function redRushFrameAt(elapsedMs){
  if(!Number.isFinite(elapsedMs)||elapsedMs<=0)return 0;
  return Math.min(RED_RUSH_FRAME_COUNT-1,Math.floor(elapsedMs*RED_RUSH_FPS/1000));
}

// The atlas opens the hand at frame 79. Contact follows a short ball flight,
// instead of sharing that frame and making the pitch look pushed forward.
export const PITCH_FLIGHT_MS=160;
export const PITCH_BALL_RELEASE_MS=Math.round(79*1000/RED_RUSH_FPS);

export function redRushTimeline(base,reduced=false){
  if(!base||reduced)return base;
  const ballReleaseAt=PITCH_BALL_RELEASE_MS;
  const impactAt=ballReleaseAt+PITCH_FLIGHT_MS;
  const releaseAt=impactAt+(base.freeze||0)+(base.slowmo||0);
  const settleAt=Math.max(1830,releaseAt+80,impactAt+500);
  return {...base,ballReleaseAt,impactAt,releaseAt,settleAt,duration:Math.max(RED_RUSH_DURATION_MS,base.duration,settleAt+170)};
}


// Frame-79 hand/ball origins in the 256px atlas cells. Keep these tied to the
// authored silhouettes so zoom and responsive layouts cannot detach the pitch.
const RELEASE_POINTS={
  'regular-01-red-rush':[15,96],
  'regular-02-teal-mirage':[19,95],
  'regular-03-amber-sinker':[10,93],
  'regular-04-ivory-ace':[20,62],
  'regular-05-violet-sting':[29,132],
  'regular-06-rose-paint':[22,106],
  'elite-01-cobalt-impact':[23,96],
  'elite-02-neon-trick':[11,94],
  'elite-03-wine-bluff':[9,102],
  'boss-01-emerald-tyrant':[10,100],
  'boss-02-platinum-halo':[23,103],
  'boss-03-black-eclipse':[28,79],
};
export function pitcherReleasePoint(artId){
  const point=RELEASE_POINTS[artId];
  return point?{x:point[0]/256,y:point[1]/256}:null;
}

export function pitchFlightWindow(motion){
  const contactAt=Math.max(1,motion?.impactAt||1);
  const releaseAt=Math.max(0,Math.min(contactAt-1,motion?.ballReleaseAt??contactAt-PITCH_FLIGHT_MS));
  return {releaseAt,contactAt,flightMs:contactAt-releaseAt,startPhase:releaseAt/contactAt};
}

export function redRushBatterShot(shot,reduced=false){
  if(!hasPitchVisual(shot)||reduced)return shot;
  return {...shot,motion:{...redRushTimeline(shot.motion),syncToPitcher:true}};
}