// Only the host's matched committed card snapshot and landed result. No preview,
// pending zone, proc forecast, damage inference or future-card inspection.
export function sluggerFeedback({enabled,execution,playback,result,phase,elapsed,effect,reduced}){
 if(!enabled||!playback||reduced||playback.timeline?.duration<=60)return null;
 const main=execution?.cards?.find(c=>c.role==='main')?.kind;
 if(main==='loadPower'&&execution.action==='prepare'&&playback.action==='prepare'&&execution.preparation){
  return elapsed>=0&&elapsed<600?{kind:'loadPower',progress:elapsed/600}:null;
 }
 if(!['slug','gapHunter'].includes(main)||execution?.action!=='swing'||playback.action!=='swing'||phase!=='result'||result?.kind!=='hit'||result.assistOnly||!effect?.committed||!effect.contactPoint||effect.age<0)return null;
 const dx=(effect.ball?.x??effect.contactPoint.x)-effect.contactPoint.x,dy=(effect.ball?.y??effect.contactPoint.y)-effect.contactPoint.y;
 const age=effect.age-(playback.timeline.freeze||0);
 // During the contact freeze no outgoing vector exists. Keep the existing
 // impact burst; start these directional accents only once the real ball moves.
 if(age<0||age>230||Math.hypot(dx,dy)<.01)return null;
 return {kind:main,progress:age/230,point:effect.contactPoint,angle:Math.atan2(dy,dx)*180/Math.PI};
}
