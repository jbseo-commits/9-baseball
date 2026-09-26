import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('A9 HP Gauge Assets and CSS Integration', () => {
  const root = path.resolve(__dirname, '..');
  const uiKitDir = path.join(root, 'assets/ui-kit');
  const cssPath = path.join(root, 'src/duel/ballpark.css');

  it('generates all 4 A9 HP gauge assets', () => {
    const expectedFiles = [
      'A9-hp-frame.png',
      'A9-hp-seg-full.png',
      'A9-hp-seg-lost.png',
      'A9-hp-seg-empty.png',
    ];
    for (const file of expectedFiles) {
      const fullPath = path.join(uiKitDir, file);
      expect(fs.existsSync(fullPath), `Asset file ${file} should exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(50);
    }
  });

  it('integrates A9 HP gauge and segment assets into ballpark.css', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('A9-hp-frame.png');
    expect(css).toContain('A9-hp-seg-full.png');
    expect(css).toContain('A9-hp-seg-lost.png');
    expect(css).toContain('A9-hp-seg-empty.png');
  });
});
