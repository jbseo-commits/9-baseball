import React,{useEffect,useRef,useState} from 'react';
import {CARDS,cardCost,LINEUP} from './cards.js';
import {setAimZone,coverageAt,previewV10Stack,cardProblem,stackSupportProblem,playV10Action,advanceV10Pitch,advanceV10Batter,v10Energy,v10EnergyCap,v10PrepMax,v10StackMax,v10TakeDrawPreview,pitchClue,START_PACKS} from './engine.js';
import {cardFaceOf,shortCardProblem} from './card-face.js';
import {preparationDrawPreview,activePreparationFeedback} from './preparation-feedback.js';
import {cardArtFor,cardArtFocusFor} from './card-art.js';
import {ZONE_WORDS} from './ballpark-copy.js';
import {createPreviewBattle,handOverview,publicZoneFaces,publicCoverText,resultFeedback,entryName} from './zone-first-model.js';
import stadium from '../../assets/duel/stadium-portrait.png';
import batterSheet from '../../assets/ui-kit/batter/batter-v14-master-sheet.png';
import {pitcherAtlases} from './pitcher-visuals.js';
import './zone-first-preview.css';

export const PREVIEW_IMPACT_MS=1450;
const BASIC={kind:'basic'};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function usePitchFrame(flying){
  const [frame,setFrame]=useState(0);
  useEffect(()=>{
    if(!flying){setFrame(0);return;}
    if(reduced()){setFrame(74);return;}
    let raf,start;
    const tick=time=>{start??=time;setFrame(Math.min(119,Math.floor((time-start)/16.67)));if(time-start<2000)raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[flying]);
  return frame;
}

function Card({s,entry,onClick,problem,selected=false}){
  const face=cardFaceOf(entry,{strikes:s.battle.strikes,drawPreview:preparationDrawPreview(s,entry.id)}),art=cardArtFor(entry.kind);
  const notes=[...new Set([face.condition,face.drawNote,shortCardProblem(problem)||problem].filter(Boolean))];
  return <button type="button" className={'zf-card'+(selected?' is-picked':'')+(notes.length?' has-notes':'')} onClick={onClick}
    aria-label={[entryName(entry),'비용 '+cardCost(entry),face.axis,face.summary,face.condition,face.drawNote,problem].filter(Boolean).join(' · ')}
    aria-disabled={!!problem} data-kind={entry.kind}>
    <span className="zf-card-art" style={art?{backgroundImage:`url("${art}")`,backgroundPosition:cardArtFocusFor(entry.kind)?.objectPosition}:{}}>
      <span className="zf-cost" aria-hidden="true">{cardCost(entry)}</span>
      <span className="zf-axis">{face.axis}</span>
    </span>
    <strong>{entryName(entry)}</strong><span className="zf-card-effect">{face.summary}</span>
    {notes.map((note,i)=><span key={i} className="zf-card-warning">{note}</span>)}
  </button>;
}

export default function ZoneFirstPreview({initialState}){
  const [game,setGame]=useState(()=>initialState||createPreviewBattle());
  const [step,setStep]=useState('aim'),[aim,setAim]=useState(null),[picked,setPicked]=useState(null);
  const [supports,setSupports]=useState([]),[armed,setArmed]=useState(null),[handMode,setHandMode]=useState('main');
  const [notice,setNotice]=useState(''),[info,setInfo]=useState(false),[sound,setSound]=useState(false);
  const pending=useRef(null),timer=useRef(null),busy=useRef(false),dialog=useRef(null),audio=useRef(null),root=useRef(null),restoreFocus=useRef(null);
  const flying=step==='flight',result=step==='result',frame=usePitchFrame(flying||result);
  const hand=game.battle.hand.map(id=>game.deck.find(c=>c.id===id)).filter(Boolean);
  const overview=handOverview(game),pack=START_PACKS.find(p=>p.id===game.v10?.startPack?.pack)||START_PACKS[0];
  const entry=picked==='basic'?BASIC:hand.find(c=>c.id===picked);
  const skill=CARDS[entry?.kind]?.type==='skill';
  const preview=picked?previewV10Stack(game,picked,supports):null;
  const problem=preview?.problem||'';
  const primary=entry&&!skill&&aim!==null?coverageAt(game,picked,aim):[];
  const cover=result?game.battle.revealed?.coverage||[]:aim===null?[]:preview?.coverage||primary;
  const supportZones=result?(game.battle.revealed?.supportCoverages||[]).flatMap(x=>x.coverage):supports.flatMap(x=>coverageAt(game,x.id,x.aimZone));
  const faces=publicZoneFaces(game),feedback=result?resultFeedback(game):null;
  const takeDraw=result?v10TakeDrawPreview(game):null;
  const canSupport=entry&&aim!==null&&picked!=='basic'&&!skill&&!CARDS[entry.kind]?.bunt&&supports.length<v10StackMax(game)-1;
  const revealed=result?game.battle.revealed:null;
  const title=flying?'한 공에 집중.':result?feedback.title:armed?'지원할 코스를 누르세요':step==='aim'?'어디를 노릴까요?':step==='hand'?(aim===null?'어떤 카드로 칠까요?':'이 코스에 쓸 카드는?'):skill?'타격 전에 준비할까요?':aim===null?'타격 코스를 고르세요':'이 범위로 승부합니다';
  const returning=step==='hand'&&!!picked;
  const browsing=step==='hand';

  const tone=(kind)=>{
    if(!sound)return;
    try{
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)return;
      const ac=audio.current||(audio.current=new Context());ac.resume();
      const osc=ac.createOscillator(),gain=ac.createGain(),t=ac.currentTime;
      osc.type=kind==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(kind==='hit'?520:kind==='near'?230:340,t);
      osc.frequency.exponentialRampToValueAtTime(kind==='hit'?1040:140,t+.16);
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
  const clearPlan=()=>{setPicked(null);setSupports([]);setArmed(null);setNotice('');};
  const openHand=(mode='main')=>{if(busy.current)return;setArmed(null);setHandMode(mode);setStep('hand');setNotice('');};
  const chooseZone=z=>{
    if(busy.current||result)return;
    tone('tap');setNotice('');
    if(armed){
      const next=[...supports,{id:armed,aimZone:z}],why=stackSupportProblem(game,picked,next);
      if(why){setNotice(why);return;}
      setSupports(next);setArmed(null);setStep('ready');return;
    }
    setAim(z);setGame(s=>setAimZone(s,z));
    if(step==='aim')openHand();
    else if(step==='hand'&&picked)setStep('ready');
  };
  const chooseCard=c=>{
    if(busy.current)return;
    const why=handMode==='support'?stackSupportProblem(game,picked,[...supports,{id:c.id,aimZone:aim}]):cardProblem(game,c.id);
    if(why){setNotice(why);return;}
    tone('tap');setNotice('');
    if(handMode==='support'){setArmed(c.id);setStep('ready');return;}
    setPicked(c.id);setSupports([]);setArmed(null);setStep('ready');
  };
  const execute=(take=false)=>{
    if(busy.current||result||(!take&&(!picked||armed||(!skill&&aim===null)||problem)))return;
    const next=playV10Action(game,take?{type:'take'}:{type:'card',id:picked,supports});
    if(next===game){setNotice('현재 선택으로 실행할 수 없습니다.');return;}
    if(next.stats.pitches===game.stats.pitches){
      setGame(next);clearPlan();setStep('hand');setHandMode('main');setNotice(`${entryName(entry)} 적용 · 준비 ${next.battle.preparations}/${v10PrepMax(next)}`);tone('tap');return;
    }
    busy.current=true;pending.current=next;setStep('flight');setNotice('');
    // Preserve the entire pre-pitch state until impact, including accessible text.
    timer.current=setTimeout(()=>{
      setGame(next);pending.current=null;setStep('result');
      tone(resultFeedback(next).tone==='near'?'near':next.battle.revealed.kind==='hit'?'hit':'tap');
    },reduced()?180:PREVIEW_IMPACT_MS);
  };
  const nextTurn=()=>{
    clearTimeout(timer.current);pending.current=null;busy.current=false;clearPlan();setAim(null);setHandMode('main');
    const next=game.phase==='pitch'?advanceV10Pitch(game):game.phase==='between'?advanceV10Batter(game):createPreviewBattle((game.initialSeed+1)>>>0,pack.id);
    setGame(next);setStep('aim');
  };
  const restartDeck=(packId=pack.id)=>{if(busy.current&&!result)return;busy.current=false;clearTimeout(timer.current);pending.current=null;setGame(createPreviewBattle(game.initialSeed,packId));clearPlan();setAim(null);setStep('aim');setHandMode('main');setInfo(false);};
  const cardProblemFor=c=>handMode==='support'?stackSupportProblem(game,picked,[...supports,{id:c.id,aimZone:aim}]):cardProblem(game,c.id);
  const ballZone=flying?pending.current?.battle.revealed?.zone:revealed?.zone;
  const ballStyle=Number.isInteger(ballZone)?{'--ball-x':`${ballZone===9?116:((ballZone%3)+.5)/3*100}%`,'--ball-y':`${ballZone===9?50:(Math.floor(ballZone/3)+.5)/3*100}%`}:{};
  const selectedFace=entry?cardFaceOf(entry,{strikes:game.battle.strikes,drawPreview:preparationDrawPreview(game,entry.id)}):null;
  const activeEffects=activePreparationFeedback(game.battle,game.phase).filter(t=>!t.startsWith('이번 공 간파:')).join(' · ');
  const clue=pitchClue(game);
  const caption=result?`실제 투구 · ${revealed?.zone===9?'존 밖':ZONE_WORDS[revealed?.zone]}`:
    armed?`${entryName(hand.find(c=>c.id===armed))} · 위치를 고르면 추가`:
    [clue,picked&&!skill?(aim===null?'코스를 고르면 타격 범위가 표시됩니다':[`${cover.length}존 커버`,publicCoverText(game,cover)].filter(Boolean).join(' · ')):clue?'':'투구 경향을 보고 코스를 누르세요'].filter(Boolean).join(' · ');

  return <main className="zf-preview" ref={root} data-step={step} onKeyDown={e=>{
    if(e.key==='Escape'&&!flying&&!result&&!info){setArmed(null);setStep(picked?'ready':'aim');setNotice('');}
  }}>
    <section className="zf-shell" aria-label="존 우선 전투 프리뷰" style={{'--zf-stadium':`url("${stadium}")`}}>
      <header className="zf-header"><a className="zf-brand" href={import.meta.env.BASE_URL}>9<span>ZONE</span></a><span className="zf-preview-tag">BATTLE STUDY</span>
        <button type="button" aria-label={sound?'소리 끄기':'소리 켜기'} aria-pressed={sound} onClick={()=>setSound(v=>!v)}>{sound?'♪ ON':'♪ OFF'}</button>
        <button type="button" aria-label="전투 정보" onClick={()=>setInfo(true)} disabled={flying}>ⓘ</button>
      </header>
      <div className="zf-scoreboard">
        <div className="zf-opponent"><span>{game.pitcher.name} <em>VS</em></span><div className="zf-hp" role="meter" aria-label="투수 HP" aria-valuenow={game.pitcher.hp} aria-valuemin={0} aria-valuemax={game.pitcher.maxHp}><i style={{width:`${game.pitcher.hp/game.pitcher.maxHp*100}%`}}/></div><small>{game.pitcher.hp}<span> / {game.pitcher.maxHp}</span></small></div>
        <div className="zf-counts" aria-label={`볼 ${game.battle.balls}, 스트라이크 ${game.battle.strikes}, 아웃 ${game.battle.outs}`}>
          {[['B',game.battle.balls,3],['S',game.battle.strikes,2],['O',game.battle.outs,2]].map(([label,value,max])=><span key={label} className={'zf-count zf-'+label}><b>{label}</b>{Array.from({length:max},(_,i)=><i key={i} className={i<value?'lit':''}/>)}</span>)}
          <span className="zf-runners" aria-label={`주자 ${(game.battle.bases||[]).filter(Boolean).length}명`}>{[2,1,0].map(i=><i key={i} className={game.battle.bases[i]?'lit':''} title={`${i+1}루`}/>)}</span>
        </div>
      </div>
      <div className={'zf-field'+(result?' zf-result zf-'+feedback.tone:'')+(flying?' zf-flying':'')}>
        <div className="zf-scenery" aria-hidden="true"/>
        <div className="zf-pitcher" aria-hidden="true" style={{backgroundImage:`url("${pitcherAtlases[game.v10.opponent.artId]}")`,backgroundPosition:`${frame%10/9*100}% ${Math.floor(frame/10)/11*100}%`}}/>
        <div className={'zf-batter'+(result&&revealed?.kind==='hit'?' zf-batter-hit':'')} aria-hidden="true" style={{backgroundImage:`url("${batterSheet}")`}}/>
        <div className="zf-focus">
          <div className="zf-prompt" role="status"><span>{flying?'PITCH':result?'RESULT':armed?'SUPPORT':step==='aim'?'AIM':browsing?'CARD':skill?'PREPARE':aim===null?'AIM':'READY'}</span><h1>{title}</h1></div>
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
        <div className="zf-dock-top"><span>{result?'이번 공의 결과':flying?'선택 완료':step==='hand'?(handMode==='support'?'지원할 카드':'손패'):picked?'선택한 플랜':'내 손패'} <b>{!picked&&!result&&!flying?hand.length+'장':''}</b></span><span className="zf-energy" aria-label={`에너지 ${v10Energy(game)}/${v10EnergyCap(game)}`}>에너지 <b>{v10Energy(game)}</b><span>/{v10EnergyCap(game)}</span></span></div>
        {step==='aim'&&<div className="zf-hand-peek"><div className="zf-peek-art" aria-hidden="true">{overview.kinds.map((kind,i)=><i key={i} style={{backgroundImage:`url("${cardArtFor(kind)}")`,backgroundPosition:cardArtFocusFor(kind)?.objectPosition}}/>)}</div><div className="zf-peek-copy"><strong>코스를 고르면 손패가 열립니다</strong><span aria-label="현재 손패 구성">{overview.shapes.join(' · ')||'기본 스윙 가능'}{overview.preparations?` · 준비 ${overview.preparations}장`:''}</span><button type="button" onClick={()=>openHand()}>손패 보기 <span>→</span></button></div></div>}
        {step==='hand'&&<div className="zf-hand" role="group" aria-label={handMode==='support'?'지원 카드 선택':'카드 선택'}>
          {handMode==='main'&&<Card s={game} entry={BASIC} onClick={()=>chooseCard({id:'basic',kind:'basic'})}/>}
          {hand.filter(c=>handMode!=='support'||c.id!==picked&&!supports.some(x=>x.id===c.id)&&CARDS[c.kind].type==='attack'&&!CARDS[c.kind].bunt).map(c=><Card key={c.id} s={game} entry={c} problem={cardProblemFor(c)} selected={picked===c.id} onClick={()=>chooseCard(c)}/>)}
        </div>}
        {step==='ready'&&<div className="zf-plan">
          <div className="zf-plan-body"><div className="zf-main-card"><span className="zf-mini-art" style={cardArtFor(entry?.kind)?{backgroundImage:`url("${cardArtFor(entry.kind)}")`,backgroundPosition:cardArtFocusFor(entry.kind)?.objectPosition}:{}}/><div><strong>{entryName(entry)}</strong><span>{selectedFace?.summary}</span>{selectedFace?.condition&&<small className="zf-warning">{selectedFace.condition}</small>}{selectedFace?.drawNote&&<small className="zf-warning">{selectedFace.drawNote}</small>}<small>{skill?`준비 ${game.battle.preparations}/${v10PrepMax(game)} · 투구 소모 없음`:`비용 ${preview?.cost??0}/${v10Energy(game)}${supports.length?' · 피해 ×'+preview?.damageRate?.toFixed(2):''}`}</small></div></div>
          <div className="zf-supports">{supports.map((x,i)=><button type="button" key={x.id} aria-label={`${entryName(hand.find(c=>c.id===x.id))} 지원 제거`} onClick={()=>setSupports(v=>v.filter(y=>y.id!==x.id))}>{i+2} {entryName(hand.find(c=>c.id===x.id))} ×</button>)}</div></div>
          <div className="zf-plan-tools"><button type="button" onClick={()=>openHand()}>카드 바꾸기</button>{canSupport&&<button type="button" onClick={()=>openHand('support')}>＋ 지원 추가</button>}{armed&&<button type="button" onClick={()=>setArmed(null)}>배치 취소</button>}</div>
        </div>}
        {flying&&<div className="zf-wait"><span className="zf-wait-mark zf-breath" aria-hidden="true">◇</span><strong>공을 기다립니다</strong></div>}
        {result&&<div className={'zf-result-card zf-'+feedback.tone}><strong>{game.v10.lastCombat?.damage?`−${game.v10.lastCombat.damage} HP`:revealed?.label}</strong><span>{feedback.detail}</span>{game.battle.takeEnergyBonus===1&&['pitch','between'].includes(game.phase)&&<small>다음 공 에너지 4 · {takeDraw.count===1?'추가 카드 +1':takeDraw.reason==='full'?'손패 6장 한도':'추가 드로우 없음'}</small>}<small>{game.phase==='lost'?'3아웃 · 체험 종료':['reward','won'].includes(game.phase)?'투수 격파 · 체험 종료':game.phase==='between'?'다음 타자가 들어옵니다':'같은 타자 · 다음 공'}</small></div>}
        <p className={'zf-notice'+(!notice&&!problem?' zf-active-effects':'')} role="status">{!result&&!flying?(notice||problem||activeEffects):''}</p>
      </section>
      <footer className="zf-actions">
        {result?<button type="button" className="zf-go" data-zf-next onClick={nextTurn}>{game.phase==='pitch'?'다음 공':game.phase==='between'?'다음 타자':'다시 플레이'} <span>→</span></button>:<>
          <button type="button" className="zf-take" onClick={()=>execute(true)} disabled={flying}>지켜보기<small>{game.battle.strikes===2?'볼이면 +1 · 삼진 피해 0':'다음 공 에너지 +1'}</small></button>
          <button type="button" className="zf-go" onClick={()=>browsing?(setStep(picked?'ready':'aim'),setNotice('')):execute()} disabled={flying||(!browsing&&(!picked||!!armed||!!problem||(!skill&&aim===null)))}>{flying?'투구 중…':returning?'선택으로 돌아가기':browsing?'손패 접기':skill?'준비 사용':picked&&aim!==null?'타격!':aim===null?'코스를 선택하세요':'카드를 선택하세요'}<small>{!flying&&picked&&!armed&&!browsing&&(skill||aim!==null)?`에너지 ${preview?.cost??0}`:''}</small></button>
        </>}
      </footer>
      <div className="zf-footnote"><span>{pack.name} · UX PREVIEW</span><button type="button" onClick={()=>restartDeck()} disabled={flying}>처음부터</button></div>
      {info&&<dialog ref={dialog} className="zf-dialog" onCancel={()=>setInfo(false)} onClose={()=>setInfo(false)} aria-labelledby="zf-info-title"><h2 id="zf-info-title">전투 정보</h2><p>존을 고르면 손패가 열립니다. 손패를 먼저 보고 카드를 선택해도 됩니다. 타격 전에 코스를 고르세요. 준비 카드는 코스 선택 없이 쓸 수 있습니다.</p><p>기존 덱빌딩 규칙과 실제 시작 덱을 사용하는 단일 전투 체험입니다. 새로고침하면 초기화됩니다.</p><p>현재 타자: {LINEUP[game.battle.batterIndex].name}<br/>준비: {game.battle.preparations}/{v10PrepMax(game)} · 집중 {game.battle.aim||0}<br/>기세 {game.battle.momentum||0} · 투수 흔들림 {game.battle.shaken||0}<br/>주자: {game.battle.bases.map((id,i)=>id?`${i+1}루 ${LINEUP.find(x=>x.id===id)?.name||'주자'}`:null).filter(Boolean).join(' · ')||'없음'}</p>{activeEffects&&<p><strong>유지 중인 준비 효과</strong><br/>{activeEffects}</p>}{entry&&<p><strong>{entryName(entry)}</strong><br/>{entry.kind==='basic'?'한 존을 노립니다. 비용 0 · 카드 소모 없음.':CARDS[entry.kind].text}</p>}<p>손패 {hand.length}장 · 더미 {game.battle.draw.length}장 · 버림 {game.battle.discard.length}장</p><fieldset className="zf-deck-picks"><legend>다른 시작 덱 체험</legend>{START_PACKS.map(p=><button type="button" key={p.id} onClick={()=>restartDeck(p.id)}><strong>{p.name}{p.id===pack.id?' · 현재':''}</strong><small>{p.desc}</small><span>이 덱으로 다시 시작 →</span></button>)}</fieldset><button type="button" onClick={()=>setInfo(false)}>닫기</button></dialog>}
    </section>
  </main>;
}
