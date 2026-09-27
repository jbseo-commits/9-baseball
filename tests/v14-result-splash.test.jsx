// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import { createV10Duel, enterV10Node } from '../src/duel/engine.js';

afterEach(() => cleanup());

const ballparkCss = fs.readFileSync('src/duel/ballpark.css', 'utf8');

describe('V14 P1-12 battle result splash overlay (HOME RUN / knockout)', () => {
  it('adds splash and homer classes to bp-verdict on a home run', () => {
    let s = createV10Duel(0);
    s = enterV10Node(s, 'a1-entry');
    s.battle.pending = { zone: 4, roll: 0.5, powerRoll: 0.9 };
    s.battle.revealed = { zone: 4, label: '홈런', kind: 'hit' };
    const shot = { grade: 'homer', kind: 'homer', title: '홈런', motion: { slowmo: 100 } };

    render(
      <BallparkBattle
        s={s}
        hand={[]}
        fxStage="settle"
        shot={shot}
        playToken={1}
        pitcher={s.pitcher}
      />
    );

    const verdict = document.querySelector('.bp-verdict');
    expect(verdict).not.toBeNull();
    expect(verdict.classList.contains('splash')).toBe(true);
    expect(verdict.classList.contains('homer')).toBe(true);
    expect(verdict.querySelector('strong').textContent).toBe('홈런');
  });

  it('adds splash and knockout classes when the pitcher is knocked out', () => {
    let s = createV10Duel(0);
    s = enterV10Node(s, 'a1-entry');
    s.battle.pending = { zone: 4, roll: 0.5, powerRoll: 0.9 };
    s.battle.revealed = { zone: 4, label: '안타', kind: 'hit' };
    const shot = { grade: 'solid', kind: 'hit', title: '안타', motion: { slowmo: 0 } };
    const koPitcher = { ...s.pitcher, hp: 0 };

    render(
      <BallparkBattle
        s={s}
        hand={[]}
        fxStage="settle"
        shot={shot}
        playToken={2}
        pitcher={koPitcher}
      />
    );

    const verdict = document.querySelector('.bp-verdict');
    expect(verdict).not.toBeNull();
    expect(verdict.classList.contains('splash')).toBe(true);
    expect(verdict.classList.contains('knockout')).toBe(true);
  });

  it('defines dramatic golden splash styling with reduced-motion protection in ballpark.css', () => {
    expect(ballparkCss).toMatch(/\.bp-verdict\.splash/);
    expect(ballparkCss).toMatch(/\.bp-verdict\.splash\.homer/);
    expect(ballparkCss).toMatch(/\.bp-verdict\.splash\.knockout/);
    expect(ballparkCss).toMatch(/@media \(prefers-reduced-motion:reduce\)/);
  });
});
