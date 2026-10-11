import {describe,it,expect} from 'vitest';
import {PACKS} from '../src/hybrid/model.js';
import {cardArtFor,cardArtFocusFor} from '../src/duel/card-art.js';

describe('hybrid playable card illustration contract',()=>{
  for(const [pack,config] of Object.entries(PACKS))it(`${pack}: every distinct card has an existing distinct original and a measured crop`,()=>{
    const illustrations=config.deck.map(kind=>cardArtFor(kind));
    expect(illustrations.every(Boolean)).toBe(true);
    expect(new Set(illustrations).size).toBe(config.deck.length);
    for(const kind of config.deck)expect(cardArtFocusFor(kind).objectPosition).toMatch(/^50% [\d.]+%$/);
  });
});
