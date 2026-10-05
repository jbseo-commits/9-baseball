import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const ids = ['regular-10-sky-phantom', 'regular-11-gale-twister', 'regular-12-vulcan-blaze'];

describe('autonomous pitcher port', () => {
  it('keeps all three pitchers wired through roster and authored geometry', () => {
    const roster = JSON.parse(read('assets/pitcher-mobs-v1/roster.json'));
    const release = JSON.parse(read('src/duel/pitcher-release.json'));
    const stance = JSON.parse(read('src/duel/pitcher-stance.json'));
    const stride = JSON.parse(read('src/duel/pitcher-stride.json'));
    const visuals = read('src/duel/pitcher-visuals.js');
    const voice = read('src/duel/pitcher-voice.js');
    for (const id of ids) {
      expect(roster.some((p) => p.id === id)).toBe(true);
      expect(release[id]).toBeTruthy();
      expect(stance[id]).toBeTruthy();
      expect(stride[id]).toBeTruthy();
      expect(visuals).toContain(id);
      expect(voice).toContain(id);
    }
  });

  it('does not replace Cinematic V2 battle orchestration', () => {
    const main = read('src/main.jsx');
    expect(main).toContain('cinematic-director.css');
    expect(main).toContain('cinematic-commit-handoff.css');
    expect(main).toContain('cinematic-pitch-handoff.css');
  });
});
