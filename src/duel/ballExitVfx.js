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
    trailCap:homer?22:extra?12:10,
    segmentCap:homer?15:extra?8:6,
    coreWidth:homer?2.75:extra?1.7:1.5,
    coreAlpha:homer?.86:extra?.5:.42,
    burstMs:homer?150:extra?120:95,
    wakeMs:homer?560:extra?420:300,
    launchMs:homer?235:extra?180:150,
  };
}

export function drawBallExitTrail(graphics,trail,{grade='',alpha=1,ballRadius=1,elapsed=0}={}){
  if(!graphics||trail.length<2)return;
  const profile=ballExitProfile(grade);
  const maxSeg=Math.min(trail.length-1,profile.segmentCap);
  const wake=Math.max(0,1-elapsed/profile.wakeMs);
  const launch=Math.max(0,1-elapsed/profile.launchMs);

  for(let i=0;i<maxSeg;i++){
    const q0=trail[i],q1=trail[i+1],fade=Math.max(0,1-i/profile.segmentCap);
    const headBoost=i<4?1+launch*(.48-i*.09):1;
    const segAlpha=alpha*profile.coreAlpha*fade;
    if(segAlpha<=0)continue;
    if(profile.homer){
      graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:q0.r*5.4*headBoost*(1-i/profile.segmentCap*.5),color:0xff6b21,alpha:segAlpha*(.09+.13*wake),cap:'round'});
      graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:q0.r*3.5*headBoost*(1-i/profile.segmentCap*.45),color:0xffa62b,alpha:segAlpha*(.23+.2*wake),cap:'round'});
    }
    graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:q0.r*profile.coreWidth*headBoost*(1-i/profile.segmentCap*.35),color:profile.power?0xffd32a:0xffffff,alpha:segAlpha,cap:'round'});
    if(profile.homer)graphics.moveTo(q0.x,q0.y).lineTo(q1.x,q1.y).stroke({width:Math.max(1,q0.r*.76*headBoost),color:0xffffff,alpha:segAlpha*(.44+.28*wake),cap:'round'});
  }

  if(profile.homer){
    const burst=Math.max(0,1-elapsed/profile.burstMs);
    const flare=Math.max(0,1-elapsed/profile.wakeMs);
    if(flare>0){
      const head=trail[0],r=ballRadius;
      graphics.circle(head.x,head.y,r*(4.6+flare*2.1)).fill({color:0xff6b21,alpha:.07*alpha*flare});
      graphics.circle(head.x,head.y,r*(3.05+flare*1.25)).fill({color:0xffb52e,alpha:.17*alpha*flare});
      graphics.circle(head.x,head.y,r*(1.75+flare*.55)).fill({color:0xffffff,alpha:.28*alpha*flare});
      if(burst>0){
        const ray=r*(5.5+burst*5.5),thk=Math.max(1,r*.68*burst);
        graphics.rect(head.x-ray,head.y-thk/2,ray*2,thk).fill({color:0xffffff,alpha:.54*alpha*burst});
        graphics.rect(head.x-thk/2,head.y-ray,thk,ray*2).fill({color:0xffffff,alpha:.4*alpha*burst});
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
    graphics.circle(q.x,q.y,q.r*(1-i*.03)).fill({color:hit&&exited?(profile.homer?0xffd32a:0xffe08a):0xffffff,alpha:alpha*(profile.homer?.46:.32)*fade});
  });
}
