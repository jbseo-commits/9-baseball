import React,{useEffect,useRef,useState} from 'react';
import BallparkBattle from '../BallparkBattle.jsx';
import {playV10Action,setAimZone,advanceV10Pitch,advanceV10Batter} from '../engine.js';
import {presentationFor,presentationTimeline} from '../presentation.js';
import {captureExecution} from '../presentation-snapshot.js';
import {startPresentationClock} from '../presentation-clock.js';
import {withKnockoutHold} from '../pitcher-sd.js';
import {animationRate,readAnimationRate,rememberAnimationRate} from '../animation-speed.js';
import {audio,cue} from '../audio.js';
import {haptic} from '../haptics.js';
import {installCardDetailGestures} from '../CardDetailSheet.jsx';
import {BattleActorSprite,BattlePitcherSprite} from '../App.jsx';
import {BATTER_V15_SHEET} from '../batter-v15.js';
import {pitcherAtlases} from '../pitcher-visuals.js';
import {rosterPitcherActor} from './roster-actor.js';
import {validComparisonActivity} from './compare-config.js';
import './comparison.css';
import LegacyCompareHost from './LegacyCompareHost.jsx';
import {appInputs,buildFixture,VNEXT_FIXTURES} from './fixtures.js';
import {createCardDecisionLabRun,CARD_DECISION_LAB_SEED,CARD_DECISION_LAB_GUIDE,cardDecisionLabPresentationTimeline} from './card-decision-lab.js';
import './card-decision-lab.css';

/* Separate memory route: never mounts Duel or invokes save/bootstrap. Legacy actors
   are shared production components. Actual engine + actual battle
   controller and the production presentation clock; sample art, no production save. */
export default function IntegrationPreview({fixture='swing-main',variant='vnext',embedded=false,decisionLab=false}){
  const first=VNEXT_FIXTURES.find(f=>f.id===fixture&&!f.defenseLab)?.id||'swing-main';
  const [rate,setRate]=useState(()=>decisionLab||embedded||variant==='legacy'?1:readAnimationRate());
  const changeRate=value=>setRate(rememberAnimationRate(value));
  const [session,setSession]=useState({id:first,key:0}),[sound,setSound]=useState(false);
  const reset=()=>setSession(s=>({id:first,key:s.key+1}));
  return <PreviewSession animationRate={decisionLab||embedded||variant==='legacy'?1:rate} onRateChange={decisionLab||embedded||variant==='legacy'?null:changeRate} variant={variant} embedded={embedded} sound={sound} setSound={setSound} key={session.key} fixture={session.id} decisionLab={decisionLab} decisionSeed={CARD_DECISION_LAB_SEED} onReset={reset} onChange={id=>setSession(s=>({id,key:s.key+1}))}/>;
}

function PreviewSession({fixture,onChange,sound,setSound,variant,embedded,animationRate:rate=1,onRateChange,decisionLab=false,decisionSeed=CARD_DECISION_LAB_SEED,onReset}){
  const clean=new URLSearchParams(window.location.search).get('battlePresentation')==='clean';
  const [active,setActive]=useState(!embedded),activeRef=useRef(!embedded);activeRef.current=active;
  useEffect(()=>{if(!embedded)return;const receive=e=>{if(validComparisonActivity(e,window))setActive(e.data.active);};window.addEventListener('message',receive);window.parent.postMessage({type:'9zone-battle-compare-ready',version:1},window.location.origin);return()=>window.removeEventListener('message',receive);},[embedded]);
  const [initial]=useState(()=>decisionLab?buildDecisionLabInitial(decisionSeed):buildFixture(fixture));
  const [labPitcher]=useState(()=>decisionLab?rosterPitcherActor(initial.artId,pitcherAtlases[initial.artId]):null);
  const [s,setS]=useState(initial.s),[selected,setSelected]=useState(initial.selected),[swingStack,setSwingStack]=useState(initial.swingStack);
  const [fxStage,setFxStage]=useState(initial.animate?'windup':initial.fxStage),[playback,setPlayback]=useState(null),[execution,setExecution]=useState(initial.execution);
  const cueAbort=useRef(new AbortController());
  const cancelCues=()=>{cueAbort.current.abort();cueAbort.current=new AbortController();};
  useEffect(()=>{const hide=()=>{if(document.hidden)cancelCues();};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);cancelCues();};},[]);
  useEffect(()=>{if(!sound)cancelCues();},[sound]);
  const current=useRef(s),busy=useRef(false),clock=useRef(null),token=useRef(0),soundRef=useRef(sound);current.current=s;soundRef.current=sound;
  useEffect(()=>()=>clock.current?.cancel(),[]);
  useEffect(()=>{
    const remove=installCardDetailGestures(window,(d,el)=>window.__bpInspect?.open?.(d,el));
    const close=e=>{if(e.key==='Escape')window.__bpInspect?.close?.();};
    window.addEventListener('keydown',close);
    return ()=>{remove();window.removeEventListener('keydown',close);};
  },[]);
  const inputs=appInputs(s,{selected,swingStack});
  const commit=next=>{
    if(next===current.current)return;
    current.current=next;setS(next);setSelected(null);setSwingStack([]);
  };
  const action=type=>{
    if(!activeRef.current||busy.current||fxStage)return;
    const before=current.current;
    const next=playV10Action(before,type==='take'?{type:'take'}:{type:'card',id:selected,supports:inputs.swingStack});
    if(next===before)return;
    const executed=captureExecution(before,next,{selected});
    commit(next);setExecution(executed);
    beginPresentation(next,executed);
  };
  const beginPresentation=(next,executed)=>{
    const shot=presentationFor(next),reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isPitch=next.last?.kind!=='skill';
    const baseTimeline=presentationTimeline(shot,reduced);
    const timeline=decisionLab&&isPitch?cardDecisionLabPresentationTimeline(baseTimeline,{actor:labPitcher,reduced,knockedOut:next.pitcher?.hp===0}):withKnockoutHold(baseTimeline,isPitch&&!reduced&&next.pitcher?.hp===0);
    cancelCues();
    const speed=reduced?1:animationRate(rate),emit=kind=>speed===1?cue(kind):cue(kind,{rate:speed,signal:cueAbort.current.signal});
    const play={timeline,...(decisionLab&&isPitch&&timeline.delivery?{pitchReleaseAt:timeline.delivery.pitchReleaseAt}:{}),rate:speed,startedAt:performance.now(),token:++token.current,action:isPitch?(executed?.action==='take'?'take':'swing'):'prepare'};
    busy.current=true;clock.current?.cancel();setPlayback(play);
    if(!embedded&&activeRef.current&&soundRef.current){audio();emit(isPitch?'pitch':shot?.cue||'skill');}
    clock.current=startPresentationClock(timeline,{startedAt:play.startedAt,rate:speed,
      onStage:setFxStage,
      onImpact:({audible})=>{if(!audible||embedded||!activeRef.current)return;if(isPitch&&soundRef.current)emit(shot?.cue||'hit');haptic(timeline.haptic);},
      onSettle:({audible})=>{if(audible&&!embedded&&activeRef.current&&soundRef.current){if(next.phase==='won')emit('champion');else if(next.phase==='reward')emit('game-win');else if(next.phase==='lost')emit('game-loss');else if(next.last?.runs>0)emit('rbi');}},
      onComplete:()=>{setPlayback(null);busy.current=false;}
    });
  };
  useEffect(()=>{if(initial.animate)beginPresentation(initial.s,initial.execution);},[]); // fixture remount owns cancellation
  const next=()=>{
    if(!activeRef.current||busy.current||fxStage)return;
    const state=current.current;
    commit(state.phase==='pitch'?advanceV10Pitch(state):state.phase==='between'?advanceV10Batter(state):state);
  };
  const terminal=!['battle','pitch','between'].includes(s.phase);
  const game=(<BallparkBattle locked={!active} s={s} {...inputs} selected={selected} pitcher={s.pitcher} rosterPitcher={decisionLab?labPitcher:null} pitcherArt={variant==='legacy'?(pitcherAtlases[initial.artId]?<BattlePitcherSprite atlas={pitcherAtlases[initial.artId]} stage={fxStage} shot={presentationFor(s)} playToken={s.stats.pitches}/>:<BattleActorSprite who="pitcher" golden stage={fxStage} shot={fxStage?presentationFor(s):null} playToken={s.stats.pitches}/>):null} batterArt={variant==='legacy'?<BattleActorSprite who="batter" golden sheet={BATTER_V15_SHEET} stage={fxStage} shot={fxStage?presentationFor(s):null} playToken={s.stats.pitches}/>:null} label="검수" artId={initial.artId}
      vnextReview={variant==='legacy'?{...initial,variant:'legacy'}:initial} previewMode animationRate={rate} onAnimationRateChange={onRateChange} playback={playback} execution={execution} fxStage={fxStage||(terminal&&s.battle?.revealed?'settle':null)} shot={fxStage||s.battle?.revealed?presentationFor(s):null} autoAdvance={!decisionLab} playToken={s.stats.pitches}
      onSelect={setSelected} onStack={setSwingStack} onAim={z=>{if(activeRef.current&&!busy.current&&!fxStage){const next=setAimZone(current.current,z);current.current=next;setS(next);}}}
      onSwing={()=>action('card')} onTake={()=>action('take')}
      sound={embedded?false:sound} onToggleSound={embedded?null:()=>{audio();setSound(v=>!v);}} onNext={!terminal&&active?next:null} nextLabel={s.phase==='pitch'?'다음 공':s.phase==='between'?'다음 타자':''}/>);
  return <div className={'vnext-shell'+(embedded?' bc-embedded':'')+(clean?' bv-clean-preview':'')}>
    {decisionLab?<nav className="bv-fixture-tools cdl-toolbar" aria-label="카드 선택 실험 안내">
      <div className="cdl-guide"><strong>카드 판단 · 첫 상대 실험</strong><ol>{CARD_DECISION_LAB_GUIDE.map(step=><li key={step}>{step}</li>)}</ol><small>실제 게임 엔진 · 고정 시드 {decisionSeed} · 저장 안 됨 · 첫 상대만 · 배속 1×</small></div>
      <button type="button" onClick={onReset}>같은 시드 다시 시작</button>
      {terminal&&(!fxStage||fxStage==='settle')&&<strong role="status">첫 상대 결과 · 전체 런은 진행하지 않습니다. 같은 시드로 다른 선택을 시험하세요.</strong>}
    </nav>:<nav className="bv-fixture-tools" aria-label="검수 화면 선택">
      <label>메모리 검수 <select aria-label="검수 상태" value={fixture} onChange={e=>onChange(e.target.value)}>
        {VNEXT_FIXTURES.filter(f=>!f.defenseLab).map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
      </select></label>
      <button type="button" onClick={()=>onChange(fixture)}>다시 시작</button>
      <button type="button" aria-pressed={sound} onClick={()=>{audio();setSound(v=>!v);}}>소리 {sound?'켜짐':'꺼짐'}</button><a href="?battleUi=vnext">실제 런으로</a><span className="bv-sandbox-art">샘플 투수 · 연출 검수</span><span className="bv-sandbox-seed">저장 안 됨 · seed {s.initialSeed||20261027}</span>
      {terminal&&(!fxStage||fxStage==='settle')&&<strong role="status">{s.phase==='reward'?'투수 강판':s.phase==='won'?'승리':'경기 종료'} · 다시 시작으로 검수 계속</strong>}
    </nav>}
    {variant==='legacy'?<LegacyCompareHost hasAtlas={!!pitcherAtlases[initial.artId]}>{game}</LegacyCompareHost>:game}
  </div>;
}

function buildDecisionLabInitial(seed){
  const {state,nodeId}=createCardDecisionLabRun(seed);
  const {hand}=appInputs(state);
  const node=state.runMap.nodes.find(item=>item.id===nodeId);
  return {s:state,execution:null,animate:false,hand,selected:null,swingStack:[],choice:null,armed:null,inspectOpen:false,fxStage:null,hasNext:false,nextLabel:'',playToken:state.stats.pitches||0,artId:node?.opponent?.artId||state.v10.opponent.artId,decisionLabNodeId:nodeId};
}
