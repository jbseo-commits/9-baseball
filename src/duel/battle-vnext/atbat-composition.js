import motion from '../../../assets/production-art/mockup-rebuild/motion.json';
import layout from '../../../assets/production-art/mockup-rebuild/layout.json';
import stadium from '../../../assets/pixel-batter-review-v1/stadium-camera-aligned.webp';
import pixelBatter from '../../../assets/pixel-batter-review-v1/batter-runtime.json';

/* Measured landmarks of the new background, not an actor-only camera trick.
   Foot anchors and contact/release local pixels retain the authored atlas data. */
const batter={...pixelBatter,...layout.actors.batter,worldHeight:1100,readyImage:null};
const pitcher={...motion.pitcher,...layout.actors.pitcher};
const event=a=>({x:a.worldFoot.x+(a.event.x-a.anchor.x)*a.worldHeight/a.sourceHeight,
  y:a.worldFoot.y+(a.event.y-a.anchor.y)*a.worldHeight/a.sourceHeight});
export const ATBAT_COMPOSITION=Object.freeze({
  stadium,home:layout.landmarks.home,mound:layout.landmarks.mound,camera:layout.camera,
  batter,pitcher,contact:event(batter),release:event(pitcher),
  shadows:[{x:801,y:530,width:66,height:14,rotation:-4},{x:478,y:846,width:145,height:19,rotation:-4}],
});
