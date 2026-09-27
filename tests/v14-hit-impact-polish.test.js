import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const actorsSource = fs.readFileSync('src/duel/BallparkActors.jsx', 'utf8');
const ballparkCss = fs.readFileSync('src/duel/ballpark.css', 'utf8');

describe('V14 P1-11 hit impact, trail and camera polish', () => {
  it('features dedicated impact burst graphics and shockwave at the contact point', () => {
    expect(actorsSource).toMatch(/const\s+impactFx\s*=\s*new\s+PIXI\.Graphics\(\)/);
    expect(actorsSource).toMatch(/impactFx\.circle/);
    expect(actorsSource).toMatch(/dataset\.impact/);
  });

  it('draws a connected speed trail for hit balls during exit flight', () => {
    expect(actorsSource).toMatch(/trail\.length/);
    expect(actorsSource).toMatch(/hit&&k>1/);
  });

  it('provides tailored camera micro-shake across all hit grades with reduced-motion protection', () => {
    expect(ballparkCss).toMatch(/\.bp-scene\.fx-stage-impact:is\([^)]*fx-dead-center/);
    expect(ballparkCss).toMatch(/\.bp-scene\.fx-stage-impact:is\([^)]*fx-solid/);
    expect(ballparkCss).toMatch(/@media \(prefers-reduced-motion:reduce\)/);
  });
});
