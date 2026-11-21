import React,{useLayoutEffect,useState} from 'react';
// Public cue only. No history/pending/course/aim access or bonus inference.
export function jadeGuard(cue,artId){return artId==='jade-viper'&&cue?.id===artId&&cue.ready===true;}
export function useJadeGuard(cue,artId,deciding){
 const publicReady=jadeGuard(cue,artId);
 const [last,setLast]=useState(()=>({artId,guarded:deciding?publicReady:false}));
 useLayoutEffect(()=>{if(deciding)setLast({artId,guarded:publicReady});else if(last.artId!==artId)setLast({artId,guarded:false});},[deciding,publicReady,artId,last.artId]);
 return artId==='jade-viper'&&(deciding?publicReady:last.artId===artId&&last.guarded);
}
// Equipment study registered to the approved ready drawing. The opening lift
// tucks the plates inward; later poses retain the original atlas untouched.
export default function JadeShell({guarded,frame,phase,action,knockedOut=false,earlyDelivery=false}){
 const resting=frame===0&&((['deciding','committing'].includes(phase)&&!action)||action==='prepare');
 if(!guarded||knockedOut||!resting&&!(earlyDelivery&&frame<=1&&action!=='prepare'))return null;
 const tuck=frame===1;
 return <svg className="bv-jade-shell" data-shell={tuck?'tucked':'guarded'} viewBox="0 0 256 256" aria-hidden="true" shapeRendering="crispEdges" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
  <g stroke="#112c29" strokeWidth="2" strokeLinejoin="miter">
   <g transform={tuck?'translate(7 3)':undefined}>
    <path fill="#34775b" d="M101 46H88V50H75V56H67V72H78V80H98V68H106V54H101Z"/>
    <path fill="#80b78a" d="M88 50H100V54H102V62H80V68H72V58H78V54H88Z"/>
    <path fill="#235341" d="M70 76H80V81H100V91H94V98H81V92H73V85H70Z"/>
   </g>
   <g transform={tuck?'translate(-7 3)':undefined}>
    <path fill="#34775b" d="M156 48H169V52H182V58H190V74H179V82H159V70H151V56H156Z"/>
    <path fill="#80b78a" d="M169 52H157V56H155V64H177V70H185V60H179V56H169Z"/>
    <path fill="#235341" d="M187 78H177V83H157V93H163V100H176V94H184V87H187Z"/>
   </g>
   {!tuck&&<><path fill="#34775b" d="M101 102H110V112H106V121H96V115H94V108H101Z"/><path fill="#34775b" d="M147 103H156V109H163V116H160V122H151V113H147Z"/></>}
  </g>
  <path d={tuck?'M98 58H107M157 60H166':'M91 55H100M157 57H166M98 108V114M157 110V116'} stroke="#d5c98c" strokeWidth="2" fill="none"/>
 </svg>;
}
