import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

describe('V15 Title, Ending & Cutscenes Masterpiece Contract', () => {
  const duelCss = fs.readFileSync(new URL('../src/duel/duel.css', import.meta.url), 'utf8');
  const ballparkEndJsx = fs.readFileSync(new URL('../src/duel/BallparkEnd.jsx', import.meta.url), 'utf8');
  const ballparkCss = fs.readFileSync(new URL('../src/duel/ballpark.css', import.meta.url), 'utf8');

  it('Title screen connects title-keyart.png backdrop in duel.css', () => {
    expect(duelCss).toMatch(/title-keyart\.png/);
  });

  it('Ending screen connects ending-keyart.png in BallparkEnd.jsx for victory', () => {
    expect(ballparkEndJsx).toMatch(/ending-keyart\.png/);
  });

  it('Ballpark splash connects homerun and knockout cinematic scene art in ballpark.css', () => {
    expect(ballparkCss).toMatch(/homerun-scene\.png/);
    expect(ballparkCss).toMatch(/knockout-red-rush-scene\.png/);
  });
});
