/* 엘리트·보스 기믹 (docs/ELITE-BOSS-GIMMICKS.md). 규칙은 전부 공개되고 지도·전투 화면에 같은 문구로 보인다.
   데이터(캐릭터→기믹)와 수치(기믹+HP 단계→보정)를 이 한 곳에 모은다. 엔진은 gimmickRules()만 읽는다.
   phase는 pitcher-hp의 pitcherPhase: steady(>60%) / pressured(≤60%) / critical(≤30%). */

export const GIMMICKS=Object.freeze({
  'elite-01-cobalt-impact':{id:'pressure',label:'압박 투구',
    summary:'2스트라이크가 되면 코스가 2개 더 열리고, 존 밖 공이 절반으로 줄어 기다리기가 어려워진다.'},
  'elite-02-neon-trick':{id:'trick',label:'속임수 코스',
    summary:'타석 첫 공은 30% 확률로 예고된 코스 옆 칸으로 밀려 들어온다.'},
  'elite-03-wine-bluff':{id:'bluff',label:'볼 유인',
    summary:'존 밖 볼이 평소보다 20%p 늘어난다. 치지 않고 기다리는 선택이 값지다.'},
  /* 신규 엘리트(2026-10-02 합류 예정)는 어울리는 기존 기믹을 쓴다: 에어벤더=속임수, 스플링커 파이어볼러=압박 */
  'gale-twister':{id:'trick',label:'속임수 코스',
    summary:'타석 첫 공은 30% 확률로 예고된 코스 옆 칸으로 밀려 들어온다.'},
  'vulcan-blaze':{id:'pressure',label:'압박 투구',
    summary:'2스트라이크가 되면 코스가 2개 더 열리고, 존 밖 공이 절반으로 줄어 기다리기가 어려워진다.'},
  'boss-01-emerald-tyrant':{id:'tyrant',label:'낮은 벽',
    summary:'낮은 3코스 비중 +10%p.',
    phases:{pressured:'지배: 준비는 타석당 1회로 줄어든다.',critical:'낮은 3코스 비중이 +20%p로 커진다.'}},
  'boss-02-platinum-halo':{id:'halo',label:'후퇴 수비',
    summary:'높은 공과 깊은 수비로 홈런 외 장타를 단타로 누른다.',
    phases:{pressured:'후광: 한 번에 겹칠 수 있는 카드가 3장으로 줄어든다.',critical:'존 밖 볼이 +10%p 늘어난다.'}},
  'boss-03-black-eclipse':{id:'eclipse',label:'반대 열 승부',
    summary:'직전에 노린 열의 반대 열을 찌른다.',
    phases:{pressured:'일식: 반대 열 쏠림이 더 강해진다.',critical:'준비는 타석당 1회로 줄어든다.'}},
});
const LEVEL={steady:0,pressured:1,critical:2};
export const gimmickFor=artId=>{const g=GIMMICKS[artId];return g?{id:g.id,label:g.label,summary:g.summary,phases:g.phases?{...g.phases}:null}:null;};

const NONE=Object.freeze({putawayExtra:0,putawayBallMul:1,ballShare:0,lowShare:0,oppCol:0,prepMax:2,stackMax:4,trickRate:0});
/* 기믹 id + HP 단계 → 엔진이 더하거나 곱할 보정. 기믹이 없으면 모두 중립이다. */
export function gimmickRules(id,phase='steady'){
  const lv=LEVEL[phase]??0;
  switch(id){
    case 'pressure':return {...NONE,putawayExtra:2,putawayBallMul:.5};
    case 'trick':return {...NONE,trickRate:.3};
    case 'bluff':return {...NONE,ballShare:.2};
    case 'tyrant':return {...NONE,lowShare:lv>=2?.2:.1,prepMax:lv>=1?1:2};
    case 'halo':return {...NONE,stackMax:lv>=1?3:4,ballShare:lv>=2?.1:0};
    case 'eclipse':return {...NONE,oppCol:lv>=1?6:0,prepMax:lv>=2?1:2};
    default:return NONE;
  }
}
/* 가중치 배열에서 idxs 칸들의 몫을 share만큼 늘린다. (S+d)/(T+d)=t 를 풀어 d만큼 더한다. */
export function addShare(weights,idxs,share){
  if(!share)return weights;
  const T=weights.reduce((a,x)=>a+x,0),S=idxs.reduce((a,i)=>a+weights[i],0);
  const t=Math.min(.95,S/T+share),d=(t*T-S)/(1-t);
  idxs.forEach(i=>{weights[i]+=d/idxs.length;});return weights;
}
/* 첫 공이 옆 칸으로 밀릴 때의 이웃 코스(상하좌우, 존 안만). */
export function trickNeighbors(zone){
  const r=Math.floor(zone/3),c=zone%3,out=[];
  if(c>0)out.push(zone-1);if(c<2)out.push(zone+1);if(r>0)out.push(zone-3);if(r<2)out.push(zone+3);
  return out;
}
