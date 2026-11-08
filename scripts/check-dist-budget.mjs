/* Shipped-size budget for the production build (run after `pnpm run build`).
   Fails when a heavy art PNG ships without its WebP derivative (new art landed but
   scripts/optimize-runtime-art.py was not re-run) or when dist/ grows past the total budget.

     node scripts/check-dist-budget.mjs

   Fix a failure with: pnpm run build && python scripts/optimize-runtime-art.py, commit assets/runtime-opt/. */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const TOTAL_MIB = 60; // 50 → 60 (2026-10-10, owner-approved): self-hosted font slices + V16 cards + 3 pitcher atlases
const PNG_KIB = 600;
// Historical 120-frame sheets belong only to the development cinematic lab.
// The actual roster uses compact pitcher-inbetweens-v1 drawing atlases.
const REVIEW_ONLY_ATLAS = /^(?:red-rush|regular-02-teal-mirage|regular-03-amber-sinker|regular-04-ivory-ace|elite-01-cobalt-impact|boss-01-emerald-tyrant)-pitch-120-atlas-/;
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
if (total > TOTAL_MIB * 1024 * 1024) {
  errors.push(`dist/ is ${(total / 1048576).toFixed(1)}MiB, budget ${TOTAL_MIB}MiB`);
}
for (const f of files) {
  if (REVIEW_ONLY_ATLAS.test(path.basename(f.p)))errors.push(`${f.p} is a legacy cinematic-review atlas; keep that showcase development-only`);
  if (!f.p.endsWith('.png') || f.size <= PNG_KIB * 1024) continue;
  if (PNG_ALLOW.some((re) => re.test(f.p))) continue;
  errors.push(`${f.p} ships as a ${(f.size / 1048576).toFixed(1)}MiB PNG (limit ${PNG_KIB}KiB) — no WebP derivative`);
}

const mb = (n) => (n / 1048576).toFixed(1);
const byExt = {};
for (const f of files) {
  const ext = path.extname(f.p) || '(none)';
  byExt[ext] = (byExt[ext] || 0) + f.size;
}
console.log(`dist ${mb(total)}MiB / ${TOTAL_MIB}MiB — ` +
  Object.entries(byExt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, s]) => `${e} ${mb(s)}MiB`).join(', '));

if (errors.length) {
  for (const e of errors) console.error(`::error::${e}`);
  console.error('Fix heavy PNGs: pnpm run build && python scripts/optimize-runtime-art.py; keep legacy showcase DEV-only and remove unused historical atlas imports.');
  process.exit(1);
}
