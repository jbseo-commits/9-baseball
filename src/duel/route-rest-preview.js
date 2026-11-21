// Public map geometry only. Cost includes the selected encounter, before any
// continuation is chosen. null is unreachable, never an alias for zero.
const COMBAT=new Set(['battle','elite','boss']);
export function minimumCombatsToRest(nodes,edges,startId){
  const byId=new Map(nodes.map(n=>[n.id,n])),start=byId.get(startId);
  if(!start)return null;
  const next=new Map();
  for(const e of edges)if(byId.get(e.from)?.act===start.act&&byId.get(e.to)?.act===start.act){
    if(!next.has(e.from))next.set(e.from,[]);next.get(e.from).push(e.to);
  }
  const best=new Map([[startId,COMBAT.has(start.type)?1:0]]),queue=[startId];
  while(queue.length){
    const id=queue.shift(),cost=best.get(id);
    for(const to of next.get(id)||[]){
      const value=cost+(COMBAT.has(byId.get(to).type)?1:0);
      if(!best.has(to)||value<best.get(to)){best.set(to,value);queue.push(to);}
    }
  }
  const rests=nodes.filter(n=>n.act===start.act&&n.type==='rest'&&best.has(n.id)).map(n=>best.get(n.id));
  return rests.length?Math.min(...rests):null;
}
export const restRouteCaption=(count,atRest=false)=>count===null?'이 막에서 닿는 휴식 없음':count===0?(atRest?'지금 휴식':'전투 없이 휴식 가능'):'휴식까지 최소 '+count+'경기';
