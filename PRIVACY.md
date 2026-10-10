# Privacy notice

_Last updated: 2026-10-06_

9ZONE HOMEBOUND ("the game") runs entirely in your browser. This notice describes
what the game stores and what it sends.

## What the game stores

The game keeps your progress in your browser's **local storage only**, on your
own device. Nothing is uploaded.

| Key | Contents |
| --- | --- |
| `9zone-v10-run` | the current run: deck, map progress, pitcher HP, statistics |
| `9zone-deckbuilder-v9` | tutorial deck progress |
| `9zone-zones-tour-v5` | onboarding tour state |

Clearing your browser storage, or using the in-game "start over" action, deletes
these. Because progress is local and not synced, clearing storage loses the run
permanently — there is no server copy to restore from.

## What the game sends

**No analytics. No telemetry. No crash reporting. No accounts. No ads. No
third-party trackers.**

## Third-party requests

The game requests font files from Google's font CDN
(`fonts.googleapis.com` / `fonts.gstatic.com`) to render text. Those requests
disclose your IP address and user agent to Google. The font service sets no
cookies and the game reads no identifiers back from it.

Self-hosting the fonts is an open item tracked in
`docs/release/COMMERCIAL-LAUNCH-BLOCKERS.md`.

## Game audio and input

Sound is synthesised with the Web Audio API at runtime; no audio is streamed or
downloaded. Input is processed on-device and never transmitted.

## Children

The game contains no data collection, so it collects nothing that could identify
a user of any age.

## Contact

Questions about this notice can go to the rights holder via the repository's
public issue tracker.