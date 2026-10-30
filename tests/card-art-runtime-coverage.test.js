import {readdirSync} from 'node:fs';
import {it,expect} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {cardArtFor,FAMILY_ART} from '../src/duel/card-art.js';
import map from '../assets/cards-v15/card-map.json';

it('every current card keeps the exact source-directory artwork after excluding unused family masters',()=>{
  const files=new Set(readdirSync('assets/cards-v15'));
  for(const [kind,card] of Object.entries(CARDS)){
    const expected=map[kind]||(files.has(`card-${kind}.png`)?`card-${kind}.png`:null)||(card.family&&files.has(`family-${card.family}.png`)?`family-${card.family}.png`:null)||FAMILY_ART[card.family];
    const actual=cardArtFor(kind);
    if(expected&&files.has(expected))expect(actual,kind).toContain('/'+expected);else expect(actual,kind).toBeNull();
  }
});
