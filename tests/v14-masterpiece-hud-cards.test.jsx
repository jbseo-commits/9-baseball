// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import { createV10Duel } from '../src/duel/engine.js';
import { BUILDS, CARDS } from '../src/duel/cards.js';

describe('V14 Masterpiece Top HUD, A6 Card Frames, and Coach Badge Integration', () => {
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'src/duel/ballpark.css');
  const coachBadgePath = path.join(root, 'assets/ui-kit/coach-badge.svg');

  it('coach-badge.svg exists with valid SVG pixel-art content', () => {
    expect(fs.existsSync(coachBadgePath)).toBe(true);
    const svg = fs.readFileSync(coachBadgePath, 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#c8923a');
    expect(svg).toContain('#141a33');
    expect(svg).toContain('#ffc861');
  });

  it('ballpark.css contains top scoreboard HUD with BSO LED strip', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('.bp-hud-brand');
    expect(css).toContain('.bp-hud-logo');
    expect(css).toContain('.bp-bso-strip');
    expect(css).toContain('.bp-bso-unit');
    expect(css).toContain('#38d9a9'); // B green LED
    expect(css).toContain('#ff6b6b'); // O red LED
  });

  it('ballpark.css applies A6 card frames to .bp-card in hand', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/\.bp-card\{[^}]*A6-card-frame-common\.png/);
    expect(css).toMatch(/\.bp-card\.main\{[^}]*A6-card-frame-selected\.png/);
    expect(css).toMatch(/\.bp-card\.signature\{[^}]*A6-card-frame-signature\.png/);
    expect(css).toMatch(/\.bp-card\.skill\{[^}]*A6-card-frame-skill\.png/);
  });

  it('ballpark.css contains coach avatar badge integration', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('.bp-coach-wrap');
    expect(css).toContain('.bp-coach-badge');
    expect(css).toContain('coach-badge.svg');
  });

  it('BallparkBattle renders HUD brand, BSO strip, cards, and coach badge', () => {
    const s = createV10Duel(1);
    const hand = [
      { id: 'c0', entry: { kind: 'strike' } },
      { id: 'c1', entry: { kind: 'smash', plus: true } },
    ];
    const { container } = render(
      <BallparkBattle
        s={s}
        hand={hand}
        selected={null}
        swingStack={[]}
        choice={null}
        pitcher={{ name: '강민호', hp: 72, maxHp: 72 }}
        label="1막 루키 리그 · 1회말"
        onSelect={() => {}}
        onAim={() => {}}
        onStack={() => {}}
      />
    );

    expect(container.querySelector('.bp-hud-brand')).not.toBeNull();
    expect(container.querySelector('.bp-hud-logo').textContent).toBe('9ZONE');
    expect(container.querySelector('.bp-bso-strip')).not.toBeNull();
    expect(container.querySelector('.bp-coach-wrap')).not.toBeNull();
    expect(container.querySelector('.bp-coach-badge')).not.toBeNull();
    expect(container.querySelector('.bp-card[data-card-kind="strike"]')).not.toBeNull();
    expect(container.querySelector('.bp-card.signature[data-card-kind="smash"]')).not.toBeNull();
  });
});
