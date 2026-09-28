import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  pitcherPortraits,
  RED_RUSH_V16_ANIMATIC,
  RED_RUSH_V16_KEYPOSES,
  IMPACT_SLASH_VFX,
} from '../src/duel/pitcher-visuals.js';

describe('V16 Battle Polish & Dex Masterpiece Integration Contract', () => {
  const actorsJsx = fs.readFileSync(new URL('../src/duel/BallparkActors.jsx', import.meta.url), 'utf8');

  it('pitcherPortraits maps all 12 pitchers to high-resolution dex masterpiece portraits', () => {
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
      const portrait = pitcherPortraits[id];
      expect(portrait, `pitcherPortraits[${id}] should be defined`).toBeDefined();
      expect(typeof portrait).toBe('string');
      // Must point to dex asset (including -v2 recommended revisions)
      expect(portrait).toMatch(/dex-/);
    }
  });

  it('exports V16 Red Rush keyposes, 7-frame animatic, and impact slash VFX', () => {
    expect(RED_RUSH_V16_ANIMATIC).toBeDefined();
    expect(RED_RUSH_V16_ANIMATIC).toMatch(/red-rush-keypose-animatic\.webp/);
    expect(fs.existsSync('assets/production-art/battle-polish-v16/red-rush-keypose-animatic.webp')).toBe(true);

    expect(RED_RUSH_V16_KEYPOSES.coilBreak).toBeDefined();
    expect(RED_RUSH_V16_KEYPOSES.lateCocking).toBeDefined();
    expect(RED_RUSH_V16_KEYPOSES.armWhip).toBeDefined();
    expect(RED_RUSH_V16_KEYPOSES.release).toBeDefined();
    expect(RED_RUSH_V16_KEYPOSES.followThrough).toBeDefined();

    expect(IMPACT_SLASH_VFX).toBeDefined();
    expect(IMPACT_SLASH_VFX).toMatch(/impact-slash\.png/);
    expect(fs.existsSync('assets/production-art/battle-polish-v16/impact-slash.png')).toBe(true);
  });

  it('BallparkActors connects impact-slash VFX for contact hit-stop feedback', () => {
    expect(actorsJsx).toMatch(/impactSlashVfx/);
    expect(actorsJsx).toMatch(/slashSprite/);
  });

  it('PitcherPortraitDialog renders 12-pitcher Dex shelf matching benchmark dex.png', () => {
    const dialogJsx = fs.readFileSync(new URL('../src/duel/PitcherPortraitDialog.jsx', import.meta.url), 'utf8');
    expect(dialogJsx).toMatch(/pitcher-dex-shelf/);
    expect(dialogJsx).toMatch(/pitcher-dex-card/);
    expect(dialogJsx).toMatch(/PITCHER ROSTER \(12명\)/);
  });

  it('App.jsx provides header dex button and deck modal subtitle', () => {
    const appJsx = fs.readFileSync(new URL('../src/duel/App.jsx', import.meta.url), 'utf8');
    expect(appJsx).toMatch(/dex-header-btn/);
    expect(appJsx).toMatch(/deck-modal-sub/);
  });

  it('BallparkEnd.jsx celebrates 3-Act clear with EVERYBODY HOME headline', () => {
    const endJsx = fs.readFileSync(new URL('../src/duel/BallparkEnd.jsx', import.meta.url), 'utf8');
    expect(endJsx).toMatch(/전원 생환 · EVERYBODY HOME/);
  });

  it('relicArtFor maps all 8 relics to high-density masterpiece SVG illustrations', async () => {
    const {relicArtFor, RELIC_ARTS, RELIC_MASTERPIECE_META} = await import('../src/duel/relic-art.js');
    const relicIds = ['firstPitch', 'twoStack', 'foulTape', 'awayBadge', 'slugBand', 'scope', 'ledger', 'radar'];

    for (const id of relicIds) {
      const art = relicArtFor(id);
      expect(art, `relicArtFor(${id}) should be defined`).toBeDefined();
      expect(typeof art).toBe('string');
      expect(art).toMatch(/(\.svg|data:image\/svg\+xml)/);
      expect(RELIC_ARTS[id]).toBeDefined();
      expect(RELIC_MASTERPIECE_META[id]).toBeDefined();
      expect(RELIC_MASTERPIECE_META[id].mark).toBeDefined();
    }
  });

  it('Act 1-3 signature cards connect to dedicated masterpiece art and signature badges', async () => {
    const {CARDS} = await import('../src/duel/cards.js');
    const {cardArtFor} = await import('../src/duel/card-art.js');
    const {cardDetailOf} = await import('../src/duel/CardDetailSheet.jsx');

    const signatures = [
      {id: 'wall', act: 1},
      {id: 'laser', act: 2},
      {id: 'commit', act: 3},
    ];

    for (const {id, act} of signatures) {
      const card = CARDS[id];
      expect(card, `CARDS[${id}] should exist`).toBeDefined();
      expect(card.rarity).toBe('signature');
      expect(card.act).toBe(act);

      const art = cardArtFor(id);
      expect(art, `cardArtFor(${id}) should be defined`).toBeDefined();
      expect(art).toMatch(/card-(wall|laser|commit)\.png/);

      const detail = cardDetailOf(id);
      expect(detail.rarity).toBe('signature');
      expect(detail.act).toBe(act);
    }
  });
});

