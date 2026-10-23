import React,{useEffect,useRef,useState} from 'react';
import {CARDS,cardCost,LINEUP} from './cards.js';
import {setAimZone,coverageAt,previewV10Stack,cardProblem,stackSupportProblem,playV10Action,advanceV10Pitch,advanceV10Batter,v10Energy,v10EnergyCap,v10PrepMax,v10StackMax,v10TakeDrawPreview,pitchClue,START_PACKS} from './engine.js';
import {cardFaceOf,shortCardProblem} from './card-face.js';
import {preparationDrawPreview,activePreparationFeedback} from './preparation-feedback.js';
import {cardArtFor,cardArtFocusFor} from './card-art.js';
import {ZONE_WORDS} from './ballpark-copy.js';
import {createPreviewBattle,publicZoneFaces,publicCoverText,resultFeedback,entryName,FIRST_LESSONS,createLessonBattle,isExactRead,resultExplanation} from './zone-first-model.js';
import stadium from '../../assets/duel/stadium-portrait.png';
import batterSheet from '../../assets/ui-kit/batter/batter-v14-master-sheet.png';
import {pitcherAtlases} from './pitcher-visuals.js';
import './zone-first-preview.css';

export const PREVIEW_IMPACT_MS=1450;
const BASIC={kind:'basic'};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function usePitchFrame(flying,readHit){
  const [frame,setFrame]=useState(0);
  useEffect(()=>{
    if(!flying){setFrame(0);return;}
    if(reduced()){setFrame(74);return;}
    let raf,start;
    const tick=time=>{start??=time;setFrame(Math.min(119,(readHit?87+Math.floor(Math.max(0,time-start-180)/28):Math.floor((time-start)/16.67))));if(time-start<2000)raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[flying,readHit]);
  return frame;
}

function Card({s,entry,onClick,problem,selected=false,support=false,armed=false,locked=false}){
  const face=cardFaceOf(entry,{strikes:s.battle.strikes,drawPreview:preparationDrawPreview(s,entry.id)}),art=cardArtFor(entry.kind);
  const notes=[...new Set([face.condition,face.drawNote,shortCardProblem(problem)||problem].filter(Boolean))];
  return <button type="button" className={'zf-card'+(selected?' is-picked':'')+(notes.length?' has-notes':'')+(support?' is-support':'')} onClick={onClick} disabled={locked} aria-pressed={selected||support||armed}
    aria-label={support?`${entryName(entry)} 지원 제거`:[entryName(entry),'비용 '+cardCost(entry),face.axis,face.summary,face.condition,face.drawNote,problem].filter(Boolean).join(' · ')}
    aria-disabled={!!problem} data-kind={entry.kind}>
    <span className="zf-card-art" style={art?{backgroundImage:`url("${art}")`,backgroundPosition:cardArtFocusFor(entry.kind)?.objectPosition}:{}}>
      <span className="zf-cost" aria-hidden="true">{cardCost(entry)}</span>
      <span className="zf-axis">{armed?'배치 중':support?'지원 · 제거':selected?'선택 · '+face.axis:face.axis}</span>
    </span>
    <strong>{entryName(entry)}</strong><span className="zf-card-effect">{face.summary}</span>
    {notes.map((note,i)=><span key={i} className="zf-card-warning">{note}</span>)}
  </button>;
}

export default function ZoneFirstPreview({initialState,onFinish,onExit,finishLabel='내 덱으로 시작',sound:controlledSound,onToggleSound}){
  const [localSound,setLocalSound]=useState(false);
  const sound=controlledSound??localSound;
  const toggleSound=()=>onToggleSound?onToggleSound():setLocalSound(v=>!v);
  const [session,setSession]=useState(()=>({id:0,lesson:onFinish?0:initialState||new URLSearchParams(globalThis.location?.search||'').get('learn')==='0'?null:0}));
  const change=lesson=>setSession(s=>({id:s.id+1,lesson}));
  const finish=()=>onFinish?onFinish():change(null);
  return <BattlePreview key={session.id} initialState={session.lesson===null?initialState:createLessonBattle()}
    lesson={session.lesson} sound={sound} onToggleSound={toggleSound} onSkip={finish} onExit={onExit} finishLabel={finishLabel} onLearn={()=>change(0)}
    onLessonComplete={()=>session.lesson===2?finish():change(session.lesson+1)}/>;
}

function BattlePreview({initialState,lesson=null,sound,onToggleSound,onSkip,onLearn,onLessonComplete,onExit,finishLabel}){
  const learning=lesson!==null,lessonInfo=FIRST_LESSONS[lesson];
  const [game,setGame]=useState(()=>initialState||createPreviewBattle());
  const [step,setStep]=useState('plan'),[aim,setAim]=useState(null),[picked,setPicked]=useState(learning&&lesson<2?'basic':null);
  const [supports,setSupports]=useState([]),[armed,setArmed]=useState(null),[handMode,setHandMode]=useState('main');
  const [notice,setNotice]=useState(''),[info,setInfo]=useState(false);
  const pending=useRef(null),timer=useRef(null),busy=useRef(false),dialog=useRef(null),audio=useRef(null),root=useRef(null),restoreFocus=useRef(null);
  const flying=step==='flight',result=step==='result',readHit=result&&isExactRead(game),frame=usePitchFrame(flying||result,readHit);
  const needsPreparation=learning&&lesson===2&&game.battle.preparations===0;
  const hand=game.battle.hand.map(id=>game.deck.find(c=>c.id===id)).filter(Boolean);
  const pack=START_PACKS.find(p=>p.id===game.v10?.startPack?.pack)||START_PACKS[0];
  const entry=picked==='basic'?BASIC:hand.find(c=>c.id===picked);
  const skill=CARDS[entry?.kind]?.type==='skill';
  const preview=picked?previewV10Stack(game,picked,supports):null;
  const problem=preview?.problem||'';
  const primary=entry&&!skill&&aim!==null?coverageAt(game,picked,aim):[];
  const cover=result?game.battle.revealed?.coverage||[]:aim===null?[]:preview?.coverage||primary;
  const supportZones=result?(game.battle.revealed?.supportCoverages||[]).flatMap(x=>x.coverage):supports.flatMap(x=>coverageAt(game,x.id,x.aimZone));
  const faces=publicZoneFaces(game),feedback=result?resultFeedback(game):null;
  const takeDraw=result?v10TakeDrawPreview(game):null;
  const canSupport=!learning&&entry&&aim!==null&&picked!=='basic'&&!skill&&!CARDS[entry.kind]?.bunt&&supports.length<v10StackMax(game)-1;
  const revealed=result?game.battle.revealed:null;
  const title=flying?'한 공에 집중.':result?feedback.title:learning?(needsPreparation?'집중 카드를 써보세요':aim===null?'밝은 코스를 눌러보세요':'좋아요, 이제 타격!'):armed?'지원할 코스를 누르세요':handMode==='support'?'지원할 카드를 고르세요':skill?'타격 전에 준비할까요?':!picked?'카드와 코스를 고르세요':aim===null?'타격 코스를 고르세요':'이 범위로 승부합니다';

  const tone=(kind)=>{
    if(!sound)return;
    try{
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)return;
      const ac=audio.current||(audio.current=new Context());ac.resume();
      const osc=ac.createOscillator(),gain=ac.createGain(),t=ac.currentTime;
      osc.type=['hit','read'].includes(kind)?'triangle':'sine';osc.frequency.setValueAtTime(kind==='read'?660:kind==='hit'?520:kind==='near'?230:340,t);
      osc.frequency.exponentialRampToValueAtTime(kind==='read'?1320:kind==='hit'?1040:140,t+.16);
      if(kind==='read')osc.frequency.setValueAtTime(1760,t+.18);
      gain.gain.setValueAtTime(.07,t);gain.gain.exponentialRampToValueAtTime(.001,t+.2);
      osc.connect(gain);gain.connect(ac.destination);osc.start(t);osc.stop(t+.22);
    }catch{/* Sound is optional; input remains available. */}
  };
  useEffect(()=>()=>{clearTimeout(timer.current);audio.current?.close();},[]);
  useEffect(()=>{if(result)root.current?.querySelector('[data-zf-next]')?.focus();},[result]);
  useEffect(()=>{
    if(info){restoreFocus.current=document.activeElement;dialog.current?.showModal?.();}
    else restoreFocus.current?.focus?.();
  },[info]);
  const clearPlan=()=>{setPicked(learning?'basic':null);setSupports([]);setArmed(null);setNotice('');};
  const cancelSupport=()=>{setArmed(null);setHandMode('main');setNotice('');};
  const toggleSupport=()=>{if(busy.current||result)return;setArmed(null);setHandMode(m=>m==='support'?'main':'support');setNotice('');};
  const chooseZone=z=>{
    if(busy.current||result)return;
    tone('tap');setNotice('');
    if(armed){
      const next=[...supports,{id:armed,aimZone:z}],why=stackSupportProblem(game,picked,next);
      if(why){setNotice(why);return;}
      setSupports(next);setArmed(null);setHandMode('main');return;
    }
    setAim(z);setGame(s=>setAimZone(s,z));
  };
  const chooseCard=c=>{
    if(busy.current||result)return;
    if(supports.some(x=>x.id===c.id)){setSupports(v=>v.filter(x=>x.id!==c.id));cancelSupport();return;}
    const why=handMode==='support'?stackSupportProblem(game,picked,[...supports,{id:c.id,aimZone:aim}]):cardProblem(game,c.id);
    if(why){setNotice(why);return;}
    tone('tap');setNotice('');
    if(handMode==='support'){setArmed(c.id);return;}
    if(c.id===picked)return;
    setPicked(c.id);setSupports([]);setArmed(null);
    if(supports.length)setNotice(`타격 카드 변경 · 지원 ${supports.length}장 해제`);
  };
  const execute=(take=false)=>{
    if(busy.current||result||(needsPreparation&&!skill)||(!take&&(!picked||armed||handMode==='support'||(!skill&&aim===null)||problem)))return;
    const next=playV10Action(game,take?{type:'take'}:{type:'card',id:picked,supports});
    if(next===game){setNotice('현재 선택으로 실행할 수 없습니다.');return;}
    if(next.stats.pitches===game.stats.pitches){
      setGame(next);clearPlan();setStep('plan');setHandMode('main');setNotice(`${entryName(entry)} 적용 · 준비 ${next.battle.preparations}/${v10PrepMax(next)}`);tone('tap');return;
    }
    busy.current=true;pending.current=next;setStep('flight');setNotice('');
    // Preserve the entire pre-pitch state until impact, including accessible text.
    timer.current=setTimeout(()=>{
      setGame(next);pending.current=null;setStep('result');
      tone(isExactRead(next)?'read':resultFeedback(next).tone==='near'?'near':next.battle.revealed.kind==='hit'?'hit':'tap');
    },reduced()?180:PREVIEW_IMPACT_MS);
  };
  const nextTurn=()=>{
    if(learning){
      if(game.battle.revealed?.kind==='hit'){onLessonComplete();return;}
      busy.current=false;clearTimeout(timer.current);pending.current=null;setGame(createLessonBattle());clearPlan();setPicked(lesson<2?'basic':null);setAim(null);setStep('plan');return;
    }
    clearTimeout(timer.current);pending.current=null;busy.current=false;clearPlan();setAim(null);setHandMode('main');
    const next=game.phase==='pitch'?advanceV10Pitch(game):game.phase==='between'?advanceV10Batter(game):createPreviewBattle((game.initialSeed+1)>>>0,pack.id);
    setGame(next);setStep('plan');
  };
  const restartDeck=(packId=pack.id)=>{if(busy.current&&!result)return;busy.current=false;clearTimeout(timer.current);pending.current=null;setGame(createPreviewBattle(game.initialSeed,packId));clearPlan();setAim(null);setStep('plan');setHandMode('main');setInfo(false);};
  const cardProblemFor=c=>handMode==='support'?stackSupportProblem(game,picked,[...supports,{id:c.id,aimZone:aim}]):cardProblem(game,c.id);
  const ballZone=flying?pending.current?.battle.revealed?.zone:revealed?.zone;
  const ballStyle=Number.isInteger(ballZone)?{'--ball-x':`${ballZone===9?116:((ballZone%3)+.5)/3*100}%`,'--ball-y':`${ballZone===9?50:(Math.floor(ballZone/3)+.5)/3*100}%`}:{};
  const selectedFace=entry?cardFaceOf(entry,{strikes:game.battle.strikes,drawPreview:preparationDrawPreview(game,entry.id)}):null;
  const selectedText=selectedFace?[...new Set([selectedFace.summary,selectedFace.condition,selectedFace.drawNote].filter(Boolean))].join(' · '):'';
  const activeEffects=activePreparationFeedback(game.battle,game.phase).filter(t=>!t.startsWith('이번 공 간파:')).join(' · ');
  const clue=pitchClue(game);
  const caption=result?`실제 투구 · ${revealed?.zone===9?'존 밖':ZONE_WORDS[revealed?.zone]}`:
    learning?'바깥쪽 코스 연습 · 존 밖 공도 가능':armed?`${entryName(hand.find(c=>c.id===armed))} · 위치를 고르면 추가`:
    [clue,picked&&!skill?(aim===null?'코스를 고르면 타격 범위가 표시됩니다':[`${cover.length}존 커버`,publicCoverText(game,cover)].filter(Boolean).join(' · ')):clue?'':'투구 경향을 보고 코스를 누르세요'].filter(Boolean).join(' · ');

  return <main className="zf-preview" ref={root} data-step={step} data-lesson={learning?lesson:undefined} onKeyDown={e=>{
    if(e.key==='Escape'&&!flying&&!result&&!info)cancelSupport();
  }}>
    <section className="zf-shell" aria-label="존 우선 전투 프리뷰" style={{'--zf-stadium':`url("${stadium}")`}}>
      <header className="zf-header">{onExit?<button type="button" className="zf-brand" aria-label="타이틀로 돌아가기" onClick={onExit}>9<span>ZONE</span></button>:<a className="zf-brand" href={import.meta.env.BASE_URL}>9<span>ZONE</span></a>}<span className="zf-preview-tag">{learning?`${lessonInfo.name} · ${lesson+1}/3`:'BATTLE STUDY'}</span>
        <button type="button" aria-label={sound?'소리 끄기':'소리 켜기'} aria-pressed={sound} onClick={onToggleSound}>{sound?'♪ ON':'♪ OFF'}</button>
        {learning?<button type="button" className="zf-skip" onClick={onSkip}>건너뛰기</button>:<button type="button" aria-label="전투 정보" onClick={()=>setInfo(true)} disabled={flying}>ⓘ</button>}
      </header>
      <div className="zf-scoreboard">{learning&&lesson===0?<p className="zf-first-goal">코스를 읽고, 한 번의 안타.</p>:<>
        <div className="zf-opponent"><span>{game.pitcher.name} <em>VS</em></span><div className="zf-hp" role="meter" aria-label="투수 HP" aria-valuenow={game.pitcher.hp} aria-valuemin={0} aria-valuemax={game.pitcher.maxHp}><i style={{width:`${game.pitcher.hp/game.pitcher.maxHp*100}%`}}/></div><small>{game.pitcher.hp}<span> / {game.pitcher.maxHp}</span></small></div>
        {!learning&&<div className="zf-counts" aria-label={`볼 ${game.battle.balls}, 스트라이크 ${game.battle.strikes}, 아웃 ${game.battle.outs}`}>
          {[['B',game.battle.balls,3],['S',game.battle.strikes,2],['O',game.battle.outs,2]].map(([label,value,max])=><span key={label} className={'zf-count zf-'+label}><b>{label}</b>{Array.from({length:max},(_,i)=><i key={i} className={i<value?'lit':''}/>)}</span>)}
          <span className="zf-runners" aria-label={`주자 ${(game.battle.bases||[]).filter(Boolean).length}명`}>{[2,1,0].map(i=><i key={i} className={game.battle.bases[i]?'lit':''} title={`${i+1}루`}/>)}</span>
        </div>}</>}
      </div>
      <div className={'zf-field'+(result?' zf-result zf-'+feedback.tone:'')+(flying?' zf-flying':'')+(readHit?' zf-read-hit':'')}>
        <div className="zf-scenery" aria-hidden="true"/>
        <div className="zf-pitcher" aria-hidden="true" style={{backgroundImage:`url("${pitcherAtlases[game.v10.opponent.artId]}")`,backgroundPosition:`${frame%10/9*100}% ${Math.floor(frame/10)/11*100}%`}}/>
        <div className={'zf-batter'+(result&&revealed?.kind==='hit'?' zf-batter-hit':'')} aria-hidden="true" style={{backgroundImage:`url("${batterSheet}")`}}/>
        <div className="zf-focus">
          <div className="zf-prompt" role="status"><ol className="zf-steps" aria-label="이번 공 진행">{[['plan','코스 노리기'],['flight','공 날아옴'],['result','결과']].map(([id,label],i)=><li key={id} aria-current={step===id?'step':undefined}><b>{i+1}</b> {label}</li>)}</ol><h1>{title}</h1></div>
          <div className={'zf-board'+(armed?' is-placing':'')} role="group" aria-label="타격 코스 선택" style={ballStyle}>
            {faces.map((f,z)=><button type="button" key={z} className={'zf-zone'+(cover.includes(z)?' covered':'')+(supportZones.includes(z)?' supported':'')+(aim===z?' aimed':'')+(!f.live?' inactive':'')+(revealed?.zone===z?' landed':'')}
              aria-label={`${ZONE_WORDS[z]} · ${f.text}${cover.includes(z)?result?' · 실제 타격 범위':' · 예상 타격 범위':''}`} aria-pressed={aim===z} disabled={flying||result} onClick={()=>chooseZone(z)}>
              <small>{String(z+1).padStart(2,'0')}</small><span>{revealed?.zone===z?'●':aim===z?'＋':f.text}</span>
              {supports.some(x=>x.aimZone===z)&&<i aria-label="지원 위치">◇</i>}
            </button>)}
            {flying&&<i className="zf-ball-flight" aria-hidden="true"/>}
            {revealed?.zone===9&&<i className="zf-outside-ball" aria-label="실제 투구: 존 밖">●</i>}
            {result&&['good','big'].includes(feedback.tone)&&<div className="zf-impact-ring" aria-hidden="true"/>}
          </div>
          <div className="zf-board-caption">{caption}</div>
        </div>
      </div>
      <section className="zf-dock" aria-label="이번 공 선택">
        {learning&&!result?<div className={'zf-lesson-guide'+(lesson===2?' with-card':'')} role="status"><span className="zf-lesson-eyebrow">{lesson===0?'첫 안타 연습':lesson===1?'새로 알게 된 것 · 투수 HP':'새로 알게 된 것 · 집중'}</span><h2>{lessonInfo.title}</h2>{lesson===2?<div className="zf-lesson-skill">{needsPreparation?<Card s={game} entry={hand[0]} problem="" selected={picked===hand[0]?.id} locked={flying} onClick={()=>chooseCard(hand[0])}/>:<strong className="zf-prepared">✓ 집중 +{game.battle.aim}<small>이번 타석에 적용 중</small></strong>}<p>{needsPreparation?lessonInfo.text:'이제 밝은 코스를 골라 타격하세요. 준비를 사용해도 공은 날아오지 않습니다.'}</p></div>:<><p>{lessonInfo.text}</p><div className="zf-lesson-motif" aria-hidden="true">{lesson===0?'＋ → ●':'안타 → HP ↓'}</div></>}</div>:<>
        <div className="zf-dock-top"><div className="zf-selection" aria-label="현재 선택"><strong>{result?'이번 공의 결과':entry?entryName(entry):`내 손패 ${hand.length}장`}</strong>{!result&&<span>{selectedText+(supports.length?` · 지원 ${supports.length}장 · 피해 ×${preview.damageRate.toFixed(2)}`:'')||(hand.length>3?'좌우로 넘겨 카드를 비교하세요':'카드와 코스를 원하는 순서로 고르세요')}</span>}</div>{!result&&(canSupport||handMode==='support')&&<button type="button" className="zf-support-toggle" aria-pressed={handMode==='support'} onClick={toggleSupport} disabled={flying}>{handMode==='support'?(armed?'배치 취소':'지원 선택 취소'):'＋ 지원 추가'}</button>}</div>
        {!result&&<div className="zf-hand" role="group" aria-label={handMode==='support'?'지원 카드 선택':'카드 선택'}>
          {hand.map(c=><Card key={c.id} s={game} entry={c} problem={supports.some(x=>x.id===c.id)?'':cardProblemFor(c)} selected={picked===c.id} support={supports.some(x=>x.id===c.id)} armed={armed===c.id} locked={flying} onClick={()=>chooseCard(c)}/>)}
        </div>}
        </>}
        {result&&<div className={'zf-result-card zf-'+feedback.tone}><strong>{learning&&lesson===0?revealed?.label:game.v10.lastCombat?.damage?`−${game.v10.lastCombat.damage} HP`:revealed?.label}</strong><span>{learning&&lesson===0?'내가 고른 코스와 실제 공을 비교해보세요.':feedback.detail}</span><p className="zf-explanation">{resultExplanation(game)}</p>{game.battle.takeEnergyBonus===1&&['pitch','between'].includes(game.phase)&&<small>다음 공 에너지 4 · {takeDraw.count===1?'추가 카드 +1':takeDraw.reason==='full'?'손패 6장 한도':'추가 드로우 없음'}</small>}<small>{learning?(revealed?.kind==='hit'?(lesson===2?'준비 끝 · 이제 원정에서 승부하세요':'성공! 다음에는 한 가지만 더 알아봅니다'):'같은 연습 공으로 다시 도전할 수 있어요'):game.phase==='lost'?'3아웃 · 체험 종료':['reward','won'].includes(game.phase)?'투수 격파 · 체험 종료':game.phase==='between'?'다음 타자가 들어옵니다':'같은 타자 · 다음 공'}</small></div>}
        <p className={'zf-notice'+(!notice&&!problem?' zf-active-effects':'')} role="status">{!result&&!flying?(notice||problem||activeEffects):''}</p>
      </section>
      <footer className="zf-actions">
        {result?<button type="button" className="zf-go" data-zf-next onClick={nextTurn}>{learning?(revealed?.kind!=='hit'?'같은 공 다시 도전':lesson===0?'다음 · 투수 HP':lesson===1?'다음 · 집중 카드':finishLabel):(game.phase==='pitch'?'다음 공':game.phase==='between'?'다음 타자':'다시 플레이')} <span>→</span></button>:<>
          {!learning&&<><button type="button" className="zf-basic" data-kind="basic" aria-pressed={picked==='basic'} onClick={()=>chooseCard({id:'basic',kind:'basic'})} disabled={flying||handMode==='support'}>기본 스윙<small>비용 0 · 카드 없음</small></button>
          <button type="button" className="zf-take" onClick={()=>execute(true)} disabled={flying}>지켜보기<small>{game.battle.strikes===2?'볼이면 +1 · 삼진 피해 0':'다음 공 에너지 +1'}</small></button></>}
          <button type="button" className="zf-go" onClick={()=>execute()} disabled={flying||(needsPreparation&&!skill)||!picked||!!armed||handMode==='support'||!!problem||(!skill&&aim===null)}>{flying?'투구 중…':handMode==='support'?'지원을 배치하세요':skill?'준비 사용':picked&&aim!==null?'타격!':picked?'코스를 선택하세요':'카드를 선택하세요'}<small>{!learning&&!flying&&picked&&!armed&&handMode!=='support'&&(skill||aim!==null)?`에너지 ${preview?.cost??0} / ${v10Energy(game)}`:!learning&&!flying?`에너지 ${v10Energy(game)} / ${v10EnergyCap(game)}`:''}</small></button>
        </>}
      </footer>
      <div className="zf-footnote"><span>{learning?'고정 연습 · 코스 1개 · 저장 없음':`${pack.name} · UX PREVIEW`}</span>{!learning&&<button type="button" onClick={()=>restartDeck()} disabled={flying}>처음부터</button>}</div>
      {info&&<dialog ref={dialog} className="zf-dialog" onCancel={()=>setInfo(false)} onClose={()=>setInfo(false)} aria-labelledby="zf-info-title"><h2 id="zf-info-title">전투 정보</h2><p>손패는 항상 표시됩니다. 카드와 코스는 원하는 순서로 고르세요. 기본 스윙은 아래 버튼으로 선택하며, 타격 버튼을 눌러 실행합니다. 선택한 지원 카드를 다시 누르면 제거됩니다. 준비 카드는 코스 선택 없이 쓸 수 있습니다.</p><button type="button" onClick={onLearn}>처음부터 배우기</button><p>기존 덱빌딩 규칙과 실제 시작 덱을 사용하는 단일 전투 체험입니다. 새로고침하면 초기화됩니다.</p><p>현재 타자: {LINEUP[game.battle.batterIndex].name}<br/>준비: {game.battle.preparations}/{v10PrepMax(game)} · 집중 {game.battle.aim||0}<br/>기세 {game.battle.momentum||0} · 투수 흔들림 {game.battle.shaken||0}<br/>주자: {game.battle.bases.map((id,i)=>id?`${i+1}루 ${LINEUP.find(x=>x.id===id)?.name||'주자'}`:null).filter(Boolean).join(' · ')||'없음'}</p>{activeEffects&&<p><strong>유지 중인 준비 효과</strong><br/>{activeEffects}</p>}{entry&&<p><strong>{entryName(entry)}</strong><br/>{entry.kind==='basic'?'한 존을 노립니다. 비용 0 · 카드 소모 없음.':CARDS[entry.kind].text}</p>}<p>손패 {hand.length}장 · 더미 {game.battle.draw.length}장 · 버림 {game.battle.discard.length}장</p><fieldset className="zf-deck-picks"><legend>다른 시작 덱 체험</legend>{START_PACKS.map(p=><button type="button" key={p.id} onClick={()=>restartDeck(p.id)}><strong>{p.name}{p.id===pack.id?' · 현재':''}</strong><small>{p.desc}</small><span>이 덱으로 다시 시작 →</span></button>)}</fieldset><button type="button" onClick={()=>setInfo(false)}>닫기</button></dialog>}
    </section>
  </main>;
}
