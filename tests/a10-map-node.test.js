import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('A10 Map Node Base Plates and CSS Integration', () => {
  const root = path.resolve(__dirname, '..');
  const uiKitDir = path.join(root, 'assets/ui-kit');
  const cssPath = path.join(root, 'src/duel/ballpark.css');

  it('generates all 5 A10 map node base plate assets', () => {
    const expectedFiles = [
      'A10-map-node-battle.png',
      'A10-map-node-elite.png',
      'A10-map-node-boss.png',
      'A10-map-node-facility.png',
      'A10-map-node-locked.png',
    ];
    for (const file of expectedFiles) {
      const fullPath = path.join(uiKitDir, file);
      expect(fs.existsSync(fullPath), `Asset file ${file} should exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(50);
    }
  });

  it('integrates A10 map node base plates into ballpark.css', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('A10-map-node-battle.png');
    expect(css).toContain('A10-map-node-elite.png');
    expect(css).toContain('A10-map-node-boss.png');
    expect(css).toContain('A10-map-node-facility.png');
    expect(css).toContain('A10-map-node-locked.png');
  });
});
