/* Node mirror of scripts/optimize-runtime-art.py — same RULES, same manifest format, no Pillow.
   Lets a machine without Python regenerate the shipped WebP derivatives.
   Usage: node scripts/optimize-runtime-art.mjs [--check] */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { globSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'assets', 'runtime-opt');
const MIN_BYTES = 150_000;

/* (pattern on the posix path under assets/, rule). First match wins.
   keep=True     -> same pixel size (sprite sheets / atlases slice frames by ratio; Pixi keyposes)
   long=N        -> fit the long edge to N px (2x the largest size the game draws it at)
   lossless=True -> exact pixels (pixel-art frames) */
const RULES = [
  // Illustrated actor atlases. Lossless was measured LARGER than the PNG master
  // (red-rush: 2.64MB PNG -> 2.75MB lossless WebP), so it never cleared the saving
  // guard and every atlas shipped as raw PNG. q90 keeps the drawn edges and still
  // saves ~41%. keep=True because frames slice by cell ratio, not by pixel size.
  [/^pitcher-sd-v\d\/.*-atlas\.png$/, { keep: true, q: 90 }],
  [/^pitcher-sd-v\d\/atlases\/.*-atlas\.png$/, { keep: true, q: 90 }],
  [/^pitcher-pixellab-v\d\/atlases\/.*-atlas\.png$/, { keep: true, lossless: true }],
  [/^sprites-v4\/.*-60\.png$/, { keep: true, lossless: true }],
  [/^ui-kit\/.*master-sheet\.png$/, { keep: true, lossless: true }],
  // Catch-all for actor atlases in any pitcher-* directory (pitcher-study-vN, new sd folders,
  // future ones). Enumerating each folder is what let 13 atlases ship as raw PNG.
  [/^pitcher-[^/]+\/.*-atlas\.png$/, { keep: true, q: 90 }],
  [/^production-art\/battle-polish-v16\/.*\.png$/, { keep: true, q: 90 }],
  [/^production-art\/battle-portrait-v15\/batter-sheet\.png$/, { long: 2048, q: 88 }],
  [/^production-art\/battle-portrait-v15\/batter-sheet-runtime\.png$/, { keep: true, q: 88 }],
  [/^production-art\/phone-assets-v18\/A0[1-3].*\.png$/, { long: 1024, q: 84 }],
  [/^production-art\/phone-assets-v18\/.*\.png$/, { long: 1200, q: 84 }],
  [/^production-art\/red-rush-knockout-layers-v17\/.*\.png$/, { long: 1024, q: 84 }],
  [/^cards-v15\/deck-dex-backdrop\.png$/, { keep: true, q: 80 }],
  [/^cards-v15\/.*\.png$/, { long: 768, q: 82 }],
  [/^production-art\/mockup-world-v15\/dex-.*\.png$/, { long: 800, q: 84 }],
  [/^production-art\/mockup-world-v15\/map-node-.*\.png$/, { long: 256, q: 85 }],
  [/^production-art\/mockup-world-v15\/frame-reward-.*\.png$/, { long: 512, q: 90 }],
  [/^production-art\/mockup-world-v15\/.*\.png$/, { keep: true, q: 80 }],
  [/^pitcher-study-v2\/source\/.*-release\.png$/, { long: 720, q: 85 }],
  [/^pitcher-mobs-v1\/.*\.png$/, { long: 720, q: 85 }],
  [/^duel\/stadium.*\.png$/, { keep: true, q: 80 }],
];

const ruleFor = (rel) => {
  for (const [pat, rule] of RULES) if (pat.test(rel)) return rule;
  return null;
};
const sha1 = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');

function shipped() {
  const files = globSync('*.png', { cwd: path.join(ROOT, 'dist', 'assets') });
  if (!files.length) {
    console.error('run the build first: derivatives are made only for PNGs the build ships');
    process.exit(2);
  }
  const ships = new Set(files.map((f) => sha1(path.join(ROOT, 'dist', 'assets', f))));
  try {
    const m = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
    for (const [h, e] of Object.entries(m)) {
      const src = path.join(ROOT, 'assets', e.src);
      if (fs.existsSync(src) && sha1(src) === h) ships.add(h);
    }
  } catch {}
  return ships;
}

const check = process.argv.includes('--check');
fs.mkdirSync(OUT, { recursive: true });
const ships = shipped();
const manifest = {};
const missing = [];

const masters = globSync('**/*.png', { cwd: path.join(ROOT, 'assets'), nodir: false })
  .map((rel) => path.join(ROOT, 'assets', rel))
  .sort();

for (const abs of masters) {
  const rel = path.relative(path.join(ROOT, 'assets'), abs).split(path.sep).join('/');
  if (rel.startsWith('runtime-opt/') || fs.statSync(abs).size < MIN_BYTES) continue;
  const rule = ruleFor(rel);
  if (!rule) continue;
  const h = sha1(abs);
  if (!ships.has(h)) continue;
  const name = `${h.slice(0, 12)}-${path.parse(rel).name}.webp`;
  const dest = path.join(OUT, name);
  if (check) {
    if (!fs.existsSync(dest)) missing.push(`${rel}  (${(fs.statSync(abs).size / 1024) | 0} KB master)`);
    continue;
  }
  const src = sharp(abs, { limitInputPixels: false });
  const meta = await src.metadata();
  let pipe = src.ensureAlpha();
  if (!rule.keep && Math.max(meta.width, meta.height) > rule.long) {
    const s = rule.long / Math.max(meta.width, meta.height);
    pipe = pipe.resize(Math.round(meta.width * s), Math.round(meta.height * s), { kernel: 'lanczos3' });
  }
  const buf = await (rule.lossless
    ? pipe.webp({ lossless: true, effort: 6 })
    : pipe.webp({ quality: rule.q, alphaQuality: 100, effort: 6 })).toBuffer();
  // Record the ENCODED size, not the master's. tests/runtime-art.test.js locks the derivative
  // dimensions (map nodes <=256, cards <=768, atlases keep the master size), and a `long`
  // rule resizes. Reading the master's metadata here recorded pre-resize sizes and broke it.
  const outMeta = await sharp(buf).metadata();
  fs.writeFileSync(dest, buf);
  const srcBytes = fs.statSync(abs).size;
  const savedBytes = srcBytes - buf.length;
  // Keep the derivative when it is either meaningfully smaller by ratio, or big enough
  // in absolute terms that the shipped bytes matter. A 1.3MB PNG that becomes 0.9MB is
  // worth shipping; a 4KB PNG that becomes 3.5KB is not.
  const worthIt = savedBytes >= 0.1 * srcBytes || savedBytes >= 200_000;
  if (!worthIt) {
    fs.rmSync(dest);
    console.log(`  skip ${rel}: only ${((savedBytes / srcBytes) * 100).toFixed(1)}% / ${(savedBytes / 1024) | 0} KB saved`);
    continue;
  }
  manifest[h] = { file: name, src: rel, size: [outMeta.width, outMeta.height] };
  console.log(`  ok   ${rel}: ${(srcBytes / 1024) | 0} KB -> ${(buf.length / 1024) | 0} KB (-${((savedBytes / srcBytes) * 100).toFixed(0)}%, ${(savedBytes / 1024) | 0} KB)`);
}

if (check) {
  console.log(missing.length ? missing.join('\n') : 'all rule matches have derivatives');
  process.exit(missing.length ? 1 : 0);
}

const live = new Set(Object.values(manifest).map((m) => m.file));
for (const old of globSync('*.webp', { cwd: OUT })) {
  if (!live.has(old)) fs.rmSync(path.join(OUT, old));
}
const sorted = Object.fromEntries(Object.entries(manifest).sort((a, b) => a[1].src.localeCompare(b[1].src)));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(sorted, null, 1) + '\n', 'utf8');
console.log(`manifest entries: ${Object.keys(sorted).length}`);