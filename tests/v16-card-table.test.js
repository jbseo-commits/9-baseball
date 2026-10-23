import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {CARDS,CORE_KINDS,ROLES,AXIS_NAMES,UPGRADES,upgradeText,canUpgrade,cardCost,cardText,FAMILIES} from '../src/duel/cards.js';
import {cardArtFor} from '../src/duel/card-art.js';

// Existing-card audit (game-20261011-a R2): every playable kind must be honest —
// its text must restate an engine rule, its art must resolve, its cost must match
// the documented table. Rules below mirror src/duel/engine.js handling:
// shapeHas (11 shapes), applySkillFx (14 skill keys), v10CardFxPlan (17 attack
// keys), cardProblem (5 requires values), aim (technique +8 / power +5 per aim).
const SHAPES=new Set(['point','row','column','cross','all','pairH','pairV','x','diag','box','corners']);
const SKILL_FX=new Set(['scout','aim','expand','run','patient','power','dmg','pressure','ballDmg','walkDmg','foulDmg','undo','shake','draw']);
const ATTACK_FX=new Set(['hit','perRunner','empty','twoStrike','ahead','first','shaken','scouted','xbh','hand','connect','support','foul','miss','drawHit','drawPlay','shakeHit']);
const REQUIRES=new Set(['runner','twoStrike','strike','first','empty']);
const RARITIES=new Set(['common','uncommon','rare','signature']);

function costTwoFromDoc(){
  const md=fs.readFileSync(path.resolve('docs/CARD-ENERGY.md'),'utf8');
  const row=md.split('\n').find(l=>l.startsWith('| 2 |'));
  if(!row)throw new Error('CARD-ENERGY.md cost-2 row not found');
  return new Set([...row.matchAll(/`([a-zA-Z]+)`/g)].map(m=>m[1]));
}

describe('card table contract (151 kinds)',()=>{
  it('every kind has complete display data with clean copy',()=>{
    expect(Object.keys(CARDS).length).toBeGreaterThanOrEqual(151);
    const names=new Set();
    for(const [kind,d] of Object.entries(CARDS)){
      expect(typeof d.name,'name:'+kind).toBe('string');
      expect(d.name.length>0,'name:'+kind).toBe(true);
      expect(names.has(d.name),'duplicate name:'+d.name).toBe(false);names.add(d.name);
      expect(['attack','skill'].includes(d.type),'type:'+kind).toBe(true);
      expect(typeof d.text==='string'&&d.text.length>0,'text:'+kind).toBe(true);
      expect(typeof d.flavor==='string'&&d.flavor.length>0,'flavor:'+kind).toBe(true);
      expect(ROLES.includes(d.role),'role:'+kind).toBe(true);
      expect(d.axis===null||Object.hasOwn(AXIS_NAMES,d.axis),'axis:'+kind).toBe(true);
      expect(Array.isArray(d.gives),'gives:'+kind).toBe(true);
      expect(Array.isArray(d.needs),'needs:'+kind).toBe(true);
      for(const t of [d.name,d.text,d.flavor,...d.gives,...d.needs])expect(t,'CJK:'+kind).not.toMatch(/[぀-ヿ一-鿿]/);
    }
  });

  it('every kind resolves art, a legal cost, a family, and a rarity',()=>{
    const docTwo=costTwoFromDoc();
    for(const [kind,d] of Object.entries(CARDS)){
      expect(cardArtFor(kind),'art:'+kind).not.toBeNull();
      const cost=cardCost(kind);
      expect([0,1,2].includes(cost),'cost:'+kind).toBe(true);
      expect(cost===0,'cost0:'+kind).toBe(kind==='setup');
      expect(cost===2,'cost2:'+kind).toBe(docTwo.has(kind));
      if(d.type==='attack'&&['row','column','diag','cross','x','box','corners','all'].includes(d.shape)&&!d.bunt&&d.rarity!=='signature')expect(cost,'ordinary-wide:'+kind).toBe(2);
      expect(typeof d.family==='string'&&d.family.length>0,'family:'+kind).toBe(true);
      if(!CORE_KINDS.includes(kind))expect(Object.hasOwn(FAMILIES,d.family),'family:'+kind).toBe(true);
      if(d.rarity!==undefined)expect(RARITIES.has(d.rarity),'rarity:'+kind).toBe(true);
    }
    expect(cardCost('setup')).toBe(0);
    expect(cardCost('laser')).toBe(1);expect(cardCost('commit')).toBe(1);
    expect(cardCost('wall')).toBe(2);expect(cardCost('thunder')).toBe(2);
  });

  it('every keyword the cards use is a keyword the engine handles',()=>{
    for(const [kind,d] of Object.entries(CARDS)){
      if(d.type==='attack')expect(SHAPES.has(d.shape),'shape:'+kind).toBe(true);
      if(d.requires!==undefined)expect(REQUIRES.has(d.requires),'requires:'+kind).toBe(true);
      for(const bag of [d.fx||{},d.plusFx||{}]){
        for(const key of Object.keys(bag))expect(SKILL_FX.has(key)||ATTACK_FX.has(key),'fx:'+kind+'.'+key).toBe(true);
      }
      if(d.fx?.scout!==undefined)expect(['row','full','ball'].includes(d.fx.scout),'scout:'+kind).toBe(true);
      if(d.zoneBonus){
        const zb=d.zoneBonus;
        expect((zb.cols||[]).every(c=>[0,1,2].includes(c)),'zb.cols:'+kind).toBe(true);
        expect((zb.rows||[]).every(r=>[0,1,2].includes(r)),'zb.rows:'+kind).toBe(true);
        expect((zb.zones||[]).every(z=>Number.isInteger(z)&&z>=0&&z<=8),'zb.zones:'+kind).toBe(true);
      }
      if(d.power!==undefined)expect(Number.isInteger(d.power)&&d.power>=-1&&d.power<=3,'power:'+kind).toBe(true);
      if(d.pressure!==undefined)expect(d.pressure>=0&&d.pressure<=1,'pressure:'+kind).toBe(true);
    }
    for(const k of Object.keys(UPGRADES))expect(Object.hasOwn(CARDS,k),'upgrades:'+k).toBe(true);
  });

  it('numbers in text restate engine values, not decoration',()=>{
    // power units are x18 (cardPower), zoneBonus power likewise, aim gives +8/+5,
    // skill-fx power feeds the same per-swing bonus (engine prepPower).
    for(const [kind,d] of Object.entries(CARDS)){
      const aim=d.fx?.aim||0;
      const allowed=new Set([(d.power||0)*18,((d.zoneBonus?.power)||0)*18,5*aim,18*(d.fx?.power||0)]);
      const fields=[d.text,...d.gives];
      for(const f of fields){
        for(const m of f.matchAll(/파워 ([+-]?\d+)/g)){
          expect(allowed.has(Number(m[1])),'power-number:'+kind+' :: '+f).toBe(true);
        }
        for(const m of f.matchAll(/집중 \+(\d+)/g)){
          expect(Number(m[1]),'aim-number:'+kind+' :: '+f).toBe(aim);
        }
        for(const m of f.matchAll(/타격 \+(\d+)/g)){
          // Aim gives +8 per aim; a lane bonus adds its own technique when the pitch meets it (engine matchup).
          const n=Number(m[1]),zbTech=d.zoneBonus?.technique;
          expect(n===8*aim||(zbTech!==undefined&&n===zbTech),'technique-number:'+kind+' :: '+f).toBe(true);
        }
        for(const m of f.matchAll(/HP (?:압박 )?\+(\d+)%/g)){
          // Top-level pressure and skill-fx pressure feed the same precision bonus (engine v10CardFxPlan).
          expect(Number(m[1]),'pressure-number:'+kind+' :: '+f).toBe(Math.round(((d.pressure||0)+(d.fx?.pressure||0))*100));
        }
      }
    }
  });

  it('an upgrade never promises power the engine will not give',()=>{
    // Plus on singles/bunt attacks adds no power (cardPower skips both), so those
    // kinds must name their real plus effect (sacrifice rate, foul survival) or stay
    // out of the upgrade pool entirely (tableSetter, whose plus changes nothing).
    for(const [kind,d] of Object.entries(CARDS)){
      if(d.type!=='attack'||!canUpgrade({kind}))continue;
      const generic=!Object.hasOwn(UPGRADES,kind);
      expect(!(generic&&(d.singles||d.bunt)),'upgrade-lie:'+kind).toBe(true);
      expect(typeof cardText(kind,true)==='string'&&cardText(kind,true).length>0,'plustext:'+kind).toBe(true);
    }
    for(const [kind,d] of Object.entries(CARDS)){
      if(d.type==='attack'&&(d.singles||d.bunt))expect(cardText(kind,true),'plustext-power:'+kind).not.toMatch(/파워 [+-]?\d+/);
    }
    expect(canUpgrade({kind:'tableSetter'})).toBe(false);
    // Pin the honest wordings so a future edit cannot quietly reintroduce the lie.
    expect(upgradeText('squeeze')).toBe('희생 92% · 파울 8%');
    for(const k of ['cutMaster','fightOff','longAtBat','shieldBat','grinder','foulTip','attrition','chokeUp','zoneProtect']){
      expect(upgradeText(k)).toBe('빗나가도 파울 +12%p · 단타 유지');
    }
  });
});

describe('plus effects behind the upgrade texts',()=>{
  // The texts above are only honest because the engine really does this. Pin it.
  async function battleWith(kind){
    const engine=await import('../src/duel/engine.js');
    let s=engine.createV10Duel(11);
    s={...s,deck:[{id:'c0',kind}],nextId:1};
    s=engine.enterV10Node(s,'a1-entry');
    if(!s.battle)throw new Error('no battle at a1-entry');
    s.battle.hand=['c0'];s.battle.draw=[];s.battle.discard=[];
    return {engine,s};
  }
  it('squeeze+ sacrifices 92%, not 82%',async()=>{
    const {engine,s}=await battleWith('squeeze');
    expect(engine.swingOdds(s,'c0',4).sacrifice).toBeCloseTo(0.82,6);
    s.deck[0].plus=true;
    expect(engine.swingOdds(s,'c0',4).sacrifice).toBeCloseTo(0.92,6);
  });
  it('cutMaster+ survives 62% of misses outside coverage, not 50%',async()=>{
    const {engine,s}=await battleWith('cutMaster');
    const aimed=engine.setAimZone(s,4);
    expect(engine.swingOdds(aimed,'c0',0).foul).toBeCloseTo(0.5,6);
    aimed.deck[0].plus=true;
    expect(engine.swingOdds(aimed,'c0',0).foul).toBeCloseTo(0.62,6);
  });
});
