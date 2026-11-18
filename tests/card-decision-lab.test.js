import {describe,it,expect} from 'vitest';
import {createCardDecisionLabRun,CARD_DECISION_LAB_SEED,CARD_DECISION_LAB_GUIDE,cardDecisionLabTimeline,cardDecisionLabPresentationTimeline} from '../src/duel/battle-vnext/card-decision-lab.js';
import {createV10Duel,enterV10Node,playV10Action,setAimZone,advanceV10Pitch,advanceV10Batter,v10Energy} from '../src/duel/engine.js';
import {presentationFor,presentationTimeline} from '../src/duel/presentation.js';
import {motionAt} from '../src/duel/battle-vnext/motion-timeline.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {rosterPitcherActor,rosterTimeline,rosterFrame} from '../src/duel/battle-vnext/roster-actor.js';
import {CARDS} from '../src/duel/cards.js';

const idOf=(state,kind)=>state.battle.hand.find(id=>state.deck.find(card=>card.id===id)?.kind===kind);

describe('card decision lab real-engine sandbox',()=>{
  it('rebuilds the same genuine first reachable opponent, hand, and seed without grants',()=>{
    const a=createCardDecisionLabRun(),b=createCardDecisionLabRun();
    expect(a.seed).toBe(CARD_DECISION_LAB_SEED);
    expect(a.nodeId).toBe(b.nodeId);
    expect(a.state).toEqual(b.state);
    const oracle=enterV10Node(createV10Duel(CARD_DECISION_LAB_SEED),a.nodeId);
    expect(a.state).toEqual(oracle);
    expect(a.state.battle.hand).toEqual(b.state.battle.hand);
    expect(a.state.initialSeed).toBe(b.state.initialSeed);
    expect(a.state.phase).toBe('battle');
    expect(a.state.deck).toHaveLength(9);
    expect(a.state.defenseLab).toBeUndefined();
    expect(a.state.relics).toEqual([]);
    expect(v10Energy(a.state)).toBe(a.state.battle.energyCap);
  });
  it('rejects invalid seeds and preserves an illegal action without advancing the engine',()=>{
    expect(()=>createCardDecisionLabRun(-1)).toThrow();
    expect(()=>createCardDecisionLabRun(0x100000000)).toThrow();
    const {state}=createCardDecisionLabRun();
    expect(playV10Action(state,{type:'card',id:'not-in-hand'})).toBe(state);
  });
  it('executes a selected real attack through the engine and reveals only the normal result',()=>{
    let {state}=createCardDecisionLabRun();
    const strike=idOf(state,'strike');
    expect(strike).toBeTruthy();
    state=setAimZone(state,4);
    const next=playV10Action(state,{type:'card',id:strike});
    expect(next).not.toBe(state);
    expect(next.stats.pitches).toBe(state.stats.pitches+1);
    expect(next.battle.revealed).toBeTruthy();
  });
  it('allows real preparation, take, and next pitch/batter transitions',()=>{
    let {state}=createCardDecisionLabRun();
    const setup=idOf(state,'setup');
    expect(CARDS.setup.type).toBe('skill');
    const prepared=playV10Action(state,{type:'card',id:setup});
    expect(prepared.stats.pitches).toBe(0);
    expect(prepared.battle.pending).toEqual(state.battle.pending);
    expect(prepared.battle.preparations).toBe(state.battle.preparations+1);
    const taken=playV10Action(prepared,{type:'take'});
    expect(taken.phase).toBe('pitch');
    expect(taken.stats.pitches).toBe(1);
    const nextPitch=advanceV10Pitch(taken);
    expect(nextPitch.phase).toBe('battle');
    const afterResult=playV10Action(nextPitch,{type:'take'});
    expect(['pitch','between','won','lost']).toContain(afterResult.phase);
    if(afterResult.phase==='between')expect(advanceV10Batter(afterResult).phase).toBe('battle');
  });
  it('keeps reduced motion unextended and knockout changes only the post-impact tail',()=>{
    const actor=rosterPitcherActor('regular-05-violet-sting','test-atlas');
    const shot=presentationFor({last:{kind:'card',runs:0},battle:{revealed:{kind:'hit',label:'중전안타',zone:4,coverage:[4],aimZone:4}}});
    const reduced=cardDecisionLabPresentationTimeline(presentationTimeline(shot,true),{actor,reduced:true});
    expect(reduced.duration).toBe(60);expect(reduced.delivery).toBeUndefined();
    const base=cardDecisionLabPresentationTimeline(presentationTimeline(shot),{actor});
    const ko=cardDecisionLabPresentationTimeline(presentationTimeline(shot),{actor,knockedOut:true});
    expect(ko.impactAt).toBe(base.impactAt);expect(ko.releaseAt).toBe(base.releaseAt);expect(ko.settleAt).toBe(base.settleAt);expect(ko.duration).toBeGreaterThan(base.duration);
  });
  it('keeps pre-impact motion and flight effects equal across hidden outcome classes',()=>{
    const shot=(kind,label,zone,coverage,aimZone)=>presentationFor({last:{kind:'card',runs:0},battle:{revealed:{kind,label,zone,coverage,aimZone,strikesBefore:0}}});
    const actor=rosterPitcherActor('regular-05-violet-sting','test-atlas');
    const actualTimeline=state=>cardDecisionLabPresentationTimeline(presentationTimeline(state),{actor});
    const hit=actualTimeline(shot('hit','중전안타',4,[4],4));
    const near=actualTimeline(shot('whiff','헛스윙',1,[4],4));
    expect(hit.impactAt).toBe(near.impactAt);
    expect(hit.impactAt-hit.delivery.pitchReleaseAt).toBe(300);
    const hitPlay={timeline:hit,action:'swing',pitchReleaseAt:hit.delivery.pitchReleaseAt};
    const nearPlay={timeline:near,action:'swing',pitchReleaseAt:near.delivery.pitchReleaseAt};
    const times=[hit.delivery.pitchReleaseAt-1,hit.delivery.pitchReleaseAt,hit.delivery.pitchReleaseAt+120,hit.impactAt-1];
    for(const elapsed of times){
      expect(motionAt({elapsed,timeline:hit,action:'swing'})).toEqual(motionAt({elapsed,timeline:near,action:'swing'}));
      expect(sceneEffectAt({elapsed,playback:hitPlay,phase:'flight',result:null})).toEqual(sceneEffectAt({elapsed,playback:nearPlay,phase:'flight',result:null}));
      expect(rosterFrame(hitPlay,elapsed,actor)).toBe(rosterFrame(nearPlay,elapsed,actor));
    }
  });
});
