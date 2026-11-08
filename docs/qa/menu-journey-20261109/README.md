# Menu → route → destination · 2026-11-09 KST

The old map remained in its portrait presentation on landscape phones, leaving most of the screen occupied by the pinned information sheet. The current game's map now uses its landscape layout with a scrollable route board, selected opponent portrait and pinned confirmation. Selection, route illumination and destination arrival are separate visible beats.

- Title: keyboard focus has one highlighted row, a short selection glint and scoped sound.
- Start pack: selection settles; confirmation is latched once and shows the **actual pack name and its three representative card artworks** over the already committed map.
- Map: reachable/inspected portraits, legible labels and sequential route emphasis. Future nodes remain inspectable but cannot be entered. Both map and detail text can scroll without losing the CTA.
- Departure: the actual opponent portrait/name appears over the real battle. The engine/save commit is immediate. The 760ms visual receipt blocks no input and disappears on new input, backgrounding or unmount. Reduced motion uses a 100ms receipt without particles/movement.
- No probability, energy, damage, card consumption, save schema or legacy layout-mode change.

## Validation

| Check | Actual result |
| --- | --- |
| Full release suite | **239 files / 1631 tests PASS**. New 11 tests cover audio lifetimes, reduced/interrupted arrival, accepted/rejected confirm, duplicate pack confirmation, vnext rotation and legacy isolation. |
| Smoke / build / budget | `zone-report.js 10`, Vite production build, **52.8/60MiB** PASS. Existing chunk-size advisory remains. |
| Normal production play | Fresh title → pack → map → actual 7-pitch KO → reward skip → map → reload/continue → event. Each action matched the unchanged engine. QA's deterministic policy is regression evidence, not a human strategy/fun study. |
| Real input, three sizes | 667×320, 844×390, 1440×900: cancel without save, future inspection without mutation, pan to far nodes, CTA hit, rotate and restore selection/state, enter and reload/continue PASS. Latest route widths **680/680/1090px** in `browser.json`. |
| First practice | 667×375, 844×390, 844×300, 1366×768: all three lessons, pack exit and unsaved cancellation PASS. |
| Time samples | Actual production screens at target 80/200/360/600/850ms (actual capture timestamps retained). Pack artwork loaded; map/battle saved from first sample; receipt absent at 850ms. No claim that these samples alone verify all display frames. |
| Audio | Actual Web Audio recording, context `running`, 38936 bytes, RMS ≈−22.7dB, peak≈−7.6dB. Recording includes shared BGM, so it is **not** a per-cue cancellation proof; mute/unmount/background cancel are covered by focused signal tests. |
| Independent code/UX | Read-only reviewers found no blocking engine/save/flow defect. Their two timing/audio findings and early particle/text overlap were corrected. |
| Blind static comparison | 12 sheets, fresh independent judge, sealed 192 scores before reveal: **2.89→3.22**, +.33, 7/8 axes improve, largest drop .08; **IMPROVED, not BAR_MET**. Art style/UI material still need further work. |

The first full run caught one real legacy regression (portrait map figures switched to head portraits); the fix restricts those images and styles to wide mode. Initial normalized SVG dash + non-scaling-stroke also hid highlighted paths in Chromium; final routes use solid strokes with sequential brightness/width settle. These failures were corrected, not removed from expected behavior.

## Evidence and limits

`map-before.png`, `map-after.png`, `pack-arrival.png`, `battle-arrival.png`, `browser.json`, `temporal.json`, sealed scores and reveal output accompany this record. Full logs/videos and earlier failures remain in `/workspace/9zone-menu-juice-20261109/` locally. Public deployment confirmation is added to the PR after the exact main bundle is verified.

The [eight-tool applicability record](../../../assets/menu-journey/README.md) distinguishes **three actually executed tools** from installed-but-unused and remote-only tools. No GPU/model/paid-provider installation occurred. This is a concrete improvement to the journey presentation, not proof of commercial readiness or human satisfaction.
