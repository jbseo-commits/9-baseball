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
import {HomeRunCut,KnockoutCut} from './phone-art-v18.jsx';
import {pitcherFigures,pitcherPortraits} from './pitcher-visuals.js';
import './ballpark.css';
import './momentum.css';
import BallparkCoach,{coachSeen} from './BallparkCoach.jsx';

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
  onSelect,onAim,onStack,onSwing,onTake,onDetail,onPile,onHome,onHelp,onToggleSound,sound=false,onJukebox=null,
  autoLesson=false,autoPlan=null,onExitLesson=null,previewMode=false,
}){
  const b=s.battle||{},rootRef=useRef(null),sceneRef=useRef(null),pitcherRef=useRef(null),zoneRef=useRef(null),flightRef=useRef(null);
  const [armed,setArmed]=useState(null),[commitBeat,setCommitBeat]=useState(null),commitTimer=useRef(null);
  const r=b.revealed,inFx=!!fxStage,deciding=s.phase==='battle'&&!inFx&&!locked&&!commitBeat;
  const judged=!!r&&s.last?.kind!=='skill'&&(inFx||s.phase!=='battle');
  const landed=!inFx||LANDED.has(fxStage);
  const showVerdict=!!shot&&(inFx||s.phase!=='battle')&&(landed||!judged);
  /* which actors Pixi has taken over (null = DOM actors only) */
  const [pixi,setPixi]=useState(null);
  const [canPixi]=useState(()=>!!batterPoses&&pixiAvailable());
  /* first-battle coach marks: once per player, on the run's very first decision */
  const [coachOn,setCoachOn]=useState(()=>!coachSeen());
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
  const canStack=!!(mainEntry&&!mainIsSkill&&mainEntry.kind!=='bunt'&&b.growthMode!=='patience');
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
    setArmed(null);
    if(selected===id){onSelect(null);onStack([]);return;}
    if(stack.some(x=>x.id===id)){onStack(stack.filter(x=>x.id!==id));return;}
    const kind=byId(id)?.entry?.kind;
    /* with a main card on the board, another swing card becomes a support: it waits for a zone */
    const nextStack=[...stack,{id,aimZone:b.aimZone}];
    if(canStack&&id!=='basic'&&kind!=='bunt'&&stack.length<v10StackMax(s)-1
      &&v10ActionCost(s,selected,nextStack)<=energy){setArmed(id);return;}
    onSelect(id);onStack([]);
  }
  function pickPrep(id){if(locked)return;setArmed(null);onStack([]);onSelect(selected===id?null:id);}
  function pickZone(z){
    if(locked||commitBeat)return;
    if(armed){onStack([...stack,{id:armed,aimZone:z}]);setArmed(null);return;}
    onAim(z);
  }
  function commitSwing(){
    if(!deciding||!selected||choice?.problem)return;
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
  const liveRate=choice?.damageRate!=null?choice.damageRate*v10MomentumRate(v10Momentum(s)):null;
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
  const energyPart=selected&&!mainIsSkill?'에너지 '+stackCost+'/'+energyLimit:'';
  const verbSub=!selected?'':mainIsSkill?prepLeft+'회 남음':[hitCover.length?'적중권 '+hitFaceFor(hitCover):'',rate,energyPart].filter(Boolean).join(' · ');
  /* #103 M03: the two numbers break between each other, never inside one ("피해 …" was cut off) */
  const verbSubParts=verbSub.split(' · ');
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
  const coach=deciding&&choice?.problem?choice.problem:firstChase?'볼은 참으면 볼넷이 된다. 바깥 띠로 올 것 같으면 지켜본다.':!deciding?'':armed?'덮을 칸을 누른다':lines.coach;
  const good=judged&&(r.kind==='hit'||r.kind==='sacrifice'||call==='볼넷');
  /* the pitcher's one-liner: once when she takes the mound, then after each pitch that lands */
  const moment=showVerdict&&judged&&landed?momentOf({call,chased:outNote==='볼에 손이 나갔다',knockedOut:(pitcher?.hp??1)===0})
    :deciding&&!(b.history?.length)&&b.turn===1?'entry':null;
  const voice=moment?pitcherLine(artId,moment,playToken):'';
  const speakerFace=pitcherPortraits[artId]||null;

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
  const debriefLesson=showDebrief?lessonFor(lessonCombat,r):null;
  const debriefPlan=showDebrief?planText(lessonCombat):'';
  const debriefActual=showDebrief?(lessonCombat.pitchLabel||lessonZoneName(r?.zone)):'';
  const debriefDamage=showDebrief&&lessonCombat.damage>0?'투수 HP -'+lessonCombat.damage+(lessonCombat.momentumBefore>0?' · 기세 ×'+v10MomentumRate(lessonCombat.momentumBefore).toFixed(1):''):'';

const CARD_DESC_MAP={
  basic:['선택 1존 집중 타격','카드 소모 없음 · 기본 스윙'],
  place:['선택 1존 정타 노림','정확 적중 시 투수 HP +50%'],
  strike:['세로 3존 결대로 밀어치기','범위 적중 시 안타 확정'],
  slug:['1존 강한 당겨치기','파워 +36 · 홈런/장타 노림'],
  rally:['가로 3존 연결 스윙','안타 시 주자 +2베이스 (2·3루 홈인)'],
  defend:['십자 5존 커트 스윙','단타 확정 · 파울 생존율 증가'],
  bunt:['9존 전체 번트 작전','주자 1루 진루 · 1아웃 지불'],
  finisher:['가로 3존 갭 공략','외야를 가르는 2루타 기회'],
  wall:['십자 5존 봉쇄','넓은 수비형 스윙 범위'],
  laser:['세로 3존 라인드라이브','안정성과 타구 질 동시 확보'],
  commit:['단 1존 끝장 승부','극대화된 파워 · 결정타'],
  setup:['타이밍 집중','집중 +1 · 파워 +5'],
  watch:['작전 간파','카드 2장 보충'],
  scout:['투수 릴리스 간파','구종 힌트 · 카드 1장'],
  lure:['코스 조정','스윙 범위 1칸 확장'],
  flow:['히트앤드런','안타 시 주자 +1베이스'],
  calm:['호흡 고르기','파울 생존 · 카드 +1'],
  // V16 Precision (C101-C113)
  pinpoint:['핀포인트 타격','1존 커버 · 정확 적중 HP +70%'],
  eyeLevel:['눈높이 컨택','가로 2존 커버 · 정확 적중 HP +35%'],
  verticalRead:['위아래 노림','세로 2존 커버 · 정확 적중 HP +35%'],
  readStrike:['읽은 공 강타','1존 · 파워 +18 · 간파 성공 +6 HP'],
  surgeon:['외과의 스윙','1존 · 정확 HP +50% · 안타 +3 HP'],
  needle:['바늘구멍 스윙','1존 · 파워 -18 · 정확 적중 HP +100%'],
  counterRead:['볼카운트 역이용','1존 · 정확 HP +30% · 유리 카운트 +5 HP'],
  onePatience:['한 칸의 인내','1존 · 정확 HP +40% · 안타 시 카드 +1'],
  laserEye:['대각선 레이저','대각선 커버 · 정확 적중 HP +30%'],
  coldRead:['냉정한 판독','높이·안팎 확인 · 정확 HP +20%'],
  focusBreath:['집중 호흡','준비 1회 · 집중 +1 · 정확 HP +40%'],
  markZone:['존 마킹','칠 곳 마킹 · 정확 HP +25% · 카드 +1'],
  perfectRead:['완벽한 판독','1존 · 파워 +36 · 간파 성공 +10 HP'],
  // V16 Power (C114-C122)
  fullSwing:['풀스윙','1존 · 파워 +36 · 홈런 상한 해제'],
  moonshot:['문샷','1존 · 파워 +54 · 장타 안타 +4 HP'],
  gapHunter:['좌중간 가르기','가로 2존 · 파워 +18 · 장타 +3 HP'],
  pullHook:['잡아당기기','세로 3존 · 파워 +18 · 몸쪽 파워 +18'],
  oppoPower:['밀어서 넘기기','세로 3존 · 파워 +18 · 바깥쪽 파워 +18'],
  upperCut:['어퍼컷 스윙','가로 3존 · 파워 +18 · 낮은 공 파워 +18'],
  highHeat:['하이볼 강타','가로 3존 · 파워 +18 · 높은 공 파워 +18'],
  cleanup:['4번 타자의 해결','1존 · 파워 +36 · 주자당 안타 +3 HP'],
  soloShot:['솔로포 각','1존 · 파워 +36 · 주자 없을 때 +6 HP'],
  loadPower:['힘 모으기','이번 타석 파워 +18'],
  sluggerInstinct:['거포 본능','이번 타석 파워 +36'],
  calledShot:['예고 홈런','파워 +36 · 이번 타석 안타 +6 HP'],
};

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
    /* a support candidate that would overflow tells so on its face, with the exact sum */
    const supportCandidate=canStack&&selected&&!mainIsSkill&&selected!==x.id&&inStack<0&&x.entry.kind!=='bunt';
    const overBudget=supportCandidate&&stackCost+cost>energyLimit;
    const roleTag=def.role||(isSkillCard?'집중':'정확');
    const descLines=problem?[problem,'']:overBudget?[(CARD_DESC_MAP[x.entry.kind]||[def.gives?.[0]||'스윙 효과'])[0],'합치면 '+stackCost+'+'+cost+'='+(stackCost+cost)+'/'+energyLimit+' 초과']:(CARD_DESC_MAP[x.entry.kind]||[def.gives?.[0]||'스윙 효과',def.gives?.[1]||'']);

    return <button key={x.id} type="button" className={'bp-card'+state+(problem?' off':'')+cardKindClass} aria-pressed={selected===x.id||inStack>=0}
      data-card-kind={x.entry.kind} data-card-plus={x.entry.plus?1:0} data-card-problem={problem||undefined} disabled={!deciding} onClick={()=>pickSwing(x.id)}>
      <span className="bp-card-cost" aria-label={`코스트 ${cost}`}>{cost}</span>
      <div className="bp-card-art-box">
        <div className="bp-card-art" style={artStyle}/>
        <div className="bp-card-mini-map"><CardGlyph zones={x.preview?.coverage}/></div>
      </div>
      <div className="bp-card-header">
        <strong>{def.name||x.entry.kind}{x.entry.plus&&<sup>+</sup>}</strong>
        <div className="bp-card-chips">
          <span className="bp-chip type">{isSkillCard?'준비':'공격'}</span>
          <span className={"bp-chip role r-"+(ROLE_TONE[roleTag]||"plain")}>{roleTag}</span>
        </div>
      </div>
      <div className={'bp-card-desc'+(overBudget?' over':'')}>
        <p>{descLines[0]}</p>
        {descLines[1]&&<p>{descLines[1]}</p>}
      </div>
      {selected===x.id&&<b className="bp-order">1</b>}{inStack>=0&&<b className="bp-order">{inStack+2}</b>}
    </button>;
  };

  /* 엘리트·보스 시각 효과: CSS가 data 속성만 읽는다(.bp-scene[data-gimmick]). 단계는 투수 HP 단계. */
  const gm=s.v10?.opponent?.gimmick,gtier=gm?(s.v10?.opponent?.rewardTier===3?'boss':'elite'):null;
  return <main ref={rootRef} className={'bp-battle'+(autoLesson?' auto-lesson':'')+(commitBeat?' committing':'')+(deciding?'':' resolving')+(inFx?' fx-'+fxStage:'')} aria-label="타석">
    <div className="bp-bar">
      <div className="bp-hud-brand">
        <button type="button" className="bp-hud-logo" aria-label="타이틀로 돌아가기" onClick={onHome}>9ZONE</button>
        <span className="bp-hud-sub" aria-hidden="true">HOMEBOUND</span>
        <b className="bp-hud-inning">{label}</b>
      </div>
      <div className="bp-bso-strip" aria-label={`볼 ${shownCount.balls} 스트라이크 ${shownCount.strikes} 아웃 ${shownCount.outs}`}>
        <div className="bp-bso-unit b"><b className="bp-bso-name">B</b><span className="bp-bso-leds">{Array.from({length:3},(_,i)=><i key={i} className={i<shownCount.balls?'on':''}/>)}</span></div>
        <div className="bp-bso-unit s"><b className="bp-bso-name">S</b><span className="bp-bso-leds">{Array.from({length:2},(_,i)=><i key={i} className={i<shownCount.strikes?'on':''}/>)}</span></div>
        <div className="bp-bso-unit o"><b className="bp-bso-name">O</b><span className="bp-bso-leds">{Array.from({length:2},(_,i)=><i key={i} className={i<shownCount.outs?'on':''}/>)}</span></div>
      </div>
      <span className="bp-piles">
        <button type="button" onClick={()=>onPile?.('draw')} className="bp-pile-btn"><i className="bp-pile-icon deck-icon" aria-hidden="true"/>덱 {b.draw?.length??0}</button>
        <button type="button" onClick={()=>onPile?.('discard')} className="bp-pile-btn"><i className="bp-pile-icon discard-icon" aria-hidden="true"/>버림 {b.discard?.length??0}</button>
        <button type="button" className="bp-pile-btn bp-sound-btn" aria-label={sound?'소리 끄기':'소리 켜기'} onClick={onToggleSound}>{sound?'♪':'♩'}</button>
        <button type="button" className="bp-pile-btn bp-jukebox-btn" aria-label="BGM 주크박스" onClick={onJukebox||onHelp}>🎧</button>
        <button type="button" className="bp-pile-btn bp-settings-btn" aria-label="설정 및 도움말" onClick={onHelp}>⚙</button>
      </span>
    </div>

    <section className={'bp-scene'+(pixi?.batter?' pixi-batter':'')+(pixi?.pitcher?' pixi-pitcher':'')+(inFx?' fx-stage-'+fxStage+(shot?' fx-'+(shot.grade||shot.kind):''):'')+(cam?' cam-'+cam:'')} ref={sceneRef} aria-label="승부 구장" data-gimmick={gm?.id} data-gtier={gtier} data-gphase={gm?(pitcher?.phase||'steady'):undefined}>
      <div className="bp-bg bp-cam" aria-hidden="true"/>
      <div className="bp-haze" aria-hidden="true"/>
      {commitBeat&&<aside className="bp-commit" data-testid="bp-commit" role="status" aria-live="assertive">
        <span className="bp-commit-kicker">BATTING PLAN LOCKED</span>
        <strong>{commitBeat.cards.length}장 STACK · 이제 지켜본다</strong>
        <div className="bp-commit-cards" aria-label="확정한 배팅 플랜">
          {commitBeat.cards.map((name,i)=><span key={i}><b>{i+1}</b>{name}<em>{commitBeat.zones[i]}</em></span>)}
        </div>
        <div className="bp-commit-stats">
          <span><small>적중권</small><b>{commitBeat.hitChance}</b></span>
          <span><small>커버</small><b>{commitBeat.coverage}존</b></span>
          <span><small>HP 효율</small><b>{commitBeat.efficiency}%</b></span>
          <span><small>CONNECT</small><b>{commitBeat.connect}/{commitBeat.linkCount}</b></span>
        </div>
      </aside>}
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
      {canPixi&&<BallparkActors sceneRef={sceneRef} pitcherAtlas={pitcherAtlas} artId={artId} batterPoses={batterPoses} batterSheet={batterSheet} batterRig={batterRig} pitchZone={judged?r.zone:null} shot={shot} fxStage={fxStage} playToken={playToken} knockedOut={judged&&(pitcher?.hp??1)===0} onReady={setPixi}/>}
      <div className="bp-pitcher bp-cam" ref={pitcherRef} aria-hidden="true" style={{'--stance-x':pitcherStance(artId)[0],'--stance-y':pitcherStance(artId)[1]}}>{pitcherArt}{gm&&<GimmickVfx id={gm.id} tier={gtier} phase={pitcher?.phase||'steady'}/>}</div>
      <div className="bp-pcol">
      <div className="bp-ptag" aria-label={`${pitcher?.name} 투수 HP ${pitcher?.hp} / ${pitcher?.maxHp}`}>
        <div className="bp-pitcher-badge-row">
          <span className="bp-pitcher-flame" aria-hidden="true">🔥</span>
          {/* #103 M08: the name is never cut; only the pitch-type prefix gives way on a narrow panel */}
          <span className="bp-pitcher-title-name">{s.v10?.opponent?.archetype&&<span className="bp-ptype">{s.v10.opponent.archetype}<i aria-hidden="true"> · </i></span>}<b className="bp-pname">{pitcher?.name||'투수'}</b></span>
        </div>
        <div className="bp-hp-gauge-container">
          <div className="bp-hp-gauge-bar" style={{'--hp-pct': `${Math.max(0, Math.min(100, Math.round(((pre?hpWas:pitcher?.hp)||0)/(pitcher?.maxHp||1)*100)))}%`}} />
          <span className="bp-ticks" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} className={tickClass(i)}/>)}</span>
        </div>
        {s.v10?.opponent?.gimmick&&<p className="bp-gimmick" data-testid="bp-gimmick"><i className="bp-gtier">{gtier==='boss'?'BOSS':'ELITE'}</i> <b>{s.v10.opponent.gimmick.label}</b> {s.v10.opponent.gimmick.summary}{s.v10.opponent.gimmick.phases&&['pressured','critical'].filter(k=>s.v10.opponent.gimmick.phases[k]&&(pitcher?.phase===k||(k==='pressured'&&pitcher?.phase==='critical'))).map(k=><span key={k}> {s.v10.opponent.gimmick.phases[k]}</span>)}</p>}
        {damage>0&&<b className="bp-damage" key={'d'+playToken}>-{damage}</b>}
        <small aria-hidden="true">HP {pre?hpWas:pitcher?.hp} / {pitcher?.maxHp}</small>
        <span className={'bp-mental'+(shaken?' shaken':'')+(shaken>=mentalCap?' max':'')+(shakenRose?' rose':'')} data-testid="bp-mental"
          data-shaken={shaken} data-cap={mentalCap} key={'m'+shaken} aria-label={`투수 흔들림 ${shaken} / ${mentalCap}`+(shaken?' · 볼 증가 · 읽기 +1':'')}>
          <em>흔들림</em><span aria-hidden="true">{Array.from({length:mentalCap},(_,i)=><i key={i} className={i<shaken?'on':''}/>)}</span>
        </span>
        {deciding&&runners>0&&<span className="bp-press" data-testid="bp-press" aria-label={`주자 ${runners}명 · 안타 피해 +${runnerPct}%`}><em>주자 압박</em><b>+{runnerPct}%</b></span>}
      </div>
      {voice&&<q className={'bp-voice m-'+moment} key={'q'+playToken+moment} data-testid="bp-voice">{voice}</q>}
      {deciding&&lines.whisper&&<span className="bp-tell" data-testid="bp-tell">{lines.whisper}</span>}
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
      {/* 기세 gauge by the batter: five flames, the multiplier they add, a burst when it rises, smoke when a strikeout puts it out */}
      <div className={'bp-momentum'+(momentum?' lit':'')+(momentum>=V10_MOMENTUM.max?' max':'')+(momentumRose?' rose':'')+(momentumOut?' out':'')} data-testid="bp-momentum" data-momentum={momentum}
        key={'mo'+momentum+(momentumOut?'x':'')} role="status" aria-label={`기세 ${momentum} / ${V10_MOMENTUM.max} · 피해 ×${v10MomentumRate(momentum).toFixed(1)}`}>
        <em>기세</em>
        <span className="bp-momentum-pips" aria-hidden="true">{Array.from({length:V10_MOMENTUM.max},(_,i)=><i key={i} className={i<momentum?'on':''}/>)}</span>
        <b>×{v10MomentumRate(momentum).toFixed(1)}</b>
        {momentumRose&&<small className="bp-momentum-pop" aria-hidden="true">+{combat.momentumAfter-combat.momentumBefore}</small>}
      </div>

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

      <div className="bp-count" aria-label={`볼 ${shownCount.balls} 스트라이크 ${shownCount.strikes} 아웃 ${shownCount.outs}`}>
        {[['B',shownCount.balls,4],['S',shownCount.strikes,3],['O',shownCount.outs,3]].map(([k,v,n])=><div key={k}>{k}{Array.from({length:n-1},(_,i)=><u key={i} className={i<v?'on':''}/>)}</div>)}
      </div>
      <div className="bp-bases" aria-label={'주자 '+[0,1,2].filter(i=>shownBases[i]).map(i=>i+1+'루').join(', ')||'주자 없음'}>
        {[1,2,0].map(i=><i key={i} className={'base-'+(i+1)+(shownBases[i]?' on':'')+(baseNew(i)?' new':'')}/>)}
      </div>
    </section>

    <div className={'bp-coach-wrap'+(voice?' has-voice':'')}>
      {/* whoever speaks wears the avatar: the pitcher's line shows her face, not the coach's */}
      <div className={'bp-coach-avatar-col'+(voice&&speakerFace?' speaker-pitcher':'')}>
        <div className="bp-coach-badge" aria-hidden="true" style={voice&&speakerFace?{backgroundImage:`url(${speakerFace})`}:undefined}/>
        <span className="bp-coach-pill">{voice&&speakerFace?'투수':'COACH'}</span>
      </div>
      <div className="bp-coach-bubble">
        <p className={'bp-coach'+(voice?' has-voice':'')}>
          <span className="bp-coach-text">{coach}</span>
          {voice&&<q className={'bp-voice-strip m-'+moment} key={'qs'+playToken+moment}><b>{pitcher?.name}</b> {voice}</q>}
        </p>
      </div>
    </div>

    {showDebrief?<aside className={'bp-debrief tone-'+(debriefLesson?.tone||'neutral')} data-testid="bp-debrief" aria-label="이번 공 복기">
      <div className="bp-dstep plan">
        <span>내 선택</span>
        <strong>{debriefPlan}</strong>
        <small>{lessonCombat.aimLabel||'노림 코스'}</small>
      </div>
      <i aria-hidden="true">→</i>
      <div className="bp-dstep actual">
        <span>실제 공</span>
        <strong>{debriefActual}</strong>
        <small>{debriefDamage||lessonCombat.verdict||call}</small>
      </div>
      <i aria-hidden="true">→</i>
      <div className="bp-dstep next">
        <span>다음엔</span>
        <strong>{debriefLesson?.title}</strong>
        <small>{debriefLesson?.text}</small>
      </div>
    </aside>:<div className="bp-hand" aria-label="손패">
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
            <span className="bp-chip role">단타</span>
          </div>
        </div>
        <div className="bp-card-desc">
          <p>선택 1존 집중 타격</p>
          <p>카드 소모 없음 · 기본 스윙</p>
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
        const descLines=problem?[problem,'']:(CARD_DESC_MAP[x.entry.kind]||[def.gives?.[0]||'준비 작전',def.gives?.[1]||'']);
        const isOff=Boolean(problem||!prepLeft);

        return <button key={x.id} type="button"
          className={'bp-card skill prep-card bp-token-card'+(selected===x.id?' main':'')+(isOff?' off':'')}
          aria-pressed={selected===x.id}
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
              <span className={"bp-chip role r-"+(ROLE_TONE[roleTag]||"plain")}>{roleTag}</span>
            </div>
          </div>
          <div className="bp-card-desc">
            <p>{descLines[0]}</p>
            {descLines[1]?<p>{descLines[1]}</p>:<p className="bp-prep-left">준비 {prepLeft}회 가능</p>}
          </div>
          {selected===x.id&&<b className="bp-order prep">준비</b>}
        </button>;
      })}
    </div>}

    {onNext&&!deciding&&s.phase!=='battle'?<div className="bp-verbs next">
      {s.version===10&&energyHud}
      {/* #103 M04: the hint names the same step as the verb (it said "next pitch" under "next batter") */}
      <button type="button" className="bp-verb go" data-testid="bp-next" disabled={inFx||locked} onClick={onNext}><span className="bp-verb-word">{nextLabel}</span>{nextHint(s.phase,inFx||locked)&&<small className="bp-verb-sub"><span>{nextHint(s.phase,inFx||locked)}</span></small>}</button>
    </div>:<div className="bp-verbs">
      {s.version===10&&energyHud}
      <button type="button" className="bp-verb go" data-testid="bp-swing" disabled={!deciding||!selected||!!choice?.problem} onClick={commitSwing}>
        <span className="bp-verb-word">{verb}</span>{verbSub&&<small className="bp-verb-sub">{verbSubParts.map((x,i)=><React.Fragment key={i}>{i>0&&<i className="bp-verb-sep" aria-hidden="true"> · </i>}<span>{x}</span></React.Fragment>)}</small>}
      </button>
      <button type="button" className="bp-verb wait" data-testid="bp-take" disabled={!deciding} onClick={onTake}><span className="bp-verb-word">지켜본다</span>{s.version===10&&<small>{b.strikes===2?'볼 +1 · 삼진 0':'다음 공 +1'}</small>}</button>
      {mainEntry&&deciding&&<button type="button" className="bp-info" aria-label={mainName+' 카드 설명'} onClick={e=>onDetail?.(mainEntry,e.currentTarget)}>ⓘ</button>}
    </div>}
    {coachOn&&deciding&&!autoLesson&&!previewMode&&b.turn===1&&!(b.history?.length)&&<BallparkCoach rootRef={rootRef} onDone={()=>setCoachOn(false)}/>}
  </main>;
}
