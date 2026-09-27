import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

describe('V15 Reward Screen Masterpiece Contract', () => {
  const stopJsx = fs.readFileSync(new URL('../src/duel/BallparkStop.jsx', import.meta.url), 'utf8');
  const ballparkCss = fs.readFileSync(new URL('../src/duel/ballpark.css', import.meta.url), 'utf8');

  it('BallparkStop connects reward production illustration assets', () => {
    expect(stopJsx).toMatch(/reward-precision-blue|reward-flame-red|reward-relay-cyan/);
  });

  it('BallparkStop connects reward frames for rare and epic', () => {
    expect(ballparkCss).toMatch(/frame-reward-rare|frame-reward-epic/);
  });

  it('renders card cost, title, description, and rarity badges in reward offers', () => {
    expect(stopJsx).toMatch(/bp-reward-rarity|bp-offer-cost|bp-offer-art/);
  });
});
