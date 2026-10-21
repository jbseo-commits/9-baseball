import {describe,expect,it} from 'vitest';
import {
  DEFENSE_LAB_SAVE_KEY,createDefenseLabState,validateDefenseLabState,
  saveDefenseLabState,readDefenseLabState,playDefenseLabAction,
  advanceDefenseLabPitch,advanceDefenseLabBatter,defenseLabThreat,
} from '../src/duel/engine.js';
import {SAVE_KEY} from '../src/duel/cards.js';
import {V10_SAVE_KEY} from '../src/duel/v10-storage.js';
import {LINEUP} from '../src/duel/cards.js';

const memory=()=>{
  const data=new Map();
  return {data,getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
};
const pinToHand=(s,id)=>{
  const b=s.battle,slot=b.hand.findIndex(x=>x!==id);
  if(b.hand.includes(id))return;
  const source=[b.draw,b.discard].find(p=>p.includes(id));
  if(!source||slot<0)throw new Error('fixture card is unavailable');
  const out=b.hand[slot];b.hand[slot]=id;source[source.indexOf(id)]=out;
};

describe('defense experiment lab',()=>{
  it('starts three matching Red Rush decks with common defend and distinct opening conditions',()=>{
    for(const pack of ['link','hold','power']){
      const normal=createDefenseLabState({seed:914,pack,scenario:'normal'});
      const crisis=createDefenseLabState({seed:914,pack,scenario:'crisis'});
      expect(normal.version).toBe(10);
      expect(normal.pitcher).toMatchObject({name:'레드 러시',hp:88,maxHp:88});
      expect(normal.v10.opponent.gimmick).toBeNull();
      expect(normal.deck).toHaveLength(10);
      expect(normal.deck.filter(c=>c.kind==='defend')).toHaveLength(1);
      expect(normal.battle).toMatchObject({outs:0,strikes:0});
      expect(crisis.battle).toMatchObject({outs:2,strikes:2});
      expect(normal.battle.hand.map(id=>normal.deck.find(c=>c.id===id)?.kind)).toContain('defend');
      expect(defenseLabThreat(normal)).toMatchObject({key:'stack',maxStack:2});
    }
  });

  it('uses only a separate, strictly validated lab save key',()=>{
    const storage=memory();
    const lab=createDefenseLabState({seed:27,pack:'hold',scenario:'normal'});
    storage.setItem(SAVE_KEY,'untouched-production-save');
    storage.setItem(V10_SAVE_KEY,'untouched-v10-production-save');
    saveDefenseLabState(storage,lab);
    expect(DEFENSE_LAB_SAVE_KEY).not.toBe(SAVE_KEY);
    expect(DEFENSE_LAB_SAVE_KEY).not.toBe(V10_SAVE_KEY);
    expect(storage.getItem(SAVE_KEY)).toBe('untouched-production-save');
    expect(storage.getItem(V10_SAVE_KEY)).toBe('untouched-v10-production-save');
    expect(readDefenseLabState(storage)).toEqual(lab);
    const corrupt=JSON.parse(storage.getItem(DEFENSE_LAB_SAVE_KEY));
    corrupt.defenseLab.pack='unknown';
    storage.setItem(DEFENSE_LAB_SAVE_KEY,JSON.stringify(corrupt));
    expect(validateDefenseLabState(corrupt)).toBe(false);
    expect(readDefenseLabState(storage)).toBeNull();
  });

  it('does not advance its visible threat clock for preparation or selection, only a real pitch',()=>{
    let s=createDefenseLabState({seed:91,pack:'link',scenario:'normal'});
    const start=defenseLabThreat(s);
    const skill=s.deck.find(c=>c.kind==='flow');
    pinToHand(s,skill.id);
    s=playDefenseLabAction(s,{type:'card',id:skill.id});
    expect(defenseLabThreat(s)).toEqual(start);
    const attack=s.deck.find(c=>c.kind==='tableSetter');pinToHand(s,attack.id);
    s.battle.pending={zone:9,roll:.5,powerRoll:.5};
    s=playDefenseLabAction(s,{type:'card',id:attack.id});
    expect(s.stats.pitches).toBe(1);
    expect(defenseLabThreat(s)).toMatchObject({key:'pressure'});
    s=advanceDefenseLabPitch(s);
    expect(s.defenseLab.activeConstraint).toMatchObject({key:'stack'});
    expect(s.battle.energy).toBe(3);
    s.battle.pending={zone:9,roll:.5,powerRoll:.5};
    s=playDefenseLabAction(s,{type:'take'});
    expect(s.defenseLab.activeConstraint).toMatchObject({key:'pressure'});
    s=advanceDefenseLabPitch(s);
    expect(s.battle.energy).toBe(3);
  });

  it('converts a two-strike covered-card miss to one protected foul before strikeout and records the block',()=>{
    let s=createDefenseLabState({seed:7,pack:'hold',scenario:'crisis'});
    const id=s.deck.find(c=>c.kind==='defend').id;
    pinToHand(s,id);s.battle.aimZone=4;s.battle.strikes=2;
    s.battle.pending={zone:0,roll:.99,powerRoll:.99};
    let next=playDefenseLabAction(s,{type:'card',id});
    expect(next.battle.revealed).toMatchObject({kind:'foul',defenseProtected:true});
    expect(next.battle.outs).toBe(2);
    expect(next.stats.fouls).toBe(1);
    expect(next.defenseLab.lastEvent).toMatchObject({protected:true,blocked:true,savedStrikeout:true,counterDamage:0});
    expect(next.defenseLab.counterReady).toBe(true);
    expect(next.defenseLab.activeConstraint).toBeNull();
    expect(next.pitcher.hp).toBe(86);
    next=advanceDefenseLabPitch(next);
    pinToHand(next,id);next.battle.aimZone=4;next.battle.pending={zone:4,roll:0,powerRoll:0};
    next=playDefenseLabAction(next,{type:'card',id});
    expect(next.battle.revealed.kind).toBe('hit');
    expect(next.defenseLab.lastEvent.counterDamage).toBe(8);
    expect(next.v10.lastCombat.totalDamageBonus).toBeGreaterThanOrEqual(8);
    expect(next.defenseLab.counterReady).toBe(false);
  });

  it('keeps normal V10 stack limits and actions unchanged without a lab marker',()=>{
    const lab=createDefenseLabState({seed:51,pack:'power',scenario:'normal'});
    const plain=structuredClone(lab);delete plain.defenseLab;
    const planned=defenseLabThreat(lab);
    expect(planned.key).toBe('stack');
    expect(validateDefenseLabState(plain)).toBe(false);
    expect(playDefenseLabAction(plain,{type:'take'})).toBe(plain);
  });

  it('spends transferred 2-strike protection on the next batter’s first eligible attack',()=>{
    let s=createDefenseLabState({seed:818,pack:'link',scenario:'normal'});
    const runner=LINEUP[2].id;s.battle.bases[0]=runner;
    const rally=s.deck.find(c=>c.kind==='rally');pinToHand(s,rally.id);
    s.battle.aimZone=4;s.battle.pending={zone:4,roll:0,powerRoll:0};
    s=playDefenseLabAction(s,{type:'card',id:rally.id});
    expect(s.phase).toBe('between');
    expect(s.defenseLab.lastEvent).toMatchObject({blocked:true,transferred:true});
    expect(s.defenseLab.deliverProtection).toBe(true);
    s=advanceDefenseLabBatter(s);
    expect(s.defenseLab.transferredProtection).toBe(true);
    const tableSetter=s.deck.find(c=>c.kind==='tableSetter');pinToHand(s,tableSetter.id);
    s.battle.strikes=2;s.battle.aimZone=4;s.battle.pending={zone:0,roll:.99,powerRoll:.99};
    s=playDefenseLabAction(s,{type:'card',id:tableSetter.id});
    expect(s.battle.revealed).toMatchObject({kind:'foul',defenseProtected:true,protectionSpent:true});
    expect(s.defenseLab.transferredProtection).toBe(false);
    expect(s.defenseLab.protectionUsed).toBe(true);
  });

  it('blocks a threat only after actual power preparation and direct narrow hit',()=>{
    let s=createDefenseLabState({seed:44,pack:'power',scenario:'normal'});
    const load=s.deck.find(c=>c.kind==='loadPower');pinToHand(s,load.id);
    s=playDefenseLabAction(s,{type:'card',id:load.id});
    expect(s.defenseLab.powerInvested).toBe(true);
    const slug=s.deck.find(c=>c.kind==='slug');pinToHand(s,slug.id);
    s.battle.aimZone=4;s.battle.pending={zone:4,roll:0,powerRoll:0};
    s=playDefenseLabAction(s,{type:'card',id:slug.id});
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.defenseLab.lastEvent).toMatchObject({blocked:true,reason:'힘 준비 후 좁은 강타 적중'});
    expect(s.defenseLab.activeConstraint).toBeNull();
  });

  it('spends 2-strike protection on an out-of-zone attack without converting the whiff',()=>{
    let s=createDefenseLabState({seed:773,pack:'hold',scenario:'crisis'});
    const defend=s.deck.find(c=>c.kind==='defend');pinToHand(s,defend.id);
    s.battle.aimZone=4;s.battle.pending={zone:9,roll:.5,powerRoll:.5};
    s=playDefenseLabAction(s,{type:'card',id:defend.id});
    expect(s.battle.revealed).toMatchObject({kind:'whiff',protectionSpent:true});
    expect(s.battle.revealed.defenseProtected).toBeUndefined();
    expect(s.defenseLab.protectionUsed).toBe(true);
    expect(s.defenseLab.lastEvent.blocked).toBe(false);
  });

  it('applies a pending pressure cost when the next batter enters',()=>{
    let s=createDefenseLabState({seed:601,pack:'link',scenario:'normal'});
    const tableSetter=s.deck.find(c=>c.kind==='tableSetter');pinToHand(s,tableSetter.id);
    s.battle.aimZone=4;s.battle.pending={zone:4,roll:0,powerRoll:0};
    s=playDefenseLabAction(s,{type:'card',id:tableSetter.id});
    expect(s.phase).toBe('between');
    s.defenseLab={...s.defenseLab,activeConstraint:{key:'pressure',label:'압박',energyCost:1}};
    s=advanceDefenseLabBatter(s);
    expect(s.battle.energy).toBe(2);
    expect(s.defenseLab.activeConstraint.key).toBe('pressure');
  });
});
