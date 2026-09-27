import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

describe('V15 Map Screen Masterpiece Contract', () => {
  const mapJsx = fs.readFileSync(new URL('../src/duel/BallparkMap.jsx', import.meta.url), 'utf8');
  const ballparkCss = fs.readFileSync(new URL('../src/duel/ballpark.css', import.meta.url), 'utf8');

  it('BallparkMap connects island city backdrop production asset', () => {
    expect(mapJsx).toMatch(/map-island-city\.png/);
  });

  it('BallparkMap connects v15 production stadium node assets', () => {
    expect(mapJsx + ballparkCss).toMatch(/map-node-battle\.png/);
    expect(mapJsx + ballparkCss).toMatch(/map-node-selected-stadium\.png/);
    expect(mapJsx + ballparkCss).toMatch(/map-node-elite\.png/);
  });

  it('preserves A10 map node contract in ballpark.css', () => {
    expect(ballparkCss).toContain('A10-map-node-battle.png');
    expect(ballparkCss).toContain('A10-map-node-elite.png');
  });
});
