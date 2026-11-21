import {releasedContact} from './committed-flight.js';
import {tideFlightAt} from './tide-flight.js';
import {foxFlightAt} from './fox-flight.js';
import {MOTION_CONTACT as DEFAULT_CONTACT,MOTION_RELEASE as DEFAULT_RELEASE,nearCoverage} from './motion-timeline.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const lerp=(a,b,p)=>({x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p});
const quadratic=(a,b,c,p)=>({x:(1-p)**2*a.x+2*(1-p)*p*b.x+p*p*c.x,y:(1-p)**2*a.y+2*(1-p)*p*b.y+p*p*c.y});

/* Committed flight consumes only the host-authorized durable course after
   release. Missing authorization preserves legacy preview, never aim/RNG. */
export function sceneEffectAt({elapsed=0,playback=null,result=null,phase='deciding',composition=null}={}){
  const authoredContact=composition?.contact||DEFAULT_CONTACT,R=composition?.release||DEFAULT_RELEASE;
  const resolved=releasedContact(playback,elapsed,phase,authoredContact),C=resolved||authoredContact;
  if(!playback||playback.timeline.duration<=60||playback.action==='prepare')return null;
  const t=playback.timeline,a=t.impactAt,age=elapsed-a,landed=phase==='result'&&!!result;
  const throwAt=playback.pitchReleaseAt??a*.54;
  const committedFlight=composition?.flightProfile==='tide-drop'?tideFlightAt:foxFlightAt;
  // RAF may cross impact before the host result render. Noncontact must keep
  // travelling; contact holds at T instead of overshooting and rewinding. The
  // durable accessor is read only at the already-locked impact deadline.
  let crosses=false;
  if(resolved&&elapsed>=a){try{crosses=playback.course.getContact?.()===false;}catch{/* hold unknown */}}
  const trail=playback.action==='swing'?Math.max(0,1-Math.abs(elapsed-(a-8))/120):0;
  if(!landed){
    if(elapsed<throwAt)return null;
    const linear=clamp((elapsed-throwAt)/Math.max(1,a-throwAt)),p=linear*linear;
    const contact=playback.action==='take'?{x:C.x+40,y:C.y+10}:C;
    if(resolved)return {kind:'flight',trail,spinAge:elapsed-throwAt,...committedFlight(crosses?elapsed:Math.min(elapsed,a),throwAt,a,R,C),age:elapsed-throwAt,flash:0,camera:0,opacity:1,committed:true,contactPoint:C};
    if(composition?.flightProfile==='tide-drop')return {kind:'flight',trail,spinAge:elapsed-throwAt,...tideFlightAt(elapsed,throwAt,a,R,C),age:elapsed-throwAt,flash:0,camera:0,opacity:1};
    if(composition?.flightProfile==='fox-depth')return {kind:'flight',trail,spinAge:elapsed-throwAt,...foxFlightAt(elapsed,throwAt,a,R,C),age:elapsed-throwAt,flash:0,camera:0,opacity:1};
    return {kind:'flight',trail,spinAge:elapsed-throwAt,ball:lerp(R,contact,p),previous:lerp(R,contact,Math.max(0,p-.16)),radius:3+9*p,age:elapsed-throwAt,flash:0,camera:0,opacity:1};
  }
  const near=result.kind==='whiff'?nearCoverage(result):null;
  const contact=['hit','foul','sacrifice','out'].includes(result.kind)&&playback.action==='swing';
  const power=result.kind==='hit'&&/홈런/.test(result.call||result.label||'');
  if(contact){
    const effectAge=Math.max(0,age-(t.freeze||0)),p=clamp(effectAge/Math.max(250,(power?t.settleAt-a:560)));
    const ground=/땅볼/.test(result.label||result.call||'');
    const fieldPoint=p=>composition?{x:p.x+composition.mound.x-832,y:p.y+composition.mound.y-580}:p;
    const end=fieldPoint(power?{x:1180,y:90}:result.kind==='foul'?{x:350,y:610}:ground?{x:865,y:580}:{x:865,y:360});
    const control=fieldPoint(power?{x:1040,y:-110}:ground?{x:900,y:640}:{x:810,y:350});
    const ball=quadratic(C,control,end,p),previous=quadratic(C,control,end,Math.max(0,p-.1));
    return {trail,kind:power?'homer':result.kind==='foul'?'foul':result.exact?'exact':'contact',ball,previous,
      ...(resolved?{committed:true,contactPoint:C}:{}),radius:Math.max(1.7,12*(1-p)),age,spinAge:a-throwAt+effectAge,flash:age>=0&&age<180?(1-age/180):0,
      camera:result.exact&&age>=0&&age<150?Math.sin(age*.1)*(1-age/150)*5:0,power,progress:p};
  }
  if(resolved)return {trail,kind:near?'near':'pass',...committedFlight(elapsed,throwAt,a,R,C),age,spinAge:elapsed-throwAt,flash:0,camera:0,near,committed:true,contactPoint:C};
  if(composition?.flightProfile==='tide-drop')return {trail,kind:near?'near':'pass',...tideFlightAt(elapsed,throwAt,a,R,C),age,spinAge:elapsed-throwAt,flash:0,camera:0,near};
  if(composition?.flightProfile==='fox-depth'){
    return {trail,kind:near?'near':'pass',...foxFlightAt(elapsed,throwAt,a,R,C),age,spinAge:elapsed-throwAt,flash:0,camera:0,near};
  }
  const z=result.actualZone;
  const dc=near?z%3-near.from%3:0,dr=near?Math.floor(z/3)-Math.floor(near.from/3):0;
  // Horizontal outer misses pass beyond the painted barrel, rather than appearing to hit its middle.
  const delta=near?{x:dc>0?155:dc<0?-90:0,y:dr?dr*38:dc<0?28:0}
    :{x:z===9?95:40+(z%3-1)*20,y:z===9?75:15+(Math.floor(z/3)-1)*18};
  const from={x:C.x+delta.x,y:C.y+delta.y},p=clamp(age/310),end={x:from.x+delta.x*.9+50,y:from.y+330};
  return {trail,kind:near?'near':'pass',ball:lerp(from,end,p),previous:lerp(from,end,Math.max(0,p-.1)),radius:7+7*p,
    age,spinAge:a-throwAt+Math.max(0,age),flash:0,camera:0,near,hidden:p>=1};
}
