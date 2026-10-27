import RELEASE from './pitcher-release.json';
import STANCE from './pitcher-stance.json';
/* Square atlas cell, feet corrected by the same stance in both renderers. */
export function pitcherReleasePoint(box,artId){
  const [sx,sy]=STANCE[artId]||[.5,1],[rx,ry]=RELEASE[artId]||[.05,.35];
  return {x:box.x+box.w/2+(rx-sx)*box.h,y:box.y+box.h+(ry-sy)*box.h};
}
