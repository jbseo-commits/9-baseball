/* Red Fox cosmetic projection. A straight constant-velocity depth ray, shared
   on both sides of a noncontact event. No result/target/zone inputs. */
export function foxFlightAt(elapsed,releaseAt,impactAt,release,contact){
 const t=Math.max(0,(elapsed-releaseAt)/Math.max(1,impactAt-releaseAt));
 const clippedT=Math.min(t,1.6),depth=2-clippedT;
 const hidden=t>=1.6,progress=clippedT/depth;
 const point=n=>({x:release.x+(contact.x-release.x)*n,y:release.y+(contact.y-release.y)*n});
 const previousT=Math.max(0,clippedT-(1000/60)/Math.max(1,impactAt-releaseAt)),previous=previousT/(2-previousT);
 return {ball:point(progress),previous:point(previous),radius:12/depth,hidden};
}
