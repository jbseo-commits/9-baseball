const HOMER_GRADES=new Set(['homer','grand-slam']);
const EXTRA_GRADES=new Set(['extra']);
const POWER_GRADES=new Set(['dead-center','extra','homer','grand-slam']);

export function ballExitProfile(grade=''){
  const homer=HOMER_GRADES.has(grade);
  const extra=EXTRA_GRADES.has(grade);
  const power=POWER_GRADES.has(grade);
  return {
    homer,
    extra,
    power,
    trailCap:homer?20:extra?12:10,
    segmentCap:homer?14:extra?8:6,
    coreWidth:homer?2.6:extra?1.7:1.5,
    coreAlpha:homer?.82:extra?.5:.42,
    burstMs:homer?175:extra?120:95,
    wakeMs:homer?650:extra?420:300,
  };
}

export function drawBallExitTrail(graphics,trail,{grade='',alpha=1,ballRadius=1,elapsed=0}={}){
  if(!graphics||trail.length<2)return;
  const profile=ballExitProfile(grade);
  const maxSeg=Math.min(trail.length-1,profile.segmentCap);
  const wake=Math.max(0,1-elapsed/profile.wakeMs);

  for(let i=0;i<maxSeg;i++){
    const q0=trail[i],q1=trail[i+1],fade=Math.max(0,1-i/profile.segmentCap);
    const segAlpha=alpha*profile.coreAlpha*fade;
    if(segAlpha<=0)continue;
    if(profile.homer){
      graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:q0.r*5.2*(1-i/profile.segmentCap*.5),color:0xff6b21,alpha:segAlpha*(.1+.12*wake),cap:'round'});
      graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:q0.r*3.4*(1-i/profile.segmentCap*.45),color:0xffa62b,alpha:segAlpha*(.24+.18*wake),cap:'round'});
    }
    graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:q0.r*profile.coreWidth*(1-i/profile.segmentCap*.35),color:profile.power?0xffd32a:0xffffff,alpha:segAlpha,cap:'round'});
    if(profile.homer){graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:Math.max(1,q0.r*.72),color:0xffffff,alpha:segAlpha*(.46+.26*wake),cap:'round'});}
  }

  if(profile.homer){
    const burst=Math.max(0,1-elapsed/profile.burstMs);
    const flare=Math.max(0,1-elapsed/profile.wakeMs);
    if(flare>0){
      const head=trail[0],r=ballRadius;
      graphics.circle(head.x,head.y,r*(4.8+flare*2.4)).fill({color:0xff6b21,alpha:.08*alpha*flare});
      graphics.circle(head.x,head.y,r*(3.25+flare*1.4)).fill({color:0xffb52e,alpha:.18*alpha*flare});
      graphics.circle(head.x,head.y,r*(1.9+flare*.65)).fill({color:0xffffff,alpha:.3*alpha*flare});
      if(burst>0){
        const ray=r*(6+burst*6),thk=Math.max(1,r*.72*burst);
        graphics.rect(head.x-ray,head.y-thk/2,ray*2,thk).fill({color:0xffffff,alpha:.58*alpha*burst});
        graphics.rect(head.x-thk/2,head.y-ray,thk,ray*2).fill({color:0xffffff,alpha:.44*alpha*burst});
      }
    }
  }
}

export function drawBallTrailDots(graphics,trail,{grade='',alpha=1,hit=false,exited=false}={}){
  if(!graphics)return;
  const profile=ballExitProfile(grade);
  trail.forEach((q,i)=>{
    if(!i)return;
    const fade=Math.max(0,1-i/profile.trailCap);
    graphics.circle(q.x,q.y,q.r*(1-i*.032)).fill({color:hit&&exited?(profile.homer?0xffd32a:0xffe08a):0xffffff,alpha:alpha*(profile.homer?.48:.32)*fade});
  });
}
