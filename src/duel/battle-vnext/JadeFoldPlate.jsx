import React,{useLayoutEffect,useState} from 'react';
// Public cue only. No history/pending/course/aim access or bonus inference.
export function jadeGuard(cue,artId){return artId==='jade-viper'&&cue?.id===artId&&cue.ready===true;}
export function useJadeGuard(cue,artId,deciding){
 const publicReady=jadeGuard(cue,artId);
 const [last,setLast]=useState(()=>({artId,guarded:deciding?publicReady:false}));
 useLayoutEffect(()=>{if(deciding)setLast({artId,guarded:publicReady});else if(last.artId!==artId)setLast({artId,guarded:false});},[deciding,publicReady,artId,last.artId]);
 return artId==='jade-viper'&&(deciding?publicReady:last.artId===artId&&last.guarded);
}
export function jadePlateKey({guarded,phase,action,elapsed=0,frame=0,releaseAt=0,reduced=false,knockedOut=false}){
 if(!guarded||knockedOut)return null;
 if(frame===0&&((['deciding','committing'].includes(phase)&&!action)||action==='prepare'))return 'open';
 if(reduced||action==='prepare'||!action||phase==='result'||frame>1||elapsed>=releaseAt)return null;
 return elapsed<80?'open':elapsed<145?'fold':elapsed<190?'tuck':elapsed<230?'seam':null;
}
const shapes={
 open:{outer:'M1 3H39V11H37V18H34V23H30V27H25V30L20 32 15 30H10V27H6V23H3V18H1Z',hole:'M17 8H25V17H17Z',left:'M3 5H17V8H15V17H19V29L11 25 6 20 3 13Z',right:'M25 5H37V12L33 20 28 25 22 29V17H27V8H25Z',ribs:'M5 12L10 19 19 28M35 12L30 19 22 28M10 7L14 19 19 25M30 7L26 19 22 25'},
 fold:{outer:'M8 6H33V12H31V20L26 25 21 28 15 25 10 20V13H8Z',hole:'M17 8H25V17H17Z',left:'M10 8H15V18L20 25 14 21 10 14Z',right:'M27 8H31V14L27 21 22 25V18H27Z',ribs:'M12 9V17L20 25M29 9V17L22 25'},
 tuck:{outer:'M15 8H28V15H26V20L21 22 17 20V15H15Z',hole:'M18 9H24V16H18Z',left:'M16 9H17V16L20 20 18 18Z',right:'M26 9H27V15L23 20 25 16Z',ribs:'M19 18L21 20 24 18'},
 seam:{outer:'M19 10H24V16H22V18H20V16H19Z',hole:'M20 11H23V15H20Z',left:'',right:'',ribs:''},
};
export default function JadeFoldPlate(props){
 const key=jadePlateKey(props);if(!key)return null;const p=shapes[key];
 // Registered against original ready mitt(about136,81); initial lift raises it15px.
 return <svg className="bv-jade-plate" data-fold={key} viewBox="0 0 40 38" aria-hidden="true" shapeRendering="crispEdges" style={{position:'absolute',left:73/256*100+'%',top:(47-(props.frame===1?15:0))/256*100+'%',width:120/256*100+'%',height:114/256*100+'%',pointerEvents:'none'}}>
  <path d={p.outer+' '+p.hole} fillRule="evenodd" fill="#123e34" stroke="#c6d59c" strokeWidth="1"/>
  <path d={p.left} fill="#28634d"/><path d={p.right} fill="#1b4f41"/>
  <path d={p.ribs} fill="none" stroke="#75a97b" strokeWidth="1"/>
 </svg>;
}
