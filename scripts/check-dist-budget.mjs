/* Shipped-size budget for the production build (run after `pnpm run build`).
   Fails when a heavy art PNG ships without its WebP derivative (new art landed but
   scripts/optimize-runtime-art.py was not re-run) or when dist/ grows past the total budget.

     node scripts/check-dist-budget.mjs

   Fix a failure with: pnpm run build && python scripts/optimize-runtime-art.py, commit assets/runtime-opt/. */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const TOTAL_MB = 60; // 50 → 60 (2026-10-10, owner-approved): self-hosted font slices + V16 cards + 3 pitcher atlases
const PNG_KB = 600;
// PNGs the optimizer leaves as-is on purpose (lossless WebP saves <10%; lossy blurs the frames)
const PNG_ALLOW = [/-pitch-120-atlas-[\w-]+\.png$/];

if (!fs.existsSync(DIST)) {
  console.error('dist/ missing: run pnpm run build first');
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else files.push({ p: path.relative(DIST, p), size: fs.statSync(p).size });
  }
})(DIST);

const errors = [];
const total = files.reduce((s, f) => s + f.size, 0);
if (total > TOTAL_MB * 1024 * 1024) {
  errors.push(`dist/ is ${(total / 1048576).toFixed(1)}MB, budget ${TOTAL_MB}MB`);
}
for (const f of files) {
  if (!f.p.endsWith('.png') || f.size <= PNG_KB * 1024) continue;
  if (PNG_ALLOW.some((re) => re.test(f.p))) continue;
  errors.push(`${f.p} ships as a ${(f.size / 1048576).toFixed(1)}MB PNG (limit ${PNG_KB}KB) — no WebP derivative`);
}

const mb = (n) => (n / 1048576).toFixed(1);
const byExt = {};
for (const f of files) {
  const ext = path.extname(f.p) || '(none)';
  byExt[ext] = (byExt[ext] || 0) + f.size;
}
console.log(`dist ${mb(total)}MB / ${TOTAL_MB}MB — ` +
  Object.entries(byExt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, s]) => `${e} ${mb(s)}MB`).join(', '));

if (errors.length) {
  for (const e of errors) console.error(`::error::${e}`);
  console.error('Fix: pnpm run build && python scripts/optimize-runtime-art.py, then commit assets/runtime-opt/');
  process.exit(1);
}
