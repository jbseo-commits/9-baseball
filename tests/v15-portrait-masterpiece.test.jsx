import {describe,it,expect} from 'vitest';
import {cardArtFor} from '../src/duel/card-art.js';
import {CARDS} from '../src/duel/cards.js';

describe('V15 Portrait Masterpiece - Card Art & Pitcher Framing', () => {
  it('resolves unique authored artwork for all 16 core card kinds', () => {
    const kinds = Object.keys(CARDS);
    expect(kinds.length).toBe(16);
    for (const kind of kinds) {
      const art = cardArtFor(kind);
      expect(art, `card art for "${kind}" should resolve`).toBeTruthy();
      expect(typeof art).toBe('string');
      expect(art).toMatch(/\.png/);
    }
  });

  it('safely returns null for unknown or null card kinds without throwing', () => {
    expect(cardArtFor(null)).toBeNull();
    expect(cardArtFor(undefined)).toBeNull();
    expect(cardArtFor('non-existent-card')).toBeNull();
  });
});
