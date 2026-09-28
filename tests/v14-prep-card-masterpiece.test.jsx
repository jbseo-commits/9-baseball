// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import { createV10Duel } from '../src/duel/engine.js';
import { CARDS } from '../src/duel/cards.js';

describe('V14 Masterpiece Prep Card Redesign', () => {
  const root = path.resolve(__dirname, '..');
  const portraitCssPath = path.join(root, 'src/duel/v14-portrait-master.css');
  const ballparkCssPath = path.join(root, 'src/duel/ballpark.css');

  it('v14-portrait-master.css contains masterpiece prep/skill card styles', () => {
    const css = fs.readFileSync(portraitCssPath, 'utf8');
    expect(css).toContain('.bp-card.prep-card');
    expect(css).toContain('.bp-card.skill');
    expect(css).toContain('.bp-card-cost.prep');
    expect(css).toContain('.bp-chip.type.prep');
    expect(css).toContain('.bp-order.prep');
  });

  it('ballpark.css contains .bp-card.bp-token-card reset and extended role colors', () => {
    const css = fs.readFileSync(ballparkCssPath, 'utf8');
    expect(css).toContain('.bp-card.bp-token-card');
    expect(css).toContain('.bp-chip.role.r-cyan');
    expect(css).toContain('.bp-chip.role.r-teal');
    expect(css).toContain('.bp-chip.role.r-purple');
  });

  it('BallparkBattle renders prep cards as full masterpiece cards with art, chips, and desc', () => {
    const s = createV10Duel('starter');
    s.phase = 'battle';
    const onSelect = vi.fn();
    const onStack = vi.fn();
    const hand = [
      { id: 'c1', entry: { kind: 'place', plus: false }, preview: { coverage: [4] } },
      { id: 'c2', entry: { kind: 'setup', plus: false }, preview: {} },
      { id: 'c3', entry: { kind: 'watch', plus: false }, preview: {} },
    ];

    const { container } = render(
      <BallparkBattle
        s={s}
        hand={hand}
        selected={null}
        swingStack={[]}
        choice={null}
        pitcher={{ hp: 100, maxHp: 100, name: '테스트 투수' }}
        label="1회초"
        onSelect={onSelect}
        onStack={onStack}
      />
    );

    // Should find the prep cards
    const prepCards = container.querySelectorAll('.bp-card.prep-card');
    expect(prepCards.length).toBe(2);

    // Each prep card should retain .bp-token-card for backwards compatibility
    prepCards.forEach(card => {
      expect(card.classList.contains('bp-token-card')).toBe(true);
      expect(card.classList.contains('skill')).toBe(true);

      // Must have cost badge
      const cost = card.querySelector('.bp-card-cost.prep');
      expect(cost).toBeTruthy();

      // Must have art box
      const artBox = card.querySelector('.bp-card-art-box');
      expect(artBox).toBeTruthy();

      // Must have prep badge glyph
      const glyph = card.querySelector('.bp-card-mini-map.prep-badge');
      expect(glyph).toBeTruthy();

      // Must have header with title and chips
      const header = card.querySelector('.bp-card-header');
      expect(header).toBeTruthy();
      const typeChip = card.querySelector('.bp-chip.type.prep');
      expect(typeChip).toBeTruthy();
      expect(typeChip.textContent).toBe('준비');

      // Must have 2-line desc
      const desc = card.querySelector('.bp-card-desc');
      expect(desc).toBeTruthy();
    });

    // Clicking prep card calls onSelect
    fireEvent.click(prepCards[0]);
    expect(onSelect).toHaveBeenCalledWith('c2');
  });
});
