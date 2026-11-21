/* Input is only the text already visible on the nine zone faces. Never pass
   engine state, private targets, aim selection, RNG or probability arrays.
   confirmedOutside is the existing earned public known-zone singleton [9],
   computed by the VM; never inferred from a rounded band percentage. */
export function publicIntentBadge(faces,phase,confirmedOutside=false){
 if(phase!=='deciding')return null;
 if(confirmedOutside===true)return {zones:[],certain:true,outside:true,label:'공개 의도 · 존 밖 볼 확정'};
 const exact=(faces||[]).slice(0,9).flatMap((face,i)=>face==='확정'?[i]:[]);
 if(exact.length===1)return {zones:exact,certain:true,label:'공개 의도 · 확정된 존'};
 const zones=(faces||[]).slice(0,9).flatMap((face,i)=>typeof face==='string'&&face!==''&&!['안 던짐','단서 밖'].includes(face)?[i]:[]);
 const ranged=zones.length>1&&zones.length<9;
 return {zones:ranged?zones:[],certain:false,label:ranged?'공개 의도 · 가능한 존 범위':'공개 의도 · 아직 알 수 없음'};
}

// Snap the small UI to CSS pixels. Avoid moving it across the face when the
// head is clipped: suppress instead of inventing an unrelated screen anchor.
export function intentBadgePosition(point,bounds){
 if(!point||!bounds||point.y<46||point.y>bounds.height||point.x<18||point.x>bounds.width-18)return null;
 return {left:Math.round(Math.max(20,Math.min(bounds.width-28,point.x))),top:Math.round(point.y-6)};
}
