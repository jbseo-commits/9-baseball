import React,{useEffect,useRef,useState} from 'react';
import {V10_SWING_DAMAGE_RATES,V11_STACK_CONNECT_BONUS,V10_MOMENTUM,V10_RUNNER_PRESSURE} from './engine.js';
import './welcome.css';

/* 게임 방법 — the rules of the main run, one idea per page, each drawn with the game's own pieces
   (9존, 카드, 기세, B S O). Numbers come from the engine so the page never drifts from the rules.
   Opens before the first new game, from 설정, and from the battle's help button. */
export const WELCOME_SEEN_KEY='9zone-welcome-v1';
const pct=r=>Math.round(r*100);

/* a 3x3 zone for the diagrams: cells = {i: {cls, text}} */
function Zone({cells={},band=null,ball=null,links=null,small=false}){
  return <div className={'wg-zone'+(small?' small':'')}>
    {band&&<span className="wg-band"><em>{band}</em></span>}
    <div className="wg-grid">{Array.from({length:9},(_,i)=><i key={i} className={cells[i]?.cls||''}>{cells[i]?.text||''}{ball===i&&<b className="wg-ball"/>}</i>)}</div>
    {ball===9&&<b className="wg-ball out"/>}
    {links&&<svg className="wg-links" viewBox="0 0 3 3" aria-hidden="true">{links.map(([a,b,ok],k)=><line key={k} x1={a%3+.5} y1={Math.floor(a/3)+.5} x2={b%3+.5} y2={Math.floor(b/3)+.5} className={ok?'ok':'no'}/>)}</svg>}
  </div>;
}
const Flames=({n})=><span className="wg-flames" aria-hidden="true">{Array.from({length:V10_MOMENTUM.max},(_,i)=><i key={i} className={i<n?'on':''}/>)}</span>;

export const WELCOME_CHAPTERS=[
  {key:'goal',eyebrow:'목표',title:'투수를 강판시켜라',
    body:[<>한 경기는 <b>1이닝</b>입니다. <b>3아웃</b>이 되기 전에 투수 HP를 0으로 만들면 <b>강판</b> · 승리.</>,
      <>3아웃을 당하면 <b>런이 끝납니다</b>. 득점은 승패가 아니라 투수를 <b>흔드는</b> 데 쓰입니다.</>,
      <>3막 지도를 지나 마지막 보스까지 끌어내리면 완주.</>],
    art:()=><div className="wg-goal"><div className="wg-hp"><span>레드 러시</span><i><b/></i><small>HP 0 / 60 · 강판</small></div><div className="wg-outs"><span>O</span><i className="on"/><i className="on"/><i/><small>3아웃 전에!</small></div></div>},
  {key:'flow',eyebrow:'한 공의 흐름',title:'읽고, 놓고, 친다',
    body:[<><b>① 읽기</b> — 투수 속마음 한 줄과 9존의 %를 봅니다.</>,<><b>② 놓기</b> — 카드를 고르고 노릴 칸을 누릅니다.</>,<><b>③ 결정</b> — <b>휘두른다</b> 또는 <b>지켜본다</b>. 공은 이미 정해져 있고 %는 실제 확률입니다.</>],
    art:()=><ol className="wg-steps"><li><i>👁</i>읽기</li><li><i>🂠</i>놓기</li><li><i>⚾</i>결정</li><li><i>★</i>결과</li></ol>},
  {key:'zone',eyebrow:'9존 읽기',title:'공이 어디로 올까',
    body:[<>칸의 <b>%</b>는 전체 공 중 그 칸으로 올 확률, <b>최다</b>는 가장 높은 칸.</>,<><b>안 던짐</b> — 이 투수가 아직 쓰지 않는 칸. 타석이 길어지면 늘어납니다.</>,<>9칸을 둘러싼 <b>바깥 띠 = 볼</b>. 30%를 넘으면 <b>유인구 주의</b>로 붉어집니다.</>],
    art:()=><Zone band="바깥 띠 = 볼 16%" cells={{0:{cls:'dead',text:'안 던짐'},1:{cls:'dead',text:'안 던짐'},2:{text:'19%'},4:{text:'15%'},5:{cls:'top',text:'28% 최다'},8:{text:'22%'}}}/>},
  {key:'cover',eyebrow:'커버 = 안타',title:'덮은 칸에 오면 무조건 안타',
    body:[<>카드의 작은 3×3 그림이 <b>덮는 칸</b>입니다. 그 칸으로 공이 오면 <b>안타 확정</b>.</>,<>덮지 못한 스트라이크는 헛스윙이나 파울. <b>볼에 휘두르면 대부분 헛스윙</b> — 볼은 지켜보면 볼입니다.</>,<>넓게 덮을수록 힘이 분산돼 <b>장타가 줄어듭니다</b>.</>],
    art:()=><div className="wg-pair"><Zone small cells={{2:{cls:'cover'},5:{cls:'cover aim'},8:{cls:'cover'}}} ball={5}/><span className="wg-verdict good">안타</span><Zone small cells={{2:{cls:'cover'},5:{cls:'cover aim'},8:{cls:'cover'}}} ball={9}/><span className="wg-verdict">볼 · 지켜보면 볼</span></div>},
  {key:'stack',eyebrow:'STACK · CONNECT',title:'여러 장 겹치기',
    body:[<>메인 카드 위에 최대 {V10_SWING_DAMAGE_RATES.length-1}장을 더 놓으면 덮는 칸이 넓어지지만 <b>피해 배율이 내려갑니다</b>: {V10_SWING_DAMAGE_RATES.map((r,i)=>(i+1)+'장 '+pct(r)+'%').join(' · ')}.</>,
      <>놓은 순서(①→②→③)대로 <b>노린 칸이 붙어 있으면 CONNECT</b> — 실선, 한 번마다 +{pct(V11_STACK_CONNECT_BONUS)}%p를 되찾습니다(최대 100%). 떨어지면 점선 <b>BREAK</b>.</>,
      <>메인 카드가 못 덮은 공을 지원 카드가 덮으면 단타로 막아 줍니다.</>],
    art:()=><div className="wg-pair"><Zone small cells={{4:{cls:'cover aim',text:'①'},5:{cls:'support',text:'②'},8:{cls:'support',text:'③'}}} links={[[4,5,1],[5,8,1]]}/><span className="wg-verdict good">CONNECT 2/2</span><Zone small cells={{0:{cls:'cover aim',text:'①'},8:{cls:'support',text:'②'}}} links={[[0,8,0]]}/><span className="wg-verdict">BREAK</span></div>},
  {key:'momentum',eyebrow:'배율 올리기',title:'기세를 타라',
    body:[<>좋은 타석이 <b>기세</b>를 쌓습니다: 안타·볼넷 +{V10_MOMENTUM.hit}, 장타(2루타 이상) +{V10_MOMENTUM.xbh}. 최대 {V10_MOMENTUM.max}단계.</>,
      <>기세 1단계마다 모든 피해 <b>+{pct(V10_MOMENTUM.step)}%</b> — 최대 <b>×{(1+V10_MOMENTUM.step*V10_MOMENTUM.max).toFixed(1)}</b>. 겹치기로 내려간 배율도 다시 끌어올립니다.</>,
      <><b>삼진을 당하면 기세가 꺼집니다.</b> 경기마다 0에서 시작.</>,
      <>그 밖의 추가 피해: 메인 카드 커버 안 안타의 <b>정확 적중</b>, 주자 1명당 <b>주자 압박 +{pct(V10_RUNNER_PRESSURE)}%</b>, 유물.</>],
    art:()=><div className="wg-momentum"><div className="wg-mrow"><em>기세</em><Flames n={0}/><b>×1.0</b></div><div className="wg-mrow lit"><em>기세</em><Flames n={3}/><b>×1.3</b><small>안타 → +1</small></div><div className="wg-mrow max"><em>기세</em><Flames n={5}/><b>×1.5</b><small>최대</small></div></div>},
  {key:'count',eyebrow:'카운트',title:'볼카운트와 준비',
    body:[<><b>볼 4개 = 볼넷</b>(진루), <b>스트라이크 3개 = 삼진</b>(아웃). 2스트라이크 뒤 파울은 카운트가 늘지 않습니다.</>,
      <>안타·볼넷·삼진·희생 번트면 타석 종료, 볼·스트라이크·파울이면 같은 타자가 다음 공.</>,
      <><b>준비 카드</b>는 공을 쓰지 않고 이번 타석을 돕습니다 — 타석당 2번까지.</>,
      <>점수를 내면 투수가 <b>흔들려</b> 볼이 늘고, 무득점 타석마다 한 단계씩 진정합니다.</>],
    art:()=><div className="wg-bso"><span>B</span><i className="on"/><i className="on"/><i/><span>S</span><i className="on"/><i/><span>O</span><i/><i/></div>},
  {key:'road',eyebrow:'원정',title:'지도를 골라 3막으로',
    body:[<>한 칸을 끝내면 이어진 칸만 열립니다. 되돌아갈 수 없습니다.</>,
      <><b>정규·강적·보스</b> 승부 뒤에는 카드 보상. <b>장비 상점</b>은 카드나 유물 하나, <b>라커룸</b>은 카드 빼기, <b>타격 훈련</b>은 강화(+), <b>휴식일</b>은 다음 경기 타격 +8.</>,
      <>전투 화면의 <b>덱 / 버림</b>은 뽑을 카드와 버린 카드 더미, 지도의 덱은 가진 카드 전체입니다.</>],
    art:()=><ul className="wg-nodes"><li>⚔<span>정규</span></li><li className="elite">⚔<span>강적</span></li><li className="boss">♛<span>보스</span></li><li>🛒<span>상점</span></li><li>🗄<span>라커룸</span></li><li>⤴<span>훈련</span></li><li>☾<span>휴식</span></li></ul>},
  {key:'words',eyebrow:'용어',title:'화면의 말들',
    body:null,
    words:[['적중권 N%','고른 카드가 덮은 칸으로 공이 올 확률'],['피해 ×N','이번 스윙이 투수 HP에 들어가는 배율 (겹치기 · 기세 반영)'],['STACK','메인 + 지원 카드를 겹쳐 치기'],['CONNECT / BREAK','순서대로 노린 칸이 붙음(실선) / 떨어짐(점선)'],['정확 적중','메인 카드 커버 안으로 온 안타 — 카드별 추가 피해'],['주자 압박','주자가 있을 때 안타 피해 추가'],['흔들림','실점한 투수의 점 표시 — 볼이 늘어남'],['기세','좋은 타석이 쌓는 피해 배율, 삼진이면 꺼짐'],['PLAN → ACTUAL → NEXT','결과 뒤 복기: 내 선택 → 실제 공 → 다음에 할 일'],['ⓘ · 길게 누르기','카드의 원문 규칙 보기']]},
];

export default function WelcomeGuide({start=0,onClose,onCards}){
  const [i,setI]=useState(Math.max(0,Math.min(WELCOME_CHAPTERS.length-1,start)));
  const c=WELCOME_CHAPTERS[i],last=i===WELCOME_CHAPTERS.length-1;
  const drag=useRef(null),closeRef=useRef(null);
  useEffect(()=>{closeRef.current?.focus();},[]);
  const done=()=>{try{localStorage.setItem(WELCOME_SEEN_KEY,'seen')}catch{}onClose?.();};
  const go=d=>setI(x=>Math.max(0,Math.min(WELCOME_CHAPTERS.length-1,x+d)));
  const onKeyDown=e=>{if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='Escape')done();};
  /* swipe between pages */
  const down=e=>{drag.current={x:e.clientX,y:e.clientY};};
  const up=e=>{const d=drag.current;drag.current=null;if(!d)return;const dx=e.clientX-d.x;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(e.clientY-d.y))go(dx<0?1:-1);};
  return <div className="wg-backdrop" role="dialog" aria-modal="true" aria-label="게임 방법" onKeyDown={onKeyDown}>
    <section className="wg-sheet" onPointerDown={down} onPointerUp={up}>
      <header className="wg-head">
        <span className="wg-eyebrow">{i+1} / {WELCOME_CHAPTERS.length} · {c.eyebrow}</span>
        <button ref={closeRef} type="button" className="wg-skip" onClick={done}>{last?'닫기':'건너뛰기'}</button>
      </header>
      <div className="wg-page" key={c.key}>
        <h2>{c.title}</h2>
        {c.art&&<div className="wg-art" aria-hidden="true">{c.art()}</div>}
        {c.body&&<ul className="wg-body">{c.body.map((t,k)=><li key={k}>{t}</li>)}</ul>}
        {c.words&&<dl className="wg-words">{c.words.map(([t,d])=><div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>}
      </div>
      <footer className="wg-foot">
        <button type="button" className="wg-prev" onClick={()=>go(-1)} disabled={i===0}>이전</button>
        <span className="wg-dots" aria-hidden="true">{WELCOME_CHAPTERS.map((_,k)=><i key={k} className={k===i?'on':''} onClick={()=>setI(k)}/>)}</span>
        {last?<span className="wg-end">{onCards&&<button type="button" className="wg-cards" onClick={()=>{try{localStorage.setItem(WELCOME_SEEN_KEY,'seen')}catch{}onCards?.()}}>카드 도감</button>}<button type="button" className="wg-next primary" onClick={done}>플레이 시작</button></span>
          :<button type="button" className="wg-next primary" onClick={()=>go(1)}>다음</button>}
      </footer>
    </section>
  </div>;
}
