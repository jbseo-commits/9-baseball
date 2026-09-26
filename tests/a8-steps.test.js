import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('A8 Step Indicator Assets and CSS Integration', () => {
  const root = path.resolve(__dirname, '..');
  const uiKitDir = path.join(root, 'assets/ui-kit');
  const cssPath = path.join(root, 'src/duel/ballpark.css');

  it('generates all 5 A8 step indicator assets', () => {
    const expectedFiles = [
      'A8-steps-node-off.png',
      'A8-steps-node-current.png',
      'A8-steps-node-done.png',
      'A8-steps-line-off.png',
      'A8-steps-line-on.png',
    ];
    for (const file of expectedFiles) {
      const fullPath = path.join(uiKitDir, file);
      expect(fs.existsSync(fullPath), `Asset file ${file} should exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(50);
    }
  });

  it('integrates A8 step indicator assets into ballpark.css', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('A8-steps-node-off.png');
    expect(css).toContain('A8-steps-node-current.png');
    expect(css).toContain('A8-steps-node-done.png');
    expect(css).toContain('A8-steps-line-off.png');
    expect(css).toContain('A8-steps-line-on.png');
  });
});
