import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,playCard,advanceBatter,advancePitch,endTurn,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {preparationDrawPreview,activePreparationFeedback} from '../src/duel/preparation-feedback.js';

function prepared({handSize=5,drawIds=[],discardIds=[],plus=true}={}){
  const s=enterV10Node(createV10Duel(481),'a1-entry');
  s.deck[0]={...s.deck[0],kind:'watch',plus};
  s.battle.hand=Array.from({length:handSize},(_,i)=>'c'+i);
  s.battle.draw=[...drawIds];s.battle.discard=[...discardIds];
  return s;
}

describe('preparation feedback',()=>{
  it.each([
    [{handSize:6,drawIds:['c6','c7']},0,'hand'],
    [{handSize:5},1,'hand'],
    [{handSize:4,drawIds:['c6','c7']},2,'hand'],
    [{handSize:3},1,'stock'],
    [{handSize:3,drawIds:['c6','c7','c8']},3,null],
  ])('matches the actual upgraded draw count and does not mutate state (%j)',(options,count,reason)=>{
    const s=prepared(options),before=JSON.stringify(s),preview=preparationDrawPreview(s,'c0');
    expect(preview).toMatchObject({requested:3,count,reason});
    expect(JSON.stringify(s)).toBe(before);
    const next=playCard(s,'c0');
    expect(next.battle.hand.length-(s.battle.hand.length-1)).toBe(count);
  });
  it('requires a real skill card in hand and ignores future pile order',()=>{
    const s=prepared({handSize:4,drawIds:['c6','c7']});
    expect(preparationDrawPreview(s,'not-in-hand')).toBeNull();
    s.deck[0].kind='slug';expect(preparationDrawPreview(s,'c0')).toBeNull();
  });
  it('previews ordinary two-card draws and includes the just-used card in a reshuffle',()=>{
    for(const handSize of [4,5,6]){
      const s=prepared({handSize,plus:false,drawIds:['c6','c7']});
      const preview=preparationDrawPreview(s,'c0'),next=playCard(s,'c0');
      expect(preview.count).toBe(6-handSize);
      expect(next.battle.hand.length-(handSize-1)).toBe(preview.count);
    }
    const empty=prepared({handSize:1,plus:false}),next=playCard(empty,'c0');
    expect(preparationDrawPreview(empty,'c0')).toEqual({requested:2,count:1,reason:'stock'});
    expect(next.battle.hand).toEqual(['c0']);
  });
  it('keeps preparation through TAKE, next pitch and save/load, then consumes a normal expansion on a supported swing',()=>{
    let s=enterV10Node(createV10Duel(715),'a1-entry');
    s.deck[0]={...s.deck[0],kind:'lure'};
    s.deck[1]={...s.deck[1],kind:'setup'};
    s.deck[2]={...s.deck[2],kind:'place'};
    s.deck[3]={...s.deck[3],kind:'strike'};
    s.battle.hand=['c0','c1','c2','c3'];
    s=playCard(playCard(s,'c0'),'c1');
    s.battle.pending={zone:9,roll:.99,powerRoll:.99};
    s=advancePitch(endTurn(s));
    expect(s.phase).toBe('battle');
    expect(activePreparationFeedback(s.battle,s.phase)).toEqual(['집중 +1','범위 +1 · 다음 스윙']);
    const storage={value:null,getItem(){return this.value},setItem(_key,value){this.value=value}};
    saveV10Duel(storage,s);s=readV10Duel(storage);
    expect(activePreparationFeedback(s.battle,s.phase)).toEqual(['집중 +1','범위 +1 · 다음 스윙']);
    s.battle.pending={zone:9,roll:.99,powerRoll:.99};
    const swung=playCard(s,'c2',{supports:[{id:'c3',aimZone:4}]});
    expect(swung).not.toBe(s);
    expect(swung.battle.expanded).toBe(false);
    expect(swung.battle.aim).toBe(1);
  });
  it('derives only active battle effects and clears the ended plate appearance',()=>{
    const battle={aim:2,runSignal:true,runSignalPlus:true,expanded:true,expandedPlus:true,bonusPower:3,
      bonusDmg:2,bonusPressure:.25,bonusBall:4,bonusWalk:5,bonusFoul:6,patient:true,scouted:true,scoutPlus:true,scoutBall:true};
    const effects=activePreparationFeedback(battle,'battle');
    for(const phrase of ['집중 +2','안타 시 주자 +2루','범위 +1 · 타석 유지','파워 +54','안타 HP +2','정타 HP +25%','볼 HP +4','볼넷 HP +5','파울 HP +6','존 안 미적중 파울 확률↑','이번 공 간파: 높이·안팎'])expect(effects).toContain(phrase);
    expect(activePreparationFeedback(battle,'between')).toEqual([]);
    expect(activePreparationFeedback({...battle,expandedPlus:false},'pitch')).toContain('범위 +1 · 다음 스윙');
  });
  it('tracks real skill use through selection-independent state and respects each expiry boundary',()=>{
    const use=(kind,plus=false)=>{
      const s=enterV10Node(createV10Duel(714),'a1-entry');
      s.deck[0]={...s.deck[0],kind,plus};s.battle.hand=['c0'];
      if(kind==='flow')s.battle.bases[0]='p1';
      return playCard(s,'c0');
    };
    const flow=use('flow',true);
    expect(activePreparationFeedback(flow.battle,flow.phase)).toContain('안타 시 주자 +2루');
    expect(activePreparationFeedback({...flow.battle,selected:'different-card'},flow.phase)).toContain('안타 시 주자 +2루');
    const lure=use('lure'),lurePlus=use('lure',true);
    expect(activePreparationFeedback(lure.battle,lure.phase)).toContain('범위 +1 · 다음 스윙');
    expect(activePreparationFeedback(lurePlus.battle,lurePlus.phase)).toContain('범위 +1 · 타석 유지');
    lure.battle.pending={zone:9,roll:.99,powerRoll:.99};
    const swung=playCard(lure,'basic');expect(swung.battle.expanded).toBe(false);
    lurePlus.battle.pending={zone:9,roll:.99,powerRoll:.99};
    const plusSwung=playCard(lurePlus,'basic');expect(plusSwung.battle.expanded).toBe(true);
    const scout=use('scout');expect(scout.battle.scouted).toBe(true);
    scout.battle.pending={zone:9,roll:.99,powerRoll:.99};
    const afterScoutPitch=playCard(scout,'basic');expect(afterScoutPitch.battle.scouted).toBe(false);
    const ended=advanceBatter(plusSwung.phase==='between'?plusSwung:{...plusSwung,phase:'between'});
    if(ended!==plusSwung)expect(activePreparationFeedback(ended.battle,ended.phase)).toEqual([]);
  });
});
