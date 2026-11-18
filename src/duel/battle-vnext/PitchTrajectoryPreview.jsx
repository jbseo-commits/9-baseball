import React,{useEffect,useMemo,useRef,useState} from 'react';
import BattleScene,{SAMPLE_ACTORS} from './BattleScene.jsx';
import {ATBAT_COMPOSITION} from './atbat-composition.js';
import {rosterPitcherActor,rosterTimeline} from './roster-actor.js';
import {pitcherAtlases} from '../pitcher-visuals.js';
import {pitchDescriptor,samplePitchFlight,samplePitchScene,PITCH_PROFILES} from './pitch-trajectory.js';
import ballUrl from '../../../assets/production-art/asset-led-battle-v1/ball.svg';
import './pitch-trajectory-preview.css';

const ART='regular-01-red-rush';
const actor=rosterPitcherActor(ART,pitcherAtlases[ART]);
const timeline=rosterTimeline({freeze:80,slowmo:0,duration:2500},actor);
const releaseAt=actor.releaseAt,impactAt=timeline.impactAt;
const actors={pitcher:actor,batter:SAMPLE_ACTORS.batter};
const outcomes={hit:{kind:'hit',exact:false,label:'안타',actualZone:4},foul:{kind:'foul',label:'파울',actualZone:4},take:{kind:'called',label:'지켜보기',actualZone:4}};
const line=points=>points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ');

function FlightArt({descriptor,elapsed,result,trail,effects,debug}){
  const s=samplePitchScene(descriptor,elapsed,{result,trail});
  const path=debug?Array.from({length:61},(_,i)=>samplePitchFlight(descriptor,releaseAt+i*5).position):[];
  return <svg className="bv-world-effects pt-flight" viewBox="0 0 1672 941" width="1672" height="941" aria-hidden="true"
    data-profile={descriptor.profile} data-ball-x={s?.position.x} data-ball-y={s?.position.y} data-radius={s?.radius} data-elapsed={elapsed}>
    {debug&&<g fill="none" stroke="#b9e5e3" strokeWidth="1.5" opacity=".6"><path d={line(path)} strokeDasharray="4 8"/>{[descriptor.release,descriptor.target].map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="14"/>)}</g>}
    {s&&!s.hidden&&<g>
      {s.wake.length>0&&<><path d={line(s.wake)} fill="none" stroke="#96c9cd" strokeWidth="8" strokeLinecap="round" opacity=".17"/><path d={line(s.wake)} fill="none" stroke="#e5eee1" strokeWidth="2.5" strokeLinecap="round" opacity=".65"/></>}
      <image data-testid="trajectory-ball" href={ballUrl} x={s.position.x-s.radius} y={s.position.y-s.radius} width={s.radius*2} height={s.radius*2} transform={`rotate(${s.rotation*180/Math.PI} ${s.position.x} ${s.position.y})`}/>
      {/* Original four short chips: empty core preserves the visible ball/barrel contact. */}
      {effects&&s.contact&&<g data-testid="trajectory-contact" fill="#edca8c" opacity={.6*(1-s.age/80)}>{[-1,1].flatMap(x=>[-1,1].map(y=><rect key={`${x},${y}`} x={descriptor.target.x+x*(18+s.age*.15)-2} y={descriptor.target.y+y*(15+s.age*.08)-2} width="5" height="3"/>))}</g>}
    </g>}
  </svg>;
}

export default function PitchTrajectoryPreview(){
  const [elapsed,setElapsed]=useState(0),[playing,setPlaying]=useState(false),[rate,setRate]=useState(1);
  const [result,setResult]=useState('hit'),[trail,setTrail]=useState(true),[effects,setEffects]=useState(true),[debug,setDebug]=useState(false),[baseline,setBaseline]=useState(false);
  const [focus,setFocus]=useState('all');
  const [reduced,setReduced]=useState(()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;const changed=()=>{setReduced(media.matches);if(media.matches)setPlaying(false);};media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);},[]);
  const timeRef=useRef(elapsed);timeRef.current=elapsed;
  useEffect(()=>{
    if(!playing)return;
    const epoch=performance.now(),start=timeRef.current;let frame;
    const tick=now=>{const next=Math.min(timeline.duration,start+(now-epoch)*rate);setElapsed(next);if(next>=timeline.duration)setPlaying(false);else frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);
    const hide=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',hide);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hide);};
  },[playing,rate]);
  const seek=value=>{setPlaying(false);setElapsed(Math.max(0,Math.min(timeline.duration,value)));};
  const target=result==='take'?{x:ATBAT_COMPOSITION.contact.x+40,y:ATBAT_COMPOSITION.contact.y+10}:ATBAT_COMPOSITION.contact;
  const descriptors=useMemo(()=>Object.keys(PITCH_PROFILES).map(profile=>pitchDescriptor({profile,release:actor.release,target,releaseAt,impactAt,seed:23})),[target.x,target.y]);
  const playback={timeline,pitchReleaseAt:releaseAt,action:result==='take'?'take':'swing',rate:1,startedAt:0,token:1};
  const phase=elapsed>=impactAt?'result':'flight';
  const shown=descriptors.filter(d=>focus==='all'||d.profile===focus);
  return <main className="pt-preview">
    <header className="pt-heading"><div><p className="pt-eyebrow">9ZONE · PITCH STUDY / P0 + P1</p><h1>같은 승부, 세 가지 움직임</h1><p>레드 러시 · 같은 릴리스 · 300ms · {result==='take'?'기존 지켜보기 통과점':'등록된 단일 접점'}</p></div><span className="pt-status">검토 후보 · 실제 9존 미연결</span></header>
    {reduced&&<p className="pt-reduced" role="status">동작 줄이기: 재생을 누르면 접점으로 이동합니다. 슬라이더와 프레임 이동으로 검수할 수 있습니다.</p>}
    <section className="pt-controls" aria-label="궤적 재생 도구">
      <button type="button" onClick={()=>{if(reduced){seek(impactAt);return;}if(elapsed>=timeline.duration)setElapsed(0);setPlaying(v=>!v);}}>{playing?'일시정지':'재생'}</button>
      <button type="button" onClick={()=>seek(0)}>처음</button>
      <button type="button" onClick={()=>seek(elapsed-1000/60)}>이전 프레임</button><button type="button" onClick={()=>seek(elapsed+1000/60)}>다음 프레임</button>
      <label>배속 <select aria-label="재생 배속" value={rate} onChange={e=>setRate(Number(e.target.value))}>{[.25,.5,.75,1,1.5,2,6].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>
      <label>결과 <select aria-label="비교 결과" value={result} onChange={e=>{setResult(e.target.value);seek(0);}}><option value="hit">안타</option><option value="foul">파울</option><option value="take">지켜보기</option></select></label>
      <label>코스 <select aria-label="비교 코스" value="registered" onChange={()=>{}}><option value="registered">기존 등록점 (진단)</option><option value="nine" disabled>9존 / outside — P2 대기</option></select></label>
      <label>보기 <select aria-label="비교 보기" value={focus} onChange={e=>setFocus(e.target.value)}><option value="all">세 구종 나란히</option>{Object.entries(PITCH_PROFILES).map(([id,p])=><option key={id} value={id}>{p.label} 크게</option>)}</select></label>
    </section>
    <div className="pt-scrub"><input aria-label="장면 시각" type="range" min="0" max={timeline.duration} step="0.1" value={elapsed} onChange={e=>seek(Number(e.target.value))}/><output data-testid="trajectory-time">{elapsed.toFixed(1)} ms</output></div>
    <div className="pt-toggles"><button type="button" onClick={()=>seek(releaseAt)}>릴리스</button><button type="button" onClick={()=>seek(impactAt)}>접촉 / 통과</button>
      <label><input type="checkbox" checked={trail} onChange={e=>setTrail(e.target.checked)}/>짧은 잔상</label>
      <label><input type="checkbox" checked={effects} onChange={e=>setEffects(e.target.checked)}/>접촉 표식</label>
      <label><input type="checkbox" checked={baseline} onChange={e=>setBaseline(e.target.checked)}/>main 기준 장면</label>
      <label><input type="checkbox" checked={debug} onChange={e=>setDebug(e.target.checked)}/>개발 검수선</label>
    </div>
    <section className={'pt-panels'+(focus!=='all'?' pt-solo':'')} aria-label="동일 조건 구종 비교">
      {shown.map(d=><article className="pt-panel" key={d.profile}><header><h2>{PITCH_PROFILES[d.profile].label}</h2><span>{d.profile==='fastball'?'곧게 파고드는 접근':d.profile==='slider'?'후반에 읽히는 횡변화':'위쪽 호에서 감기는 낙차'}</span></header><div className="pt-stage"><BattleScene actors={actors} framing="atbat" playback={playback} phase={phase} result={phase==='result'?outcomes[result]:null} reviewFrame={{elapsed,effect:null,overlay:<FlightArt descriptor={d} elapsed={elapsed} result={result} trail={trail} effects={effects} debug={debug}/>}}/></div></article>)}
    </section>
    {baseline&&<section className="pt-baseline"><h2>main 기준 · 동일 배우 / 시각 / 결과</h2><p>기존 직선 보간과 기존 효과를 그대로 재생합니다. 위 잔상·접촉 표식 설정은 후보에만 적용됩니다.</p><div className="pt-stage"><BattleScene actors={actors} framing="atbat" playback={playback} phase={phase} result={phase==='result'?outcomes[result]:null} scene={{shotGrade:result==='hit'?'hit':result==='foul'?'foul':'take',playToken:1}} reviewFrame={{elapsed}}/></div></section>}
    <footer><p>저장하지 않는 연출 비교입니다. 실제 판정·구종 상성은 추가하지 않습니다. 헛스윙의 비접촉·9존·outside와 실제 투구 연결은 후속 검수 대상입니다.</p><p>현재 배우의 접촉 작화 검수와 기존 #121 시각 품질 미달 이력은 유지됩니다. 무음 · 자동 재생 없음 · 효과를 끄고 접점을 확인할 수 있습니다.</p></footer>
    {debug&&<details open><summary>개발 검수 값</summary><pre>{JSON.stringify({seed:23,releaseAt,impactAt,flightMs:impactAt-releaseAt,elapsed,result:phase==='result'?result:'not revealed',release:actor.release,target,descriptors},null,2)}</pre></details>}
  </main>;
}
