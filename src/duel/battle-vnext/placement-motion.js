/* One receipt timeline, shared by the visual and cancellable audio. It never
   schedules game actions or reads the pending/actual pitch. */
export const PLACEMENT=Object.freeze({morphAt:140,travelAt:180,arriveAt:400,lockAt:460,settleAt:620,fadeAt:850,duration:1040,stagger:14});
export const WIDE_PLACEMENT=Object.freeze({morphAt:140,formAt:260,travelAt:400,arriveAt:620,lockAt:680,settleAt:860,fadeAt:1080,duration:1280,stagger:14});
export const placementTimeline=count=>count>1?WIDE_PLACEMENT:PLACEMENT;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export function placementGeometry(cells,source,view=null){
  if(!cells?.length)return null;
  const left=Math.min(...cells.map(c=>c.x)),top=Math.min(...cells.map(c=>c.y));
  const right=Math.max(...cells.map(c=>c.x+c.w)),bottom=Math.max(...cells.map(c=>c.y+c.h));
  const bounds={x:left,y:top,w:right-left,h:bottom-top};
  const center={x:(left+right)/2,y:(top+bottom)/2};
  const scale=Math.max(.16,Math.min(.72,(source.h>0?source.h:76)*.82/Math.max(1,bounds.h),(source.w>0?source.w:190)*.84/Math.max(1,bounds.w)));
  const sourcePoint={x:finite(source.x,center.x),y:finite(source.y,center.y)};
  const from={x:sourcePoint.x-center.x,y:sourcePoint.y-center.y};
  // A short raised arc, shared by the whole polyomino. No independently flying
  // squares or regenerated hypothetical coverage at clipped grid edges.
  const mid={x:from.x*.38,y:from.y*.38-Math.min(70,Math.max(22,bounds.h*.18))};
  const room=view&&view.right>view.left&&view.bottom>view.top?view:{left:0,top:0,right:Infinity,bottom:Infinity};
  const readScale=cells.length>1?Math.min(.9,(room.right-room.left)/Math.max(1,bounds.w),(room.bottom-room.top)/Math.max(1,bounds.h)):scale;
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const stagePoint={x:clamp(sourcePoint.x,room.left+bounds.w*readScale/2,room.right-bounds.w*readScale/2),y:clamp(sourcePoint.y,room.top+bounds.h*readScale/2,room.bottom-bounds.h*readScale/2)};
  const stage={x:stagePoint.x-center.x,y:stagePoint.y-center.y};
  const byZone=new Map(cells.map(c=>[c.z,c]));let outline='';
  for(const c of cells){
    const x=c.x-left,y=c.y-top,w=c.w,h=c.h,z=c.z;
    if(!byZone.has(z-3))outline+=`M${x},${y}h${w}`;
    if(z%3===2||!byZone.has(z+1))outline+=`M${x+w},${y}v${h}`;
    if(!byZone.has(z+3))outline+=`M${x+w},${y+h}h${-w}`;
    if(z%3===0||!byZone.has(z-1))outline+=`M${x},${y+h}v${-h}`;
  }
  const ordered=cells.slice().sort((a,b)=>Math.hypot(a.x+a.w/2-center.x,a.y+a.h/2-center.y)-Math.hypot(b.x+b.w/2-center.x,b.y+b.h/2-center.y)||a.z-b.z);
  const contour=footprintContours(cells.map(c=>({...c,x:c.x-left,y:c.y-top})));
  return {bounds,center,from,mid,scale,readScale,stage,outline,contour,cells:cells.map(c=>({...c,x:c.x-left,y:c.y-top,rank:ordered.findIndex(o=>o.z===c.z)}))};
}

/* Trace real coverage topology, including disconnected islands and holes.
   Grid vertices identify neighbours; their positions retain measured DOM edges.
   A right turn at a diagonal corner keeps the two bodies separate. */
export function footprintContours(cells=[]){
  const unique=[...new Map(cells.filter(c=>Number.isInteger(c.z)&&c.z>=0&&c.z<9).map(c=>[c.z,c])).values()];
  const zones=new Set(unique.map(c=>c.z)),edges=[],vertices=new Map();
  const vertex=(x,y,px,py)=>{const key=x+','+y;if(!vertices.has(key))vertices.set(key,{x:px,y:py});return key;};
  const add=(c,side)=>{const x=c.z%3,y=Math.floor(c.z/3),v=[vertex(x,y,c.x,c.y),vertex(x+1,y,c.x+c.w,c.y),vertex(x+1,y+1,c.x+c.w,c.y+c.h),vertex(x,y+1,c.x,c.y+c.h)];edges.push({from:v[side],to:v[(side+1)%4],direction:side});};
  for(const c of unique){if(!zones.has(c.z-3))add(c,0);if(c.z%3===2||!zones.has(c.z+1))add(c,1);if(!zones.has(c.z+3))add(c,2);if(c.z%3===0||!zones.has(c.z-1))add(c,3);}
  const unused=new Set(edges),loops=[];
  while(unused.size){
    let e=unused.values().next().value;const start=e.from,points=[vertices.get(start)];
    while(e&&unused.has(e)){
      unused.delete(e);points.push(vertices.get(e.to));if(e.to===start)break;
      const turn=d=>[1,0,3,2].indexOf((d-e.direction+4)%4);
      e=[...unused].filter(n=>n.from===e.to).sort((a,b)=>turn(a.direction)-turn(b.direction))[0];
    }
    if(points.length>2)loops.push(points);
  }
  const clean=n=>Math.round(n*10000)/10000;
  const path=loops.map(l=>'M'+l.map(p=>clean(p.x)+','+clean(p.y)).join('L')+'Z').join('');
  const perimeter=loops.reduce((sum,l)=>sum+l.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-l[i].x,p.y-l[i].y),0),0);
  return {path,loops,perimeter};
}

/* Both ends use the same screen-centred coordinate system. */
export function placementPan(localX,rootLeft,viewportWidth){
  return Math.max(-.4,Math.min(.4,(localX+rootLeft-viewportWidth/2)/Math.max(1,viewportWidth/2)*.4));
}
