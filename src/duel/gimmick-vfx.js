/* 엘리트·보스 도트 VFX. 120×120 논리 픽셀 캔버스에 캐릭터별 연출을 그린다(투수 뒤, 투수 몸은 가운데 ≈46px).
   규칙: 3단 이상 명암, 정수 픽셀, 오더드 디더로 번지는 빛(그라데이션 금지), 단계(level 0~2)와 등급(boss)이 올라갈수록
   수·길이·속도가 커진다. 시간은 t(초)만 받는 순수 함수라 정지 프레임(reduced motion)도 같은 그림이다. */

export const VFX_SIZE=120;
const CX=60,CY=58,FEET=84;
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];

export const VFX_PALETTES={
  pressure:{glow:['#0a1d52','#1c46c8','#4f95ff','#bfe0ff'],core:'#ffffff',edge:'#6fb7ff'},
  trick:{glow:['#3a0a45','#c21fa8','#ff5fe0','#ffd0f6'],core:'#27e6ff',edge:'#ff5fe0',alt:['#0b3d52','#1aa7c9','#27e6ff','#d4fbff']},
  bluff:{glow:['#2a0714','#7a1230','#d4325a','#ffb0c4'],core:'#ffe3ea',edge:'#d4325a',alt:['#2a0a52','#5b21a8','#9a52f0','#e0c8ff']},
  tyrant:{glow:['#04231a','#0b6a46','#22c98a','#a8ffd8'],core:'#e6fff3',edge:'#34e8a0'},
  halo:{glow:['#1a2440','#6f86c8','#c8dcff','#ffffff'],core:'#ffffff',edge:'#eef6ff'},
  eclipse:{glow:['#2a0a52','#8a3a10','#ffb347','#fff0b8'],core:'#fff8d8',edge:'#ffb347',dark:'#05030a'},
};

const rnd=seed=>{let x=(seed>>>0)||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* 투수 몸통 자리. 면(빛·원판)은 여기를 비워 둬서, 어떤 기기에서 레이어 순서가 달라도 투수가 가려지지 않는다. */
export const inBody=(x,y)=>((x-CX)/18)**2+((y-(CY+2))/31)**2<1;

function px(ctx,x,y,color,a=1,w=1,h=1){
  if(a<=0)return;ctx.globalAlpha=a>1?1:a;ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);
}
function line(ctx,x0,y0,x1,y1,color,a=1){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
  for(let n=0;n<400;n++){px(ctx,x0,y0,color,a);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}
}
/* 오더드 디더로 번지는 타원 빛: 가장자리는 성기고 안쪽은 촘촘하다. tones는 어두운 색→밝은 색 4개. */
function glow(ctx,cx,cy,rx,ry,tones,strength=1,t=0){
  const x0=Math.max(0,Math.floor(cx-rx)),x1=Math.min(VFX_SIZE-1,Math.ceil(cx+rx));
  const y0=Math.max(0,Math.floor(cy-ry)),y1=Math.min(VFX_SIZE-1,Math.ceil(cy+ry));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const d=Math.hypot((x-cx)/rx,(y-cy)/ry);if(d>=1||inBody(x,y))continue;
    const v=Math.pow(1-d,1.4)*strength;
    const th=(BAYER[(y&3)*4+(x&3)]+.5)/16;
    if(v<=th*.85)continue;
    const band=v>.78?3:v>.5?2:v>.28?1:0;
    px(ctx,x,y,tones[band],.92);
  }
}
function ringEllipse(ctx,cx,cy,rx,ry,tones,t,dash=3,speed=.6){
  const steps=Math.ceil((rx+ry)*3.2);
  for(let i=0;i<steps;i++){
    const a=i/steps*Math.PI*2,k=((i+Math.floor(t*speed*steps*.15))%(dash*2))<dash;
    const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;
    const front=Math.sin(a)>0; // 몸 앞쪽 호가 더 밝다
    px(ctx,x,y+1,tones[0],.9);
    px(ctx,x,y,front?tones[3]:tones[2],k?1:.55);
  }
}
function motes(ctx,t,count,tones,{rise=1,spread=34,seed=1,top=FEET,span=60}={}){
  const r=rnd(seed);
  for(let i=0;i<count;i++){
    const ox=(r()-.5)*2*spread,ph=r(),sp=(.18+r()*.3)*rise,life=((t*sp+ph)%1);
    const x=CX+ox+Math.sin(t*1.7+i)*3,y=top-life*span;
    const a=Math.sin(life*Math.PI);
    px(ctx,x,y,tones[1+(i%3)],a);if(i%4===0)px(ctx,x,y-1,tones[3],a*.8);
  }
}

/* ── 캐릭터별 ── */
function drawPressure(ctx,t,lv,boss){ // 코발트: 전류
  const P=VFX_PALETTES.pressure,k=1+lv*.35+(boss?.3:0);
  glow(ctx,CX,CY+4,34*k,36*k,P.glow,.55+lv*.12,t);
  ringEllipse(ctx,CX,FEET,28*k,7,[P.glow[1],P.glow[2],P.edge,P.core],t,3,1.2);
  const frame=Math.floor(t*(10+lv*4)),r=rnd(frame*2654435761+7);
  const arcs=3+lv*2+(boss?2:0);
  for(let n=0;n<arcs;n++){
    const a0=r()*Math.PI*2,r0=15+r()*6,r1=32+r()*14*k;
    let x=CX+Math.cos(a0)*r0,y=CY+Math.sin(a0)*r0*.9,ang=a0;
    const segs=5+Math.floor(r()*3),pts=[[x,y]];
    for(let s=1;s<=segs;s++){const rr=r0+(r1-r0)*s/segs;ang+=(r()-.5)*.9;x=CX+Math.cos(ang)*rr+(r()-.5)*5;y=CY+Math.sin(ang)*rr*.9+(r()-.5)*5;pts.push([x,y]);}
    for(let s=1;s<pts.length;s++){
      line(ctx,pts[s-1][0],pts[s-1][1]+1,pts[s][0],pts[s][1]+1,P.glow[1],.9);
      line(ctx,pts[s-1][0]+1,pts[s-1][1],pts[s][0]+1,pts[s][1],P.edge,.95);
      line(ctx,pts[s-1][0],pts[s-1][1],pts[s][0],pts[s][1],P.core,1);
    }
    if(r()<.6){const e=pts[pts.length-1];px(ctx,e[0]+1,e[1],P.core);px(ctx,e[0]-1,e[1],P.edge);px(ctx,e[0],e[1]-1,P.edge);px(ctx,e[0],e[1]+1,P.edge);}
  }
  motes(ctx,t,10+lv*6,[P.glow[0],P.glow[2],P.edge,P.core],{rise:1.6,seed:11});
}
function drawTrick(ctx,t,lv,boss){ // 네온: 글리치
  const P=VFX_PALETTES.trick,k=1+lv*.3+(boss?.3:0);
  const jit=Math.floor(t*12)%3-1;
  glow(ctx,CX-4+jit*2,CY+4,32*k,34*k,P.glow,.5+lv*.1,t);
  glow(ctx,CX+4-jit*2,CY+4,32*k,34*k,P.alt,.42+lv*.1,t);
  ringEllipse(ctx,CX,FEET,28*k,7,[P.glow[1],P.glow[2],P.edge,'#ffffff'],t,2,2);
  ringEllipse(ctx,CX+2,FEET+1,26*k,6,[P.alt[1],P.alt[2],P.core,'#ffffff'],t,2,-1.5);
  const frame=Math.floor(t*(9+lv*4)),r=rnd(frame*40503+3);
  const bars=6+lv*4+(boss?3:0);
  for(let i=0;i<bars;i++){
    const y=22+Math.floor(r()*70),w=8+Math.floor(r()*34),x=CX-w/2+(r()-.5)*40,c=r()<.5?P.edge:P.core;
    px(ctx,x,y,c,.85,w,1+(r()<.3?1:0));
    if(r()<.5)px(ctx,x+(r()<.5?-3:3),y+1,r()<.5?P.alt[1]:P.glow[1],.7,Math.floor(w*.6),1);
  }
  for(let i=0;i<5+lv*3;i++){ // 흩어지는 블록
    const bx=CX+(r()-.5)*70,by=30+r()*55,s=2+Math.floor(r()*3);
    px(ctx,bx,by,r()<.5?P.edge:P.core,.9,s,s);
  }
  motes(ctx,t,8+lv*4,[P.glow[0],P.edge,P.core,'#ffffff'],{rise:1.2,seed:23});
}
function drawBluff(ctx,t,lv,boss){ // 와인: 소용돌이 + 핏방울
  const P=VFX_PALETTES.bluff,k=1+lv*.3+(boss?.3:0);
  glow(ctx,CX,CY+6,34*k,36*k,P.glow,.8+lv*.1,t);
  glow(ctx,CX,CY-4,24*k,26*k,P.alt,.5+lv*.08,t);
  ringEllipse(ctx,CX,FEET,27*k,7,[P.glow[1],P.glow[2],P.edge,P.core],t,4,.8);
  const n=7+lv*3+(boss?3:0);
  for(let i=0;i<n;i++){
    const a=t*(1.1+lv*.35)+i*(Math.PI*2/n),rad=20+(i%3)*6+Math.sin(t*1.3+i)*3;
    const x=CX+Math.cos(a)*rad,y=CY+4+Math.sin(a)*rad*.55,front=Math.sin(a)>0;
    const tones=i%2?P.alt:P.glow;
    px(ctx,x,y,tones[1],1,3,3);px(ctx,x,y,tones[2],1,2,2);px(ctx,x,y,tones[3],front?1:.6,1,1); // 방울
    px(ctx,x+1,y-2,tones[2],.8); // 꼬리
    const tx=CX+Math.cos(a-.35)*rad,ty=CY+4+Math.sin(a-.35)*rad*.55;px(ctx,tx,ty,tones[1],.6);
  }
  const r=rnd(5);
  for(let i=0;i<6+lv*2;i++){ // 떨어지는 핏방울
    const life=(t*(.5+r()*.4)+r())%1,x=CX+(r()-.5)*54,y=20+life*66;
    px(ctx,x,y,P.edge,1-life*.4,2,2);px(ctx,x,y-2,P.glow[2],.7,1,2);if(life>.92)px(ctx,x-2,FEET,P.edge,.9,6,1);
  }
  const s=Math.floor(t*6)%4,r2=rnd(Math.floor(t*3)+9);
  for(let i=0;i<3;i++){const x=CX+(r2()-.5)*60,y=26+r2()*40;if((s+i)%2){px(ctx,x,y,P.core);px(ctx,x-1,y,P.edge);px(ctx,x+1,y,P.edge);px(ctx,x,y-1,P.edge);px(ctx,x,y+1,P.edge);}}
}
function drawTyrant(ctx,t,lv,boss){ // 에메랄드: 가시 덩굴
  const P=VFX_PALETTES.tyrant,k=1+lv*.3+(boss?.35:0);
  glow(ctx,CX,FEET-6,42*k,20*k,P.glow,1,t);
  glow(ctx,CX,CY+6,30*k,36*k,P.glow,.6+lv*.1,t);
  ringEllipse(ctx,CX,FEET,30*k,8,[P.glow[1],P.glow[2],P.edge,P.core],t,5,.5);
  const n=6+lv*2+(boss?2:0),r=rnd(77);
  for(let i=0;i<n;i++){
    const side=i%2?1:-1,bx=CX+side*(12+(i>>1)*(46/n)*2+r()*4),h=24+r()*30*k;
    const grow=clamp(.55+.45*Math.sin(t*.7+i*1.3),.3,1),H=h*grow;
    let px0=bx,py0=FEET+1;
    for(let s=0;s<H;s++){
      const sway=Math.sin(s*.16+t*1.4+i)*3.2*(s/H)+side*(s/H)*s*.12*(i%3?1:-1);
      const x=bx+sway,y=FEET-s;
      px(ctx,x,y,P.glow[1],1,3,1);px(ctx,x+1,y,P.glow[2],1,1,1);px(ctx,x+2,y,P.edge,.9,1,1);
      if(s%9===4){const lx=x+side*3;px(ctx,lx,y,P.edge,1,3,2);px(ctx,lx+side*2,y-1,P.core,1,1,1);}  // 가시/잎
      if(s%13===7)px(ctx,x-side*3,y-1,P.glow[3],1,1,2);
      px0=x;py0=y;
    }
    px(ctx,px0,py0-1,P.core,1,2,2); // 순
  }
  motes(ctx,t,12+lv*5,[P.glow[0],P.glow[2],P.edge,P.core],{rise:.9,seed:31,spread:40,span:56});
}
function drawHalo(ctx,t,lv,boss){ // 플래티넘: 후광 + 빛기둥
  const P=VFX_PALETTES.halo,k=1+lv*.25+(boss?.3:0);
  glow(ctx,CX,CY-2,34*k,40*k,[P.glow[0],P.glow[1],P.glow[2],P.glow[3]],.4+lv*.1,t);
  const ry=3.5+Math.sin(t*1.6)*.6,rx=15*k,cy=CY-24+Math.sin(t*1.3)*1.5;
  for(let w=0;w<3;w++)ringEllipse(ctx,CX,cy-w*0,rx+w*0,ry+w*.0,[P.glow[1],P.glow[2],P.glow[3],'#ffffff'],t,99,0);
  glow(ctx,CX,cy,rx+8,ry+8,P.glow,.55,t);
  ringEllipse(ctx,CX,cy,rx,ry,[P.glow[1],P.glow[3],'#ffffff','#ffffff'],t,99,0);
  ringEllipse(ctx,CX,cy-1,rx-2,ry-.8,[P.glow[2],P.glow[3],'#ffffff','#ffffff'],t,99,0);
  const sa=t*(1.4+lv*.4);px(ctx,CX+Math.cos(sa)*rx,cy+Math.sin(sa)*ry,'#ffffff');px(ctx,CX+Math.cos(sa)*rx+1,cy+Math.sin(sa)*ry,P.edge);px(ctx,CX+Math.cos(sa)*rx-1,cy+Math.sin(sa)*ry,P.edge);px(ctx,CX+Math.cos(sa)*rx,cy+Math.sin(sa)*ry-1,P.edge);
  const beams=4+lv*2;
  for(let i=0;i<beams;i++){
    const bx=CX+(i-(beams-1)/2)*(52/beams)+Math.sin(t*.8+i)*1.5,top=cy+4;
    for(let y=top;y<FEET;y+=1){
      const v=1-(y-top)/(FEET-top),th=(BAYER[(y&3)*4+((Math.round(bx))&3)]+.5)/16;
      if(v*.9>th)px(ctx,bx,y,v>.6?P.glow[3]:P.glow[2],.55*(.6+.4*Math.sin(t*2+i)),1+(v>.7?1:0),1);
    }
  }
  ringEllipse(ctx,CX,FEET,26*k,6.5,[P.glow[1],P.glow[2],P.glow[3],'#ffffff'],t,6,.4);
  motes(ctx,t,12+lv*6,[P.glow[1],P.glow[2],P.glow[3],'#ffffff'],{rise:.8,seed:41,spread:36,span:60}); // 깃털
}
function drawEclipse(ctx,t,lv,boss){ // 블랙 이클립스: 검은 태양 + 코로나
  const P=VFX_PALETTES.eclipse,k=1+lv*.22+(boss?.2:0),R=24*k,cx=CX,cy=CY-2;
  glow(ctx,cx,cy,R*2.1,R*2.1,P.glow,.8+lv*.1,t);
  const rays=22+lv*6;
  for(let i=0;i<rays;i++){
    const a=i/rays*Math.PI*2+t*(.12+lv*.05),len=R*(.45+.55*(.5+.5*Math.sin(t*1.6+i*2.3)))*(1+lv*.25);
    for(let s=0;s<len;s+=1){
      const x=cx+Math.cos(a)*(R+2+s),y=cy+Math.sin(a)*(R+2+s)*.96;
      const f=s/len,c=f<.3?P.core:f<.6?P.edge:P.glow[1];
      px(ctx,x,y,c,1-f*.7,f<.5?2:1,f<.5?2:1);
    }
  }
  for(let y=Math.floor(cy-R-3);y<=cy+R+3;y++)for(let x=Math.floor(cx-R-3);x<=cx+R+3;x++){ // 원판
    const d=Math.hypot(x-cx,y-cy);
    if(d<=R){if(!inBody(x,y))px(ctx,x,y,P.dark,1);}
    else if(d<=R+1.6)px(ctx,x,y,P.core,1);
    else if(d<=R+3.2)px(ctx,x,y,P.edge,(BAYER[(y&3)*4+(x&3)]+.5)/16<.7?1:0);
  }
  for(let i=0;i<2+lv;i++){ // 홍염
    const a=t*.5+i*2.1,rr=R+2;
    for(let s=0;s<14;s++){const aa=a+s*.035,h=Math.sin(s/14*Math.PI)*(6+lv*3)*(.7+.3*Math.sin(t*2+i));px(ctx,cx+Math.cos(aa)*(rr+h),cy+Math.sin(aa)*(rr+h),s%2?P.edge:P.core,.95);}
  }
  ringEllipse(ctx,CX,FEET,28*k,7,[P.glow[1],P.glow[2],P.edge,P.core],t,4,.5);
  const r=rnd(61);
  for(let i=0;i<10+lv*6;i++){ // 위로 빨려드는 어둠 조각
    const life=(t*(.25+r()*.25)+r())%1,x=CX+(r()-.5)*70,y=FEET-life*70;
    px(ctx,x,y,r()<.5?P.dark:P.glow[0],Math.sin(life*Math.PI),2,2);px(ctx,x,y,P.edge,Math.sin(life*Math.PI)*.8,1,1);
  }
}
const DRAW={pressure:drawPressure,trick:drawTrick,bluff:drawBluff,tyrant:drawTyrant,halo:drawHalo,eclipse:drawEclipse};
export const VFX_IDS=Object.keys(DRAW);
export const phaseLevel=phase=>phase==='critical'?2:phase==='pressured'?1:0;

/* 한 프레임. ctx는 VFX_SIZE×VFX_SIZE 캔버스의 2D 컨텍스트. */
export function drawGimmickVfx(ctx,id,t,{level=0,boss=false}={}){
  const draw=DRAW[id];ctx.clearRect(0,0,VFX_SIZE,VFX_SIZE);if(!draw)return false;
  ctx.save();ctx.imageSmoothingEnabled=false;draw(ctx,t,clamp(level,0,2),!!boss);ctx.restore();ctx.globalAlpha=1;return true;
}
