import React from "react";
import { PHONE_ART_V18 } from "./phone-art-v18.jsx";
import "./HomerV3.css";

const shots=[
 {name:"CONTACT",sub:"배트와 공의 충돌",duration:650},
 {name:"LAUNCH",sub:"배트를 떠나는 타구",duration:600},
 {name:"BALL TRACK",sub:"카메라가 공을 추적",duration:950},
 {name:"WALL CLEAR",sub:"외야 담장을 통과",duration:850},
 {name:"HOME RUN",sub:"홈런 확정",duration:1100},
 {name:"CELEBRATION",sub:"홈플레이트 세리머니",duration:1300},
];
export default function HomerV3(){
 const [shot,setShot]=React.useState(0);
 const [playing,setPlaying]=React.useState(true);
 const [round,setRound]=React.useState(0);
 const current=shots[shot];
 React.useEffect(()=>{
   if(!playing)return undefined;
   const t=window.setTimeout(()=>{if(shot===shots.length-1){setPlaying(false)}else setShot(s=>s+1)},current.duration);
   return ()=>window.clearTimeout(t);
 },[shot,playing,round,current.duration]);
 const replay=()=>{setShot(0);setPlaying(true);setRound(x=>x+1)};
 return <main className="h3-root">
   <div className="h3-head"><span>HOME RUN · V3</span><span>시퀀스 테스트 / 임시 에셋</span></div>
   <section className={"h3-stage h3-shot-"+shot} key={round+"-"+shot} aria-label={current.name}>
    <div className="h3-sky"/>
    <div className="h3-ground"/>
    {shot<2&&<img className="h3-batter" src={PHONE_ART_V18.hrBatter} alt="타자 9번 임시 이미지"/>}
    {shot>=2&&shot<=3&&<><div className="h3-wall"/><div className="h3-crowd"/></>}
    {shot<=3&&<div className="h3-ball" aria-hidden="true"/>}
    {shot===4&&<div className="h3-payoff">HOME<br/>RUN<span>9</span></div>}
    {shot===5&&<div className="h3-celebrate"><span>9</span><strong>VICTORY!</strong><small>세리머니 원화 교체 예정</small></div>}
    <div className="h3-caption"><b>{String(shot+1).padStart(2,"0")} / 06 · {current.name}</b><small>{current.sub}</small></div>
   </section>
   <div className="h3-progress">{shots.map((s,i)=><button key={s.name} className={i===shot?"active":""} onClick={()=>{setShot(i);setPlaying(false)}} aria-label={s.name}>{i+1}</button>)}</div>
   <div className="h3-controls"><button onClick={replay}>▶ 처음부터 재생</button><button onClick={()=>setPlaying(p=>!p)}>{playing?"Ⅱ 일시정지":"▶ 계속"}</button><button onClick={()=>{setShot(s=>(s+1)%shots.length);setPlaying(false)}}>다음 컷 →</button></div>
   <p className="h3-note">구도·타이밍 검수용 프로토타입입니다. 현재 타격 에셋은 V2 임시 이미지이며 새로 제작한 컷의 실제 삽입은 아직 완료되지 않았습니다. 실제 게임 결과·밸런스에는 영향을 주지 않습니다.</p>
 </main>;
}
