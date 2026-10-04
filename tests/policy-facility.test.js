import {describe,it,expect} from 'vitest';
import {createDuel,startBattle,chooseRoute,battleTarget,playCard,chooseReward,chooseFacility} from '../src/duel/engine.js';
import {facilityProblem} from '../src/duel/engine.js';
import {planFacility} from '../src/duel/policy.js';
import {DECKBUILDER_BUILD,ROUTE_CHOICES} from '../src/duel/cards.js';

// INBOX 7 둘째 조각: 시설 선택 최소 경로(봇 전용, 탐욕·결정적).
// 노선(FACILITY_ROUTES) 밖 제안 금지, 막힌 강제는 합법 폴백.
const pitch=(s,zone=s.battle.aimZone,roll=.1,powerRoll=.99)=>{
  s.battle.pending={zone,roll,powerRoll};
  return s;
};
function rewardState(){
  let s=createDuel(1,DECKBUILDER_BUILD);
  s=chooseRoute(s,ROUTE_CHOICES[0][0].id);
  s=startBattle(s);
  s.battle.runs=battleTarget(s)-1;
  s.battle.bases=[null,null,'p8'];
  s=playCard(pitch(s),'c0');
  expect(s.phase).toBe('reward');
  return s;
}
const facility1=()=>chooseReward(rewardState(),{type:'add',kind:'slug'},null);
function facility2(){
  let s=facility1();
  s=chooseFacility(s,planFacility(s));
  s=chooseRoute(s,ROUTE_CHOICES[s.stage][0].id);
  s=startBattle(s);
  s.battle.runs=battleTarget(s)-1;
  s.battle.bases=[null,null,'p8'];
  s=playCard(pitch(s),'c0');
  s=chooseReward(s,{type:'add',kind:'scout'},null);
  expect(s.phase).toBe('facility');
  return s;
}
const withDeck=(s,deck)=>({...s,deck:deck.map((kind,i)=>({id:'c'+i,kind})),nextId:deck.length});
const legal=(s,action)=>facilityProblem(s,action);

describe('planFacility minimal bot paths',()=>{
  it('trains the strongest card on the stage-1 route',()=>{
    const s=withDeck(facility1(),['slug','defend','place','place','place','place','place','place','place']);
    expect(s.phase).toBe('facility');
    const action=planFacility(s);
    expect(action).toEqual({type:'training',id:'c0'});
    expect(legal(s,action)).toBeNull();
    const n=chooseFacility(s,action);
    expect(n.phase).toBe('map');
    expect(n.deck.find(c=>c.id==='c0').plus).toBe(true);
  });
  it('takes scouting only when forced on stage 1',()=>{
    const s=withDeck(facility1(),['slug','defend','place','place','place','place','place','place','place']);
    expect(planFacility(s).type).not.toBe('scouting');
    const action=planFacility(s,{force:'scouting'});
    expect(action).toEqual({type:'scouting'});
    expect(legal(s,action)).toBeNull();
  });
  it('takes an unowned equipment on the stage-2 route',()=>{
    const s=facility2();
    const action=planFacility(s);
    expect(action.type).toBe('equipment');
    expect(legal(s,action)).toBeNull();
    const n=chooseFacility(s,action);
    expect(n.phase).toBe('map');
    expect(n.relics).toContain(action.kind);
  });
  it('releases the weakest card only when forced',()=>{
    const s=withDeck(facility2(),['slug','defend','place','place','place','place','place','place','place','strike']);
    expect(planFacility(s).type).not.toBe('release');
    const action=planFacility(s,{force:'release'});
    expect(action).toEqual({type:'release',id:'c1'});
    expect(legal(s,action)).toBeNull();
  });
  it('falls back to a legal path when the forced one is blocked',()=>{
    const s=withDeck(facility1(),['slug','defend','place','place','place','place','place','place','place']);
    s.deck=s.deck.map(c=>({...c,plus:true}));
    const action=planFacility(s,{force:'training'});
    expect(action.type).not.toBe('training');
    expect(legal(s,action)).toBeNull();
  });
});
