import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {pitcherPortraits} from '../src/duel/pitcher-visuals.js';
import {cardArtFor} from '../src/duel/card-art.js';

describe('V15 Deck and Dex Masterpiece Contract', () => {
  const appJsx = fs.readFileSync(new URL('../src/duel/App.jsx', import.meta.url), 'utf8');
  const cardDetailJsx = fs.readFileSync(new URL('../src/duel/CardDetailSheet.jsx', import.meta.url), 'utf8');
  const cardDetailCss = fs.readFileSync(new URL('../src/duel/card-detail.css', import.meta.url), 'utf8');
  const duelCss = fs.readFileSync(new URL('../src/duel/duel.css', import.meta.url), 'utf8');

  it('Card component in App.jsx connects cardArtFor for deck and collection cards', () => {
    expect(appJsx).toMatch(/cardArtFor/);
  });

  it('CardDetailSheet connects cardArtFor for detailed card inspection', () => {
    expect(cardDetailJsx).toMatch(/cardArtFor/);
  });

  it('duel.css or card-detail.css connects deck-dex-backdrop asset', () => {
    expect(duelCss + cardDetailCss).toMatch(/deck-dex-backdrop\.png/);
  });

  it('pitcherPortraits provides portraits for all 12 pitchers including v15 dex assets', () => {
    const ids = [
      'regular-01-red-rush',
      'regular-02-teal-mirage',
      'regular-03-amber-sinker',
      'regular-04-ivory-ace',
      'regular-05-violet-sting',
      'regular-06-rose-paint',
      'elite-01-cobalt-impact',
      'elite-02-neon-trick',
      'elite-03-wine-bluff',
      'boss-01-emerald-tyrant',
      'boss-02-platinum-halo',
      'boss-03-black-eclipse',
    ];
    for (const id of ids) {
      expect(pitcherPortraits[id]).toBeDefined();
      expect(typeof pitcherPortraits[id]).toBe('string');
    }
  });

  it('cardArtFor resolves illustration for all 16 playable card kinds', () => {
    const kinds = [
      'strike', 'slug', 'flow', 'place', 'rally', 'finisher',
      'bunt', 'defend', 'wall', 'laser', 'commit', 'setup',
      'watch', 'scout', 'lure', 'calm',
    ];
    for (const k of kinds) {
      const art = cardArtFor(k);
      expect(art, `cardArtFor(${k}) should resolve to an image url`).toBeDefined();
      expect(typeof art).toBe('string');
    }
  });
});
