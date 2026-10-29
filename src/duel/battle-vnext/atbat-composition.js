import motion from '../../../assets/production-art/landscape-cinema/motion.json';
import layout from '../../../assets/production-art/atbat-field/layout.json';
import stadium from '../../../assets/production-art/atbat-field/stadium.avif';

/* Measured landmarks of the new background, not an actor-only camera trick.
   Foot anchors and contact/release local pixels retain the authored atlas data. */
const batter={...motion.batter,...layout.actors.batter};
const pitcher={...motion.pitcher,...layout.actors.pitcher};
const event=a=>({x:a.worldFoot.x+(a.event.x-a.anchor.x)*a.worldHeight/a.sourceHeight,
  y:a.worldFoot.y+(a.event.y-a.anchor.y)*a.worldHeight/a.sourceHeight});
export const ATBAT_COMPOSITION=Object.freeze({
  stadium,home:layout.landmarks.home,mound:layout.landmarks.mound,
  batter,pitcher,contact:event(batter),release:event(pitcher),
  shadows:[{x:807,y:430,width:63,height:17,rotation:-4},{x:347,y:870,width:129,height:19,rotation:-4}],
});
