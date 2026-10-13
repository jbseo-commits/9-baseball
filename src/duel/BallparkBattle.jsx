import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {CARDS,LINEUP,bandFor,rangeFor,shadeNameFor,cardCost} from './cards.js';
import {publicProbabilities,readLevel,readSources,knownPitchZones,v10StackMax,v10PrepMax,v10Energy,v10EnergyCap,v10ActionCost,v10TakeDrawPreview,V11_SWING_ENERGY,V10_RUNNER_PRESSURE,v10Shaken,v10MentalCap,v10Momentum,v10MomentumRate,V10_MOMENTUM} from './engine.js';
import {probabilityBounds} from './information.js';
import {intentLines,hpTicks,ZONE_WORDS,runnerMoves} from './ballpark-copy.js';
import ZoneLinks from './ZoneLinks.jsx';
import GimmickVfx from './GimmickVfx.jsx';
import ImpactFx from './ImpactFx.jsx';
import {pitcherLine,momentOf} from './pitcher-voice.js';
import BallparkActors,{pixiAvailable,pitcherStance} from './BallparkActors.jsx';
import {lessonFor,planText} from './DecisionDebrief.jsx';
import batterV14MasterSheet from '../../assets/ui-kit/batter/batter-v14-master-sheet.png';
import cardArtSheet from '../../assets/ui-kit/cards/battle-core-v14-master-sheet.png';
import {cardArtFor,cardArtFocusFor} from './card-art.js';
import {pitcherPhase} from './pitcher-hp.js';
import {cardFaceOf,shortCardProblem,ROLE_MARKS} from './card-face.js';
import BattleInspector from './BattleInspector.jsx';
import './battle-inspector.css';
import {HomeRunCut,KnockoutCut} from './phone-art-v18.jsx';
import {pitcherFigures,pitcherPortraits} from './pitcher-visuals.js';
import './ballpark.css';
import './momentum.css';
import './original-ui-refinement.css';
import BallparkCoach from './BallparkCoach.jsx';

/* V13 BALLPARK — the battle as one ballpark scene (docs/design/v13/BALLPARK.md).
   Same engine contract as the legacy screen: `selected` + battle.aimZone is the main card,
   `swingStack` [{id,aimZone}] the supports, and the parent plays them through playV10Action.
   BP-2: the pitch plays in the scene too — the ball flies to its zone at the impact beat, the
   verdict is one word, the HP ticks drop, and one button moves on. */
/* the baseball call in one word, big (from the engine's result, not the flavour title); the flavour
   line ("갈랐다", "한 칸 차이") goes under it. Hits are the only good calls besides walks/sacrifices. */
const HIT_WORD={extra:'장타',homer:'홈런','grand-slam':'만루 홈런'};
function callOf(r,shot){
  if(!r)return '';
  const k=/strikeout|-k$/.test(shot?.grade||'')||/K$/.test(shot?.kicker||'')?'삼진':null;
  if(r.kind==='hit')return HIT_WORD[shot?.kind]||'안타';
  if(r.kind==='whiff')return k||'헛스윙';
  if(r.kind==='called')return k||'스트라이크';
  if(r.kind==='foul')return k||'파울';
  if(r.kind==='ball')return /볼넷/.test(r.label||'')?'볼넷':'볼';
  if(r.kind==='out')return '아웃';
  if(r.kind==='sacrifice')return '희생타';
  return '';
}
const LANDED=new Set(['impact','slowmo','release','settle']);
/* camera: which results push the lens in (BP-9). big = homer, mid = extra/dead-center, near = one-zone miss */
export const CAMERA={homer:'big','grand-slam':'big',extra:'mid','dead-center':'mid','near-miss':'near','near-miss-k':'near'};
export const STACK_COMMIT_MS=720;
/* #103 M10 — one camera unit for the portrait scene. The stadium, the batter, the pitcher on the mound
   and the zone over the plate are laid out in --u (v14-portrait-master.css). --u is 1% of the scene
   width, unless the scene is too short to show the mound with the pitcher standing on it (Chrome's
   address bar, short phones): then the whole camera pulls back so SCENE_UNITS_TALL units fit, never
   below 80% (the 125u-wide stadium must still cover the width). */
export const SCENE_UNITS_TALL=112;
export function sceneUnit(w,h){
  if(!(w>0))return 0;
  const full=w/100;
  if(!(h>0))return full;
  return Math.max(full*.8,Math.min(full,h/SCENE_UNITS_TALL));
}
/* BP-14: the ball band turns into a lure warning at this share of pitches */
export const LURE_PCT=30;
/* card role chip colours, inside the ballpark palette */
const ROLE_TONE={'장타':'gold','정타':'red','범위':'bone','진루':'brass','집중':'cyan','수급':'teal','관찰':'purple','생존':'bone','준비':'teal'};
/* the line under the next-step verb: pitch = same batter, next ball; between = the plate appearance ended */
export const nextHint=(phase,judging=false)=>judging?'판정 중…':phase==='pitch'?'같은 타자 · 다음 공을 기다린다':phase==='between'?'타석 종료 · 다음 타자가 들어선다':'';
const lessonZoneName=z=>z===9?'존 밖':ZONE_WORDS[z]||'코스';

const CARD_ART_POS={
  strike:'0% 0%',     // 밀어치기 (정확)
  rally:'100% 0%',    // 주자 연결 (진루)
  slug:'0% 100%',     // 당겨 넘기기 (파워)
  defend:'100% 100%', // 커트 스윙 (생존)
  place:'0% 0%',      // 정타 노림
  finisher:'0% 100%', // 갭 공략
  laser:'0% 0%',      // 라인드라이브
  commit:'0% 100%',   // 끝장 승부
  wall:'100% 100%',   // 존 봉쇄
};

/* the glyph already draws the coverage; the face keeps only what it adds (정확 적중 HP +50% …) */
const effect=def=>(def.gives||[]).filter(g=>!/커버$/.test(g)).slice(0,1).join('');
const isSkill=entry=>CARDS[entry?.kind]?.type==='skill';
const CardGlyph=({zones})=><span className="bp-glyph" aria-hidden="true">{Array.from({length:9},(_,z)=><i key={z} className={zones?.includes(z)?'on':''}/>)}</span>;

export default function BallparkBattle({
  s,hand,selected,swingStack,choice,locked=false,
  pitcher,label,pitcherArt,batterArt,
  fxStage=null,shot=null,impactAt=0,playToken=0,onNext=null,nextLabel='',vfx=null,pitcherAtlas=null,artId=null,batterPoses=null,
  batterSheet=batterV14MasterSheet,batterRig=null,
  onSelect,onAim,onStack,onSwing,onTake,onDetail,onPile,onHome,onHelp,onSettings,onToggleSound,sound=false,onJukebox=null,
  autoLesson=false,autoPlan=null,onExitLesson=null,previewMode=false,coachSignal=0,
}){
  const b=s.battle||{},rootRef=useRef(null),sceneRef=useRef(null),pitcherRef=useRef(null),zoneRef=useRef(null),flightRef=useRef(null),stageRef=useRef(null);
  const [armed,setArmed]=useState(null),[commitBeat,setCommitBeat]=useState(null),commitTimer=useRef(null);
  /* Inspector: manual arena-region swap. {tab, kind, plus, problem, pile} or null.
     The plan (selected/swingStack/armed) is never touched while it is open. */
  const [inspect,setInspect]=useState(null),inspectOpener=useRef(null),inspectScroll=useRef(0);
  const [inspectTab,setInspectTab]=useState('card');
  const openInspect=(tab,opts={})=>{
    /* Entries stay locked while the pitch/commit is in flight; the landed
       result (복기) and deciding states may inspect. */
    if(locked||commitBeat||inFx)return false;
    inspectOpener.current=document.activeElement;
    const handEl=rootRef.current?.querySelector('.bp-hand');
    inspectScroll.current=handEl?handEl.scrollLeft:0;
    setInspectTab(tab);
    setInspect({tab,pile:opts.pile||null,
      kind:opts.kind||null,plus:!!opts.plus,problem:opts.problem||null});
    return true;
  };
  const closeInspect=()=>{
    if(!inspectRef.current)return false;
    setInspect(null);
    const handEl=rootRef.current?.querySelector('.bp-hand');
    if(handEl)handEl.scrollLeft=inspectScroll.current||0;
    if(inspectOpener.current?.focus)inspectOpener.current.focus();
    return true;
  };
  /* The global card-detail gestures route battle targets here through one
     dispatch point (App.jsx); the registered object always sees live state. */
  const inspectRef=useRef(null);inspectRef.current=inspect;
  const openInspectRef=useRef(openInspect);openInspectRef.current=openInspect;
  const closeInspectRef=useRef(closeInspect);closeInspectRef.current=closeInspect;
  useEffect(()=>{
    const reg={isOpen:()=>!!inspectRef.current,
      open:(d,el)=>{
        if(!el?.closest?.('.bp-battle'))return false;
        return openInspectRef.current('card',{kind:d.kind,plus:d.plus,problem:d.problem});
      },
      close:()=>closeInspectRef.current()};
    window.__bpInspect=reg;
    return ()=>{if(window.__bpInspect===reg)delete window.__bpInspect;};
  },[]);
  const r=b.revealed,inFx=!!fxStage,deciding=s.phase==='battle'&&!inFx&&!locked&&!commitBeat;
  const judged=!!r&&s.last?.kind!=='skill'&&(inFx||s.phase!=='battle');
  const landed=!inFx||LANDED.has(fxStage);
  const showVerdict=!!shot&&(inFx||s.phase!=='battle')&&(landed||!judged);
  /* which actors Pixi has taken over (null = DOM actors only) */
  const [pixi,setPixi]=useState(null);
  const [canPixi]=useState(()=>!!batterPoses&&pixiAvailable());
  /* First-battle guide is opt-in only (help → 전투 가이드): never auto-shown,
     never re-shown by resetting its seen key. */
  const [coachOn,setCoachOn]=useState(false),coachShown=useRef(0);
  useEffect(()=>{if(coachSignal>coachShown.current){coachShown.current=coachSignal;setCoachOn(true);}},[coachSignal]);
  useLayoutEffect(()=>()=>{if(commitTimer.current)clearTimeout(commitTimer.current);},[]);
  useLayoutEffect(()=>{
    const root=rootRef.current,header=document.querySelector('.duel-header');
    if(!root)return;
    const set=()=>root.style.setProperty('--bp-top',(header?.getBoundingClientRect().height||0)+'px');
    set();window.addEventListener('resize',set);return()=>window.removeEventListener('resize',set);
  },[]);
  useLayoutEffect(()=>{
    const scene=sceneRef.current;if(!scene)return;
    const set=()=>{const u=sceneUnit(scene.clientWidth,scene.clientHeight);if(u)scene.style.setProperty('--u',u.toFixed(3)+'px');};
    set();
    const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(set):null;ro?.observe(scene);
    window.addEventListener('resize',set);
    return ()=>{ro?.disconnect();window.removeEventListener('resize',set);};
  },[]);
  /* Inspector open: the scene stays mounted (no Pixi/DOM re-init on close)
     but goes inert and hidden under the inspector's own box. */
  useEffect(()=>{
    const sc=sceneRef.current;if(!sc)return;
    if(inspect){sc.setAttribute('inert','');sc.setAttribute('aria-hidden','true');}
    else{sc.removeAttribute('inert');sc.removeAttribute('aria-hidden');}
  },[inspect]);
  /* the ball leaves the pitcher's glove and lands on its cell (or beside the zone) at the impact beat */
  useLayoutEffect(()=>{
    const f=flightRef.current,scene=sceneRef.current,p=pitcherRef.current,zone=zoneRef.current;
    if(!f||!scene||!p||!zone||!r)return;
    const sr=scene.getBoundingClientRect(),pr=p.getBoundingClientRect(),zr=zone.getBoundingClientRect();
    const z=r.zone,x1=z===9?zr.right+zr.width*.18:zr.left+zr.width*((z%3)+.5)/3,y1=z===9?zr.top+zr.height*.5:zr.top+zr.height*(Math.floor(z/3)+.5)/3;
    f.style.setProperty('--x0',(pr.left+pr.width*.45-sr.left)+'px');f.style.setProperty('--y0',(pr.top+pr.height*.42-sr.top)+'px');
    f.style.setProperty('--x1',(x1-sr.left)+'px');f.style.setProperty('--y1',(y1-sr.top)+'px');
    f.style.setProperty('--delay',Math.max(0,impactAt-360)+'ms');
  },[playToken,judged,inFx]);

  const byId=id=>hand.find(x=>x.id===id);
  const swingCards=hand.filter(x=>!isSkill(x.entry)),prepCards=hand.filter(x=>isSkill(x.entry));
  const mainEntry=selected&&selected!=='basic'?byId(selected)?.entry:null;
  const mainIsSkill=isSkill(mainEntry);
  const isBuntKind=k=>!!CARDS[k]?.bunt;
  const canStack=!!(mainEntry&&!mainIsSkill&&!isBuntKind(mainEntry.kind)&&b.growthMode!=='patience');
  const stack=canStack?swingStack.filter(x=>x.id!==selected&&byId(x.id)):[];
  const prepLeft=Math.max(0,v10PrepMax(s)-(b.preparations||0));
  const energy=v10Energy(s),energyCap=v10EnergyCap(s),actionCost=selected?choice?.cost??(selected==='basic'?0:cardCost(byId(selected)?.entry)):null;
  const takeDrawPreview=v10TakeDrawPreview(s),drawHint=takeDrawPreview.count===1?'카드+1':takeDrawPreview.reason==='full'?'6장 한도':'추가 0';
  const pendingEnergyText=s.phase==='between'?`다음 타자 4 · ${drawHint}`:`다음 공 4 · ${drawHint}`;
  const energyHud=<div className="bp-energy" data-testid="bp-energy" aria-label={`에너지 ${energy}/${energyCap}`}>
    <span>ENERGY</span><strong>{energy}<i>/{energyCap}</i></strong>
    <span className="bp-energy-leds" aria-hidden="true">{Array.from({length:energyCap},(_,i)=><i key={i} className={i<energy?'on':''}/>)}</span>
    <small>{s.phase==='battle'?(selected?`비용 ${actionCost} · 남음 ${Math.max(0,energy-(actionCost||0))}${actionCost>energy?` · 에너지 부족 ${actionCost-energy}`:''}`:s.last?.takeDrawn===1?'충전 · 카드 +1':`기본 0 · 지켜보기 0${energyCap===4?' · 보너스 공':''}`):s.battle?.takeEnergyBonus===1?pendingEnergyText:'다음 공에 3 충전'}</small>
  </div>;

  const probs=b.pending?publicProbabilities(s):b.intent?.probabilities||[];
  const live=b.intent?.repertoire||[0,1,2,3,4,5,6,7,8];
  const inZone=probs.slice(0,9).reduce((a,x)=>a+x,0)||1;
  /* 읽은 만큼만 숫자로 보인다(레거시 ZoneBoard와 같은 계약): 0등급 명암 낱말 → 1등급 구간 → 2등급 정확한 확률.
     원천은 같은 publicProbabilities이며, 낮은 등급에 틀린 숫자를 보여주지 않는다.
     (아래 `pct`보다 먼저 선언되므로 반올림을 직접 계산한다.) */
  const level=readLevel(s),known=knownPitchZones(s);
  /* 읽기 단계가 전투 중에 오르면(예: 투수 흔들림) 칸 표시가 바뀐 이유를 그 순간 보여 준다 */
  const sources=readSources(s);
  const readRef=useRef({level,keys:sources.map(x=>x.key),pitcher:s.pitcher?.name}),[readUp,setReadUp]=useState(null);
  useEffect(()=>{
    const prev=readRef.current,keys=sources.map(x=>x.key);
    readRef.current={level,keys,pitcher:s.pitcher?.name};
    if(prev.pitcher!==s.pitcher?.name||level<=prev.level)return;
    const cause=sources.find(x=>!prev.keys.includes(x.key));
    setReadUp({level,cause:cause?.label||null,n:Date.now()});
    const t=setTimeout(()=>setReadUp(null),2600);return()=>clearTimeout(t);
  },[level]);// eslint-disable-line react-hooks/exhaustive-deps
  const showUnused=(s.relics||[]).includes('radar'),exactBall=(s.relics||[]).includes('ledger');
  const exactPct=z=>Math.round((probs[z]||0)*100);
  const cellFace=z=>{
    const dead=!live.includes(z);
    if(!known.includes(z))return '단서 밖';
    if(known.length===1&&known.includes(z))return '확정';
    if(dead&&showUnused)return '안 씀';
    if(level===0)return shadeNameFor((probs[z]||0)/inZone);
    if(dead)return '0%';
    if(level===1)return rangeFor(probs[z]||0);
    return exactPct(z)+'%';
  };
  const bandFace=exactBall||level===2?exactPct(9)+'%':level===1?rangeFor(probs[9]||0):bandFor(probs[9]||0);
  const hitFaceFor=zones=>{
    const list=(zones||[]).filter(z=>z<9);
    if(!list.length)return '';
    if(level===2)return Math.round(list.reduce((a,z)=>a+(probs[z]||0),0)*100)+'%';
    const bounds=probabilityBounds(s);let lo=0,hi=0;
    for(const z of list){lo+=bounds[z][0];hi+=bounds[z][1];}
    // Public per-cell upper bounds can add past one across a broad stack.
    hi=Math.min(1,hi);
    if(hi<1e-9)return '범위 밖';
    if(lo>1-1e-9)return '확정';
    return Math.floor(lo*100+1e-9)+'–'+Math.ceil(hi*100-1e-9)+'%';
  };
  const cover=new Set(judged?r.primaryCoverage||r.coverage||[]:stack.length?choice?.primaryCoverage||[]:(!mainIsSkill&&selected?choice?.coverage||[]:[]));
  const support=new Set(judged?(r.supportCoverages||[]).flatMap(x=>x.coverage):stack.length?(choice?.supportCoverages||[]).flatMap(x=>x.coverage):[]);
  const aimAt=judged?(r.coverage?.length?r.aimZone:null):(selected&&!mainIsSkill?b.aimZone:null);
  const lines=intentLines(b.intent);
  const damage=judged&&landed?Math.max(0,pitcher?.lastDamage||0):0;
  /* 공이 닿기 전(pre)에는 결과를 미리 보여주지 않는다: HP·주자·카운트는 이 공을 던지기 전 값이다.
     오버킬이면 hp+피해가 원래 HP보다 커져 막대가 다시 차 보이므로 엔진이 적어 둔 hpBefore를 쓴다. */
  const pre=judged&&!landed;
  const hpWas=judged?Math.min(pitcher?.maxHp||0,Number.isInteger(s.v10?.lastCombat?.hpBefore)?s.v10.lastCombat.hpBefore:(pitcher?.hp||0)+(pitcher?.lastDamage||0)):pitcher?.hp;
  const ticks=hpTicks(pitcher?.hp,pitcher?.maxHp),ticksWere=judged?hpTicks(hpWas,pitcher?.maxHp):ticks;
  const shownBases=pre&&Array.isArray(r.basesBefore)?r.basesBefore:(b.bases||[]);
  const shownCount={balls:pre&&Number.isInteger(r.ballsBefore)?r.ballsBefore:b.balls,strikes:pre&&Number.isInteger(r.strikesBefore)?r.strikesBefore:b.strikes,outs:pre&&Number.isInteger(r.outsBefore)?r.outsBefore:b.outs};
  /* lit, lit until the ball lands, then dropping, then gone */
  const tickClass=i=>i<ticks?'':i<ticksWere?(landed?'drop':''):'lost';
  /* 멘탈 게이지: 실점으로 쌓이는 흔들림. 칸 수 = 막별 상한(1막 3 · 2막 2 · 3막 1). 공이 닿기 전엔 이전 값. */
  const mentalCap=v10MentalCap(s),combat=s.v10?.lastCombat;
  const shaken=judged&&!landed&&Number.isInteger(combat?.shakenBefore)?combat.shakenBefore:v10Shaken(s);
  const shakenRose=judged&&landed&&combat?.shakenAfter>combat?.shakenBefore;
  /* 기세: the batter's hot streak. Until the ball lands the gauge holds what this pitch was thrown into */
  const momentum=judged&&!landed&&Number.isInteger(combat?.momentumBefore)?combat.momentumBefore:v10Momentum(s);
  const momentumRose=judged&&landed&&combat?.momentumAfter>combat?.momentumBefore,momentumOut=judged&&landed&&combat?.momentumAfter<combat?.momentumBefore;
  /* 주자 압박: 지금 루상 주자로 안타를 치면 붙는 피해 배율 */
  const runners=shownBases.filter(Boolean).length,runnerPct=Math.round(runners*V10_RUNNER_PRESSURE*100);
  /* who moved on this pitch, once the ball has landed; the diamond pulses the bases that just filled */
  const basesBefore=judged&&landed?r.basesBefore:null;
  const moves=basesBefore?runnerMoves(basesBefore,b.bases||[],LINEUP[b.batterIndex]?.id,r.label,id=>LINEUP.find(p=>p.id===id)?.name):[];
  const baseNew=i=>!!basesBefore&&!!b.bases?.[i]&&b.bases[i]!==basesBefore[i];

  function pickSwing(id){
    if(locked)return;
    /* Inspector open: a hand tap only changes the inspected card. */
    if(inspect){
      if(id==='basic'){openInspect('card',{kind:'basic'});return;}
      const e=byId(id)?.entry;if(e)openInspect('card',{kind:e.kind,plus:e.plus,problem:byId(id)?.preview?.problem||null});return;
    }
    setArmed(null);
    if(selected===id){onSelect(null);onStack([]);return;}
    if(stack.some(x=>x.id===id)){onStack(stack.filter(x=>x.id!==id));return;}
    const kind=byId(id)?.entry?.kind;
    /* with a main card on the board, another swing card becomes a support: it waits for a zone */
    const nextStack=[...stack,{id,aimZone:b.aimZone}];
    if(canStack&&id!=='basic'&&!isBuntKind(kind)&&stack.length<v10StackMax(s)-1
      &&v10ActionCost(s,selected,nextStack)<=energy){setArmed(id);return;}
    onSelect(id);onStack([]);
  }
  function pickPrep(id){if(locked)return;
    if(inspect){const e=byId(id)?.entry;if(e)openInspect('card',{kind:e.kind,plus:e.plus,problem:byId(id)?.preview?.problem||null});return;}
    setArmed(null);onStack([]);onSelect(selected===id?null:id);}
  function pickZone(z){
    if(locked||commitBeat||inspect)return;
    if(armed){onStack([...stack,{id:armed,aimZone:z}]);setArmed(null);return;}
    onAim(z);
  }
  function commitSwing(){
    if(!deciding||!selected||choice?.problem||inspect)return;
    // Solo swings stay instant. A 2–4 card STACK gets a brief commitment beat so the player
    // can read the exact trade they authored before Pixi takes over the scene.
    if(mainIsSkill||!stack.length){onSwing?.();return;}
    const links=choice?.stackPlan?.links||[],coverage=choice?.coverage||[];
    const cards=[mainName,...stack.map(x=>CARDS[byId(x.id)?.entry?.kind]?.name||'지원')].filter(Boolean);
    const zones=[lessonZoneName(b.aimZone),...stack.map(x=>lessonZoneName(x.aimZone))];
    setArmed(null);
    setCommitBeat({
      cards,zones,coverage:coverage.length,
      hitChance:hitFaceFor(coverage),
      efficiency:Math.round((choice?.damageRate??1)*100),
      connect:links.filter(x=>x.connected).length,
      linkCount:links.length,
    });
    commitTimer.current=setTimeout(()=>{
      commitTimer.current=null;
      onSwing?.();
      setCommitBeat(null);
    },STACK_COMMIT_MS);
  }

  const mainName=selected==='basic'?'맨손 스윙':mainEntry?CARDS[mainEntry.kind].name:null;
  /* Frozen momentum: the pre-pitch value the throw was made into, never live. */
  const liveRate=choice?.damageRate!=null?choice.damageRate*v10MomentumRate(momentum):null;
  const rate=liveRate!=null?'피해 ×'+Number(liveRate).toFixed(2).replace(/0$/,''):'';
  const verb=mainIsSkill?'준비한다':'휘두른다';
  /* the verdict before the swing (BP-14): the share of pitches the chosen cells cover, then the HP multiplier */
  const hitCover=selected&&!mainIsSkill&&choice?.coverage?.length?choice.coverage.filter(z=>z<9):[];
  /* the planned swing names its running cost against what it can spend: the pitch's remaining
     energy pool in the MAIN RUN (V10), the fixed swing cap in V11 */
  const energyLimit=s?.version===11?V11_SWING_ENERGY:energy;
  const stackCost=selected&&!mainIsSkill
    ?(selected==='basic'?0:cardCost(byId(selected)?.entry))+stack.reduce((n,x)=>n+cardCost(byId(x.id)?.entry),0)
    :0;
  /* where the pitch is likely to go, as numbers: the share of every pitch (balls included), shown while deciding */
  const pct=z=>Math.round((probs[z]||0)*100);
  const topCell=live.reduce((a,z)=>(probs[z]||0)>(probs[a]||0)?z:a,live[0]);
  /* the lure warning: when a third of the pitches or more go to the ball band, the band says so */
  const lure=deciding&&pct(9)>=LURE_PCT;
  const tokens=judged?[r.coverage?.length?{z:r.aimZone,n:1}:null,...(r.supportZones||[]).map((z,i)=>({z,n:i+2}))].filter(Boolean)
    :[selected&&!mainIsSkill?{z:b.aimZone,n:1}:null,...stack.map((x,i)=>({z:x.aimZone,n:i+2}))].filter(Boolean);
  const call=judged?callOf(r,shot):'';
  /* a pitch in the ball band: say plainly what happened (players could not tell a chase from a miss) */
  const swung=!!r?.coverage?.length,outside=judged&&r.zone===9;
  const outNote=outside?(swung?'볼에 손이 나갔다':'볼을 골라냈다'):'';
  /* the first time a player swings at a ball, say once what a ball is (playtest: "유인구고 뭐고 못 알아보겠음") */
  const [chaseHint,setChaseHint]=useState(()=>{try{return localStorage.getItem('9zone-hint-chase')!=='done';}catch{return true;}});
  const [hintAt,setHintAt]=useState(null);
  const chased=!deciding&&outNote==='볼에 손이 나갔다'&&landed;
  const firstChase=chased&&(chaseHint||hintAt===playToken);
  /* the lens pivots on the bat's contact point; every .bp-cam layer gets its own offset so they zoom as one */
  const cam=inFx&&shot?CAMERA[shot.grade]||null:null;
  useLayoutEffect(()=>{
    const scene=sceneRef.current;if(!cam||!scene)return;
    const bat=scene.querySelector('.bp-batter');if(!bat)return;
    scene.style.setProperty('--cam-x',Math.round(bat.offsetLeft+bat.offsetWidth*.58)+'px');
    scene.style.setProperty('--cam-y',Math.round(bat.offsetTop+bat.offsetHeight*.52)+'px');
    for(const el of scene.querySelectorAll('.bp-cam')){el.style.setProperty('--ox',el.offsetLeft+'px');el.style.setProperty('--oy',el.offsetTop+'px');}
  },[cam,playToken]);
  useLayoutEffect(()=>{if(chased&&chaseHint){setHintAt(playToken);setChaseHint(false);try{localStorage.setItem('9zone-hint-chase','done');}catch{}}},[chased,chaseHint,playToken]);
  /* First-chase guidance now lives in the plan summary input line, not a coach row. */
  const firstChaseGuide=firstChase?'볼은 참으면 볼넷이 된다. 바깥 띠로 올 것 같으면 지켜본다.':'';
  const good=judged&&(r.kind==='hit'||r.kind==='sacrifice'||call==='볼넷');
  /* the pitcher's one-liner: once when she takes the mound, then after each pitch that lands */
  const moment=showVerdict&&judged&&landed?momentOf({call,chased:outNote==='볼에 손이 나갔다',knockedOut:(pitcher?.hp??1)===0})
    :deciding&&!(b.history?.length)&&b.turn===1?'entry':null;
  const voice=moment?pitcherLine(artId,moment,playToken):'';

  /* Experimental lesson: keep the real battle, but explicitly separate the Slay-the-Spire
     decision from the autobattler payoff. The player plans; once the verb is pressed,
     their inputs are done and Pixi gets the stage until the result is readable. */
  const lessonPhase=deciding?'plan':inFx?'watch':judged?'review':'plan';
  const lessonCombat=s.v10?.lastCombat||null;
  const currentPlanCards=selected?[mainName,...stack.map(x=>CARDS[byId(x.id)?.entry?.kind]?.name||'지원')].filter(Boolean):[];
  const currentPlanZones=selected&&!mainIsSkill?[lessonZoneName(b.aimZone),...stack.map(x=>lessonZoneName(x.aimZone))]:[];
  const lessonCards=lessonPhase==='plan'?currentPlanCards:(autoPlan?.cards||[]);
  const lessonZones=lessonPhase==='plan'?currentPlanZones:(autoPlan?.zones||[]);
  const watchBeat={windup:'투수가 시작한다',impact:'빌드가 부딪힌다',slowmo:'판정 순간',release:'결과가 전개된다',settle:'마무리'}[fxStage]||'자동 실행 중';
  const reviewText=lessonCombat
    ?(lessonCombat.verdict||call||'판정')+' · 실제 '+(lessonCombat.pitchLabel||'코스')+' · 투수 HP -'+(lessonCombat.damage||0)
    :(call||shot?.title||'결과를 확인한다');
  const showDebrief=!autoLesson&&judged&&landed&&!inFx&&s.phase!=='battle'&&!!lessonCombat;
  const debriefActual=showDebrief?(lessonCombat.pitchLabel||lessonZoneName(r?.zone)):'';
  const debriefDamage=showDebrief&&lessonCombat.damage>0?'투수 HP -'+lessonCombat.damage+(lessonCombat.momentumBefore>0?' · 기세 ×'+v10MomentumRate(lessonCombat.momentumBefore).toFixed(1):''):'';

  const cardButton=x=>{
    const def=CARDS[x.entry.kind]||{},problem=deciding?x.preview?.problem:null,inStack=stack.findIndex(y=>y.id===x.id);
    const state=selected===x.id?' main':inStack>=0?' support':armed===x.id?' armed':'';
    const isRare=x.entry.plus||def.type==='signature';
    const isSkillCard=def.type==='skill';
    const cardKindClass=(isRare?' signature':'')+(isSkillCard?' skill':'');
    const artPos=CARD_ART_POS[x.entry.kind]||'0% 0%';
    const customArt=cardArtFor(x.entry.kind);
    const focus=customArt?cardArtFocusFor(x.entry.kind):null;
    const artStyle=customArt
      ?{backgroundImage:`url(${customArt})`,backgroundPosition:focus?.objectPosition||'center 25%',backgroundSize:'cover'}
      :{backgroundImage:`url(${cardArtSheet})`,backgroundPosition:artPos};
    const cost=cardCost(x.entry);
    /* A support candidate that would overflow tells so on its face, shortly:
       exact sums belong to the plan summary after a real tap, and a tap that
       would replace the main must never read as a support join. */
    const supportCandidate=canStack&&selected&&!mainIsSkill&&selected!==x.id&&inStack<0&&!isBuntKind(x.entry.kind);
    const overBudget=supportCandidate&&stackCost+cost>energyLimit;
    const roleTag=def.role||(isSkillCard?'집중':'정확');
    const face=cardFaceOf(x.entry,{strikes:shownCount.strikes});
    const warning=shortCardProblem(problem)||(overBudget?'지원 비용 초과':'');
    /* Condition and current risk are separate slots: a cost warning must never
       hide the bunt 2S foul-strikeout (or any requires/cost) condition. */
    const condition=face.condition;
    const note=warning||condition;

    return <button key={x.id} type="button" className={'bp-card'+state+(problem?' off':'')+cardKindClass+(note?' has-note':'')+(condition&&warning?' has-both':'')} aria-pressed={selected===x.id||inStack>=0}
      aria-label={[def.name+(x.entry.plus?'+':''),'코스트 '+cost,face.axis,face.summary,condition,warning,problem].filter(Boolean).join(' · ')}
      data-card-kind={x.entry.kind} data-card-plus={x.entry.plus?1:0} data-card-problem={problem||undefined} disabled={!deciding} onClick={()=>pickSwing(x.id)}>
      <span className="bp-card-cost" aria-label={`코스트 ${cost}`}>{cost}</span>
      <div className="bp-card-art-box">
        <div className="bp-card-art" style={artStyle}/>
        <div className="bp-card-mini-map"><CardGlyph zones={x.preview?.coverage}/></div>
      </div>
      <div className="bp-card-header">
        <strong>{def.name||x.entry.kind}{x.entry.plus&&<sup>+</sup>}</strong>
        <div className="bp-card-chips">
          {isSkillCard&&<span className="bp-chip type">준비</span>}
          <span className={"bp-chip role r-"+(ROLE_TONE[roleTag]||"plain")}><span className="bp-role-mark" aria-hidden="true">{ROLE_MARKS[roleTag]}</span>{roleTag}</span>
        </div>
      </div>
      <div className={'bp-card-desc'+(overBudget?' over':'')}>
        <p>{face.summary}</p>
        {condition&&<p className="bp-card-condition">{condition}</p>}
        {warning&&<p className="bp-card-warning">{warning}</p>}
      </div>
      {selected===x.id&&<b className="bp-order">1</b>}{inStack>=0&&<b className="bp-order">{inStack+2}</b>}
    </button>;
  };

  /* 엘리트·보스 시각 효과: CSS가 data 속성만 읽는다(.bp-scene[data-gimmick]). 단계는 투수 HP 단계. */
  const gm=s.v10?.opponent?.gimmick,gtier=gm?(s.v10?.opponent?.rewardTier===3?'boss':'elite'):null;
  /* Collapsed gimmick keeps the currently-applying public numbers (gimmick.js),
     never a new rule. Counts come from the frozen view (shownCount): trick
     follows engine.js `strikes===0&&balls===0 ? trickRate : trickLate`, and
     pressure follows the live count (0S applies nothing yet). Full rules live
     in the inspector; the battle keeps no <details>. */
  const gimmickShort=(id,phase)=>{
    const {strikes=0,balls=0}=shownCount;
    const prep=phase==='steady'?'':' · 준비 1회';
    switch(id){
      case 'pressure':{
        const cur=strikes>=2?'코스 +3 · 볼 감소':strikes===1?'코스 +1':'이번 카운트 적용 없음';
        return cur+prep;
      }
      case 'trick':{
        const cur=(strikes===0&&balls===0)?'옆 칸 이동 60%':'옆 칸 이동 25%';
        return cur+(phase==='steady'?'':' · 겹치기 3장');
      }
      case 'bluff':return phase==='steady'?'존밖 볼 +35%p':'존밖 볼 +45%p · 준비 1회';
      case 'tyrant':return (phase==='critical'?'낮은 3코스 +20%p':'낮은 3코스 +10%p')+(phase==='steady'?'':' · 준비 1회');
      case 'halo':return '홈런외 장타→단타'+(phase==='steady'?'':phase==='critical'?' · 겹치기 3장 · 볼 +10%p':' · 겹치기 3장');
      case 'eclipse':return '직전 노림 반대열 공략'+(phase==='steady'?'':phase==='critical'?' · 반대열 강화 · 준비 1회':' · 반대열 강화');
      default:return '';
    }
  };
  const rawPhase=pre?pitcherPhase(hpWas,pitcher?.maxHp||1):(pitcher?.phase||'steady');
  const shownGimmickPhase=rawPhase==='defeated'?'critical':rawPhase;
  /* Fixed plan summary — energy/cost, prediction, input stay in separate
     fields. Hover/focus never feed it; only the plan does. */
  const planSummary=(()=>{
    if(!deciding){
      if(firstChase)return {input:firstChaseGuide};
      if(commitBeat||locked)return {input:'투구 중…'};
      return {input:''};
    }
    if(!selected)return {input:'카드와 코스를 고르세요'};
    if(mainIsSkill){
      const problem=byId(selected)?.preview?.problem;
      return {
        predict:cardFaceOf(mainEntry,{strikes:shownCount.strikes}).summary,
        input:problem?shortCardProblem(problem)||problem:(prepLeft>0?`준비 ${prepLeft}회 남음 · 실행하세요`:'준비 횟수 소진'),
      };
    }
    if(armed){
      const aCost=cardCost(byId(armed)?.entry),sum=stackCost+aCost;
      return {
        predict:`지원 ${stack.length}/${v10StackMax(s)-1} · 합계 ${sum}/${energyLimit}`,
        input:'지원할 코스 선택',
      };
    }
    const predict=[hitCover.length?`적중권 ${hitFaceFor(hitCover)}`:'',rate,runners?`주자 +${runnerPct}%`:'',`합계 ${stackCost}/${energyLimit}`].filter(Boolean).join(' · ');
    if(choice?.problem)return {predict,input:choice.problem};
    return {predict,input:!hitCover.length?'코스를 고르세요':stack.length?`지원 ${stack.length}/${v10StackMax(s)-1} · 실행하거나 더 얹으세요`:'실행하세요'};
  })();
  const deckById=id=>s.deck.find(c=>c.id===id);
  const pileGroups=ids=>{const m=new Map();for(const id of ids||[]){const k=deckById(id)?.kind;if(!k)continue;const nm=CARDS[k]?.name||k;m.set(nm,(m.get(nm)||0)+1);}return [...m.entries()].sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'ko'));};
  const piles=[{key:'draw',title:'남은 더미',n:b.draw?.length??0,groups:pileGroups(b.draw)},{key:'discard',title:'버림 더미',n:b.discard?.length??0,groups:pileGroups(b.discard)}];
  const shownModel={count:shownCount,bases:shownBases,momentum,momentumRate:v10MomentumRate(momentum),shaken,mentalCap,
    hp:pre?hpWas:pitcher?.hp,maxHp:pitcher?.maxHp,phase:shownGimmickPhase,tendency:lines.whisper,tendencyDetail:lines.coach};
  return <main ref={rootRef} className={'bp-battle bp-readable'+(autoLesson?' auto-lesson':'')+(commitBeat?' committing':'')+(deciding?'':' resolving')+(inFx?' fx-'+fxStage:'')+(inspect?' inspecting':'')} aria-label="타석">
    <div className="bp-bar">
      <b className="bp-hud-inning">{label}</b>
      <div className="bp-bso-strip" aria-label={`볼 ${shownCount.balls} 스트라이크 ${shownCount.strikes} 아웃 ${shownCount.outs}`}>
        <div className="bp-bso-unit b"><b className="bp-bso-name">B</b><span className="bp-bso-leds">{Array.from({length:3},(_,i)=><i key={i} className={i<shownCount.balls?'on':''}/>)}</span></div>
        <div className="bp-bso-unit s"><b className="bp-bso-name">S</b><span className="bp-bso-leds">{Array.from({length:2},(_,i)=><i key={i} className={i<shownCount.strikes?'on':''}/>)}</span></div>
        <div className="bp-bso-unit o"><b className="bp-bso-name">O</b><span className="bp-bso-leds">{Array.from({length:2},(_,i)=><i key={i} className={i<shownCount.outs?'on':''}/>)}</span></div>
      </div>
      <span className="bp-piles">
        <button type="button" className="bp-pile-btn" disabled={!deciding} onClick={()=>openInspect('pile',{pile:'both'})} aria-label={`패 더미 보기 · 더미 ${b.draw?.length??0} 버림 ${b.discard?.length??0}`}>더미 {b.draw?.length??0} / 버림 {b.discard?.length??0}</button>
        <button type="button" className="bp-pile-btn bp-settings-btn" aria-label="설정 및 도움말" onClick={onSettings||onHelp}>⚙</button>
      </span>
    </div>

    <div className="bp-stage" ref={stageRef}>
    <section className={'bp-scene'+(pixi?.batter?' pixi-batter':'')+(pixi?.pitcher?' pixi-pitcher':'')+(inFx?' fx-stage-'+fxStage+(shot?' fx-'+(shot.grade||shot.kind):''):'')+(cam?' cam-'+cam:'')} ref={sceneRef} aria-label="승부 구장" data-gimmick={gm?.id} data-gtier={gtier} data-gphase={gm?(pre?shownGimmickPhase:(pitcher?.phase||'steady')):undefined}>
      <div className="bp-bg bp-cam" aria-hidden="true"/>
      <div className="bp-haze" aria-hidden="true"/>
      {autoLesson&&<aside className={'bp-auto-lesson '+lessonPhase} data-testid="bp-auto-lesson" aria-live="polite">
        <header>
          <span>BUILD → BATTLE</span>
          <button type="button" onClick={onExitLesson}>체험 종료</button>
        </header>
        <ol aria-label="전략 자동전투 흐름">
          <li className={lessonPhase==='plan'?'on':''}><b>1</b><span>설계</span></li>
          <li className={lessonPhase==='watch'?'on':''}><b>2</b><span>자동 실행</span></li>
          <li className={lessonPhase==='review'?'on':''}><b>3</b><span>복기</span></li>
        </ol>
        {lessonPhase==='plan'&&<div className="bp-auto-copy">
          <strong>{selected?'이 빌드를 확정한다':'먼저 빌드를 만든다'}</strong>
          <small>{selected?'버튼을 누른 뒤에는 손을 떼고 결과를 본다.':'카드와 존을 고른다. 지원 카드를 얹으면 한 번의 스윙이 길어진다.'}</small>
        </div>}
        {lessonPhase==='watch'&&<div className="bp-auto-copy watch">
          <strong>AUTO RESOLVE · {watchBeat}</strong>
          <small>지금은 조작하지 않는다. 방금 만든 빌드가 투수와 싸우는 장면을 본다.</small>
        </div>}
        {lessonPhase==='review'&&<div className="bp-auto-copy review">
          <strong>{reviewText}</strong>
          <small>{lessonCombat?.connectCount?'CONNECT '+lessonCombat.connectCount+' · 연결 보너스가 실제 피해에 반영됐다.':autoPlan?.kind==='take'?(lessonCombat?.takeEnergyBonus===1?'다음 공 에너지 +1을 예약했다. '+(lessonCombat.takeDrawBonus===1?'카드도 한 장 더 뽑는다.':lessonCombat.takeDrawReason==='full'?'손패가 6장 한도라 추가 카드는 없다.':lessonCombat.takeDrawReason==='empty'?'기본 드로우 뒤 추가 카드는 없다.':'다음 공에서 보너스를 사용한다.'):'지켜보기 결과를 확인하고 다음 선택으로 이어간다.'):'노린 코스와 실제 공을 비교하고 다음 설계를 바꾼다.'}</small>
        </div>}
        {!!lessonCards.length&&<div className="bp-auto-plan" aria-label="현재 빌드">
          {lessonCards.map((name,i)=><span key={i}><b>{i+1}</b>{name}{lessonZones[i]?<em>{lessonZones[i]}</em>:null}</span>)}
          {autoPlan?.coverage>0&&lessonPhase!=='plan'&&<i>{autoPlan.coverage}존 커버</i>}
        </div>}
      </aside>}
      {canPixi&&<BallparkActors sceneRef={sceneRef} pitcherAtlas={pitcherAtlas} artId={artId} batterPoses={batterPoses} batterSheet={batterSheet} batterRig={batterRig} pitchZone={judged?r.zone:null} shot={shot} fxStage={fxStage} playToken={playToken} knockedOut={judged&&((pre?hpWas:pitcher?.hp)??1)===0} onReady={setPixi}/>}
      <div className="bp-pitcher bp-cam" ref={pitcherRef} aria-hidden="true" style={{'--stance-x':pitcherStance(artId)[0],'--stance-y':pitcherStance(artId)[1]}}>{pitcherArt}{gm&&<GimmickVfx id={gm.id} tier={gtier} phase={pre?shownGimmickPhase:(pitcher?.phase||'steady')}/>}</div>
      <div className="bp-pcol">
      <div className="bp-ptag" aria-label={`${pitcher?.name} 투수 HP ${pre?hpWas:pitcher?.hp} / ${pitcher?.maxHp}`}>
        <div className="bp-pitcher-badge-row">
          <span className="bp-pitcher-flame" aria-hidden="true">🔥</span>
          <span className="bp-pitcher-title-name"><b className="bp-pname">{pitcher?.name||'투수'}</b></span>
          <button type="button" className="bp-inspect-open" data-testid="bp-inspect-open" aria-label="투수 정보 보기" aria-expanded={!!inspect} onClick={()=>openInspect('pitcher')}>정보 ▾</button>
        </div>
        <div className="bp-hp-gauge-container">
          <div className="bp-hp-gauge-bar" style={{'--hp-pct': `${Math.max(0, Math.min(100, Math.round(((pre?hpWas:pitcher?.hp)||0)/(pitcher?.maxHp||1)*100)))}%`}} />
          <span className="bp-ticks" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} className={tickClass(i)}/>)}</span>
        </div>
        {gm&&<div className="bp-gimmick" data-testid="bp-gimmick"><i className="bp-gtier">{gtier==='boss'?'BOSS':'ELITE'}</i> <b>{gm.label}</b>
          <span className="bp-gimmick-current">{gimmickShort(gm.id,shownGimmickPhase)||gm.summary}</span>
        </div>}
        {damage>0&&<b className="bp-damage" key={'d'+playToken}>-{damage}</b>}
        <small aria-hidden="true">HP {pre?hpWas:pitcher?.hp} / {pitcher?.maxHp}</small>
        {shaken>0&&<span className={'bp-mental shaken'+(shaken>=mentalCap?' max':'')+(shakenRose?' rose':'')} data-testid="bp-mental"
          data-shaken={shaken} data-cap={mentalCap} key={'m'+shaken} aria-label={`투수 흔들림 ${shaken} / ${mentalCap} · 볼 증가 · 읽기 +1`}>
          <em>흔들림</em><span aria-hidden="true">{Array.from({length:mentalCap},(_,i)=><i key={i} className={i<shaken?'on':''}/>)}</span>
          <><b className="bp-mental-value">{shaken}/{mentalCap}</b><small className="bp-mental-effect">볼 증가 · 읽기 +1</small></>
        </span>}
      </div>
      {voice&&<q className={'bp-voice m-'+moment} key={'q'+playToken+moment} data-testid="bp-voice">{voice}</q>}
      </div>
      {showVerdict&&(()=>{
        const isHomerSplash=Boolean(shot?.grade==='homer'||shot?.grade==='grand-slam'||(call&&call.includes('홈런')));
        const isKoSplash=Boolean(judged&&(pitcher?.hp??1)===0);
        const isSplash=isHomerSplash||isKoSplash;
        return <div className={'bp-verdict'+(good?' good':'')+(isSplash?' splash':'')+(isHomerSplash?' homer':'')+(isKoSplash?' knockout':'')} key={'v'+playToken+(shot.title||'')} role="status">
          {isKoSplash?<KnockoutCut artId={artId} figure={pitcherFigures[artId]}/>:isHomerSplash&&<HomeRunCut/>}
          <strong>{call||shot.title}</strong>
          {/* with runner moves to show, the flavour line gives its room to them (the plate must clear the HP panel) */}
          {/* a pitch that is not a hit can still cost the pitcher HP (near miss, foul, ball): say so on the
              plate, from the engine's own number, so "헛스윙" next to a falling HP bar does not read as a bug */}
          {(()=>{const flavour=outNote||(!moves.length&&call&&shot.title&&shot.title!==call?shot.title:'');
            const hpNote=!good&&!moves.length&&judged&&landed&&combat?.damage>0?'투수 HP -'+combat.damage:'';
            const line=[flavour,hpNote].filter(Boolean).join(' · ');
            return line?<small>{line}</small>:null;})()}
          {!!moves.length&&<ul className="bp-moves" data-testid="bp-moves">{moves.map((m,i)=><li key={i}>{m}</li>)}</ul>}
        </div>;
      })()}
      {inFx&&vfx}
      {inFx&&shot&&judged&&<ImpactFx key={'ifx'+playToken} sceneRef={sceneRef} stage={fxStage} grade={shot.grade||shot.kind} zone={r?.zone} token={playToken}/>}
      {inFx&&<i className="bp-flash" key={'x'+playToken+fxStage} aria-hidden="true"/>}
      {fxStage==='slowmo'&&shot?.motion?.slowmo>0&&<span className="bp-slowmo" aria-hidden="true">{shot.grade==='near-miss'||shot.grade==='near-miss-k'?'ONE ZONE':shot.grade==='homer'||shot.grade==='grand-slam'?'TIME STOPS':'SLOW'}</span>}
      {cam==='near'&&fxStage==='slowmo'&&<i className="bp-letterbox" key={'lb'+playToken} aria-hidden="true"/>}
      {judged&&inFx&&!landed&&!pixi?.pitcher&&<i className="bp-flight" ref={flightRef} key={'f'+playToken} aria-hidden="true"/>}
      <div className="bp-batter bp-cam" aria-hidden="true">{batterArt}</div>
      {/* 기세: active values live by the batter; at 0 there is no instrument —
         the value and its cause live in the inspector. Until the ball lands
         the gauge holds what this pitch was thrown into. */}
      {momentum>0&&<div className={'bp-momentum lit'+(momentum>=V10_MOMENTUM.max?' max':'')+(momentumRose?' rose':'')+(momentumOut?' out':'')} data-testid="bp-momentum" data-momentum={momentum}
        key={'mo'+momentum+(momentumOut?'x':'')} role="status" aria-label={`기세 ${momentum} / ${V10_MOMENTUM.max} · 피해 ×${v10MomentumRate(momentum).toFixed(1)}`}>
        <em>기세</em>
        <span className="bp-momentum-pips" aria-hidden="true">{Array.from({length:V10_MOMENTUM.max},(_,i)=><i key={i} className={i<momentum?'on':''}/>)}</span>
        <b>×{v10MomentumRate(momentum).toFixed(1)}</b>
        {momentumRose&&<small className="bp-momentum-pop" aria-hidden="true">+{combat.momentumAfter-combat.momentumBefore}</small>}
      </div>}

      <div className={'bp-zone'+(cover.size?' has-cover':'')} ref={zoneRef} role="group" aria-label="노릴 코스">
        {ZONE_WORDS.map((word,z)=>{
          const share=(probs[z]||0)/inZone,dead=!live.includes(z),tok=tokens.filter(t=>t.z===z);
          const actual=judged&&landed&&r.zone===z;
          return <button key={z} type="button" disabled={!deciding} onClick={()=>pickZone(z)}
            aria-label={word+(dead?' · 던지지 않는 코스':'')+(b.aimZone===z?' · 노림':'')} aria-pressed={b.aimZone===z}
            className={'bp-cell'+(dead?' dead':'')+(cover.has(z)?' cover':'')+(support.has(z)?' assist':'')+(aimAt===z?' aim':'')+(armed?' target':'')+(actual?' actual'+(good?' good':''):'')}
            style={{'--heat':dead?0:Math.min(1,share*3).toFixed(2)}}>
            {dead&&!cover.has(z)&&<small className="bp-dead">안 던짐</small>}{!dead&&deciding&&<span className={'bp-pct'+(z===topCell?' top':'')+(pct(z)===0?' zero':'')}>{cellFace(z)}</span>}{tok.map(t=><b key={t.n} className="bp-token" data-board-order={t.n}>{t.n}</b>)}{actual&&<i className="bp-pitch-mark" aria-label="실제 공"/>}
          </button>;
        })}
        {/* CONNECT: the order links the engine scored, solid = connected (+HP back), dashed = broken */}
        <ZoneLinks links={judged?r.stackLinks:stack.length?choice?.stackPlan?.links:null}/>
        <span className="bp-side l">몸쪽</span><span className="bp-side r">바깥쪽</span>
        {deciding&&<span className={'bp-read lv'+level} data-testid="bp-read" aria-label={'읽기 '+level+'/2'+(sources.length?' · '+sources.map(x=>x.label).join(' · '):'')}>
          <em>읽기</em><span aria-hidden="true">{[0,1].map(i=><i key={i} className={i<level?'on':''}/>)}</span>{sources.some(x=>x.key==='shaken')&&<b>흔들림</b>}
        </span>}
        {readUp&&<div className="bp-read-up" key={readUp.n} role="status" data-testid="bp-read-up">
          <strong>투수가 읽힌다</strong>
          <small>{readUp.cause?readUp.cause+' → ':''}{readUp.level===2?'정확한 확률 공개':'확률 구간 공개'}</small>
        </div>}
        {/* the ball band: the ring around the nine cells is where balls go. Swing at one = a whiff,
            watch one = a ball. It is drawn so the out-of-zone pitch has a place players can see. */}
        <span className={'bp-band'+(outside&&landed?' hit':'')+(lure?' lure':'')} data-testid="bp-band" aria-hidden="true"><em>{lure?'유인구 주의 · 볼 '+bandFace:'바깥 띠 = 볼'+(deciding?' '+bandFace:'')}</em></span>
        {judged&&landed&&outside&&<i className="bp-pitch-mark outside" aria-label="실제 공 · 볼"/>}
      </div>

      <div className="bp-bases" aria-label={'주자 '+[0,1,2].filter(i=>shownBases[i]).map(i=>i+1+'루').join(', ')||'주자 없음'}>
        {[1,2,0].map(i=><i key={i} className={'base-'+(i+1)+(shownBases[i]?' on':'')+(baseNew(i)?' new':'')}/>)}
      </div>
    </section>
    {inspect&&<BattleInspector tab={inspectTab} setTab={setInspectTab} pileKind={inspect.pile}
      inspectCard={inspect.kind?{kind:inspect.kind,plus:inspect.plus}:null} inspectProblem={inspect.problem}
      s={s} shown={shownModel} pitcher={pitcher} label={label}
      read={{level,sources}} lastCombat={lessonCombat} r={r} piles={piles} onClose={()=>closeInspect()}/>}
    </div>

    {showDebrief?<div className="bp-result" data-testid="bp-result" aria-label="이번 공 결과">
      <strong>{call||lessonCombat.verdict||'판정'}</strong>
      <small>{[debriefActual,debriefDamage||lessonCombat.verdict].filter(Boolean).join(' · ')}</small>
      {!!moves.length&&<small>주자 이동 {moves.length}</small>}
      <button type="button" className="bp-review-open" data-testid="bp-review-open" onClick={()=>openInspect('pitch')}>이번 공 복기</button>
    </div>:<div className="bp-hand" aria-label="손패">
      <button type="button" className={'bp-card basic'+(selected==='basic'?' main':'')} data-card-kind="basic" aria-pressed={selected==='basic'} disabled={!deciding} onClick={()=>pickSwing('basic')}>
        <span className="bp-card-cost" aria-label="코스트 0">0</span>
        <div className="bp-card-art-box">
          <div className="bp-card-art" style={{backgroundImage:`url(${cardArtSheet})`,backgroundPosition:'100% 100%'}}/>
          <div className="bp-card-mini-map"><CardGlyph zones={[b.aimZone]}/></div>
        </div>
        <div className="bp-card-header">
          <strong>맨손 스윙</strong>
          <div className="bp-card-chips">
            <span className="bp-chip type">기본</span>
            <span className="bp-chip role"><span className="bp-role-mark" aria-hidden="true">·</span>단타</span>
          </div>
        </div>
        <div className="bp-card-desc">
          <p>카드 소모 없음</p>
        </div>
        {selected==='basic'&&<b className="bp-order">1</b>}
      </button>
      {swingCards.map(cardButton)}
      {prepCards.map(x=>{
        const def=CARDS[x.entry.kind]||{},problem=x.preview?.problem;
        const customArt=cardArtFor(x.entry.kind);
        const focus=customArt?cardArtFocusFor(x.entry.kind):null;
        const artStyle=customArt
          ?{backgroundImage:`url(${customArt})`,backgroundPosition:focus?.objectPosition||'center 25%',backgroundSize:'cover'}
          :{backgroundImage:`url(${cardArtSheet})`,backgroundPosition:'0% 0%'};
        const roleTag=def.role||'준비';
        const face=cardFaceOf(x.entry,{strikes:shownCount.strikes});
        const warning=shortCardProblem(problem)||(!prepLeft?'준비 횟수 소진':'');
        const condition=face.condition;
        const note=warning||condition;
        const isOff=Boolean(problem||!prepLeft);

        return <button key={x.id} type="button"
          className={'bp-card skill prep-card bp-token-card'+(selected===x.id?' main':'')+(isOff?' off':'')+(note?' has-note':'')+(condition&&warning?' has-both':'')}
          aria-pressed={selected===x.id}
          aria-label={[def.name+(x.entry.plus?'+':''),'코스트 '+cardCost(x.entry),'준비 '+prepLeft+'회 남음',face.summary,condition,warning,problem].filter(Boolean).join(' · ')}
          data-card-kind={x.entry.kind} data-card-plus={x.entry.plus?1:0} data-card-problem={problem||undefined}
          disabled={!deciding}
          onClick={()=>pickPrep(x.id)}>
          <span className="bp-card-cost prep" aria-label={`에너지 코스트 ${cardCost(x.entry)} · 준비 ${prepLeft}회 남음`}>{cardCost(x.entry)}</span>
          <div className="bp-card-art-box">
            <div className="bp-card-art" style={artStyle}/>
            <div className="bp-card-mini-map prep-badge">
              <span className="bp-prep-glyph" aria-hidden="true">✦</span>
            </div>
          </div>
          <div className="bp-card-header">
            <strong>{def.name||x.entry.kind}{x.entry.plus&&<sup>+</sup>}</strong>
            <div className="bp-card-chips">
              <span className="bp-chip type prep">준비</span>
              <span className={"bp-chip role r-"+(ROLE_TONE[roleTag]||"plain")}><span className="bp-role-mark" aria-hidden="true">{ROLE_MARKS[roleTag]}</span>{roleTag}</span>
            </div>
          </div>
          <div className="bp-card-desc">
            <p>{face.summary}</p>
            {condition&&<p className="bp-card-condition">{condition}</p>}
            {warning&&<p className="bp-card-warning">{warning}</p>}
          </div>
          {selected===x.id&&<b className="bp-order prep">준비</b>}
        </button>;
      })}
    </div>}

    <div className="bp-plan" data-testid="bp-plan" aria-label="현재 플랜 요약">
      {s.version===10&&energyHud}
      <div className="bp-plan-fields">
        {planSummary.predict&&<span className="bp-plan-predict">{planSummary.predict}</span>}
        {planSummary.input
          ?<span className="bp-plan-input">{planSummary.input}</span>
          :<span className="bp-plan-input" aria-hidden="true"> </span>}
      </div>
    </div>
    {onNext&&!deciding&&s.phase!=='battle'?<div className="bp-verbs next">
      {s.version===10&&null}
      {/* #103 M04: the hint names the same step as the verb (it said "next pitch" under "next batter") */}
      <button type="button" className="bp-verb go" data-testid="bp-next" disabled={inFx||locked||!!inspect} onClick={()=>{if(!inspect)onNext?.();}}><span className="bp-verb-word">{nextLabel}</span>{nextHint(s.phase,inFx||locked)&&<small className="bp-verb-sub"><span>{nextHint(s.phase,inFx||locked)}</span></small>}</button>
    </div>:<div className="bp-verbs">
      <button type="button" className="bp-verb go" data-testid="bp-swing" disabled={!deciding||!selected||!!choice?.problem||!!inspect} onClick={commitSwing} aria-busy={!!commitBeat}>
        <span className="bp-verb-word">{verb}</span>{commitBeat&&<small className="bp-verb-sub"><span>진행 중…</span></small>}
      </button>
      <button type="button" className="bp-verb wait" data-testid="bp-take" disabled={!deciding||!!inspect} onClick={()=>{if(!inspect)onTake?.();}}><span className="bp-verb-word">지켜본다</span>{s.version===10&&<small>{b.strikes===2?'볼 +1 · 삼진 0':'다음 공 +1'}</small>}</button>
      {mainEntry&&deciding&&<button type="button" className="bp-info" aria-label={mainName+' 카드 검사'} onClick={()=>openInspect('card',{kind:mainEntry.kind,plus:mainEntry.plus,problem:byId(selected)?.preview?.problem||null})}>ⓘ</button>}
    </div>}
    {coachOn&&<BallparkCoach rootRef={rootRef} onDone={()=>setCoachOn(false)}/>}
  </main>;
}
