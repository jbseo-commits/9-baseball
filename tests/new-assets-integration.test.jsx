// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import cardMap from '../assets/cards-v15/card-map.json';
import { cardArtFor, cardArtFocusFor, ART_FOCUS_Y } from '../src/duel/card-art.js';
import TitleScreen from '../src/duel/TitleScreen.jsx';

describe('New Assets Integration (C101-C122 Card Arts & A04-A05 Title Cast)', () => {
  const root = path.resolve(__dirname, '..');
  const titleCssPath = path.join(root, 'src/duel/title-screen.css');

  const v16Cards = [
    'pinpoint', 'eyeLevel', 'verticalRead', 'readStrike', 'surgeon',
    'needle', 'counterRead', 'onePatience', 'laserEye', 'coldRead',
    'focusBreath', 'markZone', 'perfectRead', 'fullSwing', 'moonshot',
    'gapHunter', 'pullHook', 'oppoPower', 'upperCut', 'highHeat',
    'cleanup', 'soloShot',
  ];

  it('card-map.json contains all 22 new card mappings (C101-C122)', () => {
    v16Cards.forEach(kind => {
      expect(cardMap[kind]).toBe(`card-${kind}.png`);
    });
  });

  it('cardArtFor resolves image URLs for all 22 new cards', () => {
    v16Cards.forEach(kind => {
      const art = cardArtFor(kind);
      expect(art).toBeTruthy();
      expect(typeof art).toBe('string');
    });
  });

  it('ART_FOCUS_Y contains focal point definitions for all 22 new card files', () => {
    v16Cards.forEach(kind => {
      const file = `card-${kind}.png`;
      expect(ART_FOCUS_Y[file]).toBeDefined();
      expect(typeof ART_FOCUS_Y[file]).toBe('number');
      const focus = cardArtFocusFor(kind);
      expect(focus).toBeTruthy();
      expect(focus.objectPosition).toMatch(/50%\s+[\d.]+%/);
    });
  });

  it('TitleScreen renders A04 batter and A05 coach layers', () => {
    const { container } = render(
      <TitleScreen
        run={null}
        onNew={() => {}}
        onContinue={() => {}}
        onDeck={() => {}}
        onDex={() => {}}
        onSettings={() => {}}
      />
    );

    const coach = container.querySelector('.ts-actor.ts-coach');
    expect(coach).toBeTruthy();

    const batter = container.querySelector('.ts-actor.ts-batter');
    expect(batter).toBeTruthy();
  });

  it('title-screen.css contains styles for ts-coach and ts-batter', () => {
    const css = fs.readFileSync(titleCssPath, 'utf8');
    expect(css).toContain('.ts-actor.ts-coach');
    expect(css).toContain('.ts-actor.ts-batter');
  });
});
