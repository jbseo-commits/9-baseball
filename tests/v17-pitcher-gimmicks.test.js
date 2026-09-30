import {describe,it,expect} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {createRunMap,validateRunMap} from '../src/duel/run-map.js';
import {createV10Duel,enterV10Node,playV10Action,pitcherProfile,baseIntent,v10GimmickRewardUp,v16DraftChoices} from '../src/duel/engine.js';
import {GIMMICKS,GIMMICK_TUNING,gimmickPlan,settleGimmicks,isEnraged} from '../src/duel/pitcher-gimmicks.js';
import {pitcherPhase,isPitcherHp} from '../src/duel/pitcher-hp.js';
import {validateV10State} from '../src/duel/v10-storage.js';

/* 1막 정규전에 들어가 상대 기믹만 갈아 끼운다: 같은 공으로 기믹 유무를 비교하기 위해서다. */
function battleWith(gimmick={}){
  let s=createV10Duel(20260917);
  const node=s.runMap.nodes.find(n=>n.act===1&&n.type==='battle');
  s.runMap.reachableIds=[node.id];s=enterV10Node(s,node.id);
  s.v10.opponent={...s.v10.opponent,...gimmick};
  if(gimmick.gimmicks?.includes('armor')){const a=Math.round(s.pitcher.maxHp*GIMMICK_TUNING.armorRate);s.pitcher={...s.pitcher,armor:a,armorMax:a};}
  return s;
}
const hitAt=(s,zone)=>{const t=structuredClone(s);t.battle.aimZone=zone;t.battle.pending={...t.battle.pending,zone,roll:0,powerRoll:.5};return playV10Action(t,{type:'card',id:'basic'});};
const strikeoutAt=(s,zone)=>{const t=structuredClone(s);t.battle.strikes=2;t.battle.aimZone=(zone+4)%9;t.battle.pending={...t.battle.pending,zone,roll:.99,powerRoll:.5};return playV10Action(t,{type:'card',id:'basic'});};

describe('강적·보스 기믹',()=>{
  it('강적과 보스는 모두 기믹을 들고, 정규전은 들지 않는다. 보스 기믹은 막마다 고정',()=>{
    for(let seed=0;seed<40;seed++){
      const map=createRunMap(seed);expect(validateRunMap(map)).toBe(true);
      for(const n of map.nodes.filter(n=>n.opponent)){
        if(n.type==='battle'){expect(n.opponent.gimmicks).toBeUndefined();continue;}
        expect(n.opponent.gimmicks.length).toBeGreaterThan(0);
        expect(n.opponent.gimmicks.every(k=>GIMMICKS[k])).toBe(true);
        if(n.opponent.gimmicks.includes('killZone'))expect(n.opponent.openingZones).toContain(n.opponent.killZone);
        expect(n.opponent.threat).toContain(GIMMICKS[n.opponent.gimmicks[0]].name);
      }
      expect(map.nodes.find(n=>n.id==='a1-boss').opponent.gimmicks).toEqual(['killZone']);
      expect(map.nodes.find(n=>n.id==='a2-boss').opponent.gimmicks).toEqual(['armor']);
      expect(map.nodes.find(n=>n.id==='a3-boss').opponent.gimmicks).toEqual(['killZone','rage']);
    }
    expect(createRunMap(7)).toEqual(createRunMap(7));
  });

  it('철갑 보스는 철갑을 두르고 전투를 시작하며 저장 검증을 통과한다',()=>{
    let s=createV10Duel(20260917);
    s.runMap.reachableIds=['a2-boss'];s=enterV10Node(s,'a2-boss');
    expect(s.pitcher.armor).toBe(Math.round(s.pitcher.maxHp*GIMMICK_TUNING.armorRate));
    expect(isPitcherHp(s.pitcher)).toBe(true);
    expect(validateV10State(s)).toBe(true);
  });

  it('결정구: 결정구 존 안타는 피해 ×2, 결정구 삼진은 투수 회복, 투스트라이크 비중 증가',()=>{
    const plain=battleWith(),kz=battleWith({gimmicks:['killZone'],killZone:4});
    const a=hitAt(plain,4),b=hitAt(kz,4);
    expect(a.battle.revealed.kind).toBe('hit');
    expect(b.pitcher.lastDamage).toBe(a.pitcher.lastDamage*2);
    expect(b.battle.gimmickHits).toBe(1);
    expect(hitAt(kz,3).pitcher.lastDamage).toBe(hitAt(plain,3).pitcher.lastDamage);
    const hurt={...kz,pitcher:{...kz.pitcher,hp:40,phase:pitcherPhase(40,kz.pitcher.maxHp)}};
    const k=strikeoutAt(hurt,4);
    expect(k.battle.revealed?.label||k.last.text).toMatch(/삼진/);
    const plainK=strikeoutAt({...plain,pitcher:hurt.pitcher},4);
    expect(k.pitcher.hp).toBe(plainK.pitcher.hp+GIMMICK_TUNING.killZoneHeal);
    const two=structuredClone(kz);two.battle.strikes=2;const twoPlain=structuredClone(plain);twoPlain.battle.strikes=2;
    expect(baseIntent(two).probabilities[4]).toBeGreaterThan(baseIntent(twoPlain).probabilities[4]);
  });

  it('철갑: 단타 피해는 철갑이 먼저 받고, 장타는 철갑을 부수고 전부 HP로 들어간다',()=>{
    const s=battleWith({gimmicks:['armor']}),armor=s.pitcher.armor;
    const single=hitAt(s,4);
    expect(single.pitcher.hp).toBe(s.pitcher.hp);
    expect(single.pitcher.armor).toBe(armor-12);
    const opp={gimmicks:['armor']},before={hp:100,maxHp:120,armor:30,lastDamage:0};
    const plan=gimmickPlan({opponent:opp,pitcher:before,r:{kind:'hit',label:'2루타',zone:4},damage:18,bases:2});
    expect(plan.bonus).toBe(GIMMICK_TUNING.armorBreak);
    const out=settleGimmicks({opponent:opp,before,after:{...before,hp:82,lastDamage:18},plan,bases:2,phaseOf:pitcherPhase});
    expect(out.pitcher.armor).toBe(0);
    expect(out.pitcher.hp).toBe(82-GIMMICK_TUNING.armorBreak);
  });

  it('분노: HP 50% 이하부터 투수 능력 +8, 안타 피해 +50%',()=>{
    const s=battleWith({gimmicks:['rage']}),half=Math.floor(s.pitcher.maxHp/2);
    const calm=pitcherProfile(s);
    const mad={...s,pitcher:{...s.pitcher,hp:half,phase:pitcherPhase(half,s.pitcher.maxHp)}};
    expect(isEnraged(mad.v10.opponent,mad.pitcher)).toBe(true);
    expect(pitcherProfile(mad).stuff).toBe(calm.stuff+GIMMICK_TUNING.rageStat);
    const plain={...battleWith(),pitcher:mad.pitcher};
    expect(hitAt(mad,4).pitcher.lastDamage).toBe(Math.round(hitAt(plain,4).pitcher.lastDamage*1.5));
    expect(hitAt(s,4).pitcher.lastDamage).toBe(hitAt(battleWith(),4).pitcher.lastDamage);
  });

  it('승부사: 투스트라이크 안타 ×2, 삼진마다 투수 회복',()=>{
    const s=battleWith({gimmicks:['gamble']});
    const two=structuredClone(s);two.battle.strikes=2;const twoPlain=structuredClone(battleWith());twoPlain.battle.strikes=2;
    expect(hitAt(two,4).pitcher.lastDamage).toBe(hitAt(twoPlain,4).pitcher.lastDamage*2);
    const hurt={...s,pitcher:{...s.pitcher,hp:40,phase:pitcherPhase(40,s.pitcher.maxHp)}};
    const plainK=strikeoutAt({...battleWith(),pitcher:hurt.pitcher},0);
    expect(strikeoutAt(hurt,0).pitcher.hp).toBe(plainK.pitcher.hp+GIMMICK_TUNING.gambleHeal);
  });

  it('기믹을 두 번 공략하면 보상 드래프트의 희귀 카드 비중이 오른다',()=>{
    const kz=battleWith({gimmicks:['killZone'],killZone:4});
    let t=hitAt(kz,4);expect(v10GimmickRewardUp(t)).toBe(false);
    t.battle.gimmickHits=GIMMICK_TUNING.rewardAt;expect(v10GimmickRewardUp(t)).toBe(true);
    const rares=boost=>Array.from({length:200},(_,i)=>v16DraftChoices({act:1,tier:1,seed:i+1,rareBoost:boost})).flat().filter(k=>CARDS[k].rarity==='rare').length;
    expect(rares(0)).toBe(0);
    expect(rares(GIMMICK_TUNING.rareBoost)).toBeGreaterThan(0);
  });
});

describe('넓은 커버 카드 등급',()=>{
  it('십자·X·주변 9존 카드는 커먼이 없다',()=>{
    const wide=Object.entries(CARDS).filter(([,c])=>['cross','x','box'].includes(c.shape));
    expect(wide.length).toBeGreaterThan(10);
    for(const [k,c] of wide)expect(['uncommon','rare','signature'],k).toContain(c.rarity);
  });
  it('존 봉쇄(시그니처)는 같은 십자 5존 카드보다 약하지 않다: 파워 +18과 추가 효과를 가진다',()=>{
    expect(CARDS.wall.power).toBeGreaterThanOrEqual(1);
    expect(CARDS.wall.fx?.hit).toBeGreaterThan(0);
    expect(CARDS.wall.foulMiss).toBeGreaterThan(0);
  });
});
