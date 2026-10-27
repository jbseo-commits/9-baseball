// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import * as E from '../src/duel/engine.js';
import {LINEUP} from '../src/duel/cards.js';
import {pitcherPhase} from '../src/duel/pitcher-hp.js';
import {buildFixture,handId,appInputs} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel,battlePhase} from '../src/duel/battle-vnext/view-model.js';
import HandDock from '../src/duel/battle-vnext/HandDock.jsx';

afterEach(cleanup);

/* Explicit engine-state diagnostics, not natural playtest evidence. */
function exactHit({hp=37,runner=false}={}){
  const input=buildFixture('watch-read0');
  let before=structuredClone(input.s);
  before.pitcher.hp=hp;
  before.pitcher.phase=pitcherPhase(hp,before.pitcher.maxHp);
  before.battle.shaken=0;
  if(runner)before.battle.bases=[null,null,LINEUP[(before.battle.batterIndex+1)%LINEUP.length].id];
  const id=handId(before,'strike');
  before=E.setAimZone(before,before.battle.pending.zone);
  const after=E.playV10Action(before,{type:'card',id});
  expect(after.battle.revealed.kind).toBe('hit');
  return {before,after};
}

describe('C01 independent review: last pitch and reveal boundary',()=>{
  it('keeps the actual knockout flight and impact visible after entering reward',()=>{
    const {after}=exactHit({hp:1});
    expect(after.phase).toBe('reward');
    const flight=buildBattleViewModel({s:after,fxStage:'windup'});
    expect(flight.phase).toBe('flight');
    expect(flight.result).toBeNull();
    expect(flight.scene.pitchZone).toBe(after.battle.revealed.zone);
    expect(flight.hud.pitcher).toMatchObject({hp:1,phase:'critical'});
    const landed=buildBattleViewModel({s:after,fxStage:'impact'});
    expect(landed.phase).toBe('result');
    expect(landed.result).toMatchObject({hpAfter:0,knockedOut:true,kind:'hit'});
    expect(landed.input.canExecute).toBe(false);
  });

  it('preserves actual third-out flight and strikeout result',()=>{
    const input=buildFixture('watch-read0');
    const before=structuredClone(input.s);
    before.battle.outs=2;before.battle.strikes=2;
    const after=E.playV10Action(before,{type:'take'});
    expect(after.phase).toBe('lost');
    expect(buildBattleViewModel({s:after,fxStage:'windup'}).phase).toBe('flight');
    const landed=buildBattleViewModel({s:after,fxStage:'impact',shot:{grade:'strikeout'}});
    expect(landed.result).toMatchObject({call:'삼진',actualZone:after.battle.revealed.zone});
    expect(landed.hud.count.outs).toBe(3);
  });

  it.each(['reward','won','lost'])('only active final reveal overrides terminal routing: %s',phase=>{
    const {after}=exactHit({hp:1});
    const s={...after,phase};
    expect(battlePhase({s,fxStage:'windup'})).toBe('flight');
    expect(battlePhase({s,fxStage:'impact'})).toBe('result');
    expect(battlePhase({s})).toBe('transition');
  });

  it('keeps pitcher phase consistent with the pre-hit HP until impact',()=>{
    const {before,after}=exactHit();
    expect(after.pitcher.phase).not.toBe(before.pitcher.phase);
    const flight=buildBattleViewModel({s:after,fxStage:'windup'});
    expect(flight.hud.pitcher).toMatchObject({hp:before.pitcher.hp,phase:before.pitcher.phase});
    expect(buildBattleViewModel({s:after,fxStage:'impact'}).hud.pitcher.phase).toBe(after.pitcher.phase);
  });

  it('holds reading level and sources when scoring raises shaken until impact',()=>{
    const {before,after}=exactHit({runner:true});
    expect(E.v10Shaken(after)).toBeGreaterThan(E.v10Shaken(before));
    const frozen=JSON.stringify(after);
    const flight=buildBattleViewModel({s:after,fxStage:'windup'});
    expect(flight.hud.readLevel).toBe(E.readLevel(before));
    expect(flight.zones.level).toBe(E.readLevel(before));
    expect(flight.zones.sources).toEqual(E.readSources(before).map(x=>x.label));
    expect(flight.hud.shaken).toBe(E.v10Shaken(before));
    const impact=buildBattleViewModel({s:after,fxStage:'impact'});
    expect(impact.hud.readLevel).toBe(E.readLevel(after));
    expect(impact.zones.sources).toEqual(E.readSources(after).map(x=>x.label));
    expect(JSON.stringify(after)).toBe(frozen);
  });
});

describe('C03 independent review: support limit is not an unplayable card',()=>{
  it('separates support-cost limits from card problems and keeps own-cost warnings',()=>{
    const input=buildFixture('support-stacked'),vm=buildBattleViewModel(input);
    const limited=vm.hand.filter(x=>x.overBudget&&!x.problem);
    expect(limited.length).toBeGreaterThan(0);
    for(const card of limited){
      expect(card.warning).not.toContain('지원 비용 초과');
      expect(appInputs(input.s,{selected:card.id}).choice.problem).toBeFalsy();
    }
    const {container}=render(<HandDock {...vm} onCardTap={()=>{}}/>);
    expect(container.querySelectorAll('.bv-support-limit').length).toBe(limited.length);
    expect(container.textContent).not.toContain('지원 비용 초과');
    const shortage=buildBattleViewModel(buildFixture('cost-short')).hand.find(x=>x.selectionRole==='main');
    expect(shortage.warning).toBe('에너지 부족');
  });
});
