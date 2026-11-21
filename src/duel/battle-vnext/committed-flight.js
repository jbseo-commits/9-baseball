/* Cosmetic course volume around the existing authored bat-contact depth.
 * Not the foreground decision grid or the unapproved diagnostic plane.
 * Zone9 has no measured side/height: a stable outer point represents only
 * the outside category, never fabricated sub-zone precision. */
export function committedContact(zone,center){
 if(!Number.isInteger(zone)||zone<0||zone>9)return null;
 return {x:center.x+(zone===9?110:(zone%3-1)*50),
  y:center.y+(zone===9?0:(Math.floor(zone/3)-1)*45)};
}
/** Host getter closes over a durably saved revealed pitch. Never replace with
 * result/aim/pending, or read during the earlier course-lock cue. */
export function releasedContact(playback,elapsed,phase,center){
 if(!playback||playback.action==='prepare'||playback.timeline?.duration<=60
   ||!['flight','result'].includes(phase))return null;
 const release=playback.pitchReleaseAt??playback.timeline?.pitchReleaseAt;
 if(!Number.isFinite(release)||elapsed<release||typeof playback.course?.getDestination!=='function')return null;
 try{return committedContact(playback.course.getDestination(),center);}catch{return null;}
}
