// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,playV10Action,setAimZone,claimV10Reward,saveV10Duel,readV10Duel,v10TierRelicPool,readLevel} from '../src/duel/engine.js';
import {V10_TIER_RELICS,V10_RELICS,v10TierRelicOffers,v10RelicDamagePlan,v10RelicDamageRate} from '../src/duel/v10-relics.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

function winAt(type,act=1,seed=7){
  const s=createV10Duel(seed);const n=s.runMap.nodes.find(n=>n.type===type&&n.act===act);
  s.runMap.reachableIds=[n.id];
  let t=enterV10Node(s,n.id);t.pitcher={...t.pitcher,hp:1,phase:'critical'};t=setAimZone(t,t.battle.aimZone);
  return playV10Action(t,{type:'card',id:'basic'});
}

describe('강적·보스 전용 유물',()=>{
  it('강적과 보스 유물은 풀이 다르고 상점 유물과도 다르다',()=>{
    const tiers=Object.entries(V10_TIER_RELICS);
    expect(tiers.filter(([,r])=>r.tier==='elite').length).toBeGreaterThanOrEqual(3);
    expect(tiers.filter(([,r])=>r.tier==='boss').length).toBeGreaterThanOrEqual(3);
    for(const [k] of tiers)expect(V10_RELICS[k]).toBeUndefined();
    for(let seed=0;seed<30;seed++){
      const e=v10TierRelicOffers({tier:'elite',seed,nodeSeed:seed*3}),b=v10TierRelicOffers({tier:'boss',seed,nodeSeed:seed*3});
      expect(e.every(k=>V10_TIER_RELICS[k].tier==='elite')).toBe(true);
      expect(b.every(k=>V10_TIER_RELICS[k].tier==='boss')).toBe(true);
      expect(new Set(e).size).toBe(e.length);
    }
    expect(v10TierRelicOffers({tier:'elite',owned:Object.keys(V10_TIER_RELICS)})).toEqual([]);
  });

  it('일반 전투 승리에는 유물이 없고 강적·보스에는 후보가 3개 열린다',()=>{
    expect(winAt('battle').v10.relicChoices||[]).toEqual([]);
    const e=winAt('elite'),b=winAt('boss');
    expect(e.v10.relicChoices).toHaveLength(3);expect(b.v10.relicChoices).toHaveLength(3);
    expect(e.v10.relicChoices.every(k=>V10_TIER_RELICS[k].tier==='elite')).toBe(true);
    expect(b.v10.relicChoices.every(k=>V10_TIER_RELICS[k].tier==='boss')).toBe(true);
  });

  it('고른 유물이 들어오고, 고르지 않아도 첫 후보가 자동으로 들어온다(무조건 지급)',()=>{
    const e=winAt('elite');const pick=e.v10.relicChoices[1];
    const a=claimV10Reward(e,{type:'skip',relic:pick});
    expect(a.relics).toContain(pick);expect(a.rewards.at(-1).relic).toBe(pick);expect(a.v10.relicChoices).toEqual([]);
    const b=claimV10Reward(e,{type:'skip'});expect(b.relics).toEqual([e.v10.relicChoices[0]]);
    const c=claimV10Reward(winAt('boss'),{type:'add',kind:winAt('boss').v10.rewardChoices[0]});
    expect(c.relics).toHaveLength(1);expect(V10_TIER_RELICS[c.relics[0]].tier).toBe('boss');
    expect(c.deck.length).toBe(winAt('boss').deck.length+1);
  });

  it('후보 밖의 유물은 거절한다(상태가 그대로)',()=>{
    const e=winAt('elite');
    expect(claimV10Reward(e,{type:'skip',relic:'crownBat'})).toBe(e);
    expect(claimV10Reward(e,{type:'skip',relic:'firstPitch'})).toBe(e);
  });

  it('유물 효과: 피해 배율, 보너스, 읽기',()=>{
    const hit=(o={})=>({kind:'hit',bases:1,zone:4,...o});
    expect(v10RelicDamagePlan({relics:['huntMark'],outcome:hit()}).damageRate).toBeCloseTo(1.15);
    expect(v10RelicDamagePlan({relics:['giantBelt'],outcome:hit()}).damageRate).toBeCloseTo(1.25);
    expect(v10RelicDamagePlan({relics:['gritWrist'],outcome:{kind:'foul'}}).damageBonus).toBe(3);
    expect(v10RelicDamagePlan({relics:['gritWrist'],outcome:hit()}).damageBonus).toBe(0);
    expect(v10RelicDamagePlan({relics:['clutchRing'],outcome:hit(),runnersBefore:1}).damageBonus).toBe(6);
    expect(v10RelicDamagePlan({relics:['clutchRing'],outcome:hit(),runnersBefore:0}).damageBonus).toBe(0);
    expect(v10RelicDamagePlan({relics:['crownBat'],outcome:hit({bases:2})}).damageBonus).toBe(10);
    expect(v10RelicDamagePlan({relics:['crownBat'],outcome:hit({bases:4})}).damageBonus).toBe(20);
    expect(v10RelicDamagePlan({relics:['overwhelm'],outcome:hit(),pitcherPhase:'steady'}).damageBonus).toBe(5);
    expect(v10RelicDamagePlan({relics:['overwhelm'],outcome:hit(),pitcherPhase:'pressured'}).damageBonus).toBe(10);
    expect(v10RelicDamageRate(['wideNet'],3,.65)).toBeCloseTo(.9);expect(v10RelicDamageRate(['wideNet'],2,.9)).toBe(1);expect(v10RelicDamageRate(['wideNet'],1,1)).toBe(1);
    const s=createV10Duel(3);const base=readLevel(s);s.relics=['hawkEye'];expect(readLevel(s)).toBe(Math.min(2,base+1));
  });

  it('보상 화면: 유물을 고를 때까지 버튼이 잠기고, 고른 유물이 들어온다',()=>{
    const e=winAt('elite');saveV10Duel(localStorage,e);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    expect(screen.getByTestId('bp-relics')).toBeTruthy();
    expect(document.querySelectorAll('.bp-relic-offers .bp-offer.relic')).toHaveLength(3);
    expect(screen.queryByTestId('bp-stop-skip')).toBeNull();
    const go=screen.getByTestId('bp-stop-go');expect(go.disabled).toBe(true);
    fireEvent.click(document.querySelectorAll('.bp-relic-offers .bp-offer.relic')[2]);
    expect(go.disabled).toBe(false);
    fireEvent.click(go);
    const t=readV10Duel(localStorage);expect(t.relics).toEqual([e.v10.relicChoices[2]]);expect(t.phase).toBe('map');
  });
});
