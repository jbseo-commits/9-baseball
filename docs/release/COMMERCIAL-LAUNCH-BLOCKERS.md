# Commercial launch blockers

_Status as of 2026-10-06. Measured against `origin/main` at `efff947` and the
`release/commercial-hardening` branch._

This file is the gate list for a commercial release. Items marked **BLOCKER**
must be closed before a store submission or paid distribution. Items marked
**OWNER** cannot be closed by engineering alone — they need a rights decision
from the rights holder.

## Fixed on this branch

| # | Blocker | Fix |
| --- | --- | --- |
| 1 | `main` shipped with 5 failing tests (the Cinematic V2 merge landed without CI) | diagnosed per case and corrected; 898/898 green |
| 2 | `deploy-pages.yml` built and deployed with no test run | `pnpm test` now gates the production build |
| 3 | V10 save validator only checked `typeof kind === 'string'`, so a deck with a kind absent from `CARDS` passed validation and crashed the deck modal into `ErrorBoundary` with no recovery | CARDS membership plus run-level field checks; optional fields validated only when present so existing saves keep loading |
| 4 | `ErrorBoundary` "start over" cleared only the V10 key, so a crash driven by the V9 deck save repeated forever | clears the V9 and legacy keys too |
| 5 | Art pipeline had no rule for `pitcher-sd-v2/atlases/` or any other `pitcher-*/…-atlas.png`, so 13 atlases shipped as raw master PNGs | catch-all rule added |
| 6 | The remaining atlas was pinned to lossless, and measured lossless WebP came out 4% **larger** than the PNG, so the "no real saving" guard silently discarded the derivative | switched to q90 (illustration, not pixel art) and the guard now also accepts ≥200KB saved; dist 49.4MB → 45.1MB |
| 7 | `title-pixel.css` was no longer the last global stylesheet, so the title overlay lost the cascade | import order restored |
| 8 | No `LICENSE`, `NOTICE.md` or `PRIVACY.md` | added |

## BLOCKER — engineering

| # | Item | Evidence | Note |
| --- | --- | --- | --- |
| B1 | Test suite was red on `main` | fixed above, but this only happened because deploy had no gate | keep the gate; do not bypass it |
| B2 | `portrait-lock.css` hides the entire app with a global rule | `html body #root { visibility: hidden }` under `(orientation:landscape) and (max-height:540px) and (pointer:coarse)` | a global visibility kill on `#root` is a landmine: it blanks the whole product for any coarse-pointer device under that height. Replace with a solid overlay so the app is covered, never hidden |
| B3 | Shipped orientation contradicts the project's own rules | `src/duel/layout-mode.js:6` `PORTRAIT_ONLY = true` | see the orientation decision below |
| B4 | Balance is not release-grade | bot full-run completion 10–16% (V9 3/30, V10 4/25) across ~33 nodes and ~1,084 total pitcher HP | `docs/STATUS.md` records 0.233 for the same V9 path; re-measurement is roughly half that, so the number is drifting rather than holding |
| B5 | Version identity is inconsistent in shipped UI | header reads `BUILD YOUR BASEBALL · V9.2`, branch screen `V9.2 · CHOOSE THE OPPONENT`, `package.json` is `0.3.0` and `private: true`, docs are at V12/V13 | pick one string and use a single source of truth |
| B6 | Runtime depends on a third-party font CDN | `index.html` loads Gowun Dodum / Black Han Sans / Silkscreen; `src/duel/duel.css:1` `@import`s Noto Sans KR (an `@import` in CSS is render-blocking) | self-host; see `NOTICE.md` |
| B7 | Documented features that do not exist | `docs/V12-PROGRESS.md` marks P1–P8 and UX-1 complete and names 9 CSS files and 9 test files, none of which are on `main` (deleted in `d497db1`) | a submission reviewer who reads the repo will find this |
| B8 | Dead code with live tests | 14 files / ~1,299 lines unreachable from `src/main.jsx`, including `RunMap.jsx` (354 lines); tests exist for several of them, so the suite verifies code that cannot ship | remove, or make the docs stop claiming them |

## BLOCKER — OWNER decision required

These cannot be closed by writing code. Each needs the rights holder to decide,
and each is a question a store reviewer or a publisher will ask.

| # | Question | Why it blocks |
| --- | --- | --- |
| O1 | Who is the rights holder, and are the terms in `LICENSE` correct? | the file was added as proprietary all-rights-reserved because that grants nothing; the name and any commercial terms still need confirming |
| O2 | What do the generative-image service terms allow for a paid game? | all artwork is generated output; the service terms were never recorded in the repo |
| O3 | What do the PixelLab terms allow, and at which tier? | the Act 1 branch pitchers are PixelLab output; the README only notes results are also saved to a PixelLab gallery. A paid tool's output terms need checking against the intended distribution |
| O4 | Is the intended orientation portrait or landscape? | see below |
| O5 | Is the reference material risk accepted? | development notes state legal non-infringement "is not guaranteed". Pitching footage and instructional material informed motion study. `assets/pitcher-sd-v2/README.md` records that reference SD proportions and pixel density were studied. A deliberate, documented acceptance is needed, or the affected assets need replacement |

## Orientation decision (O4)

The rules file and most of the documentation describe a mobile-landscape-first
game. The shipped build is portrait-only: phones in landscape get a "rotate to
portrait" overlay, and desktop renders the game inside a 9:16 frame.

The shipped code and the written intent disagree. Both cannot be kept:

- If **portrait** is intended, roughly 1,000 lines of landscape CSS and the JS
  sidecars that gate on `landscapeMedia()` are unreachable and should be removed,
  and the documentation should stop describing landscape as the play format.
- If **landscape** is intended, `PORTRAIT_ONLY` and `portrait-lock.css` need to be
  reverted, and the landscape QA that was captured before the flip has to be redone.

My read: portrait is a defensible primary orientation for a vertical card
battler, and it is what the product actually does. That makes the code right and
the documentation wrong — but it is a product call, so it is filed as O4 rather
than decided here.

## Quality records

`docs/art/QUALITY-LOG.md` records a `MASTERPIECE` grade (average 4.88). The grade
was self-assigned by the same agent that produced the art, and
`docs/art/FULL_MOCKUP_ASSET_AUDIT_2026-09-28.md`, written the next day, records
six screens as having no real captures and several asset groups as
`runtime_connected: false`. The two cannot both stand. For an external
submission the second document is the credible one; the MASTERPIECE line should be
annotated as self-assessed and superseded.

## Verification checklist for a release branch

- `pnpm test` — 898/898, no failures
- `pnpm run build` — green
- `node scripts/optimize-runtime-art.mjs --check` — every rule match has a derivative
- first-load transfer measured on a real phone network, not localhost
- landscape and portrait checked on a physical device
- an old save from before each schema change loads without an error banner