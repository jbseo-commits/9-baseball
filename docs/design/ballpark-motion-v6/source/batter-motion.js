/* One right-handed hitter from the accepted catcher-side rear camera.
   Every active drawing, including idle, taking, bunting and returning, comes
   from the v6 registry. Missing artwork is an explicit error: the old frontal
   atlas is never a fallback. Native source poses own all keyframe anatomy. */
(function(global){
  'use strict';
  const keys=['ready','load','plant','entry','drive','contact','extend','finish','unwind','regrip','bunt'];
  const names=['crown','head','neck','shoulderRear','shoulderFront','elbowRear','elbowFront','grip','pelvis','hipRear','hipFront','kneeRear','kneeFront','ankleRear','ankleFront','rearFoot','frontFoot','batKnob','batTip','barrel'];
  const rear=[112,748];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{const p=clamp(v);return p*p*(3-2*p);};
  const mix=(a,b,p)=>a+(b-a)*p;
  const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
  const clone=pins=>Object.fromEntries(names.map(n=>[n,pins[n].slice()]));
  const upperWeights={crown:.12,head:.12,neck:.18,shoulderRear:.3,shoulderFront:.36,elbowRear:.66,elbowFront:.76,grip:1,batKnob:1,batTip:1,barrel:1};
  const valid=art=>art&&typeof art.file==='string'&&/-v6\.png$/.test(art.file)&&names.every(n=>Array.isArray(art.pins?.[n])&&art.pins[n].length===2&&art.pins[n].every(Number.isFinite));
  function library(){const registry=global.BallparkInbetweenArt?.batter||{};return Object.fromEntries(keys.filter(k=>valid(registry[k])).map(k=>[k,registry[k]]));}
  function requirePose(art,key){if(!art[key])throw new Error('후면 타자 원화가 없습니다: '+key+' (batter-art-v6.js)');return art[key];}
  function registered(source){
    const dx=rear[0]-source.pins.rearFoot[0],dy=rear[1]-source.pins.rearFoot[1];
    return{source,pins:Object.fromEntries(names.map(n=>[n,[source.pins[n][0]+dx,source.pins[n][1]+dy]])),
      registration:{scale:1,angle:0,sourceAnchor:source.pins.rearFoot.slice(),targetAnchor:rear.slice()}};
  }
  function context(required=keys){
    const art=library(),poses={};for(const k of required)poses[k]=registered(requirePose(art,k));
    if(!poses.ready)poses.ready=registered(requirePose(art,'ready'));
    return{art,poses,front:poses.ready.pins.frontFoot.slice()};
  }
  function key(t,id,ctx,override){const p=ctx.poses[id];return{t,id,source:p.source,registration:p.registration,pins:override?clone(override):clone(p.pins)};}
  function loaded(pins){const p=clone(pins);for(const n of Object.keys(upperWeights)){p[n][0]-=2;p[n][1]+=1.5;}return p;}
  function normalTrack(ctx){return[
    key(0,'ready',ctx),key(600,'ready',ctx,loaded(ctx.poses.ready.pins)),key(860,'load',ctx),key(1000,'load',ctx),
    key(1150,'plant',ctx),key(1210,'entry',ctx),key(1270,'drive',ctx),key(1340,'contact',ctx),key(1480,'extend',ctx),
    key(1565,'finish',ctx),key(1810,'finish',ctx),key(1940,'unwind',ctx),key(2070,'regrip',ctx),key(2310,'ready',ctx),key(2400,'ready',ctx)];}
  function reach(pins,delta){const out=clone(pins);for(const[n,w]of Object.entries(upperWeights)){out[n][0]+=delta[0]*w;out[n][1]+=delta[1]*w;}return out;}
  function buntTrack(ctx){
    const p=ctx.poses.bunt.pins,target=materialBat(ctx.poses.contact.pins).barrel,from=materialBat(p).barrel,
      check=reach(p,[target[0]-from[0],target[1]-from[1]]);
    return[key(0,'ready',ctx),key(600,'ready',ctx,loaded(ctx.poses.ready.pins)),key(1000,'ready',ctx),key(1150,'bunt',ctx),
      key(1340,'bunt',ctx,check),key(1610,'bunt',ctx,check),key(2070,'regrip',ctx),key(2310,'ready',ctx),key(2400,'ready',ctx)];
  }
  function slope(track,i,name,axis){
    if(i===0||i===track.length-1)return 0;
    const a=track[i-1],b=track[i],c=track[i+1],h0=b.t-a.t,h1=c.t-b.t,
      d0=(b.pins[name][axis]-a.pins[name][axis])/h0,d1=(c.pins[name][axis]-b.pins[name][axis])/h1;
    if(!d0||!d1||d0*d1<=0)return 0;const w0=2*h1+h0,w1=h1+2*h0;return(w0+w1)/(w0/d0+w1/d1);
  }
  function batFrame(pins){
    const dx=pins.batTip[0]-pins.grip[0],dy=pins.batTip[1]-pins.grip[1];
    return{angle:Math.atan2(dy,dx),length:Math.hypot(dx,dy)};
  }
  function at(track,time){
    if(time<=track[0].t)return{...track[0],pins:clone(track[0].pins)};
    if(time>=track.at(-1).t)return{...track.at(-1),pins:clone(track.at(-1).pins)};
    let i=0;while(track[i+1].t<time)i++;
    const a=track[i],b=track[i+1],h=b.t-a.t,p=clamp((time-a.t)/h),p2=p*p,p3=p2*p,
      h00=2*p3-3*p2+1,h10=p3-2*p2+p,h01=-2*p3+3*p2,h11=p3-p2,pins={};
    for(const n of names)pins[n]=[0,1].map(axis=>h00*a.pins[n][axis]+h10*h*slope(track,i,n,axis)+h01*b.pins[n][axis]+h11*h*slope(track,i+1,n,axis));
    const A=batFrame(a.pins),B=batFrame(b.pins),q=smooth(p);let delta=B.angle-A.angle;
    while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;
    const angle=A.angle+delta*q,u=[Math.cos(angle),Math.sin(angle)],length=mix(A.length,B.length,q);
    pins.batTip=[pins.grip[0]+u[0]*length,pins.grip[1]+u[1]*length];
    const source=p<.5?a:b;return{id:source.id,source:source.source,registration:source.registration,pins};
  }
  function materialBat(pins){
    // One complete bat keeps the same material coordinates throughout every
    // body-source transition. The renderer draws this rigid asset separately;
    // old body drawings' wood landmarks no longer define contact or the knob.
    const art=global.BallparkBatArt;
    if(!art||!['grip','tip','barrel','knob'].every(n=>Array.isArray(art[n])&&art[n].length===2&&art[n].every(Number.isFinite))||!Number.isFinite(art.acrossScale)||art.acrossScale<=0)
      throw new Error('완전한 배트 원화 좌표가 없습니다 (BallparkBatArt)');
    const dx=art.tip[0]-art.grip[0],dy=art.tip[1]-art.grip[1],length=Math.hypot(dx,dy),s=[dx/length,dy/length],
      frame=batFrame(pins),u=[Math.cos(frame.angle),Math.sin(frame.angle)],ratio=frame.length/length;
    const point=q=>{const x=q[0]-art.grip[0],y=q[1]-art.grip[1],along=(x*s[0]+y*s[1])*ratio,across=(-x*s[1]+y*s[0])*art.acrossScale;
      return[pins.grip[0]+along*u[0]-across*u[1],pins.grip[1]+along*u[1]+across*u[0]];};
    return{barrel:point(art.barrel),batKnob:point(art.knob)};
  }
  function lockFoot(pins,foot,ankle,knee,goal){
    const dx=goal[0]-pins[foot][0],dy=goal[1]-pins[foot][1];pins[foot]=goal.slice();
    pins[ankle][0]+=dx;pins[ankle][1]+=dy;pins[knee][0]+=dx*.24;pins[knee][1]+=dy*.24;
  }
  function feet(pins,time,ctx,isBunt){
    const front=ctx.front,lift=isBunt?front:ctx.poses.load.pins.frontFoot;let lead=front.slice();
    if(!isBunt&&time>=600&&time<860){const p=smooth((time-600)/260);lead=[mix(front[0],lift[0],p),mix(front[1],lift[1],p)];}
    else if(!isBunt&&time>=860&&time<=1000)lead=lift.slice();
    else if(!isBunt&&time>1000&&time<1150){const p=smooth((time-1000)/150);lead=[mix(lift[0],front[0],p),mix(lift[1],front[1],p)];}
    lockFoot(pins,'rearFoot','ankleRear','kneeRear',rear);lockFoot(pins,'frontFoot','ankleFront','kneeFront',lead);
  }
  function offset(pins,time,value){
    const xy=[finite(value?.[0]),finite(value?.[1])],fade=smooth((time-1120)/220)*(1-smooth((time-1650)/600));
    for(const[n,w]of Object.entries(upperWeights)){pins[n][0]+=xy[0]*w*fade;pins[n][1]+=xy[1]*w*fade;}
  }
  function packagePose(p,phase,ctx,time,isBunt=false,taking=false){
    Object.assign(p.pins,materialBat(p.pins));
    return{cell:p.id,sourceKey:p.id,file:p.source.file,sourcePins:p.source.pins,pins:p.pins,
      registration:p.registration,occludedPins:p.source.occludedPins||p.source.pins.occludedPins||[],shoeContacts:p.source.shoeContacts||null,camera:p.source.camera,
      barrel:p.pins.barrel.slice(),grip:p.pins.grip.slice(),rearFoot:p.pins.rearFoot.slice(),frontFoot:p.pins.frontFoot.slice(),
      footContact:{rear:true,front:taking||isBunt||time<600||time>=1150},ground:{rear:rear.slice(),front:ctx.front.slice()},phase,bothHandsOnBat:true};
  }
  function readyPose(now=0,takingTime=null){
    const ctx=context(['ready']),r=ctx.poses.ready,p={id:'ready',source:r.source,registration:r.registration,pins:clone(r.pins)};
    if(takingTime!==null){
      const load=smooth(takingTime/950)*(1-smooth((takingTime-1450)/650));
      for(const[n,w]of Object.entries(upperWeights)){p.pins[n][0]-=load*w*2;p.pins[n][1]+=load*w*1.5;}
      return packagePose(p,takingTime<1000?'read':takingTime<1420?'take':'settle',ctx,takingTime,false,true);
    }
    const breath=Math.sin(finite(now)/1050)*1.2;for(const n of Object.keys(upperWeights))p.pins[n][1]+=breath;
    return packagePose(p,'ready',ctx,-1,false,true);
  }
  function sample(time,opts={}){
    const t=finite(time,-1);if(t<0)return readyPose(opts.now);
    if(t>=2400){const ctx=context(['ready']),r=ctx.poses.ready;return packagePose({id:'ready',source:r.source,registration:r.registration,pins:clone(r.pins)},'ready',ctx,t,false,true);}
    if(opts.take)return readyPose(0,t);
    const isBunt=opts.kind==='bunt',ctx=context(isBunt?['ready','bunt','contact','regrip']:keys.filter(k=>k!=='bunt')),p=at(isBunt?buntTrack(ctx):normalTrack(ctx),t);
    feet(p.pins,t,ctx,isBunt);offset(p.pins,t,opts.offset);
    let phase=isBunt?(t<1150?'ready':t<1340?'show-bunt':t<1610?'check-bunt':'recover')
      :t<600?'ready':t<1000?'load':t<1150?'plant':t<1270?'hips':t<1340?'swing':t<1480?'extend':t<1810?'finish':'recover';
    if(!isBunt&&t>=1340&&opts.contact===false&&t<1810)phase='miss-follow-through';
    return packagePose(p,phase,ctx,t,isBunt);
  }
  global.BallparkBatterMotion=Object.freeze({get poses(){return library();},sample,
    get contactBarrel(){return materialBat(context(['ready','contact']).poses.contact.pins).barrel;},get frontPlant(){return context(['ready']).front.slice();},
    rearPlant:Object.freeze(rear.slice()),camera:'catcher-side rear three-quarter',
    keyTimes:Object.freeze({ready:0,load:860,plant:1150,entry:1210,drive:1270,contact:1340,extend:1480,finish:1565,unwind:1940,regrip:2070,readyEnd:2400})});
})(typeof window==='object'?window:globalThis);
