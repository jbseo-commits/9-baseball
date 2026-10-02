export const V10_RELICS=Object.freeze({
  firstPitch:{name:'초구 노림표',mark:'1ST',text:'타석 첫 공에서 HP 피해가 발생하면 +3 HP.'},
  twoStack:{name:'더블 그립',mark:'2X',text:'2장 SWING STACK의 HP 피해 효율 +10%p.'},
  foulTape:{name:'커트 테이프',mark:'CUT',text:'파울이 투수 HP에 추가 +2 피해.'},
  awayBadge:{name:'반대 방향 배지',mark:'OUT',text:'바깥쪽 코스를 안타로 만들면 추가 +4 HP.'},
  slugBand:{name:'클린업 손목밴드',mark:'XBH',text:'2루타 이상 장타면 추가 +4 HP.'},
});

/* 강적(엘리트)·보스를 이기면 반드시 받는 전용 유물. 상점 유물(위)과 풀이 다르고 효과가 더 크다.
   tier: 'elite'=강적 승리 보상 풀, 'boss'=보스 승리 보상 풀. 상점에는 나오지 않는다. */
export const V10_TIER_RELICS=Object.freeze({
  huntMark:{tier:'elite',name:'사냥꾼의 표식',mark:'+15%',text:'모든 HP 피해 +15%.'},
  hawkEye:{tier:'elite',name:'매의 눈',mark:'EYE',text:'읽기 단계 +1. 공개되는 정보가 한 단계 더 선명해진다.'},
  gritWrist:{tier:'elite',name:'끈질긴 손목',mark:'GRIT',text:'파울·헛스윙·볼도 투수 HP에 +3 피해.'},
  clutchRing:{tier:'elite',name:'클러치 반지',mark:'RBI',text:'주자가 있을 때 안타면 추가 +6 HP.'},
  crownBat:{tier:'boss',name:'왕관의 배트',mark:'CROWN',text:'2루타 이상 장타 +10 HP, 홈런은 +10 HP 더.'},
  wideNet:{tier:'boss',name:'그물 그립',mark:'NET',text:'카드를 겹칠 때 HP 피해 효율 +25%p (최대 100%).'},
  overwhelm:{tier:'boss',name:'압도',mark:'WIN',text:'모든 안타 +5 HP. 투수 HP가 60% 이하면 안타 +5 HP 더.'},
  giantBelt:{tier:'boss',name:'거인의 벨트',mark:'+25%',text:'모든 HP 피해 +25%.'},
});
export const V10_ALL_RELICS=Object.freeze({...V10_RELICS,...V10_TIER_RELICS});
export const v10RelicInfo=key=>V10_ALL_RELICS[key]||null;
export const V10_RELIC_KEYS=Object.freeze(Object.keys(V10_RELICS));
const ACT_POOLS=Object.freeze({
  1:['firstPitch','foulTape','twoStack','awayBadge'],
  2:['twoStack','awayBadge','slugBand','foulTape','firstPitch'],
  3:['slugBand','awayBadge','twoStack','foulTape','firstPitch'],
});
const mix=x=>{x=(x^61)^(x>>>16);x=(x+Math.imul(x,8))>>>0;x^=x>>>4;x=Math.imul(x,0x27d4eb2d)>>>0;x^=x>>>15;return x>>>0;};

export function v10RelicOffers({seed=0,act=1,nodeSeed=0,owned=[]}={}){
  const pool=(ACT_POOLS[act]||ACT_POOLS[1]).filter(k=>!owned.includes(k));
  if(pool.length<=2)return pool;
  const offset=mix((seed>>>0)^(nodeSeed>>>0)^Math.imul(act,0x9e3779b1))%pool.length;
  return [...pool.slice(offset),...pool.slice(0,offset)].slice(0,2);
}

/* 강적/보스 보상 후보: 그 등급 풀에서 아직 없는 유물을 시드로 섞어 count개. 보스는 보스 풀, 강적은 강적 풀만 쓴다. */
export function v10TierRelicOffers({tier='elite',seed=0,nodeSeed=0,act=1,owned=[],count=3}={}){
  const pool=Object.keys(V10_TIER_RELICS).filter(k=>V10_TIER_RELICS[k].tier===tier&&!owned.includes(k));
  if(pool.length<=count)return pool;
  const out=[],left=[...pool];let h=mix((seed>>>0)^(nodeSeed>>>0)^Math.imul(act+tier.length,0x9e3779b1));
  while(out.length<count&&left.length){h=mix(h+0x9e3779b9>>>0);out.push(left.splice(h%left.length,1)[0]);}
  return out;
}

export function v10RelicDamageRate(relics=[],cardCount=1,baseRate=1){
  let rate=relics.includes('twoStack')&&cardCount===2?Math.min(1,baseRate+.10):baseRate;
  if(relics.includes('wideNet')&&cardCount>=2)rate=Math.min(1,rate+.25);
  return rate;
}

const damagingOutcome=o=>o?.kind==='hit'||o?.kind==='foul'||o?.kind==='whiff'||o?.kind==='miss'||o?.kind==='ball'||o?.kind==='walk'||o?.kind==='out'||o?.kind==='sacrifice'||o?.label==='볼넷';

export function v10RelicDamagePlan({relics=[],outcome={},cardCount=1,damageRate=1,pitchInPA=1,runnersBefore=0,pitcherPhase='steady'}={}){
  const events=[];
  let rate=v10RelicDamageRate(relics,cardCount,damageRate);
  let bonus=0;
  if(relics.includes('huntMark')){rate*=1.15;events.push('사냥꾼의 표식 · 피해 +15%');}
  if(relics.includes('giantBelt')){rate*=1.25;events.push('거인의 벨트 · 피해 +25%');}
  if(relics.includes('twoStack')&&cardCount===2&&rate!==damageRate)events.push('더블 그립 · 2장 스택 피해 +10%p');
  if(relics.includes('firstPitch')&&pitchInPA===1&&damagingOutcome(outcome)){
    bonus+=3;events.push('초구 노림표 · +3 HP');
  }
  if(relics.includes('foulTape')&&outcome?.kind==='foul'){
    bonus+=2;events.push('커트 테이프 · 파울 +2 HP');
  }
  if(relics.includes('awayBadge')&&outcome?.kind==='hit'&&Number.isInteger(outcome.zone)&&outcome.zone%3===2){
    bonus+=4;events.push('반대 방향 배지 · 바깥 안타 +4 HP');
  }
  if(relics.includes('slugBand')&&outcome?.kind==='hit'&&(outcome.bases||1)>=2){
    bonus+=4;events.push('클린업 손목밴드 · 장타 +4 HP');
  }
  const hit=outcome?.kind==='hit',bases=outcome?.bases||1;
  if(relics.includes('gritWrist')&&['foul','whiff','miss','ball'].includes(outcome?.kind)){bonus+=3;events.push('끈질긴 손목 · +3 HP');}
  if(relics.includes('clutchRing')&&hit&&runnersBefore>0){bonus+=6;events.push('클러치 반지 · 주자 있는 안타 +6 HP');}
  if(relics.includes('crownBat')&&hit&&bases>=2){const n=bases>=4?20:10;bonus+=n;events.push('왕관의 배트 · '+(bases>=4?'홈런':'장타')+' +'+n+' HP');}
  if(relics.includes('overwhelm')&&hit){const n=pitcherPhase==='steady'?5:10;bonus+=n;events.push('압도 · 안타 +'+n+' HP');}
  return {damageRate:rate,damageBonus:bonus,events};
}
