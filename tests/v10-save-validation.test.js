import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import {validateV10State} from '../src/duel/v10-storage.js';
import {CARDS} from '../src/duel/cards.js';
import {createV10Duel,enterV10Node} from '../src/duel/engine.js';

// Regression: the V10 save validator only checked `typeof c.kind === 'string'`, so a save
// carrying a card kind that is not in CARDS passed validation. The deck modal then read
// CARDS[kind].type and threw, landing on ErrorBoundary with no recovery path. Before this,
// `validateV10State` returned TRUE for the counterexample below.

function validBattleSave(){
  const base=createV10Duel(20260910);
  return enterV10Node(base,base.runMap.nodes.find(n=>n.type==='battle').id);
}

describe('V10 save validation rejects card kinds that are not in CARDS',()=>{
  it('rejects a deck whose card kind does not exist in CARDS',()=>{
    const s=validBattleSave();
    expect(validateV10State(s)).toBe(true);
    s.deck[0]={...s.deck[0],kind:'__not_a_real_card__'};
    expect(validateV10State(s)).toBe(false);
  });

  it('rejects a counterexample save that used to slip through',()=>{
    const s=validBattleSave();
    s.deck[0]={...s.deck[0],kind:' banana '};
    s.runOuts=' banana ';
    s.nextId='not-a-number';
    s.stats='not-an-object';
    expect(validateV10State(s)).toBe(false);
  });

  it('rejects a mid-battle save that has no battle object',()=>{
    const s=validBattleSave();
    expect(s.phase).toBe('battle');
    s.battle=null;
    expect(validateV10State(s)).toBe(false);
  });

  it('rejects non-array relicChoices',()=>{
    const s=validBattleSave();
    s.v10.relicChoices={};
    expect(validateV10State(s)).toBe(false);
  });

  it('still accepts the pinned pre-runOuts historical fixture',()=>{
    // The P0-1 baseline fixture predates runOuts. The engine coerces it via `s.runOuts|0`,
    // so an absent optional field must not invalidate an otherwise sound save.
    const meta=JSON.parse(fs.readFileSync('docs/design/v12/baseline.json','utf8'));
    const actual=JSON.parse(fs.readFileSync(meta.fixture,'utf8'));
    expect(actual.runOuts).toBeUndefined();
    expect(validateV10State(actual)).toBe(true);
  });

  it('accepts every card kind the engine can produce',()=>{
    const s=validBattleSave();
    for(const c of s.deck)expect(Object.hasOwn(CARDS,c.kind)).toBe(true);
  });
});