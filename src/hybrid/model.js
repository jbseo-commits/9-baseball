import {createV10Duel,enterV10Node,setAimZone,playV10Action,advanceV10Pitch,advanceV10Batter,cardProblem,previewV10Stack,readLevel} from '../duel/engine.js';
import {probabilityBounds} from '../duel/information.js';
import {CARDS} from '../duel/cards.js';
import {presentationFor} from '../duel/presentation.js';
import {redRushTimeline} from '../duel/pitcher-sd.js';
import {actorContactPoint} from '../duel/actorContact.js';
import {BATTER_MOTION_V3_HIT_GRADES} from '../duel/batterMotionV3.js';

export const COMMON=['place','strike','setup','watch','scout','defend'];
export const PACKS={
  precision:{name:'정밀 승부',en:'THE PERFECT READ',symbol:'◎',color:'#f3c56f',pack:['place','slug','scout'],core:'scout',title:'읽고. 기다리고. 꿰뚫는다.',description:'릴리스 간파로 높이를 읽고, 정타 노림의 정확 적중에 투자하세요.',short:'관찰 → 한 칸 승부',art:3},
  relay:{name:'주자 연결',en:'KEEP THE LINE MOVING',symbol:'↗',color:'#74d8cf',pack:['rally','flow','bunt'],core:'rally',title:'한 명의 안타가, 다음 기회로.',description:'먼저 출루를 만들고, 주자 연결·사인·번트로 다음 타석까지 설계하세요.',short:'출루 → 사인 → 진루',art:1},
  grind:{name:'끈질긴 압박',en:'MAKE EVERY PITCH COUNT',symbol:'≋',color:'#aabaf2',pack:['defend','calm','watch'],core:'calm',title:'끝나지 않는 타석의 압박.',description:'호흡과 손패를 확보하고 커트로 버티세요. 장타력과 생존을 교환합니다.',short:'호흡 → 커트 → 다음 공',art:4},
};
export const SHORT={place:'1존 · 정확 적중 HP +50%',strike:'세로 3존 · 바깥 공 보너스',slug:'1존 · 파워 +36',rally:'가로 3존 · 기존 주자 +2루',bunt:'9존 · 희생 성공 시 아웃 +1',defend:'십자 커버 · 적중 단타 · 파울 생존',setup:'집중 +1 · 이번 타석',watch:'카드 2장 뽑기',scout:'이번 공 높이 확인 · 카드 +1',flow:'안타 때 기존 주자 추가 +1루',calm:'파울 생존 · 카드 +1'};
export const ART_INDEX={place:0,strike:0,slug:0,rally:1,flow:1,bunt:2,scout:3,setup:3,defend:4,calm:4,watch:3};
export const entryFor=(s,id)=>s.deck.find(c=>c.id===id);
export const attackFor=(s,id)=>id==='basic'||CARDS[entryFor(s,id)?.kind]?.type==='attack';

export function startMatch(pack='precision',seed=Date.now()>>>0){
  const config=PACKS[pack]||PACKS.precision;
  let s=createV10Duel(seed);
  s.deck=[...COMMON,...config.pack].map((kind,i)=>({id:`hybrid-${i}`,kind}));
  s.nextId=9;
  s=enterV10Node(s,s.runMap.reachableIds[0]);
  // Guarantee the pack's first decision, preserving all nine physical card instances.
  // Only the opening shuffle is curated; B/S/O, runners, pitch and rolls stay engine-owned.
  const core=s.deck.slice(COMMON.length).find(c=>c.kind===config.core).id;
  if(!s.battle.hand.includes(core)){
    const returned=s.battle.hand.pop();
    s.battle.hand.push(core);
    s.battle.draw=s.battle.draw.filter(id=>id!==core);
    s.battle.draw.push(returned);
  }
  return setAimZone(s,7);
}

export function defaultCard(s){
  return s.battle.hand.find(id=>attackFor(s,id)&&!cardProblem(s,id))||'basic';
}
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
