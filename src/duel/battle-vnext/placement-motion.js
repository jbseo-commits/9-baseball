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
  return {bounds,center,from,mid,scale,readScale,stage,outline,cells:cells.map(c=>({...c,x:c.x-left,y:c.y-top,rank:ordered.findIndex(o=>o.z===c.z)}))};
}
