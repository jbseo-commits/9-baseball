/* One continuous delivery. Artwork is retargeted by anatomical landmarks;
 * engine results are still published exactly once at the physical contact. */
(function(global){
  'use strict';
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const FILES={stadium:'stadium-v1.png',ready:'pitcher-ready-v1.png',windup:'pitcher-windup.png',coil:'pitcher-coil-break.png',stride:'pitcher-stride.png',cock:'pitcher-late-cocking.png',whip:'pitcher-arm-whip.png',release:'pitcher-release-no-ball.png',follow:'pitcher-follow-through.png'};
  const physical=r=>!!r&&!r.take&&(['hit','foul','out','sacrifice'].includes(r.kind)||['home-run','hit','foul'].includes(r.reaction));
  const hpLoss=r=>Number.isFinite(r?.pressure?.hpLost)?Math.max(0,r.pressure.hpLost):Number.isFinite(r?.hpBefore)&&Number.isFinite(r?.hpAfter)?Math.max(0,r.hpBefore-r.hpAfter):Math.max(0,r?.damage||0);
  const zoneOffset=z=>z===9?{x:1+35/18,y:1}:Number.isInteger(z)&&z>=0&&z<9?{x:z%3-1,y:Math.floor(z/3)-1}:{x:0,y:0};
  class BallparkScene{
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.painter=new global.BallparkDeform.Painter(canvas);this.images={};this.width=1;this.height=1;this.ready=false;this.shot=null;this.snapshot=null;this.prepAt=-1e5;this.trace=[];this.reduced=global.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;this.review=null;this.settled=null;this.setup=null;
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
      const files={...FILES};
      for(const [key,art]of Object.entries(global.BallparkInbetweenArt?.pitcher||{}))files[key]='inbetweens/'+art.file;
      for(const [key,art]of Object.entries(global.BallparkInbetweenArt?.batter||{}))files['batter-'+key]='inbetweens/'+art.file;
      files.woodenBat='inbetweens/'+global.BallparkBatArt.file;
      this.loaded=Promise.all(Object.entries(files).map(([key,file])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images[key]=im;resolve();};im.onerror=()=>reject(new Error('에셋을 불러오지 못했습니다: '+file));im.src=global.BALLPARK_INLINE_ART?.[file]||(file.startsWith('inbetweens/')?'assets/'+file.replace(/\.png$/,'.webp'):'assets/runtime/'+file.replace(/\.png$/,'.webp'));}))).then(()=>{
        this.batterMasks={};
        for(const[key,art]of Object.entries(global.BallparkInbetweenArt.batter)){
          const image=this.images['batter-'+key],body=(this.canvas.ownerDocument||global.document).createElement('canvas');body.width=image.width;body.height=image.height;if(image.url)body.url=image.url;
          const context=body.getContext('2d'),sx=image.width/512,sy=image.height/768;context.drawImage(image,0,0);context.globalCompositeOperation='destination-out';context.lineJoin='round';context.lineCap='round';context.lineWidth=6;
          const regions=Object.entries(art.pins.surfaceRegions).filter(([name])=>name.startsWith('bat')).map(([,region])=>region.polygon);this.batterMasks[key]=regions;
          for(const polygon of regions){context.beginPath();polygon.forEach((point,i)=>context[i?'lineTo':'moveTo'](point[0]*sx,point[1]*sy));context.closePath();context.fill();context.stroke();}
          // Generated cutouts can carry faint haze outside their opaque
          // silhouette. Clip only that low-alpha haze before mesh skinning,
          // so empty texture cannot stretch into a glittering helmet edge.
          const pixels=context.getImageData(0,0,body.width,body.height);if(pixels?.data){for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<128)pixels.data[i]=0;context.putImageData(pixels,0,0);}
          this.images['batter-'+key]=body;
        }
        for(const pose of Object.values(global.BallparkBatterMotion.poses))global.BallparkDeform.compile(pose.pins);
        for(const pose of Object.values(global.BallparkPitcherMotion.poses))global.BallparkDeform.compile(pose.pins);
        this.ready=true;this.frameId=requestAnimationFrame(t=>this.frame(t));
      });
    }
    geometry(){const close=this.width<=520&&this.height>=this.width*.7,cropX=close?(this.width<330?220:180):0,cropW=close?720:960,sx=Math.min(this.width/cropW,this.height/720),sy=sx,a=sx,offsetX=(this.width-cropW*sx)/2,offsetY=(this.height-720*sy)/2;return{sx,sy,a,cropX,cropW,offsetX,offsetY,fieldWidth:cropW*sx,fieldHeight:720*sy,x:v=>offsetX+(v-cropX)*sx,y:v=>offsetY+v*sy};}
    actorPlacement(key,g){const scale=224*g.a/768,foot=[g.x(492),g.y(355)];return{x:foot[0]-363*scale,y:foot[1]-750*scale,w:512*scale,h:768*scale,scale,foot};}
    frontPlant(g,p=this.actorPlacement('ready',g)){return[363+122*g.a/p.scale,750+37*g.a/p.scale];}
    batterPlacement(g){const h=280*g.a,scale=h/768,w=h*2/3,foot=[g.x(370),g.y(635)],rear=global.BallparkBatterMotion.rearAnchor||[112,748];return{x:foot[0]-rear[0]*scale,y:foot[1]-rear[1]*scale,w,h,scale,foot};}
    point(p,placement){return[placement.x+p[0]*placement.scale,placement.y+p[1]*placement.scale];}
    resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.dpr=Math.min(global.devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);const g=this.geometry(),p=this.actorPlacement('ready',g),label=this.canvas.parentElement?.querySelector('.opponent');if(label){const compact=this.height<180;label.dataset.compact=String(compact);label.style.width=compact?'110px':'';label.style.left=(compact?this.width-63:g.x(492))+'px';label.style.top=(compact?6:Math.max(9,p.y-24))+'px';}}
    update(snapshot){if(this.snapshot?.result&&!snapshot?.result&&this.settled)this.beginSetup();this.snapshot=snapshot;}
    beginSetup(now=performance.now()){
      if(!this.settled||this.setup)return;
      this.setup={start:now,duration:(global.BallparkPitcherMotion.setupDuration||900)*(this.reduced?.55:1)};
      this.settled=null;
    }
    prepare(){this.prepAt=performance.now();}
    play(options){if(this.shot)return Promise.resolve({ok:false});this.review=null;const now=performance.now();this.beginSetup(now);const resetRemaining=this.setup?Math.max(0,this.setup.start+this.setup.duration-now):0;return new Promise(resolve=>{this.trace=[];this.shot={...options,start:now+resetRemaining,contacted:false,result:null,step:'',resolve,durationScale:this.reduced?.55:1};});}
    setStep(shot,step){if(shot.step===step)return;shot.step=step;this.trace.push(step);shot.onStep?.(step);}
    contactPoint(zone,g){const b=this.batterPlacement(g),off=zoneOffset(zone),base=this.point(global.BallparkBatterMotion.contactBarrel,b);return[base[0]+off.x*18*g.a,base[1]+off.y*36*g.a];}
    releasePoint(g){const p=this.actorPlacement('ready',g),front=this.frontPlant(g,p);return this.point(global.BallparkPitcherMotion.sample(1000,{frontPlant:front}).releaseHand,p);}
    incoming(t,g,options){const p=clamp((t-1000)/340),q=p**1.7,start=this.releasePoint(g),center=this.contactPoint(4,g),off=t>=1340&&options.result?zoneOffset(options.result.zone):options.flightOffset?.(p)||{x:0,y:0};return[lerp(start[0],center[0],q)+off.x*18*g.a+Math.sin(q*Math.PI)*9*g.a,lerp(start[1],center[1],q)+off.y*36*g.a-Math.sin(q*Math.PI)*14*g.a];}
    motionSample(t,options={}){
      const g=this.geometry(),pp=this.actorPlacement('ready',g),bp=this.batterPlacement(g),front=this.frontPlant(g,pp),result=t>=1340?options.result||null:null;
      const pitcherOptions={frontPlant:front,reaction:result?.reaction,terminal:result?.terminal};
      const pitcher=Number.isFinite(options.setupTime)?global.BallparkPitcherMotion.sampleSetup(options.setupTime,options.setupDuration||900,pitcherOptions):global.BallparkPitcherMotion.sample(options.finished?2400:Math.max(0,t),pitcherOptions);
      let aim=zoneOffset(options.aimZone),off=aim;
      if(t>=1000&&t<1340&&!options.take){
        const current=options.swingOffset?.(clamp((t-1000)/340));
        if(current){off=current;}
        else{
        const observed=options.flightOffset?.(clamp((t-1000)/340))||{x:0,y:0},coverage=options.coverage||[options.aimZone??4];
        const d=Math.min(...coverage.filter(z=>z>=0&&z<9).map(z=>{const q=zoneOffset(z);return Math.max(Math.abs(q.x-observed.x),Math.abs(q.y-observed.y));}));
        const follow=1-smooth((d-.55)/.3);off={x:lerp(aim.x,observed.x,follow),y:lerp(aim.y,observed.y,follow)};
        }
      }
      if(t>=1340&&physical(result))off=zoneOffset(result.zone);
      const nativeOffset=[off.x*18*g.a/bp.scale,off.y*36*g.a/bp.scale];
      const batterTime=Number.isFinite(options.setupTime)?0:t;
      const batter=global.BallparkBatterMotion.sample(batterTime,{now:options.now,take:!!options.take,kind:options.kind,offset:nativeOffset,contact:result?physical(result):null,reaction:result?.reaction});
      return{t,g,pitcher,batter,pitcherPlacement:pp,batterPlacement:bp,releaseHand:this.releasePoint(g),batBarrel:this.point(batter.barrel,bp),batTip:this.point(batter.pins.batTip,bp),grip:this.point(batter.grip,bp),pitcherRearFoot:this.point(pitcher.rearFoot,pp),pitcherFrontFoot:this.point(pitcher.frontFoot,pp),batterRearFoot:this.point(batter.rearFoot,bp),batterFrontFoot:this.point(batter.frontFoot,bp),ball:t>=1000&&t<=1340?this.incoming(t,g,options):null,physicalContact:physical(result)};
    }
    shadow(x,y,rx,ry,alpha=.3){const c=this.ctx;c.save();c.fillStyle='rgba(8,19,23,'+alpha+')';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.restore();}
    drawPitcher(key,g,now,shot,t,frame){const p=frame||this.motionSample(t,{...shot,now}),pose=p.pitcher,placement=p.pitcherPlacement,image=this.images[pose.key];this.painter.draw(this.ctx,image,{x:0,y:0,w:image.width,h:image.height,nativeW:512,nativeH:768},pose.sourcePins,pose.pins,placement);return placement;}
    drawBatter(cell,g,now,load=0,frame){const p=frame||this.motionSample(0,{now}),pose=p.batter,placement=p.batterPlacement,image=this.images['batter-'+pose.sourceKey];if(!pose.file||!image)throw new Error('Rear-view batter artwork missing: '+pose.sourceKey);const rect={x:0,y:0,w:image.width,h:image.height,nativeW:512,nativeH:768};this.painter.draw(this.ctx,image,rect,pose.sourcePins,pose.pins,placement);return placement;}
    batMatrix(frame){const art=global.BallparkBatArt,p=frame.batter.pins,G=p.grip,T=p.batTip,dx=T[0]-G[0],dy=T[1]-G[1],length=Math.hypot(dx,dy),sx=art.tip[0]-art.grip[0],sy=art.tip[1]-art.grip[1],sourceLength=Math.hypot(sx,sy),u=[sx/sourceLength,sy/sourceLength],v=[dx/length,dy/length],along=length/sourceLength,across=art.acrossScale,a=v[0]*u[0]*along+v[1]*u[1]*across,b=v[1]*u[0]*along-v[0]*u[1]*across,c=v[0]*u[1]*along-v[1]*u[0]*across,d=v[1]*u[1]*along+v[0]*u[0]*across;return{a,b,c,d,e:G[0]-a*art.grip[0]-c*art.grip[1],f:G[1]-b*art.grip[0]-d*art.grip[1]};}
    drawBat(frame){const m=this.batMatrix(frame),p=frame.batterPlacement,c=this.ctx,image=this.images.woodenBat;c.save();c.transform(m.a*p.scale,m.b*p.scale,m.c*p.scale,m.d*p.scale,p.x+m.e*p.scale,p.y+m.f*p.scale);c.drawImage(image,0,0,image.width,image.height,0,0,512,768);c.restore();}
    ball(x,y,r,alpha=1,trail=null){const c=this.ctx;c.save();c.globalAlpha=alpha;if(trail){c.strokeStyle='rgba(236,246,223,.38)';c.lineWidth=r*1.15;c.lineCap='round';c.beginPath();c.moveTo(...trail);c.lineTo(x,y);c.stroke();}c.fillStyle='#fff3d0';c.shadowColor='#d5f1e0';c.shadowBlur=r*1.2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle='#a2483f';c.lineWidth=Math.max(.6,r*.13);c.beginPath();c.arc(x-r*.4,y,r*.7,-1.3,1.3);c.stroke();c.beginPath();c.arc(x+r*.4,y,r*.7,1.85,4.45);c.stroke();c.restore();}
    impact(point,g,elapsed,result){if(elapsed<0||elapsed>330||!physical(result)||this.reduced)return;const c=this.ctx,p=clamp(elapsed/330),strong=result.homeRun;c.save();c.globalAlpha=1-p;c.translate(...point);c.strokeStyle=strong?'#ffe7a1':result.reaction==='foul'?'#efd29c':'#c1f4ef';c.lineWidth=(1-p)*(strong?4:2)*g.a;c.beginPath();c.ellipse(0,0,(8+p*(strong?100:55))*g.a,(5+p*25)*g.a,-.3,0,Math.PI*2);c.stroke();for(let i=0;i<(strong?7:4);i++){const angle=i*2.399,d=(9+p*65)*g.a;c.beginPath();c.moveTo(Math.cos(angle)*d*.6,Math.sin(angle)*d*.45);c.lineTo(Math.cos(angle)*d,Math.sin(angle)*d*.8);c.stroke();}c.restore();}
    dust(g,t,point){if(this.reduced||t<835||t>1180)return;const c=this.ctx,p=clamp((t-835)/345);c.save();c.globalAlpha=(1-p)*.2;c.fillStyle='#e6bb83';for(let i=0;i<5;i++){c.beginPath();c.ellipse(point[0]+(i-2)*p*9*g.a,point[1]-Math.sin(p*Math.PI)*(4+i)*g.a,(1+p*4)*g.a,(1+p*2)*g.a,0,0,Math.PI*2);c.fill();}c.restore();}
    damage(g,t,result){const lost=hpLoss(result);if(!['home-run','hit'].includes(result?.reaction)||result.take||!lost||t<1480||t>2350)return;const c=this.ctx,p=clamp((t-1480)/870);c.save();c.globalAlpha=1-p*.6;c.font='800 '+Math.max(17,29*g.a)+'px system-ui';c.textAlign='center';c.fillStyle='#ffe3b1';c.strokeStyle='#542c29';c.lineWidth=3;c.strokeText('−'+lost,g.x(523),g.y(238)-p*17);c.fillText('−'+lost,g.x(523),g.y(238)-p*17);c.restore();}
    // Review is an explicit, separate inspector UI; it never touches a game.
    inspect(time,options){this.review={time,options};}
    clearInspection(){this.review=null;}
    draw(now){
      if(!this.ready)return;const c=this.ctx,g=this.geometry(),shot=this.shot,review=this.review;
      if(this.setup&&now>=this.setup.start+this.setup.duration)this.setup=null;
      let t=review?review.time:shot?(now-shot.start)/shot.durationScale:-1,result=review?review.options.result:shot?.result;
      if(shot&&t>=1340&&!shot.contacted){shot.contacted=true;result=shot.onContact?.()||null;shot.result=result;this.setStep(shot,'contact');}
      if(shot)this.setStep(shot,t<0?'reset':t<1000?'windup':t<1080?'release':t<1340?'flight':t<1420?'contact':t<2400?'reaction':'settled');
      const opts=review?review.options:{...shot,result,now,finished:!shot&&!!this.settled,...(this.setup?{setupTime:(now-this.setup.start)/this.setup.duration*(global.BallparkPitcherMotion.setupDuration||900),setupDuration:global.BallparkPitcherMotion.setupDuration||900}:{})},frame=this.motionSample(t,opts);
      c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.save();
      const age=t-1340;if(shot&&!this.reduced){const shake=physical(result)&&age>=0&&age<70?(1-age/70)*(result.homeRun?1.4:.6):0;c.translate(Math.sin(t*.12)*shake,Math.cos(t*.15)*shake);}
      // Keep plate, chalk and athletes in the same projection at small heights.
      // Wide screens retain a quiet stadium matte around the fitted play field.
      if(g.offsetX>1||g.offsetY>1){c.save();c.filter='blur(18px)';c.drawImage(this.images.stadium,0,0,this.width,this.height);c.restore();c.fillStyle='#07171ed9';c.fillRect(0,0,this.width,this.height);}
      c.drawImage(this.images.stadium,this.images.stadium.width*g.cropX/960,0,this.images.stadium.width*g.cropW/960,this.images.stadium.height,g.offsetX,g.offsetY,g.fieldWidth,g.fieldHeight);c.fillStyle='#102c291a';c.fillRect(0,0,this.width,this.height);
      const light=c.createLinearGradient(0,0,this.width,this.height);light.addColorStop(0,'#f5c57b0b');light.addColorStop(.6,'#0c2e3510');light.addColorStop(1,'#10253118');c.fillStyle=light;c.fillRect(0,0,this.width,this.height);
      const pr=frame.pitcherRearFoot,pf=frame.pitcherFrontFoot,br=frame.batterRearFoot,bf=frame.batterFrontFoot;
      const pc=frame.pitcher.footContact,pg=frame.pitcher.ground,bt=Number.isFinite(opts.setupTime)?0:t,
        groundRear=pc.rear?pr:this.point(pg?.rear||[frame.pitcher.rearFoot[0],750],frame.pitcherPlacement),
        groundFront=pc.front?pf:this.point(pg?.front||[frame.pitcher.frontFoot[0],877],frame.pitcherPlacement);
      const bc=frame.batter.footContact,bgr=this.point(frame.batter.ground.rear,frame.batterPlacement),bgf=this.point(frame.batter.ground.front,frame.batterPlacement);
      this.shadow(...groundRear,15*g.a,4*g.a,pc.rear?.28:.1);this.shadow(...groundFront,17*g.a,4*g.a,pc.front?.28:.1);this.shadow(bgr[0],bgr[1]+2*g.a,22*g.a,5*g.a,bc.rear?.3:.12);this.shadow(...bgf,16*g.a,4*g.a,bc.front?.3:.1);
      this.painter.begin(this.width,this.height,this.dpr);this.drawPitcher(frame.pitcher.key,g,now,opts,t,frame);this.painter.flush(c);this.drawBat(frame);this.painter.begin(this.width,this.height,this.dpr);this.drawBatter(frame.batter.cell,g,now,0,frame);this.painter.flush(c);this.dust(g,t,pf);
      if(t>=1000&&t<1340){const p=clamp((t-1000)/340),point=this.incoming(t,g,opts),old=this.incoming(Math.max(1000,t-16),g,opts);this.ball(...point,lerp(2,7,p**1.7)*g.a,1,old);}
      if(result&&t>=1340&&t<2220){const target=this.contactPoint(result.zone,g),contact=physical(result),p=clamp((t-1340)/(contact?800:240));
        if(contact){const q=1-(1-p)**1.7,end=result.homeRun?[g.x(740),g.y(40)]:result.kind==='foul'||result.reaction==='foul'?[g.x(60),g.y(250)]:['out','sacrifice'].includes(result.kind)?[g.x(610),g.y(470)]:[g.x(720),g.y(410)],arc=result.homeRun?125:['out','sacrifice'].includes(result.kind)?16:65;
          const position=k=>[lerp(target[0],end[0],1-(1-k)**1.7),lerp(target[1],end[1],1-(1-k)**1.7)-Math.sin(k*Math.PI)*arc*g.a];const point=position(p);this.ball(...point,lerp(7,1.5,q)*g.a,1-p*.6,position(Math.max(0,p-.025)));
        }else if(p<1)this.ball(target[0]+p*12*g.a,target[1]+p*65*g.a,7*g.a,1-p);
        this.impact(target,g,age,result);this.damage(g,t,result);
      }
      if(now-this.prepAt<700&&!this.reduced){const p=(now-this.prepAt)/700;c.save();c.globalAlpha=(1-p)*.4;c.strokeStyle='#c7f0d8';c.lineWidth=2;c.beginPath();c.ellipse((br[0]+bf[0])/2,(br[1]+bf[1])/2,(40+p*30)*g.a,(6+p*8)*g.a,0,0,Math.PI*2);c.stroke();c.restore();}c.restore();
      if(shot&&t>=2400){this.lastShot={take:shot.take,aimZone:shot.aimZone,result:shot.result};this.settled={result:shot.result};this.shot=null;shot.resolve({ok:true,result:shot.result});}
    }
    frame(now){this.draw(now);this.frameId=requestAnimationFrame(t=>this.frame(t));}
    destroy(){cancelAnimationFrame(this.frameId);this.observer.disconnect();this.painter.destroy();}
  }
  global.BallparkScene=BallparkScene;
})(window);
