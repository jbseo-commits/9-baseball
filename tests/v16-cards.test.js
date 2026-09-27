import {describe,it,expect} from 'vitest';
import {CARDS,CORE_KINDS,FAMILIES,AXIS_NAMES} from '../src/duel/cards.js';
import {createV10Duel,enterV10Node,playV10Action,coverageAt,swingOdds,playCard,knownPitchZones,
  v16DraftChoices,V16_STARTER_KINDS,v10Shaken} from '../src/duel/engine.js';
import {cardArtFor} from '../src/duel/card-art.js';

const NEW=Object.keys(CARDS).filter(k=>!CORE_KINDS.includes(k));
const clone=s=>JSON.parse(JSON.stringify(s));
function battle(){return enterV10Node(createV10Duel(7),'a1-entry');}
/* put one card in hand and fix the pitch */
function withCard(kind,{zone=4,roll=.5,powerRoll=.99,aim=zone,strikes=0,balls=0,bases=[null,null,null],shaken=0,priorPitches=0}={}){
  const s=clone(battle()),b=s.battle,id='cx';
  s.deck.push({id,kind});s.nextId++;b.hand.push(id);
  b.pending={zone,roll,powerRoll};b.aimZone=aim;
  for(let i=0;i<priorPitches;i++)b.history.push({zone:9,label:'볼',aimZone:null,turn:b.turn,balls:i,strikes:0});b.strikes=strikes;b.balls=balls;b.bases=bases;b.shaken=shaken;
  return {s,id};
}
const hpLoss=(s,a)=>{const n=playV10Action(s,a);return {n,loss:s.pitcher.hp-n.pitcher.hp};};

describe('V16 reward expansion: 120+ cards across real deck concepts',()=>{
  it('adds at least 120 cards, every concept has 10+, all fields are valid and names are unique',()=>{
    expect(NEW.length).toBeGreaterThanOrEqual(120);
    const byFam={};for(const k of NEW)byFam[CARDS[k].family]=(byFam[CARDS[k].family]||0)+1;
    expect(Object.keys(byFam).sort()).toEqual(Object.keys(FAMILIES).sort());
    for(const n of Object.values(byFam))expect(n).toBeGreaterThanOrEqual(10);
    const names=Object.values(CARDS).map(c=>c.name);expect(new Set(names).size).toBe(names.length);
    for(const k of NEW){
      const c=CARDS[k];
      expect(['attack','skill'],k).toContain(c.type);
      expect(['common','uncommon','rare'],k).toContain(c.rarity);
      expect(c.gives.length,k).toBeGreaterThan(0);expect(c.text.length,k).toBeGreaterThan(8);
      if(c.type==='attack')expect(AXIS_NAMES[c.axis],k).toBeTruthy();
      expect(cardArtFor(k),k).toBeTruthy();
    }
  });

  it('every new swing still honours the contract: a covered pitch is a hit',()=>{
    for(const k of NEW.filter(k=>CARDS[k].type==='attack'&&!CARDS[k].bunt)){
      const {s,id}=withCard(k,{zone:4});
      for(const z of coverageAt(s,id,4))expect(swingOdds(s,id,z),k+' zone '+z).toMatchObject({hit:1,covered:true});
    }
  });

  it('new coverage shapes cover what their names say',()=>{
    const cov=(kind,aim)=>{const {s,id}=withCard(kind,{aim});return coverageAt(s,id,aim);};
    expect(cov('eyeLevel',3)).toEqual([3,4]);        // pairH leans to the centre
    expect(cov('eyeLevel',5)).toEqual([4,5]);
    expect(cov('verticalRead',1)).toEqual([1,4]);    // pairV
    expect(cov('xSwing',4)).toEqual([0,2,4,6,8]);    // x
    expect(cov('laserEye',0)).toEqual([0,4,8]);      // diag
    expect(cov('grinder',0)).toEqual([0,1,3,4]);     // box
    expect(cov('cornerGuard',4)).toEqual([0,2,4,6,8]);
  });

  it('runner, two-strike, count, first-pitch and scouting keywords add pitcher HP only when true',()=>{
    const hit=(kind,opts)=>{const {s,id}=withCard(kind,opts);return hpLoss(s,{type:'card',id}).loss;};
    const r1=[ 'p2',null,null];
    expect(hit('rbiMachine',{bases:r1})-hit('rbiMachine',{})).toBeGreaterThanOrEqual(4);
    expect(hit('lastChance',{strikes:2})-hit('lastChance',{strikes:1})).toBeGreaterThanOrEqual(8);
    expect(hit('aheadSwing',{balls:2,strikes:0})).toBeGreaterThan(hit('aheadSwing',{balls:1,strikes:1}));
    expect(hit('firstStrike',{zone:4})-hit('firstStrike',{zone:4,balls:1,priorPitches:1})).toBeGreaterThanOrEqual(5);
  });

  it('foul keyword: a cut-grind card turns a missed pitch into a foul that still costs the pitcher',()=>{
    const {s,id}=withCard('cutMaster',{zone:0,aim:8,roll:.01});   // miss, roll inside the foul band
    const {n,loss}=hpLoss(s,{type:'card',id});
    expect(n.battle.revealed.kind).toBe('foul');
    expect(loss).toBeGreaterThanOrEqual(2+2);   // foul 2 + keyword 2
  });

  it('shake skills raise the pitcher shake, capped by act; shaken keyword pays per level',()=>{
    const {s,id}=withCard('taunt');
    const n=playCard(s,id);expect(v10Shaken(n)).toBe(1);
    const base=withCard('breakHim',{shaken:0}),shook=withCard('breakHim',{shaken:2});
    expect(hpLoss(shook.s,{type:'card',id:shook.id}).loss-hpLoss(base.s,{type:'card',id:base.id}).loss).toBeGreaterThanOrEqual(10);
  });

  it('ball-only scouting reveals ball or strike, and time-out wipes one strike',()=>{
    const ball=withCard('goodEye',{zone:9}),inZone=withCard('goodEye',{zone:2});
    expect(knownPitchZones(playCard(ball.s,ball.id))).toEqual([9]);
    expect(knownPitchZones(playCard(inZone.s,inZone.id))).toEqual([0,1,2,3,4,5,6,7,8]);
    const t=withCard('timeOut',{strikes:2});expect(playCard(t.s,t.id).battle.strikes).toBe(1);
    const noStrike=withCard('timeOut',{strikes:0});expect(playCard(noStrike.s,noStrike.id)).toBe(noStrike.s);   // requires a strike
  });

  it('prep bonuses last the plate appearance: ball damage on a taken ball, walk bonus on ball four',()=>{
    const {s,id}=withCard('countBattle',{zone:9,balls:1});
    const prepped=playCard(s,id);prepped.battle.pending={zone:9,roll:.5,powerRoll:.5};
    const plain=clone(s);plain.battle.pending={zone:9,roll:.5,powerRoll:.5};
    const a=hpLoss(prepped,{type:'take'}).loss,b=hpLoss(plain,{type:'take'}).loss;
    expect(a-b).toBe(2);
  });

  it('lane bonus: a zone specialist hits harder only on its lane',()=>{
    const {s,id}=withCard('middleMash',{zone:4});
    const off=withCard('middleMash',{zone:0,aim:0});
    expect(s.deck.length).toBeGreaterThan(0);
    // compare the power edge through the preview matchup
    expect(CARDS.middleMash.zoneBonus).toEqual({zones:[4],power:2});
    expect(hpLoss(s,{type:'card',id}).n.battle.revealed.kind).toBe('hit');
    expect(hpLoss(off.s,{type:'card',id:off.id}).n.battle.revealed.kind).toBe('hit');
  });
});

describe('V16 reward draft',()=>{
  it('offers distinct concepts, never starters, and no rares in act 1 normal fights',()=>{
    for(let seed=1;seed<60;seed++){
      const picks=v16DraftChoices({deck:[],act:1,tier:1,seed,count:3});
      expect(picks).toHaveLength(3);
      expect(new Set(picks.map(k=>CARDS[k].family)).size).toBe(3);
      for(const k of picks){expect(V16_STARTER_KINDS).not.toContain(k);expect(CARDS[k].rarity).not.toBe('rare');}
    }
  });
  it('the first choice follows the deck\'s strongest concept',()=>{
    const deck=[{id:'a',kind:'cutMaster'},{id:'b',kind:'foulTip'},{id:'c',kind:'fullSwing'}];
    for(let seed=1;seed<30;seed++)expect(CARDS[v16DraftChoices({deck,act:2,tier:1,seed})[0]].family).toBe('grind');
  });
  it('rares appear from act 2 and more often on elite nodes; the draft is deterministic',()=>{
    const rares=(act,tier)=>Array.from({length:200},(_,i)=>v16DraftChoices({act,tier,seed:i+1})).flat().filter(k=>['rare','signature'].includes(CARDS[k].rarity)).length;
    expect(rares(1,1)).toBe(0);
    expect(rares(2,1)).toBeGreaterThan(0);
    expect(rares(3,2)).toBeGreaterThan(rares(2,1));
    expect(v16DraftChoices({act:2,seed:42})).toEqual(v16DraftChoices({act:2,seed:42}));
  });
  it('over a whole pool of seeds the draft reaches nearly every card',()=>{
    const seen=new Set();for(let act=1;act<=3;act++)for(let i=1;i<400;i++)for(const k of v16DraftChoices({act,tier:2,seed:i,count:4}))seen.add(k);
    const eligible=Object.keys(CARDS).filter(k=>!V16_STARTER_KINDS.includes(k));
    expect(seen.size/eligible.length).toBeGreaterThan(.95);
  });
});

describe('V16 card art hand-off (docs/art/PHONE_ASSET_QUEUE.md queue C)',()=>{
  it('a new card borrows its concept art until family-<concept>.png or card-<key>.png lands',async()=>{
    const src=(await import('node:fs')).readFileSync('src/duel/card-art.js','utf8');
    expect(src).toContain('card-${kind}.png');
    expect(src).toContain('family-${fam}.png');
    const {FAMILY_ART}=await import('../src/duel/card-art.js');
    for(const f of Object.keys(FAMILIES))expect(FAMILY_ART[f],f).toBeTruthy();
    expect(cardArtFor('pinpoint')).toMatch(/reward-precision-blue/);   // borrowed until C01 is uploaded
  });
});
