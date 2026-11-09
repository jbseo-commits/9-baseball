# Rest choice — PR96 part2

User explicitly confirmed exactly1out recovery. Rest now offers recovery OR one eligible card upgrade, with a separate card-ID selection and back/cancel. Selection/cancel spends nothing; confirmation finishes the visit once. Zero-outs recovery/no-eligible-card upgrade are disabled; skip remains available. Lifetime stats, deck size/nextId and boss full recovery are preserved. Newly visited rest no longer creates+8; already-earned rest/event bonuses and old utility-history saves retain their existing next-combat consumption.

Base e8aa628 (shop PR97). Rest-only CSS, engine option validation, App/map/welcome copy. Engine review found existing ID-only training/locker validators would accept the new recover type: both now validate their exact type and have explicit disguised-recovery counterexample tests. No save-schema change.

Red before implementation:5/7 new engine cases failed. Final241files/1644tests PASS, smoke10/build/dist52.8MiB PASS. Two old readability tests and the old newly-awarded+8 contract were updated to the user-approved rules; legacy-bonus coverage is preserved separately.

[Independent actual UX](independent-ux.md), [reports](independent-report.json):5sizes/10flows, actual recover2→1, chosen duplicateID only upgraded with outs2, save/reload→next-combat actual starting outs1/2, legacy+8→active once, real touch/Tab/Enter, disabled edges/skip, final small-header bounds. Fixtures are engine-produced states with diagnostic runOuts2; not a human playtest.

First visual candidate scored NOT_IMPROVED(-.50) and was corrected without lowering gates. [Fresh final sealed comparison](comparison.png)/[scores](judgement.json):2.88→3.44,+.56,5axes improve,no decline:IMPROVED/notBAR_MET. Retains panoramic stadium/background and existing UI art. Three product revisions; no further retry-count reset. Exact CI/merge/public verification goes in the implementation PR body. Physical-device/human fun/art release quality remain unproven.
