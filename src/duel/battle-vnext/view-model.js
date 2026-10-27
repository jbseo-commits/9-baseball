/* battle-vnext 표시 모델 (C01, docs/design/mockup-v1/CONTRACTS.md).
   App의 실제 엔진 상태 + 기존 선택/지원/연출 상태 → 화면이 그릴 값만.
   - 상태를 바꾸지 않는다. 엔진 함수(playV10Action 등)를 실행 경로로 부르지 않는다.
   - 계산은 기존 selector를 그대로 쓴다: forecastFor·previewSwing(예측), publicProbabilities·probabilityBounds(9존),
     cardFaceOf(카드 면), v10Energy(에너지), resultExplanation·isExactRead(결과).
   - 숨은 값(battle.pending의 실제 코스·난수, previewSwing의 hitChance·expected·outcomes)은 결과에 담지 않는다.
     읽기 0/1에서는 칸별 정확한 %도 담지 않는다. */
import {CARDS,LINEUP,bandFor,rangeFor,shadeNameFor,cardCost} from '../cards.js';
import {publicProbabilities,readLevel,readSources,knownPitchZones,v10StackMax,v10PrepMax,v10Energy,v10EnergyCap,v10EnergyBase,
  v10NextEnergyMax,v10ActionCost,v10TakeDrawPreview,V11_SWING_ENERGY,v10Momentum,v10MomentumRate,v10Shaken,v10MentalCap,
  selectV10Pitcher,selectV10Combat,coverage as cardCoverage} from '../engine.js';
import {intentLines,ZONE_WORDS,runnerMoves} from '../ballpark-copy.js';
import {resultExplanation,isExactRead} from '../zone-first-model.js';
import {cardFaceOf,shortCardProblem} from '../card-face.js';
import {preparationDrawPreview,activePreparationFeedback} from '../preparation-feedback.js';
import {forecastFor} from '../SwingForecast.jsx';
import {formatHitChance} from '../swing-preview.js';
import {pitcherIntentIcon} from '../intent-icon.js';

export const VIEW_PHASES=Object.freeze(['deciding','committing','flight','result','transition']);
/* BallparkBattle LANDED와 같은 집합: 이 연출 단계부터 공이 도착해 결과를 보여도 된다 */
export const LANDED_STAGES=Object.freeze(['impact','slowmo','release','settle']);
/* 단일 행동 버튼의 종류 → 보이는 이름 (CONTRACTS §3) */
export const ACTION_LABELS=Object.freeze({watch:'지켜보기',swing:'타격',prepare:'준비 사용',
  'support-zone':'코스를 고르세요',busy:'투구 중…',next:'다음 공',none:''});
/* 버튼이 부를 기존 콜백. swing은 컨테이너의 commitSwing(지원 카드 commit beat)을 거쳐 onSwing으로 간다 */
export const ACTION_CALLBACKS=Object.freeze({watch:'onTake',swing:'onSwing',prepare:'onSwing',next:'onNext'});

const isSkillKind=kind=>CARDS[kind]?.type==='skill';
const isBuntKind=kind=>!!CARDS[kind]?.bunt;

/* 엔진 phase + 연출 단계에서 표시 phase를 도출한다. 엔진 phase를 바꾸지 않는다. */
export function battlePhase({s,fxStage=null,commitBeat=false,locked=false}){
  const b=s?.battle;
  /* 강판·패배는 엔진이 곧바로 reward 등으로 넘어간다. 그 공의 연출이 도는 동안은 결과를 보여준다 */
  if(!b||(!['battle','pitch','between'].includes(s.phase)&&!fxStage))return 'transition';
  if(commitBeat)return 'committing';
  if(isJudged(s,fxStage))return fxStage&&!LANDED_STAGES.includes(fxStage)?'flight':'result';
  if(fxStage)return 'committing';
  return s.phase==='battle'&&!locked?'deciding':'transition';
}
function isJudged(s,fxStage){
  return !!s.battle?.revealed&&s.last?.kind!=='skill'&&(!!fxStage||s.phase!=='battle');
}

/* 결과 한 낱말. BallparkBattle callOf와 같은 규칙이다 (C05에서 한쪽으로 합친다). */
const HIT_WORD={extra:'장타',homer:'홈런','grand-slam':'만루 홈런'};
export function resultCall(r,shot){
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

/* 칸 표면: 읽기 0 = 명암 낱말, 1 = 5%p 구간, 2 = 정확한 %. 낮은 단계에 틀린/정확한 숫자를 싣지 않는다. */
export function zoneFace(s,z,{level=readLevel(s),known=knownPitchZones(s),probs=publicProbabilities(s)}={}){
  const live=s.battle.intent?.repertoire||[0,1,2,3,4,5,6,7,8],inZone=probs.slice(0,9).reduce((a,x)=>a+x,0)||1;
  if(!live.includes(z))return '안 던짐';
  if(!known.includes(z))return '단서 밖';
  if(known.length===1)return '확정';
  if(level===0)return shadeNameFor((probs[z]||0)/inZone);
  if(level===1)return rangeFor(probs[z]||0);
  return Math.round((probs[z]||0)*100)+'%';
}
export function bandFace(s,{level=readLevel(s),probs=publicProbabilities(s)}={}){
  const p=probs[9]||0;
  if((s.relics||[]).includes('ledger')||level===2)return Math.round(p*100)+'%';
  return level===1?rangeFor(p):bandFor(p);
}

/* SwingForecast.forecastFor 결과에서 공개 값만 남긴다. hitChance·expected·outcomes·miss 범위는 버린다. */
export function publicForecast(f){
  if(!f)return null;
  const view=now=>{
    const sacrifice=!!now.sacrifice,bounds=sacrifice?now.sacBounds:now.hitBounds;
    const [low,high]=sacrifice?[now.sacMin,now.sacMax]:[now.dmgMin,now.dmgMax];
    const outcome=sacrifice?'희생타':'안타',reachable=bounds[1]>0;
    const damageText=reachable?(low===high?String(low):low+'~'+high):'-';
    return {outcome,chance:[bounds[0],bounds[1]],chanceText:formatHitChance(bounds),
      damageMin:reachable?low:0,damageMax:reachable?high:0,damageText,
      damageLabel:reachable&&high>0?`${outcome} 시 −${damageText}`:'',
      coverage:[...now.coverage],cardCount:now.cardCount,
      runners:sacrifice?0:now.runners,shaken:now.shaken,shakenHp:now.shakenHp,
      reasons:(now.reasons||[]).map(x=>x.label)};
  };
  const out=view(f.now);
  return {...out,before:f.before?view(f.before):null,preparation:f.skill||null,problem:f.problem||null};
}

/* App/BallparkBattle이 이미 가진 값을 받는다.
   s, hand([{id,entry,preview}]), selected, swingStack, choice: App 소유 (기존 그대로)
   armed, commitBeat, inspectOpen, hoverZone, hoverSkill, lastSwing: 전투 컨테이너의 로컬 조정 상태
   locked, fxStage, shot, playToken, nextLabel, hasNext, artId, defenseLab: App 연출·흐름 상태 */
export function buildBattleViewModel({
  s,hand=[],selected=null,swingStack=[],choice=null,
  armed=null,commitBeat=null,inspectOpen=false,hoverZone=null,hoverSkill=null,lastSwing=null,
  locked=false,fxStage=null,shot=null,playToken=0,nextLabel='',hasNext=false,artId=null,defenseLab=null,
}={}){
  const b=s?.battle;
  const phase=battlePhase({s,fxStage,commitBeat:!!commitBeat,locked});
  if(!b)return {phase,input:emptyInput(),energy:null,hand:[],zones:null,forecast:null,hud:null,result:null,scene:null,effects:[]};
  const deciding=phase==='deciding',judged=phase==='flight'||phase==='result',landed=phase==='result';
  const r=judged?b.revealed:null;
  const byId=id=>hand.find(x=>x.id===id);
  const mainEntry=selected&&selected!=='basic'?byId(selected)?.entry:null;
  const mainIsSkill=isSkillKind(mainEntry?.kind);
  const canStack=!!(mainEntry&&!mainIsSkill&&!isBuntKind(mainEntry.kind)&&b.growthMode!=='patience');
  const stack=canStack?swingStack.filter(x=>x.id!==selected&&byId(x.id)):[];
  const liveArmed=deciding&&canStack&&armed&&byId(armed)?armed:null;
  const shownCount=countShown(b,r,landed);

  /* ── 에너지: 손패 바로 위 한 곳 ── */
  const energyNow=v10Energy(s),energyLimit=s.version===11?V11_SWING_ENERGY:energyNow;
  const stackCost=selected&&!mainIsSkill?(selected==='basic'?0:cardCost(mainEntry))+stack.reduce((n,x)=>n+cardCost(byId(x.id)?.entry),0):0;
  const selectedCost=deciding&&selected?(choice?.cost??v10ActionCost(s,selected,stack)):0;
  const armedCost=liveArmed?cardCost(byId(liveArmed)?.entry):0;
  const takeDraw=v10TakeDrawPreview(s);
  const drawHint=takeDraw.count===1?'카드+1':takeDraw.reason==='full'?'6장 한도':'추가 0';
  const energy=s.version===10?{
    current:energyNow,cap:v10EnergyCap(s),base:v10EnergyBase(s),
    selectedCost,armedCost,
    remainingIfExecuted:Math.max(0,energyNow-selectedCost),
    shortfall:Math.max(0,selectedCost-energyNow),
    nextTakeHint:shownCount.strikes===2?'스트라이크면 삼진'+(defenseLab?' · 보호 제외':''):`다음 공 ⚡+1`,
    upcoming:s.phase!=='battle'&&b.takeEnergyBonus===1?`${s.phase==='between'?'다음 타자':'다음 공'} ${v10NextEnergyMax(s)} · ${drawHint}`:'',
    refill:s.phase!=='battle'&&b.takeEnergyBonus!==1?`다음 공에 ${v10EnergyBase(s)} 충전`:'',
  }:null;

  /* ── 단일 행동 ── */
  const input=inputFor({phase,deciding,selected,mainIsSkill,choice,armed:liveArmed,inspectOpen,locked,fxStage,commitBeat,
    hasNext,nextLabel,s,takeHint:energy?.nextTakeHint||''});

  /* ── 손패: 기본 스윙 칩 → 스윙 카드 → 준비 카드 (기존 순서) ── */
  const prepLeft=Math.max(0,v10PrepMax(s)-(b.preparations||0));
  const roleOf=id=>selected===id?'main':stack.some(x=>x.id===id)?'support':liveArmed===id?'armed':null;
  const orderOf=id=>selected===id?1:stack.findIndex(x=>x.id===id)>=0?stack.findIndex(x=>x.id===id)+2:null;
  const handView=[{id:'basic',kind:'basic',plus:false,name:'맨손 스윙',type:'basic',cost:0,artKey:'basic',
    coverage:b.aimZone!=null?[b.aimZone]:[],role:'단타',summary:'카드 소모 없음',condition:'',drawNote:'',warning:'',problem:null,
    selectionRole:roleOf('basic'),order:orderOf('basic'),disabled:!input.canSelect,unavailable:false}];
  for(const x of hand){
    const def=CARDS[x.entry?.kind];if(!def)continue;
    const kind=x.entry.kind,isPrep=def.type==='skill',cost=cardCost(x.entry);
    const problem=deciding?x.preview?.problem||null:null;
    const face=cardFaceOf(x.entry,{strikes:shownCount.strikes,drawPreview:preparationDrawPreview(s,x.id)});
    const supportCandidate=canStack&&!mainIsSkill&&selected!==x.id&&!stack.some(y=>y.id===x.id)&&!isBuntKind(kind)&&!isPrep;
    const overBudget=deciding&&supportCandidate&&stackCost+cost>energyLimit;
    const exhausted=isPrep&&!prepLeft;
    const warning=shortCardProblem(problem)||(overBudget?'지원 비용 초과':'')||(exhausted?'준비 횟수 소진':'');
    handView.push({id:x.id,kind,plus:!!x.entry.plus,name:def.name+(x.entry.plus?'+':''),type:isPrep?'prepare':'swing',cost,artKey:kind,
      coverage:isPrep?null:[...(x.preview?.coverage||cardCoverage(s,x.id))],role:def.role||(isPrep?'준비':'정확'),
      summary:face.summary,condition:face.condition,drawNote:face.drawNote||'',warning,problem,overBudget,
      selectionRole:roleOf(x.id),order:orderOf(x.id),disabled:!input.canSelect,unavailable:!!problem||exhausted});
  }
  const ordered=[handView[0],...handView.slice(1).filter(x=>x.type==='swing'),...handView.slice(1).filter(x=>x.type==='prepare')];

  /* ── 9존 ── */
  const level=readLevel(s),known=knownPitchZones(s),probs=publicProbabilities(s);
  const live=b.intent?.repertoire||[0,1,2,3,4,5,6,7,8];
  const plan=judged
    ?{cover:r.primaryCoverage||r.coverage||[],support:(r.supportCoverages||[]).flatMap(x=>x.coverage),aim:r.coverage?.length?r.aimZone:null,
      tokens:[r.coverage?.length?{z:r.aimZone,n:1}:null,...(r.supportZones||[]).map((z,i)=>({z,n:i+2}))].filter(Boolean)}
    :{cover:stack.length?choice?.primaryCoverage||[]:(!mainIsSkill&&selected?choice?.coverage||[]:[]),
      support:stack.length?(choice?.supportCoverages||[]).flatMap(x=>x.coverage):[],
      aim:selected&&!mainIsSkill?b.aimZone:null,
      tokens:[selected&&!mainIsSkill?{z:b.aimZone,n:1}:null,...stack.map((x,i)=>({z:x.aimZone,n:i+2}))].filter(Boolean)};
  const cells=ZONE_WORDS.map((word,z)=>({zone:z,word,live:live.includes(z),
    face:deciding?zoneFace(s,z,{level,known,probs}):null,
    aimed:b.aimZone===z,aim:plan.aim===z,cover:plan.cover.includes(z),support:plan.support.includes(z),
    tokens:plan.tokens.filter(t=>t.z===z).map(t=>t.n),actual:landed&&r.zone===z}));
  const zones={level,sources:readSources(s).map(x=>x.label),cells,
    band:{face:deciding?bandFace(s,{level,probs}):null,actual:landed&&r.zone===9},
    clue:known.length<10,targetingSupport:!!liveArmed,links:judged?r.stackLinks||[]:stack.length?choice?.stackPlan?.links||[]:[]};

  /* ── 예측: 선택 중에만, 실제 판정과 같은 함수의 공개 구간 ── */
  const forecast=deciding&&!inspectOpen&&selected
    ?publicForecast(forecastFor({s,selected:mainIsSkill?null:selected,stack,armed:liveArmed,hoverZone,
      skillId:hoverSkill||(mainIsSkill?selected:null),lastSwing})):null;

  /* ── HUD: 공이 닿기 전에는 던지기 전 값 ── */
  const pitcher=selectV10Pitcher(s),combat=selectV10Combat(s);
  const pre=phase==='flight';
  const hpBefore=judged?Math.min(pitcher?.maxHp||0,Number.isInteger(combat?.hpBefore)?combat.hpBefore:(pitcher?.hp||0)+(pitcher?.lastDamage||0)):pitcher?.hp;
  const bases=(pre&&Array.isArray(r.basesBefore)?r.basesBefore:(b.bases||[])).map(Boolean);
  const intent=deciding?pitcherIntentIcon(s):null,lines=intentLines(b.intent);
  const hud={
    pitcher:pitcher?{name:pitcher.name,hp:pre?hpBefore:pitcher.hp,maxHp:pitcher.maxHp,phase:pitcher.phase}:null,
    count:shownCount,outsLeft:Math.max(0,3-shownCount.outs),bases,
    tell:lines.whisper,tellDetail:lines.coach,intent:intent?{kind:intent.kind,label:intent.label,icon:intent.icon,level:intent.level}:null,
    readLevel:level,
    momentum:pre&&Number.isInteger(combat?.momentumBefore)?combat.momentumBefore:v10Momentum(s),
    shaken:pre&&Number.isInteger(combat?.shakenBefore)?combat.shakenBefore:v10Shaken(s),mentalCap:v10MentalCap(s),
    gimmick:s.v10?.opponent?.gimmick?{id:s.v10.opponent.gimmick.id,label:s.v10.opponent.gimmick.label}:null,
  };
  hud.momentumRate=v10MomentumRate(hud.momentum);

  /* ── 결과: 공이 닿은 뒤에만 ── */
  let result=null;
  if(landed){
    const call=resultCall(r,shot),swung=!!r.coverage?.length,outside=r.zone===9;
    const moves=Array.isArray(r.basesBefore)?runnerMoves(r.basesBefore,b.bases||[],LINEUP[b.batterIndex]?.id,r.label,id=>LINEUP.find(p=>p.id===id)?.name):[];
    result={call,label:r.label||'',kind:r.kind,action:r.action==='take'?'take':'swing',
      good:r.kind==='hit'||r.kind==='sacrifice'||call==='볼넷',exact:isExactRead(s),assistOnly:!!r.assistOnly,
      aimZone:swung?r.aimZone:null,actualZone:r.zone,outside,outsideNote:outside?(swung?'볼에 손이 나갔다':'볼을 골라냈다'):'',
      explanation:resultExplanation(s),damage:Math.max(0,combat?.damage??pitcher?.lastDamage??0),
      hpBefore,hpAfter:pitcher?.hp??null,knockedOut:(pitcher?.hp??1)===0,moves,
      next:s.phase==='pitch'?'pitch':s.phase==='between'?'batter':null};
  }

  const scene={artId,playToken,fxStage,shotGrade:shot?.grade||shot?.kind||null,
    pitchZone:judged?r.zone:null,knockedOut:judged&&((pre?hpBefore:pitcher?.hp)??1)===0,motionEnabled:false};
  /* 준비 유지 효과: 선택 중, 그리고 같은 타자의 다음 공을 기다리는 동안 (BallparkBattle prepEffects와 같다) */
  const effects=deciding||(landed&&!fxStage&&!locked&&s.phase==='pitch')?activePreparationFeedback(b,s.phase):[];
  return {phase,input,energy,hand:ordered,zones,forecast,hud,result,scene,effects};
}

function countShown(b,r,landed){
  const pre=!!r&&!landed;
  return {balls:pre&&Number.isInteger(r.ballsBefore)?r.ballsBefore:b.balls,
    strikes:pre&&Number.isInteger(r.strikesBefore)?r.strikesBefore:b.strikes,
    outs:pre&&Number.isInteger(r.outsBefore)?r.outsBefore:b.outs};
}
function emptyInput(){
  return {canSelect:false,canExecute:false,blockedReason:'',actionKind:'none',actionLabel:'',callback:null,autoNext:false,ariaLabel:''};
}
function inputFor({phase,deciding,selected,mainIsSkill,choice,armed,inspectOpen,locked,fxStage,commitBeat,hasNext,nextLabel,s,takeHint}){
  const out=emptyInput();
  out.canSelect=deciding&&!inspectOpen;
  if(deciding){
    out.actionKind=armed?'support-zone':!selected?'watch':mainIsSkill?'prepare':'swing';
    const problem=selected?choice?.problem||null:null;
    out.blockedReason=inspectOpen?'정보창을 닫으면 이어서 고를 수 있다':armed?'지원할 코스를 9존에서 고르세요':problem?(shortCardProblem(problem)||problem):'';
    out.canExecute=!inspectOpen&&!armed&&!problem;
  }else if(phase==='committing'||phase==='flight'){
    out.actionKind='busy';
  }else if(hasNext&&(s.phase==='pitch'||s.phase==='between')){
    out.actionKind='next';
    out.canExecute=!inspectOpen&&!locked&&!fxStage;
    out.autoNext=out.canExecute&&!commitBeat;
  }
  out.actionLabel=out.actionKind==='next'?nextLabel||ACTION_LABELS.next:ACTION_LABELS[out.actionKind];
  out.callback=ACTION_CALLBACKS[out.actionKind]||null;
  out.ariaLabel=out.actionKind==='watch'?`${out.actionLabel} · ${takeHint}`:out.blockedReason&&!out.canExecute?`${out.actionLabel} · ${out.blockedReason}`:out.actionLabel;
  return out;
}
