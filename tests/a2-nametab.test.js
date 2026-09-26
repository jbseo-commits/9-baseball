import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('A2 Name Tab Assets and CSS Integration', () => {
  const root = path.resolve(__dirname, '..');
  const uiKitDir = path.join(root, 'assets/ui-kit');
  const cssPath = path.join(root, 'src/duel/ballpark.css');

  it('generates both A2 name tab assets', () => {
    const expectedFiles = [
      'A2-nametab-navy.png',
      'A2-nametab-stitch.png',
    ];
    for (const file of expectedFiles) {
      const fullPath = path.join(uiKitDir, file);
      expect(fs.existsSync(fullPath), `Asset file ${file} should exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(50);
    }
  });

  it('integrates A2 name tab assets into ballpark.css', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('A2-nametab-navy.png');
    expect(css).toContain('A2-nametab-stitch.png');
  });
});
