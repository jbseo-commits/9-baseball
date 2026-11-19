/* Input is only the text already visible on the nine zone faces. Never pass
   engine state, private targets, aim selection, RNG or probability arrays. */
export function publicIntentBadge(faces,phase){
 if(phase!=='deciding')return null;
 const exact=faces.flatMap((face,i)=>face==='확정'?[i]:[]);
 if(exact.length===1)return {zones:exact,certain:true,label:'공개 의도 · 확정된 존'};
 const zones=faces.flatMap((face,i)=>typeof face==='string'&&face!==''&&!['안 던짐','단서 밖'].includes(face)?[i]:[]);
 return {zones:zones.length>1?zones:[],certain:false,label:zones.length>1?'공개 의도 · 가능한 존 범위':'공개 의도 · 아직 알 수 없음'};
}
