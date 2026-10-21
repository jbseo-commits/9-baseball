import {describe,it,expect} from 'vitest';
import {createDefenseLabState,validateDefenseLabState,readDefenseLabState,DEFENSE_LAB_SAVE_KEY,
  playDefenseLabAction,advanceDefenseLabPitch,advanceDefenseLabBatter} from '../src/duel/engine.js';
import {LINEUP} from '../src/duel/cards.js';
import {defenseLabDisplay} from '../src/duel/defense-lab-view.js';

// Forced pitches below are unit fixtures, never evidence of an actual UI playthrough.
function ready(pack='hold',scenario='crisis') {return createDefenseLabState({seed:914,pack,scenario});}
function inHand(s,kind){
  const id=s.deck.find(c=>c.kind===kind).id,b=s.battle;
  if(!b.hand.includes(id)){
    const pile=[b.draw,b.discard].find(p=>p.includes(id)),out=b.hand[0];
    pile[pile.indexOf(id)]=out;b.hand[0]=id;
  }
  return id;
}
function pitch(s,kind,zone=0,roll=.99,aim=4){
  const id=kind==='basic'?'basic':inHand(s,kind);
  s.battle.aimZone=aim;s.battle.pending={zone,roll,powerRoll:0};
  return playDefenseLabAction(s,{type:'card',id});
}

describe('defense lab boundary contracts',()=>{
  it.each([
    ['missing hand',s=>delete s.battle.hand],['missing draw',s=>delete s.battle.draw],
    ['missing discard',s=>delete s.battle.discard],['missing pending',s=>delete s.battle.pending],
    ['wrong max HP',s=>{s.pitcher.maxHp=999;s.pitcher.hp=999;}],
    ['missing stats',s=>delete s.stats],['null card',s=>{s.deck[0]=null;}],
    ['duplicate pile card',s=>{s.battle.draw[0]=s.battle.hand[0];}],
    ['invalid pitch roll',s=>{s.battle.pending.roll=2;}],
    ['invalid count',s=>{s.battle.strikes=3;}],
    ['null history entry',s=>{s.battle.history=[null];}],
    ['null result entry',s=>{s.battle.results=[null];}],
    ['invalid log entry',s=>{s.battle.log=[null];}],
    ['missing preparations',s=>delete s.battle.preparations],
  ])('rejects corrupt save: %s',(_,mutate)=>{
    const s=ready();mutate(s);
    expect(()=>validateDefenseLabState(s)).not.toThrow();
    expect(validateDefenseLabState(s)).toBe(false);
    const calls=[];
    expect(readDefenseLabState({getItem:key=>{calls.push(key);return JSON.stringify(s);}})).toBeNull();
    expect(calls).toEqual([DEFENSE_LAB_SAVE_KEY]);
  });
  it('distinguishes a natural foul from an actual saved strikeout, and does not recharge',()=>{
    let s=pitch(ready(),'defend',0,0);
    expect(s.battle.revealed).toMatchObject({kind:'foul',defenseProtected:true});
    expect(s.defenseLab.lastEvent.savedStrikeout).toBe(false);
    s=advanceDefenseLabPitch(s);
    s=pitch(s,'defend',0,.99);
    expect(s.phase).toBe('lost');
    expect(s.battle.outs).toBe(3);
    expect(s.defenseLab.protectedPitches).toBe(1);
    expect(s.defenseLab.lastEvent).toMatchObject({protected:false,blocked:false});
  });
  it('does not protect TAKE, even if transferred protection exists',()=>{
    let s=ready('link');s.defenseLab.transferredProtection=true;
    s.battle.pending={zone:4,roll:.99,powerRoll:0};
    s=playDefenseLabAction(s,{type:'take'});
    expect(s.phase).toBe('lost');expect(s.battle.outs).toBe(3);
    expect(s.defenseLab.lastEvent.protected).toBe(false);
  });
  it('lets transferred protection cover basic, and does not add another charge',()=>{
    let s=ready('link');s.defenseLab.transferredProtection=true;
    s=pitch(s,'basic');
    expect(s.battle.outs).toBe(2);expect(s.defenseLab.lastEvent.savedStrikeout).toBe(true);
    s=advanceDefenseLabPitch(s);s=pitch(s,'defend');
    expect(s.phase).toBe('lost');expect(s.defenseLab.protectedPitches).toBe(1);
  });
  it.each([['empty bases',[]],['one step from third',[null,null,LINEUP[2].id]]])('does not give link a fictitious runner reward: %s',(_,bases)=>{
    let s=ready('link','normal');if(bases.length)s.battle.bases=bases;
    s=pitch(s,'rally',4,0);
    expect(s.defenseLab.lastEvent.blocked).toBe(false);
    expect(s.defenseLab.lastEvent.transferred).toBe(false);
  });
  it('keeps the power investment through a miss and TAKE but clears it at the next batter',()=>{
    let s=ready('power','normal');const id=inHand(s,'loadPower');
    s=playDefenseLabAction(s,{type:'card',id});
    s=pitch(s,'slug',0,.99);
    expect(s.defenseLab.powerInvested).toBe(true);
    s=advanceDefenseLabPitch(s);s.battle.pending={zone:9,roll:0,powerRoll:0};
    s=playDefenseLabAction(s,{type:'take'});
    expect(s.defenseLab.powerInvested).toBe(true);
    s=advanceDefenseLabPitch(s);s=pitch(s,'slug',4,0);
    s=advanceDefenseLabBatter(s);
    expect(s.defenseLab.powerInvested).toBe(false);
  });
  it('does not treat a common scout or support-only hit as the power condition',()=>{
    let s=ready('power','normal');const scout=inHand(s,'scout');
    s=playDefenseLabAction(s,{type:'card',id:scout});
    expect(s.defenseLab.powerInvested).toBe(false);
    s=pitch(s,'slug',4,0);expect(s.defenseLab.lastEvent.blocked).toBe(false);
    s=ready('power','normal');s.defenseLab.powerInvested=true;
    const slug=inHand(s,'slug'),defend=inHand(s,'defend');
    s.battle.aimZone=4;s.battle.pending={zone:0,roll:0,powerRoll:0};
    s=playDefenseLabAction(s,{type:'card',id:slug,supports:[{id:defend,aimZone:1}]});
    expect(s.battle.revealed.assistOnly).toBe(true);
    expect(s.defenseLab.lastEvent.blocked).toBe(false);
  });
  it('does not count a rest or terminal hit as a successfully blocked future threat',()=>{
    let s=ready('link','normal');s.battle.bases[0]=LINEUP[2].id;s.stats.pitches=2;
    s=pitch(s,'rally',4,0);
    expect(s.defenseLab.lastEvent).toMatchObject({blocked:false,transferred:true,threat:'rest'});
    s=ready('link','normal');s.battle.bases[0]=LINEUP[2].id;s.pitcher.hp=1;s.pitcher.phase='critical';
    s=pitch(s,'rally',4,0);
    expect(s.phase).toBe('won');
    expect(s.defenseLab.lastEvent).toMatchObject({blocked:false,transferred:false});
    expect(s.defenseLab.activeConstraint).toBeNull();
  });
  it('freezes every new status before impact and shows the counter together with a spent shield',()=>{
    const before=ready();const after=pitch(before,'defend');
    expect(defenseLabDisplay(after,true).status).toBe(defenseLabDisplay(before).status);
    expect(defenseLabDisplay(after,true).threat).toBe(defenseLabDisplay(before).threat);
    expect(defenseLabDisplay(after,true).result).toBe('');
    expect(defenseLabDisplay(after).status).toContain('보호 소진');
    expect(defenseLabDisplay(after).status).toContain('다음 안타 +8');
  });
});
