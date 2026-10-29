import {MOTION_CONTACT as DEFAULT_CONTACT,MOTION_RELEASE as DEFAULT_RELEASE,nearCoverage} from './motion-timeline.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const lerp=(a,b,p)=>({x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p});
const quadratic=(a,b,c,p)=>({x:(1-p)**2*a.x+2*(1-p)*p*b.x+p*p*c.x,y:(1-p)**2*a.y+2*(1-p)*p*b.y+p*p*c.y});

/* All flight before impact is outcome-independent. Actual course/result is
   accepted ONLY through the landed result, never scene.pitchZone/pending. */
export function sceneEffectAt({elapsed=0,playback=null,result=null,phase='deciding',composition=null}={}){
  const C=composition?.contact||DEFAULT_CONTACT,R=composition?.release||DEFAULT_RELEASE;
  if(!playback||playback.timeline.duration<=60||playback.action==='prepare')return null;
  const t=playback.timeline,a=t.impactAt,age=elapsed-a,landed=phase==='result'&&!!result;
  const throwAt=a*.54;
  const trail=playback.action==='swing'?Math.max(0,1-Math.abs(elapsed-(a-8))/120):0;
  if(!landed){
    if(elapsed<throwAt)return null;
    const p=clamp((elapsed-throwAt)/Math.max(1,a-throwAt));
    const contact=playback.action==='take'?{x:C.x+40,y:C.y+10}:C;
    return {kind:'flight',trail,ball:lerp(R,contact,Math.min(.995,p)),previous:lerp(R,contact,Math.max(0,p-.16)),radius:3+4*p,age:0,flash:0,camera:0,opacity:p>.6?(1-p)/.4:1};
  }
  const near=result.kind==='whiff'?nearCoverage(result):null;
  const contact=['hit','foul','sacrifice','out'].includes(result.kind)&&playback.action==='swing';
  const power=result.kind==='hit'&&/홈런/.test(result.call||result.label||'');
  if(contact){
    const p=clamp((age-(t.freeze||0))/Math.max(250,(power?t.settleAt-a:560)));
    const ground=/땅볼/.test(result.label||result.call||'');
    const fieldPoint=p=>composition?{x:p.x+composition.mound.x-832,y:p.y+composition.mound.y-580}:p;
    const end=fieldPoint(power?{x:1180,y:90}:result.kind==='foul'?{x:350,y:610}:ground?{x:865,y:580}:{x:865,y:360});
    const control=fieldPoint(power?{x:1040,y:-110}:ground?{x:900,y:640}:{x:810,y:350});
    const ball=quadratic(C,control,end,p),previous=quadratic(C,control,end,Math.max(0,p-.1));
    return {trail,kind:power?'homer':result.kind==='foul'?'foul':result.exact?'exact':'contact',ball,previous,
      radius:Math.max(1.7,7*(1-p)),age,flash:age>=0&&age<180?(1-age/180):0,
      camera:result.exact&&age>=0&&age<150?Math.sin(age*.1)*(1-age/150)*5:0,power,progress:p};
  }
  const z=result.actualZone;
  const dc=near?z%3-near.from%3:0,dr=near?Math.floor(z/3)-Math.floor(near.from/3):0;
  // Horizontal outer misses pass beyond the painted barrel, rather than appearing to hit its middle.
  const delta=near?{x:dc>0?155:dc<0?-90:0,y:dr?dr*38:dc<0?28:0}
    :{x:z===9?95:40+(z%3-1)*20,y:z===9?75:15+(Math.floor(z/3)-1)*18};
  const from={x:C.x+delta.x,y:C.y+delta.y},p=clamp(age/310),end={x:from.x+delta.x*.9+50,y:from.y+330};
  return {trail,kind:near?'near':'pass',ball:lerp(from,end,p),previous:lerp(from,end,Math.max(0,p-.1)),radius:7+7*p,
    age,flash:0,camera:0,near,hidden:p>=1};
}
