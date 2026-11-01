const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
/* Presentation geometry only. The pointer remains the real drop coordinate. */
export function dragPreviewBox(pointer,viewport,zone=null){
 const w=Math.min(210,viewport.width-16),h=94,gap=28,fit=(x,y)=>({x:clamp(x,8,viewport.width-w-8),y:clamp(y,8,viewport.height-h-8),w,h});
 const finger={x:pointer.x-24,y:pointer.y-24,w:48,h:48};
 const candidates=[fit(pointer.x-w-gap,pointer.y-h-gap),...(zone?[fit(pointer.x-w-gap,zone.y-h-14)]:[]),fit(pointer.x-w-gap,pointer.y+gap),fit(pointer.x+gap,pointer.y-h-gap),fit(pointer.x+gap,pointer.y+gap)];
 const score=r=>overlap(r,finger)*20+(zone?overlap(r,zone)*8:0);
 return candidates.reduce((best,r)=>score(r)<score(best)?r:best,candidates[0]);
}
