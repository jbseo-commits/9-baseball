import React,{useLayoutEffect,useState} from 'react';
import './ballpark-coach.css';

/* First-battle coach marks: the real battle screen, one piece at a time — a spotlight on the piece and
   a short line beside it. Once per player (COACH_KEY); non-modal, so the screen stays live under it.
   Rendered by BallparkBattle while the first pitch of a run is being decided. */
export const COACH_KEY='9zone-bp-coach-v1';
export const COACH_STEPS=[
  {sel:'.bp-ptag',title:'투수 HP',text:'이 HP를 0으로 만들면 강판 · 승리. 3아웃이 먼저 오면 런이 끝납니다.'},
  {sel:'.bp-tell',title:'투수 속마음',text:'이번 공을 어디로 던지고 싶은지 한 줄로 보여 줍니다.'},
  {sel:'.bp-zone',title:'9존',text:'숫자는 읽은 만큼만 보입니다. 처음엔 자주·가끔·드묾, 읽기가 쌓이면 구간·정확한 확률. 안 던짐은 안 쓰는 칸, 둘레의 바깥 띠는 볼입니다.'},
  {sel:'.bp-hand',title:'카드 놓기',text:'각 카드의 ⚡ 비용을 확인하세요. 준비 카드는 에너지를 내고 공을 진행하지 않습니다. 카드를 고르고 노릴 칸을 누르면 카드의 3×3 그림만큼 덮고, 덮은 칸에 오면 안타. 희생 번트는 예외로 작전 성공을 노립니다. 길게 누르면 설명.'},
  {sel:'.bp-verbs',title:'휘두른다 · 지켜본다',text:'카드와 지원의 합계가 남은 에너지 안에 있어야 실행됩니다. 모자라면 기본 스윙과 지켜보기는 무료입니다. 지켜본 볼이나 삼진 전 스트라이크는 다음 실제 공 에너지 +1과 가능한 추가 드로우 1장을 예약합니다. 기본 보충 뒤 자리가 있고 더미가 있어야 카드가 오며 손패는 최대 6장입니다. 삼진·투수 강판에는 보상이 없습니다.'},
  {sel:'.bp-momentum',title:'기세',text:'안타·볼넷이 기세를 쌓아 피해가 최대 ×1.5까지 오릅니다. 삼진이면 꺼집니다.'},
  {sel:'.bp-bso-strip',title:'볼카운트',text:'볼 4개면 볼넷, 스트라이크 3개면 삼진(아웃). 오른쪽 위 ⚙에서 게임 방법을 다시 볼 수 있습니다.'},
];
export const coachSeen=()=>{try{return localStorage.getItem(COACH_KEY)==='done'}catch{return true}};

export default function BallparkCoach({rootRef,onDone}){
  const [i,setI]=useState(0),[rect,setRect]=useState(null);
  const steps=COACH_STEPS,step=steps[i],last=i===steps.length-1;
  useLayoutEffect(()=>{
    const find=()=>{const el=rootRef?.current?.querySelector(step.sel);if(!el){setRect(null);return;}
      const r=el.getBoundingClientRect();setRect({x:r.left,y:r.top,w:r.width,h:r.height});};
    find();window.addEventListener('resize',find);return ()=>window.removeEventListener('resize',find);
  },[i,rootRef,step.sel]);
  const finish=()=>{try{localStorage.setItem(COACH_KEY,'done')}catch{}onDone?.();};
  const vh=typeof window!=='undefined'?window.innerHeight:800;
  /* the line sits on the roomier side of the piece */
  const below=rect?rect.y+rect.h/2<vh/2:true;
  const bubble=rect?(below?{top:Math.min(vh-170,rect.y+rect.h+12)}:{bottom:Math.max(12,vh-rect.y+12)}):{bottom:24};
  return <div className="bp-coach-layer" role="dialog" aria-modal="false" aria-label="전투 가이드">
    {rect&&<i className="bp-coach-spot" style={{left:rect.x-6,top:rect.y-6,width:rect.w+12,height:rect.h+12}} aria-hidden="true"/>}
    <section className={'bp-coach-card'+(below?' below':' above')} style={bubble} key={i}>
      <span className="bp-coach-step">전투 가이드 {i+1} / {steps.length}</span>
      <strong>{step.title}</strong>
      <p>{step.text}</p>
      <div className="bp-coach-actions">
        <button type="button" className="bp-coach-skip" onClick={finish}>가이드 건너뛰기</button>
        <button type="button" className="bp-coach-next" onClick={()=>last?finish():setI(i+1)}>{last?'첫 공 승부!':'다음 설명'}</button>
      </div>
    </section>
  </div>;
}
