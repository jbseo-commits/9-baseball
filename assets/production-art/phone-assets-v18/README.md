# Phone asset queue · A01–A09

Nine separated production-art candidates for the home-run, title, ending, and female Red Rush knockout scenes. These files do not replace the current runtime cinematics. `manifest.json` records the source, dimensions, transparency, and intended layer role.

The home-run batter and empty stadium are the user's previously reviewed PNGs. A03 and A04–A09 were generated with the built-in image generator using `docs/art/benchmark/target/` and existing production art as visual references. A04 and A05 were revised after an edge-margin check. Each file was inspected visually, checked for PNG dimensions and alpha/corners, and compared at mobile preview sizes. The comparison is a composition sanity check, not a final in-game placement or animation approval.

Composition notes:

- A01/A02/A03: align the trailing streak between the bat and the single ball; no code-rendered ball should be duplicated.
- A04/A05/A06: the title needs intentional placement and safe areas for the separately rendered logo/menu. On a portrait viewport the batter must sit lower than a naïve center overlay.
- A07/A08: keep the right sky free for the ending copy and logo. The batter is a separate foreground layer.
- A09: intermediate pose between the existing female `stagger` and `kneel`; exact pivots, foot contact and playback timing still require game-speed verification.

No runtime import, CSS, game rule, or save data was changed here.
