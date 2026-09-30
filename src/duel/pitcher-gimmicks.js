/* 강적·보스 기믹: 체력만 높은 상대가 아니라, 공략하면 크게 이기고 놓치면 크게 잃는 규칙을 하나씩 든다.
   모든 기믹은 위험(risk)과 보상(reward)을 같이 가진다. 화면은 이 표를 그대로 읽어 보여준다. */
export const GIMMICKS=Object.freeze({
  killZone:{name:'결정구',mark:'◎',
    risk:'투스트라이크에서 결정구 존 비중이 크게 오른다. 결정구에 삼진당하면 투수 HP +8 회복',
    reward:'결정구 존 공을 안타로 받아치면 피해 ×2'},
  armor:{name:'철갑',mark:'▣',
    risk:'HP 앞에 철갑(최대 HP의 25%). 단타·파울·볼 피해는 철갑이 먼저 받는다',
    reward:'2루타 이상이면 철갑을 한 번에 부수고 그 피해가 전부 HP로 · 파괴 +8'},
  rage:{name:'분노',mark:'▲',
    risk:'HP 50% 이하부터 투수 능력 +8',
    reward:'HP 50% 이하부터 안타 피해 +50%'},
  gamble:{name:'승부사',mark:'♠',
    risk:'삼진마다 투수 HP +8 회복',
    reward:'투스트라이크에서 친 안타 피해 ×2'},
});
export const GIMMICK_KEYS=Object.freeze(Object.keys(GIMMICKS));
const BOSS_GIMMICKS={1:['killZone'],2:['armor'],3:['killZone','rage']};
export const GIMMICK_TUNING=Object.freeze({killZoneWeight:14,killZoneHeal:8,armorRate:.25,armorBreak:8,rageAt:.5,rageStat:8,rageRate:.5,gambleHeal:8,rewardAt:2,rareBoost:4});
/* 기믹을 두 번 이상 공략(보상 쪽 발동)하면 보상 드래프트 등급이 한 단계 오른다. */
export const GIMMICK_REWARD_TEXT=`기믹 공략 ${GIMMICK_TUNING.rewardAt}회 이상이면 보상 등급 +1`;

const mix=x=>{x=(x^61)^(x>>>16);x=(x+Math.imul(x,8))>>>0;x^=x>>>4;x=Math.imul(x,0x27d4eb2d)>>>0;x^=x>>>15;return x>>>0;};

/* 지도 생성 때 한 번 정한다. 강적은 시드로 하나, 보스는 막마다 고정. */
export function rollGimmicks(seed,salt,type,act,openingZones=[]){
  if(type!=='elite'&&type!=='boss')return {};
  const keys=type==='boss'?(BOSS_GIMMICKS[act]||BOSS_GIMMICKS[1]):[GIMMICK_KEYS[mix((seed>>>0)^Math.imul(salt+7,0x85ebca6b))%GIMMICK_KEYS.length]];
  const out={gimmicks:[...keys]};
  if(keys.includes('killZone')){
    const zones=openingZones.length?openingZones:[4];
    out.killZone=zones[mix((seed>>>0)^Math.imul(salt+11,0xc2b2ae35))%zones.length];
  }
  return out;
}

export const hasGimmick=(opponent,key)=>Array.isArray(opponent?.gimmicks)&&opponent.gimmicks.includes(key);
export const armorFor=(opponent,maxHp)=>hasGimmick(opponent,'armor')?Math.round(maxHp*GIMMICK_TUNING.armorRate):0;
export const isEnraged=(opponent,pitcher)=>hasGimmick(opponent,'rage')&&!!pitcher&&pitcher.hp>0&&pitcher.hp<=pitcher.maxHp*GIMMICK_TUNING.rageAt;

/* 지도·전투 화면용 한 줄 설명 */
export function gimmickLines(opponent){
  if(!Array.isArray(opponent?.gimmicks))return [];
  return opponent.gimmicks.filter(k=>GIMMICKS[k]).map(k=>{
    const g=GIMMICKS[k],zone=k==='killZone'&&Number.isInteger(opponent.killZone)?opponent.killZone:null;
    return {key:k,name:g.name,mark:g.mark,zone,risk:g.risk,reward:g.reward};
  });
}

/* 한 공의 기믹 결과. before는 공 던지기 전 상태, r은 판정, damage는 기믹 전 최종 피해.
   bonus: 추가 피해, heal: 투수 회복, armorHit: 철갑이 흡수한 양, exploit: 보상 쪽이 발동했는지 */
export function gimmickPlan({opponent,pitcher,strikesBefore=0,r,damage=0,bases=0}){
  const events=[];let bonus=0,heal=0,exploit=0;
  if(!opponent||!pitcher||!r)return {bonus,heal,exploit,events};
  const hit=r.kind==='hit',strikeout=/삼진/.test(r.label||'');
  if(hasGimmick(opponent,'killZone')&&r.zone===opponent.killZone){
    if(hit&&damage>0){bonus+=damage;exploit++;events.push('결정구 공략 · 피해 ×2 +'+damage+' HP');}
    else if(strikeout){heal+=GIMMICK_TUNING.killZoneHeal;events.push('결정구 삼진 · 투수 HP +'+GIMMICK_TUNING.killZoneHeal+' 회복');}
  }
  if(hasGimmick(opponent,'rage')&&isEnraged(opponent,pitcher)&&hit&&damage>0){
    const add=Math.round(damage*GIMMICK_TUNING.rageRate);bonus+=add;exploit++;events.push('분노한 투수 · 안타 피해 +50% · +'+add+' HP');
  }
  if(hasGimmick(opponent,'gamble')){
    if(hit&&strikesBefore===2&&damage>0){bonus+=damage;exploit++;events.push('승부사 격파 · 투스트라이크 안타 ×2 +'+damage+' HP');}
    else if(strikeout){heal+=GIMMICK_TUNING.gambleHeal;events.push('승부사 · 삼진 · 투수 HP +'+GIMMICK_TUNING.gambleHeal+' 회복');}
  }
  if(hasGimmick(opponent,'armor')&&(pitcher.armor||0)>0&&hit&&bases>=2){
    bonus+=GIMMICK_TUNING.armorBreak;exploit++;events.push('철갑 파괴 · 장타 +'+GIMMICK_TUNING.armorBreak+' HP');
  }
  return {bonus,heal,exploit,events};
}

/* applyPitcherOutcome 뒤에 기믹을 반영한다: 추가 피해 → 철갑 흡수 → 회복 순서.
   before는 이번 공 이전 투수, after는 기믹 없이 계산한 투수. */
export function settleGimmicks({opponent,before,after,plan,bases=0,phaseOf}){
  const events=[];const next={...after};
  if(plan.bonus>0&&next.hp>0){next.hp=Math.max(0,next.hp-plan.bonus);}
  let dealt=before.hp-next.hp;
  if(hasGimmick(opponent,'armor')&&(before.armor||0)>0){
    if(bases>=2)next.armor=0;
    else if(dealt>0){
      const absorbed=Math.min(before.armor,dealt);next.armor=before.armor-absorbed;next.hp+=absorbed;dealt-=absorbed;
      events.push('철갑이 '+absorbed+' 흡수 · 남은 철갑 '+next.armor+(next.armor?'':' · 철갑 붕괴'));
    }
  }
  next.lastDamage=Math.max(0,dealt);
  if(plan.heal&&next.hp>0){
    /* 회복한 공은 피해 0으로 적는다: 화면이 hp+lastDamage로 '맞기 전' 게이지를 그리기 때문 */
    const was=next.hp;next.hp=Math.min(next.maxHp,next.hp+plan.heal);next.lastDamage=0;
    if(next.hp===was)events.push('투수 HP 가득 · 회복 없음');
  }
  next.phase=phaseOf(next.hp,next.maxHp);
  return {pitcher:next,damage:next.lastDamage,events};
}
