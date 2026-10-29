import React,{useLayoutEffect,useState} from 'react';

/* A visual receipt of a player's placement, never a second coverage judge.
   Measure the live buttons after the authored aim has reached the view model.
   Cancels on pitch/rotation/new placement; no animation callback advances play. */
export default function CoverageInsert({request,pieces,rootRef,phase}){
  const [effect,setEffect]=useState(null);
  const shape=pieces?.find(p=>p.id===request?.id),shapeKey=shape?shape.role+':'+shape.coverage.join(','):'';
  useLayoutEffect(()=>{
    if(!request||phase!=='deciding'){setEffect(null);return;}
    const root=rootRef.current,piece=pieces?.find(p=>p.id===request.id);
    if(!root||!piece?.coverage.length){setEffect(null);return;}
    const box=root.getBoundingClientRect(),source=request.source;
    const cells=piece.coverage.flatMap(z=>{
      const el=root.querySelector(`.bv-cell[data-zone="${z}"]`);if(!el)return [];
      const b=el.getBoundingClientRect();
      return [{z,x:b.left-box.left,y:b.top-box.top,w:b.width,h:b.height,
        dx:source.x-box.left-(b.left-box.left+b.width/2),dy:source.y-box.top-(b.top-box.top+b.height/2)}];
    });
    const center={x:cells.reduce((n,c)=>n+c.x+c.w/2,0)/cells.length,y:cells.reduce((n,c)=>n+c.y+c.h/2,0)/cells.length};
    setEffect({seq:request.seq,cells,role:piece.role,name:request.name,art:request.art,source:{x:source.x-box.left,y:source.y-box.top},center});
    const timer=setTimeout(()=>setEffect(null),800);
    const clear=()=>setEffect(null);window.addEventListener('resize',clear);
    return ()=>{clearTimeout(timer);window.removeEventListener('resize',clear);};
  },[request,shapeKey,phase,rootRef]); // eslint-disable-line react-hooks/exhaustive-deps
  if(!effect||phase!=='deciding')return null;
  return <div key={effect.seq} className={'bv-insert-fx r-'+effect.role} aria-hidden="true" data-testid="bv-coverage-insert" data-card-name={effect.name}>
    <span className="bv-insert-card" style={{left:effect.source.x,top:effect.source.y,'--card-x':effect.center.x-effect.source.x+'px','--card-y':effect.center.y-effect.source.y+'px',backgroundImage:effect.art?`linear-gradient(90deg,transparent,#102235ee 50%),url(${effect.art})`:undefined}}>{effect.name}</span>
    {effect.cells.map((c,i)=><span key={c.z} className="bv-insert-block" data-insert-zone={c.z} style={{left:c.x,top:c.y,width:c.w,height:c.h,'--insert-x':c.dx+'px','--insert-y':c.dy+'px','--insert-delay':60+i*20+'ms'}}><i/><b/><em/></span>)}
  </div>;
}
