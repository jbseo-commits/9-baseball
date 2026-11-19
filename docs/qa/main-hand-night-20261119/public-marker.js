// Accept rendered public faces only. No engine object, probabilities or private state.
export function markerPlan(faces,phase){
 if(phase!=='deciding')return {visible:false,zones:[],certain:false};
 const exact=faces.flatMap((face,i)=>face==='확정'?[i]:[]);
 if(exact.length===1)return {visible:true,zones:exact,certain:true};
 const zones=faces.flatMap((face,i)=>typeof face==='string'&&face!==''&&!['안 던짐','단서 밖'].includes(face)?[i]:[]);
 return {visible:true,zones:zones.length>1?zones:[],certain:false};
}
