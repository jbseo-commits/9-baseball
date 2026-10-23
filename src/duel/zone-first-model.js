import {CARDS,shadeNameFor,rangeFor} from './cards.js';
import {createV10Duel,applyStartPack,START_PACKS,enterV10Node,publicProbabilities,knownPitchZones,readLevel} from './engine.js';
import {probabilityBounds} from './information.js';
import {ZONE_WORDS} from './ballpark-copy.js';

export const FIRST_LESSONS=[
  {name:'첫 스윙',title:'밝은 코스를 눌러보세요',text:'공이 자주 오는 바깥쪽 코스를 고르고, 타격을 누르세요.'},
  {name:'투수 압박',title:'안타가 투수를 무너뜨립니다',text:'다시 코스를 맞혀보세요. 안타를 치면 위의 투수 HP가 줄어듭니다.'},
  {name:'집중 카드',title:'타격 전에, 집중 한 번',text:'타이밍 맞추기를 골라 준비 사용을 누르세요. 집중은 맞힌 공의 타구 질을 높입니다.'},
];

// An explicitly labelled, repeatable practice setup. Configure before the engine
// deals: never replace a pending pitch, random roll, or resolved outcome.
export function createLessonBattle(seed=20261023){
  const run=createV10Duel(seed,{tutorial:true});
  run.deck=[{id:'lesson-setup',kind:'setup'}];run.nextId=1;
  const node=run.runMap.nodes.find(n=>run.runMap.reachableIds.includes(n.id)&&n.opponent);
  node.opponent={...node.opponent,name:'레드 러시',style:'rookie',archetype:'outside',
    artId:'regular-01-red-rush',archetypeKey:'outside',openingZones:[5],threat:'코스 하나를 반복하는 연습 상대',zoneOpen:1,zoneMax:1,gimmick:null};
  return enterV10Node(run,node.id);
}

export function isExactRead(s){
  const r=s.battle?.revealed;
  return !!r&&r.kind==='hit'&&!r.assistOnly&&r.zone===r.aimZone
    &&(r.primaryCoverage||r.coverage||[]).includes(r.zone);
}

export function resultExplanation(s){
  const r=s.battle?.revealed;
  if(!r)return '';
  const actual=r.zone===9?'존 밖':ZONE_WORDS[r.zone];
  const choice=r.action==='take'?'지켜봄':`${ZONE_WORDS[r.aimZone]||'코스'} 노림`;
  const covered=(r.primaryCoverage||r.coverage||[]).includes(r.zone);
  const reason=r.action==='take'?(r.zone===9?'볼':'스트라이크'):
    r.kind==='hit'?(r.assistOnly||!covered?'지원 적중':isExactRead(s)?'정확 적중':'범위 적중'):
    r.kind==='sacrifice'?'번트 성공':r.zone===9?'유인구에 스윙':!covered?'범위 밖':'';
  return `${choice} → 실제 ${actual} → ${[reason,r.label].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')}`;
}

// Reuse the real starter catalog and opening-role guarantees from the main game.
export function createPreviewBattle(seed=20261015,packId='power'){
  const pack=START_PACKS.find(p=>p.id===packId)||START_PACKS[0];
  const run=applyStartPack(createV10Duel(seed),pack.id);
  return enterV10Node(run,'a1-entry');
}

const SHAPE_LABELS={point:'1존',row:'가로',column:'세로',cross:'십자',all:'전체',pairH:'가로 2칸',pairV:'세로 2칸',diag:'대각선',x:'X자',box:'주변',corners:'모서리'};
export function handOverview(s){
  const hand=(s.battle?.hand||[]).map(id=>s.deck.find(c=>c.id===id)).filter(Boolean);
  return {shapes:[...new Set(hand.filter(c=>CARDS[c.kind]?.type==='attack').map(c=>SHAPE_LABELS[CARDS[c.kind].shape]||'특수 범위'))],
    preparations:hand.filter(c=>CARDS[c.kind]?.type==='skill').length,kinds:hand.slice(0,3).map(c=>c.kind)};
}

export function publicZoneFaces(s){
  const probabilities=publicProbabilities(s),known=knownPitchZones(s),level=readLevel(s);
  const live=s.battle.intent.repertoire||[0,1,2,3,4,5,6,7,8];
  const inside=probabilities.slice(0,9).reduce((a,b)=>a+b,0)||1;
  return probabilities.slice(0,9).map((p,z)=>({
    live:live.includes(z),
    text:!live.includes(z)?'안 던짐':!known.includes(z)?'단서 밖':known.length===1?'확정':
      level===2?Math.round(p*100)+'%':level===1?rangeFor(p):shadeNameFor(p/inside),
  }));
}

export function publicCoverText(s,zones){
  if(!zones?.length)return '';
  // Level zero cells expose only normalized in-zone tendencies. Do not derive
  // numerical bounds from hidden absolute probability mass (including balls).
  if(readLevel(s)===0)return '';
  const bounds=probabilityBounds(s);
  const low=Math.max(0,zones.reduce((a,z)=>a+bounds[z][0],0));
  const high=Math.min(1,zones.reduce((a,z)=>a+bounds[z][1],0));
  return readLevel(s)===2?`적중권 ${Math.round(low*100)}%`:
    `적중권 ${Math.floor(low*100+1e-9)}–${Math.ceil(high*100-1e-9)}%`;
}

// Interpret only an already revealed result. No odds, rolls or pending pitch access.
export function resultFeedback(s){
  const r=s.battle?.revealed,combat=s.v10?.lastCombat;
  if(!r)return {tone:'quiet',title:'',detail:''};
  const damage=combat?.damage||0;
  const damageText=damage?`투수 HP −${damage}`:'';
  const strikeout=/삼진/.test(r.label||'')||s.battle.outs>(r.outsBefore??s.battle.outs)&&['whiff','called','foul'].includes(r.kind);
  if(s.pitcher.hp<=0)return {tone:'big',title:'강판!',detail:damageText};
  if(r.kind==='hit'){
    const homer=/홈런/.test(r.label||'');
    const mainHit=(r.primaryCoverage||r.coverage||[]).includes(r.zone);
    const title=homer?'넘겼다!':mainHit&&r.zone===r.aimZone?'정확히 읽었다!':mainHit?'노린 범위다!':'지원이 받쳤다!';
    return {tone:homer?'big':'good',title,detail:[r.label,damageText].filter(Boolean).join(' · ')};
  }
  if(r.kind==='ball')return {tone:'good',title:r.label==='볼넷'?'끝까지 잘 참았다!':'잘 참았다.',detail:r.label==='볼넷'?'볼넷 · 출루':'볼 +1'};
  if(r.kind==='sacrifice')return {tone:'good',title:'작전 성공.',detail:[r.label,damageText].filter(Boolean).join(' · ')};
  const covered=r.coverage||[];
  const distance=Number.isInteger(r.zone)&&r.zone>=0&&r.zone<9&&covered.length?
    Math.min(...covered.map(z=>Math.abs(Math.floor(z/3)-Math.floor(r.zone/3))+Math.abs(z%3-r.zone%3))):Infinity;
  if(['whiff','foul','out'].includes(r.kind)&&distance===1)
    return {tone:'near',title:'한 칸 차이…',detail:[strikeout?'삼진':r.label,damageText].filter(Boolean).join(' · ')};
  if(r.kind==='foul'&&!strikeout)return {tone:'quiet',title:'아직 승부 중.',detail:['파울',damageText].filter(Boolean).join(' · ')};
  return {tone:'quiet',title:strikeout?'삼진.':r.kind==='called'?'스트라이크.':r.label||'다음 승부를 준비하자.',detail:damageText};
}

export function entryName(entry){return entry?.kind==='basic'?'기본 스윙':(CARDS[entry?.kind]?.name||'')+(entry?.plus?'+':'');}
