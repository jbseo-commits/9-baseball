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
import {appInputs,buildFixture,VNEXT_FIXTURES} from './fixtures.js';

/* Separate route: no App/bootstrap/storage import. Actual engine + actual battle
   controller and the production presentation clock; sample art, no production save. */
export default function IntegrationPreview({fixture='swing-main'}){
  const first=VNEXT_FIXTURES.find(f=>f.id===fixture&&!f.defenseLab)?.id||'swing-main';
  const [session,setSession]=useState({id:first,key:0});
  return <PreviewSession key={session.key} fixture={session.id} onChange={id=>setSession(s=>({id,key:s.key+1}))}/>;
}

function PreviewSession({fixture,onChange}){
  const [initial]=useState(()=>buildFixture(fixture));
  const [s,setS]=useState(initial.s),[selected,setSelected]=useState(initial.selected),[swingStack,setSwingStack]=useState(initial.swingStack);
  const [fxStage,setFxStage]=useState(initial.fxStage),[playback,setPlayback]=useState(null),[execution,setExecution]=useState(null),[sound,setSound]=useState(false);
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
    if(busy.current||fxStage)return;
    const before=current.current;
    const next=playV10Action(before,type==='take'?{type:'take'}:{type:'card',id:selected,supports:inputs.swingStack});
    if(next===before)return;
    const executed=captureExecution(before,next,{selected});
    commit(next);setExecution(executed);
    const shot=presentationFor(next),reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isPitch=next.last?.kind!=='skill';
    const timeline=withKnockoutHold(presentationTimeline(shot,reduced),isPitch&&!reduced&&next.pitcher?.hp===0);
    const play={timeline,startedAt:performance.now(),token:++token.current,action:isPitch?(type==='take'?'take':'swing'):'prepare'};
    busy.current=true;clock.current?.cancel();setPlayback(play);
    if(soundRef.current){audio();cue(isPitch?'pitch':shot?.cue||'skill');}
    clock.current=startPresentationClock(timeline,{startedAt:play.startedAt,
      onStage:setFxStage,
      onImpact:({audible})=>{if(!audible)return;if(isPitch&&soundRef.current)cue(shot?.cue||'hit');haptic(timeline.haptic);},
      onComplete:()=>{setPlayback(null);busy.current=false;}
    });
  };
  const next=()=>{
    if(busy.current||fxStage)return;
    const state=current.current;
    commit(state.phase==='pitch'?advanceV10Pitch(state):state.phase==='between'?advanceV10Batter(state):state);
  };
  const terminal=!['battle','pitch','between'].includes(s.phase);
  return <div className="vnext-shell">
    <nav className="bv-fixture-tools" aria-label="검수 화면 선택">
      <label>메모리 검수 <select aria-label="검수 상태" value={fixture} onChange={e=>onChange(e.target.value)}>
        {VNEXT_FIXTURES.filter(f=>!f.defenseLab).map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
      </select></label>
      <button type="button" onClick={()=>onChange(fixture)}>다시 시작</button>
      <button type="button" aria-pressed={sound} onClick={()=>{audio();setSound(v=>!v);}}>소리 {sound?'켜짐':'꺼짐'}</button><a href="?battleUi=vnext">실제 런으로</a><span className="bv-sandbox-art">샘플 투수 · 연출 검수</span><span className="bv-sandbox-seed">저장 안 됨 · seed {s.initialSeed||20261027}</span>
      {terminal&&<strong role="status">{s.phase==='reward'?'투수 강판':s.phase==='won'?'승리':'경기 종료'} · 다시 시작으로 검수 계속</strong>}
    </nav>
    <BallparkBattle s={s} {...inputs} selected={selected} pitcher={s.pitcher} label="검수" artId={initial.artId}
      vnextReview={initial} previewMode playback={playback} execution={execution} fxStage={fxStage} shot={fxStage||s.battle?.revealed?presentationFor(s):null} playToken={s.stats.pitches}
      onSelect={setSelected} onStack={setSwingStack} onAim={z=>{if(!busy.current&&!fxStage){const next=setAimZone(current.current,z);current.current=next;setS(next);}}}
      onSwing={()=>action('card')} onTake={()=>action('take')}
      sound={sound} onToggleSound={()=>{audio();setSound(v=>!v);}} onNext={!terminal?next:null} nextLabel={s.phase==='pitch'?'다음 공':s.phase==='between'?'다음 타자':''}/>
  </div>;
}
