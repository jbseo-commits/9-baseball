import React,{useEffect,useMemo,useState} from 'react';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,
  previewCard,previewV10Stack,setAimZone} from './engine.js';
import {CARDS} from './cards.js';
import {DEFENSE_DEPTH_START,DEFENSE_VERSION,defenseDepthName,defenseStance} from './defense-stance.js';
import {DEFENSE_DECKS,buildDefenseCase} from './defense-cases.js';
import {installCardDetailGestures} from './CardDetailSheet.jsx';
import BallparkBattle from './BallparkBattle.jsx';
import './defense-experiment.css';

/* Tactical defense experiment A — DEV-only isolated shell (memory state).
   Never reads/writes real saves or settings keys; no reward/map flow (single
   diagnostic game); no FX timelines (instant resolve → result). */
const memStorage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,String(v));},removeItem:k=>{m.delete(k);}};};

function naturalState({seed,deckId}){
  const extra=DEFENSE_DECKS[deckId]||null;
  let s=createV10Duel(seed);
  if(extra){
    s.deck=extra.map((kind,i)=>({id:'e'+i,kind}));
    s.nextId=extra.length;
  }
  s=enterV10Node(s,'a1-entry');
  if(extra){
    // At least one comparison-pool card in the opening hand (real IDs).
    const poolKinds=extra.slice(6);
    const hasPool=s.battle.hand.some(id=>poolKinds.includes(s.deck.find(c=>c.id===id)?.kind));
    if(!hasPool){
      const cand=s.battle.draw.map(id=>s.deck.find(c=>c.id===id)).find(c=>c&&poolKinds.includes(c.kind));
      if(cand){
        const outId=s.battle.hand[s.battle.hand.length-1];
        s.battle.hand=[...s.battle.hand.slice(0,-1),cand.id];
        s.battle.draw=[outId,...s.battle.draw.filter(id=>id!==cand.id)];
      }
    }
  }
  return {state:s,depth:DEFENSE_DEPTH_START,note:deckId?`비교 덱 ${deckId} 자연 시작`:'자연 시작'};
}

function initExperiment(){
  const q=new URLSearchParams(typeof window!=='undefined'?window.location.search:'');
  const off=q.get('off')==='1';
  const seed=Number(q.get('seed'))||90211;
  const caseId=q.get('case'),deckId=q.get('deck');
  let boot;
  if(caseId){
    const c=buildDefenseCase(caseId,{seed});
    boot={s:c.state,depth:c.depth,off,caseId,deckId:null,note:c.note};
  }else{
    const n=naturalState({seed,deckId:deckId||null});
    boot={s:n.state,depth:n.depth,off,caseId:null,deckId:deckId||null,note:n.note};
  }
  /* Diagnostic pending override (DEV harness only): ?pending=zone,roll,power.
     Same mechanism as scripts/qa-shots.mjs; never part of the game rules. */
  const pend=q.get('pending');
  if(pend){
    const [zone,roll,power]=pend.split(',').map(Number);
    if(Number.isInteger(zone)&&zone>=0&&zone<=9)
      boot.s.battle.pending={zone,roll:Number.isFinite(roll)?roll:.5,powerRoll:Number.isFinite(power)?power:.9};
  }
  return boot;
}

const byId=(s,id)=>s.deck.find(c=>c.id===id);

export default function DefenseExperiment(){
  const boot=useMemo(initExperiment,[]);
  const [s,setS]=useState(boot.s);
  const [depth,setDepth]=useState(boot.depth);
  const [selected,setSelected]=useState(null);
  const [stack,setStack]=useState([]);
  const [history,setHistory]=useState([]);
  const store=useMemo(memStorage,[]);
  const off=boot.off;
  /* Manual detail inputs (long-press / right-click / i) route battle targets
     to the arena inspector through the same single dispatch as the main run.
     There is deliberately no global sheet in the experiment tree. */
  useEffect(()=>installCardDetailGestures(window,(d,el)=>{
    if(el?.closest?.('.bp-battle'))window.__bpInspect?.open?.(d,el);
  }),[]);

  const b=s.battle||{};
  const hand=(b.hand||[]).filter(id=>{const e=byId(s,id);return e&&CARDS[e.kind];})
    .map(id=>({id,entry:byId(s,id),preview:previewCard(s,id)}));
  const choice=selected&&(selected==='basic'||(b.hand||[]).includes(selected))
    ?previewV10Stack(s,selected,stack):null;
  const defenseOpts=off?{}:{defense:{depth}};
  const lastDefense=s.v10?.lastCombat?.defense||null;

  const doAct=(fn,...args)=>{
    const before=s;
    const next=fn(before,...args);
    if(next===before)return;
    const rec=next.v10?.lastCombat?.defense;
    if(rec&&rec!==before.v10?.lastCombat?.defense)
      setHistory(h=>[...h.slice(-11),{label:next.v10.lastCombat.verdict,defense:rec}]);
    // The result stays on screen (strip + reservation); only the selection clears.
    if(next.phase==='between'&&before.phase!=='between'){setSelected(null);setStack([]);}
    setS(next);
  };
  /* Next-step inputs (the user advances; nothing auto-advances past results).
     Reserved depth applies only at the next batter boundary. */
  const doNext=()=>{
    if(s.phase==='pitch')setS(cur=>advanceV10Pitch(cur));
    else if(s.phase==='between'){
      const rec=s.v10?.lastCombat?.defense;
      setS(cur=>{
        const nb=advanceV10Batter(cur);
        if(nb===cur)return cur;
        if(rec&&!off)setDepth(rec.nextDepth);
        setSelected(null);setStack([]);
        return nb;
      });
    }
  };

  // ---- defenseView (absent when off → Battle renders the main-line UI) ----
  const mainEntry=selected&&selected!=='basic'?hand.find(x=>x.id===selected)?.entry:null;
  const mainKind=mainEntry?.kind||(selected==='basic'?'basic':null);
  const mainStance=mainKind?defenseStance(mainKind):'none';
  const summaryHint=off?null:defenseSummaryHint({mainKind,mainStance,coverage:choice?.coverage||[],runners:(b.bases||[]).some(Boolean)});
  const cardEffects=off?null:defenseCardEffects(hand,depth);
  const effectLine=off?null:defenseEffectLine(depth);
  const defenseView=off?null:{depth,depthName:defenseDepthName(depth),effectLine,summaryHint,cardEffects};

  const ended=['won','lost','reward'].includes(s.phase);
  const restart=()=>{const b0=initExperiment();setS(b0.s);setDepth(b0.depth);setSelected(null);setStack([]);setHistory([]);};

  return <div className="defense-experiment" data-testid="defense-experiment">
    <header className="defense-bar" aria-label="수비 실험 상태">
      <strong>수비 실험 {DEFENSE_VERSION}{off?' · 비교(OFF)':''}</strong>
      <span>수비 {defenseDepthName(depth)}({depth})</span>
      {boot.caseId&&<span>사례 {boot.caseId}</span>}
      {boot.deckId&&<span>덱 {boot.deckId}</span>}
      <span>{boot.note}</span>
      <button type="button" onClick={restart}>다시 시작</button>
    </header>
    {!ended?<div className="v14-battle-portrait"><BallparkBattle key="defense-battle" s={s} hand={hand} selected={selected} swingStack={stack} choice={choice}
      locked={false} label={'실험 A'} pitcher={s.pitcher}
      storage={store} defenseView={defenseView}
      onSelect={setSelected} onStack={setStack}
      onAim={z=>setS(cur=>setAimZone(cur,z))}
      onSwing={()=>doAct(playV10Action,{type:'card',id:selected,supports:stack},defenseOpts)}
      onTake={()=>doAct(playV10Action,{type:'take'},defenseOpts)}
      onNext={s.phase==='pitch'||s.phase==='between'?doNext:null}
      nextLabel={s.phase==='pitch'?'다음 공':s.phase==='between'?'다음 타자':''}
    /></div>:<section className="defense-end" aria-label="실험 경기 종료">
      <strong>경기 종료 · {s.phase}</strong>
      <p>수비 {defenseDepthName(depth)}에서 끝났습니다. {lastDefense?`마지막 예약: ${lastDefense.causeText} → ${defenseDepthName(lastDefense.nextDepth)}.`:'기록된 수비 전이가 없습니다.'}</p>
      {!!history.length&&<ol>{history.map((h,i)=><li key={i}>{h.label} — {h.defense.causeText} → {defenseDepthName(h.defense.nextDepth)}{h.defense.delta?` · 피해 ${h.defense.delta>0?'+':''}${h.defense.delta}`:''}{h.defense.extraAdvance?' · 주자 +1루':''}</li>)}</ol>}
      <button type="button" onClick={restart}>다시 시작</button>
    </section>}
  </div>;
}

function defenseSummaryHint({mainKind,mainStance,coverage,runners}){
  if(!mainKind||mainKind==='basic')return null;
  if(mainStance==='contact'){
    const rows=[...new Set((coverage||[]).filter(z=>z<9).map(z=>Math.floor(z/3)))];
    if(rows.length>1)return '정타 적중 높이에 따라 다음 수비 조정';
    const r=rows[0];
    return `정타 적중 → 다음 수비 ${r===0?'후퇴':r===2?'전진':'유지'}`;
  }
  if(mainStance==='advance')return '진루 적중 → 한 단계 전진';
  if(mainStance==='power')return '장타 경계 → 다음 수비 후퇴';
  if(mainStance==='sacrifice')return runners?'성공 희생 → 즉시 전진':null;
  return null;
}

function defenseCardEffects(hand,depth){
  const out={};
  for(const x of hand){
    const stance=defenseStance(x.entry?.kind);
    if(stance==='advance')out[x.entry.kind]=depth===0?'전진 수비: 피해 −4':depth===2?'후퇴 수비: 기존 주자 +1루':null;
    else if(stance==='power')out[x.entry.kind]=depth===0?'전진 수비: 피해 +8':depth===2?'후퇴 수비: 피해 −4':null;
  }
  for(const k of Object.keys(out))if(!out[k])delete out[k];
  return out;
}

function defenseEffectLine(depth){
  if(depth===0)return '전진: 장타 피해 +8 · 진루 피해 −4';
  if(depth===2)return '후퇴: 진루 기존 주자 +1루 · 장타 피해 −4';
  return '기본: 공간 효과 없음';
}
