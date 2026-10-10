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
   <div className="h3-head"><span>HOME RUN · V3</span><span>V3.1 · 기존 원화 적용</span></div>
   <section className={"h3-stage h3-shot-"+shot} key={round+"-"+shot} aria-label={current.name}>
    <div className="h3-photo" style={{backgroundImage:`url(${shot===5?PHONE_ART_V18.endPlate:PHONE_ART_V18.hrPlate})`}}/>
    <div className="h3-grade"/>
    {shot===0&&<div className="h3-flash"/>}
    {(shot<2||shot===4)&&<img className="h3-batter" src={PHONE_ART_V18.hrBatter} alt="타자 9번 기존 원화"/>}
    {shot===5&&<img className="h3-batter h3-ending" src={PHONE_ART_V18.endBatter} alt="타자 9번 엔딩 원화"/>}
    {shot===1&&<img className="h3-trail" src={PHONE_ART_V18.hrTrail} alt="" aria-hidden="true"/>}
    {shot<=3&&<div className="h3-ball" aria-hidden="true"/>}
    {shot===4&&<div className="h3-payoff">HOME<br/>RUN<span>#9</span></div>}
    {shot===5&&<div className="h3-ending-title">THE NINTH<br/><strong>HOME RUN</strong></div>}
    <div className="h3-caption"><b>{String(shot+1).padStart(2,"0")} / 06 · {current.name}</b><small>{current.sub}</small></div>
   </section>
   <div className="h3-progress">{shots.map((s,i)=><button key={s.name} className={i===shot?"active":""} onClick={()=>{setShot(i);setPlaying(false)}} aria-label={s.name}>{i+1}</button>)}</div>
   <div className="h3-controls"><button onClick={replay}>▶ 처음부터 재생</button><button onClick={()=>setPlaying(p=>!p)}>{playing?"Ⅱ 일시정지":"▶ 계속"}</button><button onClick={()=>{setShot(s=>(s+1)%shots.length);setPlaying(false)}}>다음 컷 →</button></div>
   <p className="h3-note">V3.1 연출 검수용입니다. 기존 저장소의 야구장·타자 원화를 사용합니다. 타구 추적·담장 돌파의 전용 원화와 홈플레이트 세리머니 원화는 아직 미등록 상태이며, 마지막 장면은 엔딩 타자 이미지로 임시 대체했습니다. 게임 결과·밸런스에는 영향을 주지 않습니다.</p>
 </main>;
}
