import {batterMotionV3Timeline} from './batterMotionV3.js';
import {WIDE_SWING_GRADES,WIDE_RECOVERY_END} from './landscape-presentation.js';
/* Each recovery drawing gets a readable beat. The strike point stays at the
   engine presentation's impact; only the opt-in scene's recovery tail grows. */
export function landscapeBatterTimeline(shot){
  const timeline=batterMotionV3Timeline(shot);
  if(!WIDE_SWING_GRADES.has(shot?.grade))return timeline;
  const motion=shot.motion||{},impact=motion.syncToPitcher?Math.max(220,Number(motion.impactAt)||260):Math.max(220,Math.min(390,Number(motion.impactAt)||260));
  const miss=['near-miss','near-miss-k','chase','chase-k','fooled','strikeout'].includes(shot.grade);
  return [{pose:'ready',at:0},{pose:'load',at:Math.max(42,impact-480)},
    {pose:'trigger',at:Math.max(95,impact-260)},{pose:'swing-start',at:Math.max(140,impact-125)},
    {pose:'swing-mid',at:impact-55},{pose:miss?'swing-through':'contact',at:impact},
    {pose:'follow-through-early',at:impact+100},{pose:'follow-through-late',at:impact+230},
    {pose:'finish',at:impact+350},{pose:'settle',at:impact+470},
    {pose:'recover-front',at:impact+620},{pose:'recover-raise',at:impact+760},
    {pose:'recover-ready',at:impact+900},{pose:'ready',at:impact+WIDE_RECOVERY_END}];
}
