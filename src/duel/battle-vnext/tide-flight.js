/* Tide presentation only: a projected ballistic sag, independent of action,
   hidden target and outcome. Same curve and diameter continue through a miss.
   Gravity accelerates down late; endpoints remain actual authored R and C. */
export function tideFlightAt(elapsed,releaseAt,impactAt,release,contact){
 const duration=Math.max(1,impactAt-releaseAt),raw=Math.max(0,(elapsed-releaseAt)/duration),t=Math.min(raw,1.6);
 const point=n=>{const depth=2-n,q=n/depth;return {x:release.x+(contact.x-release.x)*q,y:release.y+(contact.y-release.y)*q+64*n*(n-1)/depth};};
 return {ball:point(t),previous:point(Math.max(0,t-(1000/60)/duration)),radius:12/(2-t),hidden:raw>=1.6};
}
