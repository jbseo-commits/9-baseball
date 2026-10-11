import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import BallparkActors,{pixiAvailable} from '../duel/BallparkActors.jsx';
import {BATTER_V15_SHEET,BATTER_V15_RIG,sheetCellStyle} from '../duel/batter-v15.js';
import {batterMotionV3PoseAt} from '../duel/batterMotionV3.js';
import {redRushFrameAt} from '../duel/pitcher-sd.js';
import redRushAtlas from '../../assets/pitcher-sd-v1/red-rush-pitch-120-atlas.png';
import setupArt from '../../assets/cards-v15/card-setup.png';
import watchArt from '../../assets/cards-v15/card-watch.png';
import calmArt from '../../assets/cards-v15/card-calm.png';
import {CARDS,ZONES,cardCost} from '../duel/cards.js';
import {coverageAt,cardProblem,v10PrepMax,v10StackMax,v10Energy,v10EnergyCap,v10ActionCost,currentBatter,setAimZone} from '../duel/engine.js';
import {PACKS,SHORT,ART_INDEX,startMatch,defaultCard,entryFor,attackFor,actionPreview,resolveAction,continueMatch,pitchMilestones,visibleForecast,coverageInterval,intervalLabel,fallbackBall,fallbackElapsed} from './model.js';
import './hybrid.css';
import './play-layout.css';
import {FIELD,ACTOR_GEOMETRY,layoutStyle,points} from './geometry.js';

const POSES=Object.fromEntries(['ready','load','trigger','swing-start','swing-mid','contact','follow-through-early','follow-through-late','finish','settle'].map(x=>[x,1]));
const EXISTING_CARD_ART={setup:setupArt,watch:watchArt,calm:calmArt};
const pct=n=>Math.round((n||0)*100)+'%';
const nameFor=(s,id)=>id==='basic'?'기본 스윙':CARDS[entryFor(s,id)?.kind]?.name||'';
const coreCard=(s,pack)=>s.battle.hand.find(id=>entryFor(s,id).kind===PACKS[pack].core&&!cardProblem(s,id))||defaultCard(s);

function Count({name,n,max}){return <span className={`count count-${name.toLowerCase()}`}><b>{name}</b>{Array.from({length:max},(_,i)=><i key={i} className={i<n?'lit':''}/>)}</span>}
function Diamond({bases}){return <div className="diamond" aria-label={bases.map((v,i)=>v?`${i+1}루 주자`:null).filter(Boolean).join(', ')||'주자 없음'}>{[1,2,0].map(i=><i key={i} className={`base base-${i} ${bases[i]?'occupied':''}`}/>)}<i className="home"/></div>}
function Glyph({zones}){return <span className="coverage-glyph" aria-hidden="true">{Array.from({length:9},(_,z)=><i key={z} className={zones.includes(z)?'on':''}/>)}</span>}

// No WebGL still gets authored sprite motion. Pixi is the preferred renderer, not a gameplay dependency.
export function HybridScene({shot,stage,token,zone,onTimeline,knockedOut}){
  const reduced=useRef(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches).current;
  const forceDom=useRef(reduced||new URLSearchParams(window.location.search).get('renderer')==='dom').current;
  const sceneRef=useRef(null),viewportRef=useRef(null),[scale,setScale]=useState(1),[ready,setReady]=useState(()=>!forceDom&&pixiAvailable()?'loading':'fallback'),[frame,setFrame]=useState({pitch:0,pose:'ready',ball:null});
  useEffect(()=>{
    const resize=()=>{const el=viewportRef.current;if(el)setScale(Math.min(el.clientWidth/FIELD.width,el.clientHeight/FIELD.height))};
    resize();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);
    observer?.observe(viewportRef.current);window.addEventListener('resize',resize);
    return()=>{observer?.disconnect();window.removeEventListener('resize',resize)};
  },[]);
  const report=useCallback(info=>setReady(info?'pixi':'fallback'),[]);
  const eventRef=useRef(onTimeline);eventRef.current=onTimeline;
  useEffect(()=>{
    if(!shot||!stage||ready!=='fallback')return;
    let raf=0,index=0,start=null;
    const milestones=pitchMilestones(shot.motion);
    const box=selector=>{const el=sceneRef.current?.querySelector(selector);return el?{x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight}:null};
    const tick=now=>{
      start??=now;const t=fallbackElapsed(shot,now-start,reduced);
      setFrame({pitch:reduced?0:redRushFrameAt(t),pose:reduced?'ready':batterMotionV3PoseAt(shot,t),ball:fallbackBall(shot,t,zone,{b:box('.bp-batter'),p:box('.bp-pitcher'),geometry:ACTOR_GEOMETRY},reduced)});
      while(index<milestones.length&&t>=milestones[index][1])eventRef.current({type:milestones[index++][0],token,elapsed:t});
      if(t<shot.motion.duration)raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[shot,token,ready,!!stage]);
  useEffect(()=>{if(!stage)setFrame({pitch:0,pose:'ready',ball:null})},[stage]);
  const camera=stage==='pitcher-focus'?'focus':stage==='ball-approach'?'approach':stage==='impact'?'contact':'hold';
  return <div ref={viewportRef} className="stage-viewport"><div className={`hybrid-scene camera-${camera} ${ready==='pixi'?'actors-ready':''}`} style={{width:FIELD.width*scale,height:FIELD.height*scale}} data-stage={stage||'ready'}>
    <div className="world-scale" style={{transform:`scale(${scale})`}}><div ref={sceneRef} className="scene-world">
      <div className="stadium"/><div className="stadium-light"/>
      <svg className="ground-markings" viewBox="0 0 1280 720" aria-hidden="true">
        <g className="chalk"><polygon data-field="batter-box" points={points(FIELD.batterBox)}/><polygon data-field="opposite-box" points={points(FIELD.oppositeBox)}/>{FIELD.foulLines.map((line,i)=><polyline key={i} points={points(line)}/>)}</g>
        <polygon className="plate-shadow" points={points(FIELD.plate)} transform="translate(0 4)"/>
        <polygon className="home-plate" data-field="home-plate" points={points(FIELD.plate)}/>
        <polyline className="plate-wear" points={points(FIELD.plateWear)}/>
      </svg>
      <div className="bp-pitcher" style={layoutStyle(FIELD.pitcher)} aria-hidden="true"><div style={{backgroundImage:`url(${redRushAtlas})`,backgroundSize:'1000% 1200%',backgroundPosition:`${frame.pitch%10/9*100}% ${Math.floor(frame.pitch/10)/11*100}%`}}/></div>
      <div className="bp-batter" data-pose={frame.pose} style={layoutStyle(FIELD.batter)} aria-hidden="true"><div style={sheetCellStyle(BATTER_V15_SHEET,frame.pose)}/></div>
      <div className="bp-zone" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} className="bp-cell"/>)}</div>
      {!forceDom&&<BallparkActors sceneRef={sceneRef} pitcherAtlas={redRushAtlas} artId="regular-01-red-rush" batterPoses={POSES} batterSheet={BATTER_V15_SHEET} batterRig={BATTER_V15_RIG} shot={shot} fxStage={stage} playToken={token} pitchZone={zone} knockedOut={knockedOut} onReady={report} onTimeline={onTimeline} geometry={ACTOR_GEOMETRY}/>}
      {ready==='fallback'&&frame.ball&&<i className="fallback-ball" style={{left:frame.ball.x,top:frame.ball.y,width:frame.ball.r*2,height:frame.ball.r*2,opacity:frame.ball.alpha}} aria-hidden="true"/>}
    </div></div>
    <div className="stadium-grain"/><span className="ground-caption">RIVERSIDE PARK <i/> 18:42</span>
  </div></div>;
}

export function HybridApp({initialSeed}){
  const seedRef=useRef(initialSeed??(Number(new URLSearchParams(window.location.search).get('seed'))||Date.now()>>>0));
  const [pack,setPack]=useState('precision'),[state,setState]=useState(()=>startMatch('precision',seedRef.current));
  const [selected,setSelected]=useState(()=>coreCard(state,'precision')),[supports,setSupports]=useState([]),[editing,setEditing]=useState(null),[adding,setAdding]=useState(false);
  const [locked,setLocked]=useState(false),[result,setResult]=useState(false),[shot,setShot]=useState(null),[stage,setStage]=useState(null),[token,setToken]=useState(0),[auto,setAuto]=useState(false),[sound,setSound]=useState(false),[notice,setNotice]=useState(''),[lastPlan,setLastPlan]=useState(null);
  const [compact,setCompact]=useState(()=>window.innerWidth<=700),[zonesOpen,setZonesOpen]=useState(false),forecastRef=useRef(null);
  const Forecast=compact?'dialog':'section';
  useEffect(()=>{const resize=()=>setCompact(window.innerWidth<=700);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
  useEffect(()=>{const el=forecastRef.current;if(compact&&zonesOpen){if(!el?.open)el?.showModal?.()}else el?.close?.()},[compact,zonesOpen]);
  const pending=useRef(null),serial=useRef(0),soundRef=useRef(null),fieldRef=useRef(null);
  const b=state.battle,config=PACKS[pack],card=entryFor(state,selected),def=CARDS[card?.kind],skill=def?.type==='skill';
  const active=state.phase==='battle'&&!locked&&!result;
  const plan=result&&lastPlan?lastPlan:actionPreview(state,selected,supports);
  const forecast=result&&lastPlan?.forecast?lastPlan.forecast:visibleForecast(state);
  const hitRange=coverageInterval(state,plan.coverage||[]);
  const combat=result?state.v10.lastCombat:null;
  const currentAim=editing?supports.find(s=>s.id===editing)?.aimZone:b.aimZone;
  const mainCoverage=plan.primaryCoverage||plan.coverage||[],allCoverage=plan.coverage||[];
  const cost=v10ActionCost(state,selected,supports);
  const decision=skill?`준비 · ⚡${cost}`:card?.kind==='bunt'?`희생 ${intervalLabel([(1-forecast.bounds[9][1])*.7,(1-forecast.bounds[9][0])*.7])} · 아웃 +1`:`${allCoverage.length}/9 · ${selected==='basic'?0:supports.length+1}장 · HP ${pct(plan.damageRate)}`;

  function playSound(type){
    if(!sound)return;
    try{
      const ctx=soundRef.current||(soundRef.current=new (window.AudioContext||window.webkitAudioContext)());ctx.resume();
      const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
      const contact=type==='impact';osc.type=contact?'triangle':'sine';osc.frequency.setValueAtTime(contact?180:520,now);osc.frequency.exponentialRampToValueAtTime(contact?48:160,now+.09);gain.gain.setValueAtTime(contact?.12:.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.start(now);osc.stop(now+.13);
    }catch{}
  }
  const handleTimeline=useCallback(event=>{
    const current=pending.current;
    if(!current||current.token!==event.token)return;
    if(event.type==='focus')setStage('pitcher-focus');
    if(event.type==='release'){setStage('ball-approach');current.sound('release')}
    if(event.type==='impact'&&!current.committed){
      current.committed=true;setState(current.next);setResult(true);setStage('impact');current.sound('impact');
    }
    if(event.type==='settled'){
      // A suspended browser tab may jump over several events; commit remains exactly once.
      if(!current.committed){current.committed=true;setState(current.next);setResult(true)}
      pending.current=null;setLocked(false);setStage(null);
    }
  },[]);
  useEffect(()=>()=>{pending.current=null;soundRef.current?.close()},[]);

  function reset(key=pack){
    serial.current++;pending.current=null;setZonesOpen(false);
    seedRef.current=(seedRef.current+1)>>>0;
    const next=startMatch(key,seedRef.current);setPack(key);setState(next);setSelected(coreCard(next,key));setSupports([]);setEditing(null);setAdding(false);setResult(false);setLocked(false);setShot(null);setStage(null);setAuto(false);setNotice('');setLastPlan(null);
  }
  function execute(action){
    if(pending.current||!active)return;
    const resolved=resolveAction(state,action);if(!resolved)return;
    setNotice('');setAdding(false);setEditing(null);
    if(!resolved.pitch){
      setState(resolved.next);setSupports([]);setSelected(defaultCard(resolved.next));setNotice(resolved.shot?.title+' · 공 소비 없음');return;
    }
    const id=++serial.current;
    setLastPlan({...plan,forecast,consumed:resolved.consumed});
    pending.current={token:id,next:resolved.next,committed:false,sound:playSound};
    setZonesOpen(false);
    setLocked(true);setResult(false);setShot(resolved.shot);setToken(id);setStage('windup');
  }
  function advance(){
    if(locked)return;
    const next=continueMatch(state);
    if(next===state){setAuto(false);return}
    setState(next);setSelected(defaultCard(next));setSupports([]);setEditing(null);setAdding(false);setResult(false);setShot(null);setStage(null);setNotice('');setLastPlan(null);
  }
  function chooseCard(id){
    if(!active)return;
    if(adding){
      if(!attackFor(state,id)||id===selected||supports.some(s=>s.id===id)||entryFor(state,id)?.kind==='bunt'||cardProblem(state,id))return;
      setSupports([...supports,{id,aimZone:b.aimZone}]);setEditing(id);setAdding(false);
    }else{setSelected(id);setSupports([]);setEditing(null)}
    setNotice('');
  }
  function aim(z){if(!active)return;editing?setSupports(supports.map(s=>s.id===editing?{...s,aimZone:z}:s)):setState(setAimZone(state,z));setZonesOpen(false)}
  const canSupport=active&&!skill&&selected!=='basic'&&card?.kind!=='bunt'&&supports.length<v10StackMax(state)-1;

  // The spectator uses only the same public forecast shown to the player. It never sees pending.zone.
  useEffect(()=>{
    if(!auto||locked)return;
    const timer=setTimeout(()=>{
      if(result){if(['pitch','between'].includes(state.phase))advance();else setAuto(false);return}
      if(!active)return;
      const prepKind=pack==='precision'?'scout':pack==='grind'?'calm':b.bases.some(Boolean)?'flow':'setup';
      const prep=b.hand.find(id=>entryFor(state,id).kind===prepKind&&!cardProblem(state,id));
      if(prep&&!b.scouted&&b.preparations<1){execute({type:'card',id:prep});return}
      let best=null;
      for(const id of [...b.hand.filter(id=>attackFor(state,id)&&entryFor(state,id).kind!=='bunt'&&!cardProblem(state,id)),'basic']){
        for(let z=0;z<9;z++){
          const at=setAimZone(state,z),p=actionPreview(at,id,[]),range=coverageInterval(at,p.coverage||[]),score=(range[0]+range[1])/2+(pack==='grind'&&entryFor(state,id)?.kind==='defend'?.05:0);
          if(!best||score>best.score)best={id,z,score};
        }
      }
      if(best.id!==selected||b.aimZone!==best.z){setSelected(best.id);setState(setAimZone(state,best.z));setSupports([]);return}
      execute({type:'card',id:best.id,supports:[]});
    },result?1250:700);
    return()=>clearTimeout(timer);
  },[auto,locked,result,state,selected,pack]);

  const ended=result&&!['pitch','between','battle'].includes(state.phase);
  const resultTitle=combat?(state.pitcher.hp<=0?'승부를 끝냈다.':shot?.title):null;
  const tactic=pack==='relay'?(b.bases.some(Boolean)?'주자가 나갔습니다. 진루 카드의 가치가 달라집니다.':'주자 없음. 지금은 출루를 만드는 첫 타석입니다.'):pack==='precision'?(b.scouted?'높이를 읽었습니다. 정확 적중과 넓은 커버를 비교하세요.':'관찰은 공을 쓰지 않습니다. 높이를 읽은 뒤 한 칸을 고르세요.'):(b.patient?'호흡 적용 중. 파울 생존과 다음 손패를 확보하세요.':'호흡으로 손패와 생존을 확보하고, 커트로 타석을 이어가세요.');
  return <main className="hybrid-app" style={{'--accent':config.color}}>
    <header className="masthead"><a href="./" className="wordmark" aria-label="기존 게임으로">9<span>ZONE</span><i>HOMEBOUND</i></a><div className="edition">황혼의 승부 <span>RIVERSIDE SERIES / 01</span></div><div className="utility"><button onClick={()=>setSound(v=>!v)} aria-pressed={sound}>{sound?'소리 켜짐':'소리 꺼짐'}</button><button className={auto?'auto-on':''} onClick={()=>setAuto(v=>!v)} aria-pressed={auto}>{auto?'자동 플레이 중지':'자동 플레이'}</button></div></header>
    <nav className="pack-nav" aria-label="시작 덱 선택">{Object.entries(PACKS).map(([key,p])=><button key={key} onClick={()=>reset(key)} aria-pressed={pack===key}><span className="pack-symbol">{p.symbol}</span><span><b>{p.name}</b><small>{p.short}</small></span><em>{pack===key?'IN PLAY':'09 CARDS'}</em></button>)}</nav>
    <div className="battle-layout">
      <section className="field-panel" aria-label="실시간 야구 전투">
        <div className="scoreboard"><div className="score-team"><small>HOMEBOUND</small><strong>{String(b.runs).padStart(2,'0')}</strong></div><div className="score-counts" aria-label={`${b.balls}볼 ${b.strikes}스트라이크 ${b.outs}아웃`}><div><Count name="B" n={b.balls} max={3}/><Count name="S" n={b.strikes} max={2}/><Count name="O" n={b.outs} max={2}/></div><span>{b.batterIndex+1}번 타자 <b>{currentBatter(state).name}</b> · {state.stats.pitches+(!result?1:0)}구</span></div><Diamond bases={b.bases}/><div className="opponent"><span>01 <b>RED RUSH</b></span><small>{state.v10.opponent.archetype}</small><div className="hp-track" role="progressbar" aria-label="투수 HP" aria-valuemin={0} aria-valuemax={state.pitcher.maxHp} aria-valuenow={state.pitcher.hp}><i style={{width:pct(state.pitcher.hp/state.pitcher.maxHp)}}/></div><em>{state.pitcher.hp} / {state.pitcher.maxHp} HP</em></div></div>
        <div ref={fieldRef} className={`field ${locked?'in-motion':''} ${combat?'has-result':''}`}>
          <HybridScene shot={shot} stage={stage} token={token} zone={shot?(pending.current?.next.v10.lastCombat?.actualPitch??combat?.actualPitch):null} onTimeline={handleTimeline} knockedOut={!!combat&&state.pitcher.hp<=0}/>
          <div className="field-title"><small>{config.en}</small><h1>{config.title}</h1></div>
          <div className="pitcher-tag"><span className="live-dot"/> {locked?'PITCH IN MOTION':'READY TO DUEL'}<b>레드 러시</b><small>낮은 싱커 · 오른손 투수</small></div>
          {!result&&<div className="field-prompt"><span>{locked?'투구 중':'YOUR AT BAT'}</span><strong>{locked?'그녀의 손끝에서, 당신의 배트까지.':adding?'지원할 카드를 고르세요.':skill?'준비는, 승부의 일부.':'어디를 기다릴 것인가.'}</strong></div>}
          {combat&&<div className={`result-call ${locked?'arriving':''}`} role="status"><span>{state.pitcher.hp<=0?'DUEL WON':shot?.kicker}</span><strong>{resultTitle}</strong><p>{combat.verdict} · {combat.actualPitch===9?'존 밖 볼':ZONES[combat.actualPitch]}</p><b>{combat.damage>0?`−${combat.damage} HP`:combat.runsScored?`+${combat.runsScored} RUN`:'NEXT CHANCE'}</b></div>}
          <div className="field-bottom"><span className="turn-notice" role={notice?'status':undefined} title={notice||undefined}>{notice?'준비 완료 · 공 유지':`${config.symbol} ${config.name}`}</span><b className="decision-metrics" aria-label="선택 비용과 효과">{decision}</b>{compact?<button className="course-toggle" disabled={!active} onClick={()=>{setAuto(false);setZonesOpen(true)}} aria-haspopup="dialog" aria-expanded={zonesOpen}>코스 {currentAim+1} · {editing?'지원':'MAIN'} ▦</button>:<span>{locked?'● LIVE':result?'● RESULT':'● YOUR DECISION'}</span>}</div>
        </div>
        <div className="hand-heading"><div><small>YOUR HAND</small><b>{b.hand.length}장의 선택</b><b className="energy" aria-label={`에너지 ${v10Energy(state)}/${v10EnergyCap(state)}, 선택 비용 ${cost}`}>⚡{v10Energy(state)}/{v10EnergyCap(state)} <small>선택 {cost}</small></b></div><span>뽑기 {b.draw.length} <i>·</i> 버림 {b.discard.length} <i>·</i> 준비 {Math.max(0,v10PrepMax(state)-b.preparations)}회</span></div>
        <div className="hand" aria-label="손패 카드">{b.hand.map(id=>{
          const c=entryFor(state,id),d=CARDS[c.kind],problem=active?cardProblem(state,id):null,support=supports.find(x=>x.id===id),chosen=selected===id;
          return <button key={id} className={`game-card ${chosen?'selected':''} ${support?'support-selected':''} ${problem?'restricted':''}`} disabled={!active} onClick={()=>chooseCard(id)} aria-pressed={chosen||!!support} aria-label={`${d.name} · ${problem||SHORT[c.kind]}`}>
            <span className="card-illustration" style={EXISTING_CARD_ART[c.kind]?{backgroundImage:`url(${EXISTING_CARD_ART[c.kind]})`,backgroundSize:'cover',backgroundPosition:'50% 25%'}:{'--art-index':ART_INDEX[c.kind]??0}}/><span className="card-type">{support?'SUPPORT':d.type==='skill'?'PREPARE':'SWING'}<i>{d.role} · ⚡{cardCost(c)}</i></span>
            {d.type==='attack'&&<Glyph zones={coverageAt(state,id,4)}/>}
            <span className="card-copy"><strong>{d.name}</strong><small>{problem||SHORT[c.kind]}</small></span><span className="card-select-mark">{support?String(supports.indexOf(support)+2):chosen?'MAIN':'＋'}</span>
          </button>;
        })}{!b.hand.length&&<p>손패가 비었습니다. 기본 스윙과 지켜보기를 사용할 수 있습니다.</p>}</div>
      </section>
      <aside className="dugout" aria-label="전술과 코스 선택">
        <div className="tactic-heading"><small>THE DUGOUT / 전술</small><span>{config.symbol}</span><h2>{config.name}</h2><p>{tactic}</p></div>
        <Forecast ref={forecastRef} className="forecast" aria-label="코스 선택" onCancel={()=>setZonesOpen(false)} onClose={()=>setZonesOpen(false)}><div className="section-heading"><b>{b.scouted?'간파한 코스':'어디로 올까?'}</b><small>{forecast.level===0?'명암 읽기 · 확정 위치 아님':forecast.level===1?'확률 구간 · 확정 위치 아님':'정확한 확률'}</small>{compact&&<button className="course-close" onClick={()=>setZonesOpen(false)} aria-label="코스 선택 닫기">×</button>}</div>{compact&&<p className="course-editor">{editing?`SUPPORT · ${nameFor(state,editing)}`:`MAIN · ${nameFor(state,selected)}`} · 현재 {currentAim+1}번 존</p>}<div className="zone-labels"><span>몸쪽</span><span>가운데</span><span>바깥</span></div><div className="zone-grid" role="group" aria-label="목표 존 선택">{Array.from({length:9},(_,z)=>{
          const steps=plan.stackPlan?.steps.filter(s=>s.aimZone===z).map(s=>s.order)||[];
          return <button key={z} onClick={()=>aim(z)} disabled={!active} aria-pressed={currentAim===z} aria-label={`${ZONES[z]} · ${forecast.labels[z]}${allCoverage.includes(z)?' · 커버':''}`} className={`${forecast.bounds[z][1]===0?'unknown':''} ${mainCoverage.includes(z)?'main-cover':allCoverage.includes(z)?'support-cover':''} ${currentAim===z?'aim':''} ${combat?.actualPitch===z?'actual':''}`} style={{'--heat':Math.min(.75,(forecast.bounds[z][0]+forecast.bounds[z][1])/2)}}><small>{z+1}</small><strong className="range">{forecast.labels[z]}</strong><span>{steps.length?steps.join('·'):combat?.actualPitch===z?'●':''}</span></button>;
        })}</div><div className={`outside ${combat?.actualPitch===9?'actual':''}`}><span>존 밖 볼</span><b>{forecast.labels[9]}</b></div><div className="zone-key"><span><i/> 메인 커버</span><span><i/> 지원 커버</span><span>◎ 목표 존</span></div></Forecast>
        <section className="plan-panel"><div className="section-heading"><b>{result?'이번 공의 결과':skill?'타석을 준비한다':'어떻게 칠까?'}</b><small>{editing?'지원 목표 조정 중':'선택 → 코스 → 실행'}</small></div>
          {result&&combat?<div className="result-summary"><strong>{combat.choiceLabel}</strong><p>{combat.verdict}</p><div><span>피해 <b>−{combat.damage}</b></span><span>소비 <b>{lastPlan?.consumed??0}장</b></span><span>득점 <b>+{combat.runsScored}</b></span></div></div>:<>
            <div className="order-list"><button className={!editing?'editing':''} disabled={!active} onClick={()=>{setEditing(null);setAdding(false)}}><i>1</i><span>{skill?'준비':'MAIN'}<b>{nameFor(state,selected)}</b></span><em>{skill?'공 소비 없음':`${b.aimZone+1}번 존`}</em></button>{supports.map((s,i)=><div key={s.id} className="support-row"><button className={editing===s.id?'editing':''} disabled={!active} onClick={()=>setEditing(s.id)}><i>{i+2}</i><span>SUPPORT {plan.stackPlan?.links[i]?.connected?'↗ CONNECT':''}<b>{nameFor(state,s.id)}</b></span><em>{s.aimZone+1}번 존</em></button><button disabled={!active} aria-label={`${nameFor(state,s.id)} 지원 제거`} onClick={()=>{setSupports(supports.filter(x=>x.id!==s.id));setEditing(null)}}>×</button></div>)}</div>
            <button className={`add-support ${adding?'adding':''}`} disabled={!canSupport} onClick={()=>{setAdding(!adding);setEditing(null)}}>{adding?'손패에서 지원 카드 선택':'＋ 지원 카드 추가'}</button>
            <div className="plan-stats">{skill?<p>{SHORT[card.kind]}<small>준비 1회 · 이 공은 아직 던지지 않습니다.</small></p>:card?.kind==='bunt'?<><div><small>희생 성공 · 공개 정보 범위</small><b>{intervalLabel([(1-forecast.bounds[9][1])*.7,(1-forecast.bounds[9][0])*.7])}</b></div><div><small>성공 시 대가</small><b>아웃 +1</b></div></>:<><div><small>적중권 · 공개 정보 범위</small><b>{intervalLabel(hitRange)}</b></div><div><small>{pack==='grind'?'손패 소비':'HP 피해 효율'}</small><b>{pack==='grind'?`${selected==='basic'?0:supports.length+1}장`:pct(plan.damageRate)}</b></div></>}</div>
            {supports.length>0&&<p className="support-note">지원은 범위와 연결에 사용됩니다. 카드 고유 효과는 메인만 발동합니다.</p>}
          </>}
          {plan.problem&&active&&<p className="problem" role="status">{plan.problem}</p>}
        </section>
        <div className="action-panel">{result?<button className="primary-action" disabled={locked} onClick={ended?()=>reset():advance}>{locked?'타구를 지켜보는 중…':ended?'새로운 승부 시작':state.phase==='between'?'다음 타자 →':'다음 공 →'}</button>:<button className="primary-action" disabled={!active||!!plan.problem} onClick={()=>execute({type:'card',id:selected,supports})}>{locked?'투구 중…':skill?'준비 실행':supports.length?`${supports.length+1}장으로 스윙`:'스윙'}<span>{locked?'PITCH IN MOTION':skill?'PREPARE':'COMMIT TO YOUR READ'}</span></button>}<div className="secondary-actions"><button disabled={!active} aria-pressed={selected==='basic'} onClick={()=>{setSelected('basic');setSupports([]);setEditing(null)}}>기본 스윙</button><button disabled={!active} onClick={()=>execute({type:'take'})}>지켜보기</button></div><button className="new-match" onClick={()=>reset()}>새 손패로 다시 시작 ↻</button></div>
      </aside>
    </div><footer className="app-footer"><span>9ZONE <i>·</i> 야구 덱빌딩 로그라이트</span><span>읽는 재미. 고르는 무게. 맞히는 쾌감.</span></footer>
  </main>;
}

const root=document.getElementById('hybrid-root');
if(root)createRoot(root).render(<HybridApp/>);
