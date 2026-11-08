import soles from '../../../assets/production-art/batter-follow-v2/sole-registration.json';

/* Measured source-pixel soles share the actor's world transform. The lifted
   lead foot of load key2 casts onto the ground below, rather than dragging
   its shadow into the air. No actor geometry, timing or judgement changes. */
export function batterGroundShadows(meta,drawing){
  const feet=soles[String(drawing)]||soles['0'],scale=meta.worldHeight/meta.sourceHeight;
  return feet.map((foot,i)=>{
    const airborne=drawing===2&&i===1;
    const point={x:meta.worldFoot.x+(foot.x-meta.anchor.x)*scale,
      y:meta.worldFoot.y+((airborne?687:foot.y)-meta.anchor.y)*scale};
    const width=(i===0?54:airborne?76:70)*scale,height=(airborne?7:6)*scale;
    return {x:point.x-width/2,y:point.y-2*scale,width,height,rotation:-4,opacity:airborne?.35:.9};
  });
}
