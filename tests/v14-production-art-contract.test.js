import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../', import.meta.url);
const readPng = relative => {
  const bytes = fs.readFileSync(new URL(relative, root));
  expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
};

describe('V14 portrait production art contracts', () => {
  it('keeps the batter atlas in nine equal high-resolution transparent cells', () => {
    const atlas = readPng('assets/ui-kit/batter/batter-v14-master-sheet.png');
    expect(atlas.width % 3).toBe(0);
    expect(atlas.height % 3).toBe(0);
    expect(atlas.width / 3).toBeGreaterThanOrEqual(320);
    expect(atlas.height / 3).toBeGreaterThanOrEqual(320);
    expect(atlas.colorType).toBe(6);
  });

  it('keeps the card atlas in four equal illustration cells', () => {
    const atlas = readPng('assets/ui-kit/cards/battle-core-v14-master-sheet.png');
    expect(atlas.width % 2).toBe(0);
    expect(atlas.height % 2).toBe(0);
    expect(atlas.width / 2).toBeGreaterThanOrEqual(480);
    expect(atlas.height / 2).toBeGreaterThanOrEqual(360);
  });
});
