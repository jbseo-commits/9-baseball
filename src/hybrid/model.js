import {createV10Duel,enterV10Node,setAimZone,playV10Action,advanceV10Pitch,advanceV10Batter,cardProblem,previewV10Stack,readLevel} from '../duel/engine.js';
import {probabilityBounds} from '../duel/information.js';
import {CARDS,cardCost} from '../duel/cards.js';
import {presentationFor} from '../duel/presentation.js';
import {redRushTimeline} from '../duel/pitcher-sd.js';
import {actorContactPoint} from '../duel/actorContact.js';
import {BATTER_MOTION_V3_HIT_GRADES} from '../duel/batterMotionV3.js';

export const PACKS={
  precision:{name:'정밀 승부',symbol:'◎',color:'#f3c56f',deck:['scout','pinpoint','focusBreath','place','slug','setup','scoreSheet','eyeLevel','strike'],opening:['scout','pinpoint'],core:'scout',short:'간파 → 1존 정타',identity:'정보에 에너지를 쓰고, 한 칸에 투자한다.'},
  relay:{name:'주자 연결',symbol:'↗',color:'#74d8cf',deck:['tableSetter','strike','rally','flow','bunt','hitAndRun','chainSign','relayBat','watch'],opening:['tableSetter','hitAndRun'],core:'tableSetter',short:'출루 → 주루 설계',identity:'첫 타석의 안타를, 다음 타석의 득점으로.'},
  grind:{name:'끈질긴 압박',symbol:'≋',color:'#aabaf2',deck:['wearDown','foulTip','defend','calm','longAtBat','fightOff','watch','setup','countBattle'],opening:['wearDown','foulTip'],core:'wearDown',short:'생존 → 파울 압박',identity:'단타와 파울로 버티며 투수 HP를 깎는다.'},
};
export const SHORT={place:'1존 · 정확 적중 HP +50%',strike:'세로 3존 · 바깥 공 보너스',slug:'1존 · 파워 +36',rally:'가로 3존 · 기존 주자 +2루',bunt:'9존 · 희생 성공 시 아웃 +1',defend:'십자 커버 · 적중 단타 · 파울 생존',setup:'집중 +1 · 이번 타석',watch:'카드 2장 뽑기',scout:'이번 공 높이 확인 · 카드 +1',flow:'안타 때 기존 주자 추가 +1루',calm:'파울 생존 · 카드 +1'};
export const cardSummary=kind=>SHORT[kind]||CARDS[kind]?.gives?.join(' · ')||CARDS[kind]?.text||'';
export const entryFor=(s,id)=>s.deck.find(c=>c.id===id);
export const attackFor=(s,id)=>id==='basic'||CARDS[entryFor(s,id)?.kind]?.type==='attack';

export function startMatch(pack='precision',seed=Date.now()>>>0){
  const config=PACKS[pack]||PACKS.precision;
  let s=createV10Duel(seed);
  s.deck=config.deck.map((kind,i)=>({id:`hybrid-${i}`,kind}));
  s.nextId=9;
  s=enterV10Node(s,s.runMap.reachableIds[0]);
  // Two complementary tools, three shuffled choices. Never mint/destroy a card or a runner.
  const opening=config.opening.map(kind=>s.deck.find(c=>c.kind===kind).id);
  for(const id of opening){
    if(s.battle.hand.includes(id))continue;
    const index=s.battle.hand.findLastIndex(other=>!opening.includes(other));
    const returned=s.battle.hand[index];s.battle.hand[index]=id;
    s.battle.draw=s.battle.draw.filter(other=>other!==id);s.battle.draw.push(returned);
  }
  return setAimZone(s,7);
}

// Public-state heuristic for optional spectator mode, not an optimal-play/hidden-roll solver.
export function publicDecision(s,pack){
  const b=s.battle,available=kind=>b.hand.find(id=>entryFor(s,id)?.kind===kind&&!cardProblem(s,id));
  const energy=b.energy,attackReady=b.hand.some(id=>attackFor(s,id)&&!cardProblem(s,id));
  const prep=kinds=>{
    if(b.preparations>=2||energy<2||!attackReady)return null;
    for(const kind of kinds){const id=available(kind);if(id)return {type:'card',id,zone:b.aimZone};}
    return null;
  };
  let preparation=null;
  if(pack==='precision')preparation=!b.scouted?prep(['coldRead','scout']):!b.bonusPressure?prep(['focusBreath']):null;
  if(pack==='relay'&&b.bases.some(Boolean)&&!b.runSignal&&!b.bonusDmg)preparation=prep(['flow','chainSign']);
  if(pack==='grind'&&!b.patient)preparation=prep(['wearDown','calm']);
  if(preparation)return preparation;
  const bounds=probabilityBounds(s),ball=(bounds[9][0]+bounds[9][1])/2;
  if(bounds[9][0]===1)return {type:'take'};
  const runners=b.bases.filter(Boolean).length;
  let best=null;
  for(const id of [...b.hand.filter(id=>attackFor(s,id)&&!cardProblem(s,id)),'basic']){
    const d=CARDS[entryFor(s,id)?.kind]||{};
    // A sacrifice needs a real runner and an out to spend. Players can still choose it freely.
    if(d.bunt&&(!runners||b.outs>=2))continue;
    for(let zone=0;zone<9;zone++){
      const at={...s,battle:{...b,aimZone:zone}};
      const p=actionPreview(at,id),range=coverageInterval(s,p.coverage||[]),hit=(range[0]+range[1])/2;
      let score=hit;
      if(pack==='precision')score=hit*(1+(d.pressure||0)+(b.bonusPressure||0))+(d.shape==='point'?.16:0);
      if(pack==='relay')score=d.bunt?hit*.25:hit*(1+runners*((d.advance||1)*.28+(d.fx?.perRunner||0)*.04))+(d.fx?.empty&&!runners?.35:0);
      if(pack==='grind')score=hit+Math.max(0,1-hit-ball)*(d.foulMiss||.08)*(.35+((d.fx?.foul||0)+(b.bonusFoul||0))*.08);
      score-=cardCost(entryFor(s,id))*.015+Math.abs(zone-b.aimZone)*.0001;
      if(!best||score>best.score)best={type:'card',id,zone,score};
    }
  }
  return best||{type:'take'};
}

export function tacticalRead(s,pack){
  const b=s.battle,runners=b.bases.filter(Boolean).length;
  const risk=b.outs===2?'2아웃 · 다음 아웃이면 승부 종료':b.strikes===2?'2스트라이크 · 헛스윙은 삼진':b.energy===0?'에너지 소진 · 기본 스윙 또는 지켜보기':`준비 ${Math.max(0,2-b.preparations)}회 · 에너지 ${b.energy}/${b.energyCap}`;
  if(pack==='precision')return {tag:'READ / COMMIT',title:b.scouted?'읽은 높이, 한 칸의 승부':'먼저 읽고, 좁게 노린다',metric:b.bonusPressure?`준비 효과 · 정확 적중 +${Math.round(b.bonusPressure*100)}%`:b.scouted?'간파 완료 · 코스판에서 남은 후보 확인':'간파는 공을 소비하지 않습니다',risk};
  if(pack==='relay')return {tag:'ON BASE / ADVANCE',title:runners?'살아 있는 주자를 홈으로':'첫 안타가 다음 작전의 시작',metric:runners?`주자 ${runners}명 · 사인/진루 효과 활성`:'빈 베이스 · 테이블 세터 안타 +3 HP',risk};
  return {tag:'SURVIVE / WEAR DOWN',title:b.patient?'파울도 투수를 압박한다':'끝나지 않는 타석을 만든다',metric:b.bonusFoul?`준비 효과 · 파울마다 +${b.bonusFoul} HP`:b.patient?'파울 생존 적용 중':'투구 수 늘리기 → 파울 추가 피해',risk};
}

export function defaultCard(s,pack){
  const preference=pack==='precision'?['pinpoint','place','eyeLevel']:pack==='relay'?(s.battle.bases.some(Boolean)?['hitAndRun','rally','relayBat']:['tableSetter','strike']):pack==='grind'?['foulTip','longAtBat','defend']:[];
  for(const kind of preference){const id=s.battle.hand.find(id=>entryFor(s,id)?.kind===kind&&!cardProblem(s,id));if(id)return id;}
  return s.battle.hand.find(id=>attackFor(s,id)&&!cardProblem(s,id))||'basic';
}

export const hasBatContact=shot=>shot?.motion?.swing!==false&&(BATTER_MOTION_V3_HIT_GRADES.has(shot?.grade)||['foul','battle-foul','sacrifice','sacrifice-run','out'].includes(shot?.grade));
export function actionPreview(s,id,supports=[]){
  const card=CARDS[entryFor(s,id)?.kind];
  return card?.type==='skill'?{skill:true,problem:cardProblem(s,id)}:previewV10Stack(s,id,supports);
}
export function resolveAction(s,action){
  const next=playV10Action(s,action);
  if(next===s)return null;
  const pitch=next.stats.pitches>s.stats.pitches;
  const raw=presentationFor(next);
  const shot=raw&&pitch?{...raw,motion:{...redRushTimeline(raw.motion),syncToPitcher:true,swing:action.type!=='take'}}:raw;
  return {next,pitch,shot,consumed:next.stats.cards-s.stats.cards};
}
export function continueMatch(s){
  return s.phase==='pitch'?advanceV10Pitch(s):s.phase==='between'?advanceV10Batter(s):s;
}

// Used by the fallback clock and verified independently of React/Pixi rendering.
export function pitchMilestones(motion){
  return [['focus',Math.max(0,motion.impactAt-520)],['release',motion.impactAt-300],['impact',motion.impactAt],['settled',motion.duration]];
}

export function intervalLabel([low,high]){
  if(Math.abs(high-low)<1e-8)return Math.round(low*100)+'%';
  return Math.floor((low+1e-9)*100)+'–'+Math.ceil((high-1e-9)*100)+'%';
}
export function visibleForecast(s){
  const bounds=probabilityBounds(s),level=readLevel(s);
  return {bounds,level,labels:bounds.map(([low,high])=>high===0?'—':low===high?intervalLabel([low,high]):level===0?(low>=.28?'자주':low>=.14?'가끔':'드묾'):intervalLabel([low,high]))};
}
export function coverageInterval(s,zones){
  const bounds=probabilityBounds(s);
  const sum=(inside,index)=>bounds.reduce((n,b,z)=>n+(zones.includes(z)===inside?b[index]:0),0);
  return [Math.max(0,sum(true,0),1-sum(false,1)),Math.min(1,sum(true,1),1-sum(false,0))];
}
export function fallbackElapsed(shot,elapsed,reduced=false){
  const impact=shot?.motion.impactAt;
  return !reduced&&shot?.motion.swing!==false&&BATTER_MOTION_V3_HIT_GRADES.has(shot?.grade)&&elapsed>=impact?Math.max(impact,elapsed-90):elapsed;
}
export function fallbackBall(shot,elapsed,zone,{b,p,geometry},reduced=false){
  const impact=shot?.motion.impactAt,release=impact-300;
  if(reduced||!shot||!b||!p||elapsed<release)return null;
  const {x:tx,y:ty}=actorContactPoint(b,zone,geometry?.contactAnchor);
  if(elapsed<=impact){
    const k=Math.pow((elapsed-release)/300,1.1),hx=p.x+p.w*(geometry?.exactScale ? .119 : .047),hy=p.y+p.h*.34;
    return {x:hx+(tx-hx)*k,y:hy+(ty-hy)*k-Math.sin(Math.PI*k)*b.h*.03,alpha:1,r:b.h*(.013+.004*k)};
  }
  const hit=['dead-center','solid','jammed','lucky','extra','homer','grand-slam'].includes(shot.grade),foul=shot.kind==='foul';
  const u=Math.min(1,(elapsed-impact)/(hit?650:foul?300:160));
  return {x:tx+u*b.h*(hit?2.5:foul?1.2:-.55),y:ty-u*b.h*(hit?1:foul?.4:-.06),alpha:1-u,r:b.h*.017};
}
