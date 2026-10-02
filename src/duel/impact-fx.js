/* 타격감 임팩트 연출. 공이 들어온 존 칸(접점)에서 시작해 장면 전체에 그려지는 도트 이펙트.
   등급(grade)별로 다르게 그린다: 안타 계열은 플래시·충격파·속도선·불꽃·타구 궤적, 파울은 챙·분필 가루,
   헛스윙은 스윙 궤적·바람선·미트 팝, 삼진은 거기에 붉은 X.
   순수 함수: createImpactState(params)로 한 번 입자를 만들고, drawImpactFx(ctx,state,t)가 t초 시점의 프레임을 그린다.
   좌표는 논리 픽셀(장면 크기 / PX). 정수 픽셀, 3단 이상 명암. */

export const IMPACT_PX=3;

const rnd=seed=>{let x=(seed>>>0)||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=p=>1-Math.pow(1-clamp(p,0,1),2.4);

const PAL={
  gold:['#fffbe0','#ffe27a','#ffa63a','#d4552a'],
  hot:['#ffffff','#fff3a8','#ffb347','#ff5a2a'],
  cool:['#ffffff','#bfe6ff','#5aa8ff','#2a4cc8'],
  red:['#ffffff','#ffb0a0','#ff4a3a','#8a1620'],
  dust:['#f6f0dc','#d8cfb0','#a89e80','#6e664e'],
  leaf:['#ffffff','#d0ffe8','#5be0a8','#1d8f68'],
};

/* 등급 → 연출 프로필. power는 세기, kind는 그리는 방식. */
export function impactProfile(grade){
  switch(grade){
    case 'grand-slam':return {kind:'hit',power:3.2,pal:PAL.gold,flight:'homer',confetti:true};
    case 'homer':return {kind:'hit',power:2.6,pal:PAL.gold,flight:'homer',confetti:true};
    case 'extra':return {kind:'hit',power:1.9,pal:PAL.hot,flight:'gap'};
    case 'dead-center':return {kind:'hit',power:1.5,pal:PAL.hot,flight:'line'};
    case 'solid':case 'hit':return {kind:'hit',power:1,pal:PAL.hot,flight:'line'};
    case 'lucky':return {kind:'hit',power:.8,pal:PAL.hot,flight:'bloop'};
    case 'jammed':return {kind:'hit',power:.7,pal:PAL.dust,flight:'jam'};
    case 'battle-foul':return {kind:'foul',power:.9,pal:PAL.gold};
    case 'foul':return {kind:'foul',power:.7,pal:PAL.gold};
    case 'near-miss':case 'fooled':case 'chase':return {kind:'whiff',power:.8,pal:PAL.cool};
    case 'near-miss-k':case 'chase-k':case 'strikeout':return {kind:'whiff',power:1.3,pal:PAL.cool,k:true};
    case 'called-k':case 'frozen':return {kind:'called',power:1.2,pal:PAL.red,k:true};
    case 'called':return {kind:'called',power:.7,pal:PAL.red};
    case 'out':case 'sacrifice':case 'sacrifice-run':return {kind:'hit',power:.6,pal:PAL.dust,flight:'jam'};
    default:return null;
  }
}
export const IMPACT_GRADES=['grand-slam','homer','extra','dead-center','solid','lucky','jammed','battle-foul','foul','near-miss','fooled','chase','near-miss-k','chase-k','strikeout','called-k','called'];

/* params: {W,H,px,py,grade,seed}  (W,H,px,py = 논리 픽셀) */
export function createImpactState({W,H,px,py,grade,seed=1}){
  const prof=impactProfile(grade);if(!prof)return null;
  const r=rnd(seed*2654435761+97),p=prof.power;
  const st={W,H,px,py,prof,grade,seed};
  st.sparks=Array.from({length:Math.round((prof.kind==='hit'?14:prof.kind==='foul'?9:5)+(prof.kind==='hit'?12*p:3*p))},(_,i)=>{
    const dir=prof.kind==='hit'?(-.9+r()*1.8):(r()*Math.PI*2);
    return {a:prof.kind==='hit'?dir-.15:dir,sp:40+r()*(80+40*p),life:.22+r()*.4,size:r()>.7?2:1,c:i%4,star:prof.kind==='hit'&&p>=1.5&&r()>.8};
  });
  st.rays=Array.from({length:Math.round(prof.kind==='hit'?12+8*p:prof.kind==='whiff'?4:8)},(_,i)=>({
    a:(Math.PI*2/ (prof.kind==='hit'?12+8*p:8))*i+(r()-.5)*.25,r0:6+r()*6,len:16+r()*(18+12*p),c:i%3,
  }));
  st.dust=Array.from({length:prof.kind==='foul'||prof.kind==='called'||prof.kind==='whiff'?8+Math.round(6*p):prof.grade==='jammed'?10:0},()=>({a:r()*Math.PI*2,sp:10+r()*26,life:.35+r()*.4,s:2+Math.floor(r()*3)}));
  st.confetti=prof.confetti?Array.from({length:Math.round(24+14*p)},(_,i)=>({x:r()*W,y:-r()*H*.5,vy:30+r()*60,vx:(r()-.5)*24,c:i%4,star:r()>.6,ph:r()*6})):[];
  st.wind=Array.from({length:7+Math.round(6*p)},()=>({y:py+(r()-.5)*H*.22,x0:px-W*.05+(r()-.5)*W*.3,len:18+r()*34,life:.18+r()*.2,c:r()>.5?1:2}));
  return st;
}

/* 단일 도트(정수 좌표) */
function dot(ctx,x,y,c,a=1,w=1,h=1){if(a<=0)return;ctx.globalAlpha=a>1?1:a;ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function ray(ctx,x,y,a,r0,r1,c,alpha,thick=1){
  const dx=Math.cos(a),dy=Math.sin(a);
  for(let d=r0;d<r1;d+=1){dot(ctx,x+dx*d,y+dy*d,c,alpha*(1-(d-r0)/Math.max(1,r1-r0)*.35),thick,thick);}
}
function ringPx(ctx,cx,cy,rad,pal,alpha,thick=2){
  const steps=Math.max(16,Math.round(rad*5));
  for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2,x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad*.86;
    dot(ctx,x,y,pal[1],alpha,thick,thick);dot(ctx,x,y-1,pal[0],alpha*.9,1,1);dot(ctx,x,y+thick,pal[3],alpha*.7,1,1);}
}
function star(ctx,cx,cy,R,pal,alpha){
  for(let d=0;d<=R;d++){const w=Math.max(1,Math.round((R-d)/R*3));
    const c=d<R*.3?pal[0]:d<R*.65?pal[1]:pal[2];
    dot(ctx,cx+d,cy-(w>>1),c,alpha,1,w);dot(ctx,cx-d,cy-(w>>1),c,alpha,1,w);
    dot(ctx,cx-(w>>1),cy+d,c,alpha,w,1);dot(ctx,cx-(w>>1),cy-d,c,alpha,w,1);}
  const D=Math.round(R*.55);for(let d=0;d<=D;d++){const c=d<D*.4?pal[0]:pal[1];
    dot(ctx,cx+d,cy+d,c,alpha*.9);dot(ctx,cx-d,cy+d,c,alpha*.9);dot(ctx,cx+d,cy-d,c,alpha*.9);dot(ctx,cx-d,cy-d,c,alpha*.9);}
  for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(Math.abs(x)+Math.abs(y)<=3)dot(ctx,cx+x,cy+y,pal[0],alpha);
}
function plus(ctx,x,y,c,a){dot(ctx,x,y,c,a);dot(ctx,x-1,y,c,a*.8);dot(ctx,x+1,y,c,a*.8);dot(ctx,x,y-1,c,a*.8);dot(ctx,x,y+1,c,a*.8);}

/* 타구 궤적: 접점에서 날아가는 점. p는 0~1 진행. */
function flightPoint(st,flight,p){
  const {W,H,px,py}=st;
  const T={homer:[W*1.2,-H*.3,-.12],gap:[W*1.05,H*.22,-.12],line:[W*1.02,H*.3,-.03],bloop:[W*.74,H*.48,-.24],jam:[W*.55,py+H*.12,.05]}[flight]||[W,H*.3,0];
  const e=1-Math.pow(1-clamp(p,0,1),flight==='homer'?1.5:1.9),x=px+(T[0]-px)*e;let y=py+(T[1]-py)*e;
  y+=Math.sin(Math.PI*e)*H*T[2];
  return [x,y];
}
const flightDur={homer:.95,gap:.7,line:.55,bloop:.85,jam:.5};

export function drawImpactFx(ctx,st,t){
  if(!st)return;
  const {W,H,px,py,prof}=st,p=prof.power,pal=prof.pal;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,W,H);

  /* 1) 전체 화면 플래시(히트스톱 느낌): 첫 몇 프레임만 */
  const fl=prof.kind==='hit'||prof.kind==='foul'?clamp(1-t/.1,0,1)*Math.min(.62,.2+.14*p):prof.k?clamp(1-t/.12,0,1)*.28:0;
  if(fl>0){ctx.globalAlpha=fl;ctx.fillStyle=prof.kind==='whiff'||prof.kind==='called'?'#9ec8ff':'#ffffff';ctx.fillRect(0,0,W,H);}

  if(prof.kind==='hit'){
    /* 2) 접점 별: 순간 커졌다 꺼진다 */
    const sr=(10+11*p)*(t<.05?t/.05:1),sa=clamp(1-(t-.04)/.14,0,1);
    if(sa>0)star(ctx,px,py,Math.round(sr),pal,sa);
    /* 3) 속도선(방사) */
    const ra=clamp(1-t/.26,0,1);
    if(ra>0)for(const s of st.rays){const g=ease(t/.12);ray(ctx,px,py,s.a,s.r0+g*14,s.r0+g*14+s.len*ra,pal[s.c],ra*.9,p>1.4&&s.c===0?2:1);}
    /* 4) 충격파 링 2겹 */
    const k1=t/(.2+.05*p);if(k1<1)ringPx(ctx,px,py,6+ease(k1)*(20+16*p),pal,1-k1,p>1.4?3:2);
    const k2=(t-.05)/(.28+.05*p);if(k2>0&&k2<1)ringPx(ctx,px,py,4+ease(k2)*(30+22*p),pal,(1-k2)*.7,2);
    /* 5) 불꽃 */
    for(const s of st.sparks){const q=t/s.life;if(q<0||q>=1)continue;
      const dd=1-q*.4,x=px+Math.cos(s.a)*s.sp*q*dd,y=py+Math.sin(s.a)*s.sp*q*dd+q*q*34;
      if(s.star)plus(ctx,x,y,pal[s.c%3],1-q);else dot(ctx,x,y,pal[s.c],1-q*.9,s.size,s.size);}
    /* 6) 타구 궤적: 잔상 + 공 */
    if(prof.flight&&prof.flight!=='jam'||prof.flight==='jam'){
      const dur=flightDur[prof.flight]||.6,tt=t-.04;
      if(tt>0){
        const q=clamp(tt/dur,0,1);
        for(let i=12;i>=1;i--){const qq=Math.max(0,q-i*.022);const [tx,ty]=flightPoint(st,prof.flight,qq);
          dot(ctx,tx,ty,pal[Math.min(3,1+(i>6?1:0)+(i>10?1:0))],Math.min(1,(13-i)*.09)*(q<1?1:Math.max(0,1-(tt-dur)*3)),i>6?3:4,i>6?3:4);}
        if(q<1||tt-dur<.12){const [bx,by]=flightPoint(st,prof.flight,q);
          const fade=q<1?1:Math.max(0,1-(tt-dur)*8);
          dot(ctx,bx-1,by-1,pal[3],fade,5,5);dot(ctx,bx,by-1,pal[1],fade,3,5);dot(ctx,bx-1,by,pal[1],fade,5,3);dot(ctx,bx,by,'#ffffff',fade,3,3);
          if(prof.flight==='homer'&&q<1)for(let i=0;i<3;i++)plus(ctx,bx-8-i*9+((t*40+i*7)%5),by+((i*5+t*30)%7)-3,pal[i],.85-i*.2);}
      }
    }
    /* 7) 먼지(빗맞은 타구) */
    for(const d of st.dust){const q=t/d.life;if(q<0||q>=1)continue;const rr=d.sp*ease(q);dot(ctx,px+Math.cos(d.a)*rr,py+Math.sin(d.a)*rr*.7,PAL.dust[1+(d.s>3?1:0)],(1-q)*.8,d.s,d.s);}
    /* 8) 홈런: 금빛 비네트 + 색종이 */
    if(prof.confetti){
      const va=clamp(t/.15,0,1)*clamp(1-(t-.9)/.8,0,1)*.5;
      if(va>0){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,'rgba(255,200,60,0)');g.addColorStop(1,'rgba(255,170,30,'+va.toFixed(2)+')');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
      if(t>.25)for(const c of st.confetti){const tt=t-.25,x=c.x+c.vx*tt+Math.sin(tt*5+c.ph)*4,y=c.y+c.vy*tt*(1+tt*.6);if(y<-4||y>H+4)continue;
        const a=clamp(1-(tt-1.1)/.6,0,1);if(c.star)plus(ctx,x,y,PAL.gold[c.c],a);else dot(ctx,x,y,PAL.gold[c.c],a,2,2);}
    }
  }

  if(prof.kind==='foul'){
    const sr=7+6*p,sa=clamp(1-t/.12,0,1);if(sa>0)star(ctx,px,py,Math.round(sr),pal,sa);
    const k=t/.22;if(k<1)ringPx(ctx,px,py,4+ease(k)*(14+8*p),pal,1-k,2);
    for(const s of st.sparks){const q=t/s.life;if(q<0||q>=1)continue;
      /* 파울: 공은 옆·뒤로 튄다 → 왼쪽 위로 */
      const a=-2.45+(s.a%1)*.9,x=px+Math.cos(a)*s.sp*q,y=py+Math.sin(a)*s.sp*q+q*q*30;dot(ctx,x,y,pal[s.c],1-q,s.size,s.size);}
    for(const d of st.dust){const q=t/d.life;if(q<0||q>=1)continue;const rr=d.sp*ease(q);dot(ctx,px+Math.cos(d.a)*rr,py+Math.sin(d.a)*rr*.6,PAL.dust[1+(d.s>3?1:0)],(1-q)*.75,d.s,d.s);}
    /* 튕겨 나가는 공 */
    const q=clamp((t-.03)/.5,0,1);if(t>.03&&q<1){
      for(let i=8;i>=0;i--){const qq=Math.max(0,q-i*.03),e=ease(qq);dot(ctx,px-e*W*.5,py-e*H*.3+Math.sin(Math.PI*e)*-H*.06,pal[1+(i>4?1:0)],(9-i)*.07,i>4?2:3,i>4?2:3);}
      const e=ease(q);dot(ctx,px-e*W*.5-1,py-e*H*.3-Math.sin(Math.PI*e)*H*.06-1,'#fff',1-q*.4,4,4);}
    /* 파울 라인 분필 가루 */
    const cl=clamp(1-t/.5,0,1);if(cl>0)for(let i=0;i<10;i++)dot(ctx,px-i*3-2+(i*7%5),py+6+((i*5)%7),PAL.dust[0],cl*(1-i*.08),2,1);
  }

  if(prof.kind==='whiff'){
    /* 스윙 궤적: 접점을 지나는 반달 호 */
    const aq=clamp(t/.16,0,1),ak=clamp(1-(t-.12)/.22,0,1);
    if(ak>0){
      const R=22+10*p;
      for(let i=0;i<46;i++){const f=i/45;if(f>aq)break;const a=Math.PI*(1.15+f*.95),th=(1-Math.abs(f-.55)*1.2);
        const x=px+Math.cos(a)*R*-1.0,y=py+Math.sin(a)*R*.7-4;
        for(let w=0;w<Math.round(1+3*th*p);w++){dot(ctx,x,y+w-1,w===0?'#ffffff':w===1?pal[1]:pal[2],ak*(.9-w*.15),2,1);}}
    }
    /* 바람선 */
    for(const w of st.wind){const q=t/w.life;if(q<0||q>=1)continue;const x=w.x0-ease(q)*28;for(let i=0;i<w.len;i+=2)dot(ctx,x+i,w.y,pal[w.c],(1-q)*(.2+i/w.len*.6),2,1);}
    /* 미트 팝: 공이 지나간 자리에 먼지 링 */
    const pk=(t-.1)/.3;if(pk>0&&pk<1){ringPx(ctx,px,py,3+ease(pk)*(10+6*p),PAL.dust,(1-pk)*.8,2);
      for(const d of st.dust){const q=(t-.1)/d.life;if(q<0||q>=1)continue;const rr=d.sp*.6*ease(q);dot(ctx,px+Math.cos(d.a)*rr,py+Math.sin(d.a)*rr*.6,PAL.dust[1],(1-q)*.7,d.s,d.s);}}
    if(prof.k){
      /* 삼진: 붉은 X가 순간 박힌다 + 가장자리 어둠 */
      const xa=clamp((t-.12)/.05,0,1)*clamp(1-(t-.3)/.35,0,1);
      if(xa>0){const L=11+4*p;for(let d=-L;d<=L;d++){dot(ctx,px+d,py+d,PAL.red[1],xa,3,3);dot(ctx,px+d,py-d,PAL.red[1],xa,3,3);dot(ctx,px+d+1,py+d+1,PAL.red[2],xa,2,2);dot(ctx,px+d+1,py-d+1,PAL.red[2],xa,2,2);}}
      const va=clamp((t-.1)/.1,0,1)*clamp(1-(t-.4)/.5,0,1)*.45;
      if(va>0){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.8);g.addColorStop(0,'rgba(10,16,40,0)');g.addColorStop(1,'rgba(10,16,40,'+va.toFixed(2)+')');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
    }
  }

  if(prof.kind==='called'){
    const pk=t/.32;if(pk<1){ringPx(ctx,px,py,3+ease(pk)*(12+8*p),pal,1-pk,2);ringPx(ctx,px,py,2+ease(pk)*(7+4*p),PAL.dust,(1-pk)*.8,2);}
    const sa=clamp(1-t/.1,0,1);if(sa>0)star(ctx,px,py,Math.round(6+4*p),PAL.dust,sa*.9);
    for(const d of st.dust){const q=t/d.life;if(q<0||q>=1)continue;const rr=d.sp*ease(q);dot(ctx,px+Math.cos(d.a)*rr,py+Math.sin(d.a)*rr*.6,PAL.dust[1+(d.s>3?1:0)],(1-q)*.8,d.s,d.s);}
    if(prof.k){const xa=clamp((t-.1)/.06,0,1)*clamp(1-(t-.4)/.4,0,1);
      if(xa>0){const L=10;for(let d=-L;d<=L;d++){dot(ctx,px+d,py+d,PAL.red[1],xa,3,3);dot(ctx,px+d,py-d,PAL.red[1],xa,3,3);}}}
  }
  ctx.restore();ctx.globalAlpha=1;
}

/* 이 연출이 끝나는 시각(초). 이후엔 캔버스를 비운다. */
export function impactDuration(grade){
  const p=impactProfile(grade);if(!p)return 0;
  if(p.kind==='hit')return p.confetti?2.6:(flightDur[p.flight]||.6)+.35;
  if(p.kind==='foul')return .7;
  return p.k?.9:.6;
}
