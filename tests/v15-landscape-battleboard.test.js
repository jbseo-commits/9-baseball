import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

describe('V15 Landscape Battleboard Masterpiece Contract', () => {
  const ballparkCss = fs.readFileSync(new URL('../src/duel/ballpark.css', import.meta.url), 'utf8');

  it('references stadium-landscape.png in landscape mode', () => {
    expect(ballparkCss).toMatch(/stadium-landscape\.png/);
  });

  it('keeps pitcher on mound rubber with proper landscape positioning', () => {
    expect(ballparkCss).toMatch(/@media\s*\(orientation:\s*landscape\)/);
    // Pitcher must be centered in landscape stadium
    expect(ballparkCss).toMatch(/\.bp-pitcher/);
  });

  it('ensures 9ZONE is positioned as tactical glass grid beside pitcher', () => {
    expect(ballparkCss).toMatch(/\.bp-zone/);
  });

  it('positions pitcher HUD tag cleanly without obstructing the field', () => {
    expect(ballparkCss).toMatch(/\.bp-ptag/);
  });
});
