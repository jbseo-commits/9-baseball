import React,{useEffect,useMemo,useRef,useState} from 'react';
import BattleScene,{SAMPLE_ACTORS} from './BattleScene.jsx';
import {ATBAT_COMPOSITION} from './atbat-composition.js';
import {rosterPitcherActor} from './roster-actor.js';
import {pitcherAtlases} from '../pitcher-visuals.js';
import {pitchDescriptor,PITCH_PROFILES} from './pitch-trajectory.js';
import PitchContactSpark from './PitchContactSpark.jsx';
import ballUrl from '../../../assets/production-art/asset-led-battle-v1/ball.svg';
import {classifySwipe,judgePrototypeContact,profileFromCrypto,prototypeSwingPoseTimeline,sampleAtOrAfterArrival,scorePrototypeResult,SWING_LEAD_MS} from './pitch-swing-prototype.js';
import './pitch-swing-prototype.css';

const ART='regular-01-red-rush';
const actor=rosterPitcherActor(ART,pitcherAtlases[ART]);
const actors={pitcher:actor,batter:SAMPLE_ACTORS.batter};
const TARGET=ATBAT_COMPOSITION.contact;
const line=points=>points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ');

function SwingOverlay({descriptor,elapsed,played,result,effects,reduced,trail}){
  let sample;
  const hasContact=['contact','cut-foul'].includes(result?.play?.result)&&result?.play?.position;
  if(hasContact&&result?.contactAt!=null&&elapsed>result.contactAt){
    const age=elapsed-result.contactAt,p=Math.min(1,age/520),start=result.play.position;
    const control=result.play.result==='cut-foul'?{x:-130,y:-60}:{x:135,y:-245};
    const finish=result.play.result==='cut-foul'?{x:-215,y:105}:{x:245,y:-195};
    sample={position:{x:start.x+2*(1-p)*p*control.x+p*p*finish.x,y:start.y+2*(1-p)*p*control.y+p*p*finish.y},radius:result.play.radius+(2-result.play.radius)*p};
  }else if(hasContact&&result.contactAt!=null&&elapsed>=result.contactAt){
    sample={position:result.play.position,radius:result.play.radius};
  }else{
    sample=sampleAtOrAfterArrival(descriptor,elapsed);
  }
  const wake=trail&&sample&&elapsed<=descriptor.impactAt?Array.from({length:5},(_,i)=>{
    const t=Math.max(descriptor.releaseAt,elapsed-20*(4-i)/4);
    return sampleAtOrAfterArrival(descriptor,t).position;
  }):[];
  const contactAge=result?.contactAt==null?null:elapsed-result.contactAt;
  return <svg className="bv-world-effects ps-flight" viewBox="0 0 1672 941" aria-hidden="true" data-testid="prototype-flight" data-elapsed={elapsed}>
    {wake.length>1&&<><path d={line(wake)} fill="none" stroke="#e2ebe2" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/><path d={line(wake)} fill="none" stroke="#8dc5c9" strokeWidth="8" strokeLinecap="round" opacity=".12"/></>}
    {['contact','cut-foul'].includes(result?.play?.result)&&result?.play?.position&&<PitchContactSpark age={contactAge} point={result.play.position} result={result.play.result==='cut-foul'?'foul':'hit'} enabled={effects} reduced={reduced}/>}
    {sample&&<image data-testid="prototype-ball" x={sample.position.x-sample.radius} y={sample.position.y-sample.radius} width={sample.radius*2} height={sample.radius*2} href={ballUrl}/>}
  </svg>;
}

export default function PitchSwingPrototype(){
  const [reduced,setReduced]=useState(()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [duration,setDuration]=useState(600),[elapsed,setElapsed]=useState(0),[playing,setPlaying]=useState(false);
  const [pitch,setPitch]=useState(null),[swing,setSwing]=useState(null),[outcome,setOutcome]=useState(null),[taking,setTaking]=useState(false);
  const [selected,setSelected]=useState('medium'),[gesture,setGesture]=useState(null),[fx,setFx]=useState(true),[trail,setTrail]=useState(true),[gameScore,setGameScore]=useState(0),[strikes,setStrikes]=useState(0);
  const scoreRef=useRef({score:0,strikes:0});
  const rootRef=useRef(null), epochRef=useRef(0),liveRef=useRef({}),gestureRef=useRef(null),rafRef=useRef(0);
  const activeDescriptor=pitch?.descriptor||null;
  const timeline=useMemo(()=>{
    if(!pitch)return {impactAt:duration,releaseAt:duration+160,settleAt:duration+650,duration:1800,freeze:35,slowmo:0};
    const contactAt=swing?.contactAt??pitch.descriptor.impactAt;
    return swing?prototypeSwingPoseTimeline({inputAt:swing.inputAt,contactAt}):{impactAt:pitch.descriptor.impactAt,releaseAt:pitch.descriptor.impactAt+160,settleAt:pitch.descriptor.impactAt+650,duration:1800,freeze:35,slowmo:0};
  },[pitch,swing]);
  const playback={timeline,pitchReleaseAt:0,action:swing?'swing':'take',rate:1,startedAt:0,token:pitch?.id||0};
  const phase=outcome?'result':pitch?'flight':'deciding';
  const verdict=outcome?.kind==='contact'?'contact':outcome?.kind==='cut-foul'?'foul':'take';
  const sceneResult=outcome?{kind:verdict,label:verdict==='contact'?'접촉':verdict==='foul'?'커트 파울':'지켜봄',actualZone:4}:null;

  useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;const change=()=>{setReduced(media.matches);if(media.matches&&liveRef.current.pitch&&!liveRef.current.outcome)discard('동작 설정 변경으로 공을 취소했습니다.');};media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  useEffect(()=>{
    if(!playing)return;
    const tick=()=>{
      const current=performance.now()-epochRef.current;setElapsed(current);
      const pending=liveRef.current;
      if(pending.swing&&!pending.outcome&&current>=pending.swing.contactAt){
        const play=judgePrototypeContact({descriptor:pending.pitch.descriptor,contactAt:pending.swing.contactAt,target:TARGET,swipe:pending.swing.swipe});
        pending.outcome={kind:play.result,play,contactAt:pending.swing.contactAt,swipe:pending.swing.swipe};
        const scored=scorePrototypeResult({...scoreRef.current,result:play.result,multiplier:play.multiplier});scoreRef.current=scored;setGameScore(scored.score);setStrikes(scored.strikes);setOutcome(pending.outcome);
      }else if(!pending.swing&&!pending.outcome&&pending.pitch&&current>=pending.pitch.descriptor.impactAt){
        pending.outcome={kind:'take',contactAt:pending.pitch.descriptor.impactAt,swipe:null};
        const scored=scorePrototypeResult({...scoreRef.current,result:'take'});scoreRef.current=scored;setGameScore(scored.score);setStrikes(scored.strikes);setOutcome(pending.outcome);
      }
      if(current<Math.max((liveRef.current.pitch?.descriptor.impactAt||0)+900,(liveRef.current.swing?.contactAt||0)+800))rafRef.current=requestAnimationFrame(tick);
      else setPlaying(false);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[playing,duration,pitch?.id]);
  useEffect(()=>{
    const cancel=()=>{if(liveRef.current.pitch&&!liveRef.current.outcome)discard('화면 전환으로 공을 취소했습니다. 점수·스트라이크 변화 없음.');};
    const hidden=()=>{if(document.hidden)cancel();};
    window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);document.addEventListener('visibilitychange',hidden);
    return()=>{window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);document.removeEventListener('visibilitychange',hidden);};
  },[]);
  function discard(message='공을 취소했습니다. 점수·스트라이크 변화 없음.'){
    cancelAnimationFrame(rafRef.current);setPlaying(false);setPitch(null);setSwing(null);setOutcome({kind:'canceled',message});setElapsed(0);setGesture(null);gestureRef.current=null;liveRef.current={};
  }
  function start(){
    if(scoreRef.current.strikes>=3){scoreRef.current={...scoreRef.current,strikes:0};setStrikes(0);}
    const profile=profileFromCrypto();
    const releaseAt=actor.releaseAt;
    const descriptor=pitchDescriptor({profile,release:actor.release,target:TARGET,releaseAt,impactAt:releaseAt+duration,seed:0});
    const next={id:(liveRef.current.pitch?.id||0)+1,profile,descriptor};cancelAnimationFrame(rafRef.current);epochRef.current=performance.now();liveRef.current={pitch:next};gestureRef.current=null;setGesture(null);setPitch(next);setSwing(null);setOutcome(null);setTaking(false);setElapsed(0);setPlaying(true);
  }
  function commit(size){
    const pending=liveRef.current;if(!size||!pending.pitch||pending.swing||pending.take||pending.outcome)return;
    const inputAt=performance.now()-epochRef.current;
    const next={inputAt,contactAt:inputAt+SWING_LEAD_MS,swipe:size};pending.swing=next;setSwing(next);setSelected(size);
  }
  function take(){const pending=liveRef.current;if(!pending.pitch||pending.swing||pending.take||pending.outcome)return;pending.take=true;setTaking(true);}
  function startPointer(e){
    if(e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
    if(!liveRef.current.pitch||liveRef.current.swing||liveRef.current.take||liveRef.current.outcome||gestureRef.current)return;
    const el=e.currentTarget;el.setPointerCapture?.(e.pointerId);
    const g={id:e.pointerId,x:e.clientX,width:Math.max(1,el.clientWidth),at:performance.now()};gestureRef.current=g;setGesture(g);
  }
  function endPointer(e){const g=gestureRef.current;if(!g||g.id!==e.pointerId)return;gestureRef.current=null;setGesture(null);try{e.currentTarget.releasePointerCapture?.(e.pointerId);}catch{}commit(classifySwipe(e.clientX-g.x,g.width));}
  function cancelPointer(e){if(gestureRef.current?.id!==e.pointerId)return;gestureRef.current=null;setGesture(null);discard('입력이 취소되었습니다. 점수·스트라이크 변화 없음.');}
  function keySwing(e){if(e.code==='Space'){e.preventDefault();if(!e.repeat)commit(selected);}}

  const displayProfile=outcome&&pitch&&outcome.kind!=='canceled'?PITCH_PROFILES[pitch.profile].label:null;
  return <main ref={rootRef} className="ps-root">
    <header className="ps-head"><div><p className="ps-kicker">9ZONE · SWING LAB</p><h1>읽고, 휘두르기</h1></div><span className="ps-tag">입력 실험 · 실전 미연결</span></header>
    <section className="ps-layout">
      <section className="ps-play" aria-label="실제 투구와 스윙" data-state={pitch?(outcome?'result':'flight'):'ready'}>
        <BattleScene actors={actors} framing="atbat" phase={phase} result={sceneResult} playback={playback} reviewFrame={{elapsed,effect:null,pitcherPlayback:{timeline:{duration:3000},action:pitch?'take':'prepare'},overlay:activeDescriptor?<SwingOverlay descriptor={activeDescriptor} elapsed={elapsed} result={outcome?.play?outcome:null} effects={fx} reduced={reduced} trail={trail}/>:<svg/>}}/>
        <div className="ps-screen-status">{!pitch?'스와이프를 놓으면 160ms 뒤 배트가 접점에 도착':outcome?`${outcome.kind==='contact'?'접촉':outcome.kind==='cut-foul'?'커트 파울':outcome.kind==='miss'?'헛스윙':'지켜보기'} · ${displayProfile}`:taking?'지켜보기 선택':swing?'스윙 중':elapsed<actor.releaseAt?'준비 · 구종 비공개':'비행 중 · 구종을 읽어보세요'}</div>
      </section>
      <aside className="ps-controls">
        <div className="ps-actions">{!pitch||outcome?<button className="ps-primary" type="button" onClick={start}>{pitch?'다음 공':'투구 시작'}</button>:<button type="button" onClick={()=>discard()}>공 취소</button>}<button type="button" onClick={take} disabled={!pitch||!!outcome||!!swing||taking}>지켜보기</button></div>
        <div className="ps-pad-wrap"><div className="ps-swing-pad" role="button" tabIndex={0} aria-label="가로 드래그로 스윙하고 크기 선택" onPointerDown={startPointer} onPointerUp={endPointer} onPointerCancel={cancelPointer} onLostPointerCapture={cancelPointer} onKeyDown={keySwing} data-gesture={gesture?'active':'idle'}><strong>가로로 밀고 놓기</strong><span>작게 커트 · 중간 ×1.5 · 크게 ×3</span></div><small>놓는 순간 스윙 시작 → 160ms 뒤 접점</small></div>
        <div className="ps-keyboard"><label>키보드 크기 <select aria-label="키보드 스윙 크기" value={selected} onChange={e=>setSelected(e.target.value)}><option value="small">작음 ×1 · 커트</option><option value="medium">중간 ×1.5</option><option value="large">큼 ×3</option></select></label><button type="button" onClick={()=>commit(selected)} disabled={!pitch||!!swing||!!outcome||taking}>스윙 (Space)</button></div>
        <p className="ps-mode">{duration}ms {duration===600?'연습':'챌린지'} · 가설 점수 / 저장 안 함</p>
      </aside>
    </section>
    <div className="ps-score"><strong>프리뷰 점수 {gameScore}</strong><span>스트라이크 {strikes}/3{strikes>=3?' · 삼진, 다음 공은 새 타석':''}</span><button type="button" onClick={()=>{scoreRef.current={score:0,strikes:0};setGameScore(0);setStrikes(0);discard('프리뷰 점수를 초기화했습니다.');}}>세션 초기화</button></div>
    {outcome&&<section className="ps-result" aria-live="polite"><h2>{outcome.kind==='contact'?'접촉':outcome.kind==='cut-foul'?'작은 스윙 · 커트 파울':outcome.kind==='take'?'지켜보기 · 스트라이크':outcome.kind==='miss'?'헛스윙':outcome.kind==='canceled'?'투구 취소':'결과'}</h2>{outcome.message&&<p>{outcome.message}</p>}{outcome.play&&<p>접점 도착 오차 {outcome.play.timingErrorMs>=0?'+':''}{outcome.play.timingErrorMs.toFixed(0)}ms · 중심 거리 {Number.isFinite(outcome.play.distance)?outcome.play.distance.toFixed(1):'비행 전'} · 점수 배율 ×{outcome.play.multiplier}</p>}{displayProfile&&<p>구종 공개: {displayProfile}</p>}</section>}
    <details className="ps-settings"><summary>연습 설정 · 조작법 · 실험 규칙</summary>
      <fieldset><legend>릴리스 → 도착 비행 시간</legend><label><input type="radio" name="duration" checked={duration===600} disabled={!!pitch&&!outcome} onChange={()=>setDuration(600)}/>600ms 연습 (기본)</label><label><input type="radio" name="duration" checked={duration===300} disabled={!!pitch&&!outcome} onChange={()=>setDuration(300)}/>300ms 챌린지</label></fieldset>
      <div className="ps-toolbar"><label><input type="checkbox" checked={trail} onChange={e=>setTrail(e.target.checked)}/>짧은 잔상</label><label><input type="checkbox" checked={fx&&!reduced} disabled={reduced} onChange={e=>setFx(e.target.checked)}/>접촉 PXF</label><button type="button" onClick={()=>setFx(false)}>효과 끄기</button><output>{elapsed.toFixed(0)} ms</output></div>
      <p>패드를 가로로 끌고 놓으세요. 12px 미만은 입력하지 않습니다. 길이 ÷ 패드 너비 &lt;12% 작음, 12–28% 중간, ≥28% 큼입니다. 키보드는 크기를 고른 뒤 스윙 버튼을 누르거나 패드에 초점을 두고 Space를 누릅니다.</p>
      <p>승인된 가설 배율: 작음 ×1 · 중간 ×1.5 · 큼 ×3. 접촉은 100×배율 점수와 새 타석(스트라이크 0), 작은 스와이프 접촉은 커트 파울(0점)이며 2스트라이크를 넘기지 않습니다. 지켜보기·헛스윙은 스트라이크입니다. 큰 스윙의 추가 위험·카드 시너지는 아직 구현하지 않았습니다.</p>
      <p>입력 후 160ms의 배트 준비 시간이 있습니다. 실제 공 중심과 등록 접점 C 사이 22 world-unit 이내일 때만 접촉으로 봅니다. 이는 작화된 배트 충돌체를 검증한 것이 아닌 실험용 근사값입니다. 늦은 입력으로 공을 되감지 않습니다.</p>
      <p>세 구종의 도착 시간은 동일합니다. 직구는 곧게, 슬라이더는 후반 횡변화, 커브는 낙차를 보입니다. 300ms 모드의 정시 스윙 시작은 릴리스 후 140ms이며, 슬라이더 최대 횡변화(225ms)보다 빠릅니다. 후반 변화를 다 본 뒤 반응하는 구조는 아니며, 사람 대상 반응 검증도 아직 없습니다. 클라이언트 전용 프리뷰라 개발자 도구의 구종 열람을 막지 않습니다.</p>
      <p>실전 9존·카드·HP·RNG·저장과 연결하지 않습니다. 취소·회전·다른 창 전환은 진행 중 공을 버립니다. 기존 #121 시각 품질 미달 기록은 유지됩니다.</p>
      {reduced&&<p role="status">동작 줄이기: 접촉 효과는 꺼집니다. 입력에 필요한 공·배트 움직임은 투구 시작을 누른 경우에만 재생됩니다.</p>}
    </details>
  </main>;
}
