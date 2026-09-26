import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('A11 Icons 12 Types Assets and CSS Integration', () => {
  const root = path.resolve(__dirname, '..');
  const uiKitDir = path.join(root, 'assets/ui-kit');
  const cssPath = path.join(root, 'src/duel/ballpark.css');

  const expectedIcons = [
    'A11-icons-deck.png',
    'A11-icons-discard.png',
    'A11-icons-sound-on.png',
    'A11-icons-sound-off.png',
    'A11-icons-help.png',
    'A11-icons-locker.png',
    'A11-icons-training.png',
    'A11-icons-shop.png',
    'A11-icons-rest.png',
    'A11-icons-runner.png',
    'A11-icons-shaken.png',
    'A11-icons-signature.png',
  ];

  it('generates all 12 A11 icon assets', () => {
    for (const file of expectedIcons) {
      const fullPath = path.join(uiKitDir, file);
      expect(fs.existsSync(fullPath), `Asset file ${file} should exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(50);
    }
  });

  it('integrates all 12 A11 icons into ballpark.css', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    for (const file of expectedIcons) {
      expect(css).toContain(file);
    }
  });
});
