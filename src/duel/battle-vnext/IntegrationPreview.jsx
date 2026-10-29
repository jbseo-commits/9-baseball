import React,{useEffect,useRef,useState} from 'react';
import BallparkBattle from '../BallparkBattle.jsx';
import {playV10Action,setAimZone,advanceV10Pitch,advanceV10Batter} from '../engine.js';
import {presentationFor,presentationTimeline} from '../presentation.js';
import {captureExecution} from '../presentation-snapshot.js';
import {startPresentationClock} from '../presentation-clock.js';
import {withKnockoutHold} from '../pitcher-sd.js';
import {audio,cue} from '../audio.js';
import {haptic} from '../haptics.js';
import {installCardDetailGestures} from '../CardDetailSheet.jsx';
import {BattleActorSprite,BattlePitcherSprite} from '../App.jsx';
import {BATTER_V15_SHEET} from '../batter-v15.js';
import {pitcherAtlases} from '../pitcher-visuals.js';
import {validComparisonActivity} from './compare-config.js';
import './comparison.css';
import LegacyCompareHost from './LegacyCompareHost.jsx';
import {appInputs,buildFixture,VNEXT_FIXTURES} from './fixtures.js';

/* Separate memory route: never mounts Duel or invokes save/bootstrap. Legacy actors
   are shared production components. Actual engine + actual battle
   controller and the production presentation clock; sample art, no production save. */
export default function IntegrationPreview({fixture='swing-main',variant='vnext',embedded=false}){
  const first=VNEXT_FIXTURES.find(f=>f.id===fixture&&!f.defenseLab)?.id||'swing-main';
  const [session,setSession]=useState({id:first,key:0}),[sound,setSound]=useState(false);
  return <PreviewSession variant={variant} embedded={embedded} sound={sound} setSound={setSound} key={session.key} fixture={session.id} onChange={id=>setSession(s=>({id,key:s.key+1}))}/>;
}

function PreviewSession({fixture,onChange,sound,setSound,variant,embedded}){
  const clean=new URLSearchParams(window.location.search).get('battlePresentation')==='clean';
  const [active,setActive]=useState(!embedded),activeRef=useRef(!embedded);activeRef.current=active;
  useEffect(()=>{if(!embedded)return;const receive=e=>{if(validComparisonActivity(e,window))setActive(e.data.active);};window.addEventListener('message',receive);window.parent.postMessage({type:'9zone-battle-compare-ready',version:1},window.location.origin);return()=>window.removeEventListener('message',receive);},[embedded]);
  const [initial]=useState(()=>buildFixture(fixture));
  const [s,setS]=useState(initial.s),[selected,setSelected]=useState(initial.selected),[swingStack,setSwingStack]=useState(initial.swingStack);
  const [fxStage,setFxStage]=useState(initial.animate?'windup':initial.fxStage),[playback,setPlayback]=useState(null),[execution,setExecution]=useState(initial.execution);
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
    const timeline=withKnockoutHold(presentationTimeline(shot,reduced),isPitch&&!reduced&&next.pitcher?.hp===0);
    const play={timeline,startedAt:performance.now(),token:++token.current,action:isPitch?(executed?.action==='take'?'take':'swing'):'prepare'};
    busy.current=true;clock.current?.cancel();setPlayback(play);
    if(!embedded&&activeRef.current&&soundRef.current){audio();cue(isPitch?'pitch':shot?.cue||'skill');}
    clock.current=startPresentationClock(timeline,{startedAt:play.startedAt,
      onStage:setFxStage,
      onImpact:({audible})=>{if(!audible||embedded||!activeRef.current)return;if(isPitch&&soundRef.current)cue(shot?.cue||'hit');haptic(timeline.haptic);},
      onSettle:({audible})=>{if(audible&&!embedded&&activeRef.current&&soundRef.current){if(next.phase==='won')cue('champion');else if(next.phase==='reward')cue('game-win');else if(next.phase==='lost')cue('game-loss');else if(next.last?.runs>0)cue('rbi');}},
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
  const game=(<BallparkBattle locked={!active} s={s} {...inputs} selected={selected} pitcher={s.pitcher} pitcherArt={variant==='legacy'?(pitcherAtlases[initial.artId]?<BattlePitcherSprite atlas={pitcherAtlases[initial.artId]} stage={fxStage} shot={presentationFor(s)} playToken={s.stats.pitches}/>:<BattleActorSprite who="pitcher" golden stage={fxStage} shot={fxStage?presentationFor(s):null} playToken={s.stats.pitches}/>):null} batterArt={variant==='legacy'?<BattleActorSprite who="batter" golden sheet={BATTER_V15_SHEET} stage={fxStage} shot={fxStage?presentationFor(s):null} playToken={s.stats.pitches}/>:null} label="검수" artId={initial.artId}
      vnextReview={variant==='legacy'?{...initial,variant:'legacy'}:initial} previewMode playback={playback} execution={execution} fxStage={fxStage||(terminal&&s.battle?.revealed?'settle':null)} shot={fxStage||s.battle?.revealed?presentationFor(s):null} playToken={s.stats.pitches}
      onSelect={setSelected} onStack={setSwingStack} onAim={z=>{if(activeRef.current&&!busy.current&&!fxStage){const next=setAimZone(current.current,z);current.current=next;setS(next);}}}
      onSwing={()=>action('card')} onTake={()=>action('take')}
      sound={embedded?false:sound} onToggleSound={embedded?null:()=>{audio();setSound(v=>!v);}} onNext={!terminal&&active?next:null} nextLabel={s.phase==='pitch'?'다음 공':s.phase==='between'?'다음 타자':''}/>);
  return <div className={'vnext-shell'+(embedded?' bc-embedded':'')+(clean?' bv-clean-preview':'')}>
    <nav className="bv-fixture-tools" aria-label="검수 화면 선택">
      <label>메모리 검수 <select aria-label="검수 상태" value={fixture} onChange={e=>onChange(e.target.value)}>
        {VNEXT_FIXTURES.filter(f=>!f.defenseLab).map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
      </select></label>
      <button type="button" onClick={()=>onChange(fixture)}>다시 시작</button>
      <button type="button" aria-pressed={sound} onClick={()=>{audio();setSound(v=>!v);}}>소리 {sound?'켜짐':'꺼짐'}</button><a href="?battleUi=vnext">실제 런으로</a><span className="bv-sandbox-art">샘플 투수 · 연출 검수</span><span className="bv-sandbox-seed">저장 안 됨 · seed {s.initialSeed||20261027}</span>
      {terminal&&(!fxStage||fxStage==='settle')&&<strong role="status">{s.phase==='reward'?'투수 강판':s.phase==='won'?'승리':'경기 종료'} · 다시 시작으로 검수 계속</strong>}
    </nav>
    {variant==='legacy'?<LegacyCompareHost hasAtlas={!!pitcherAtlases[initial.artId]}>{game}</LegacyCompareHost>:game}
  </div>;
}
