# G-021 independent UX verification

Executed 2026-11-09 against dev candidate http://127.0.0.1:5340/ in fresh Chromium. Product and tests were not edited.

Three sizes: 667×320, 844×300, 844×390. Each used actual title → power pack → map → battle, then an actual attack card and center-zone plan. No state injection or DOM action dispatch.

Passed independently:

- Menu body wheel reaches final content; last `타이틀로` button fits fully within body.
- Real CDP touch swipe scrolls the menu body while head/tabs and field remain fixed.
- Actual Tab navigation reaches final menu controls, including `타이틀로`.
- At 667×320 and 844×300 the Read body has overflow. Actual Tab reaches that body; Home resets to 0, PageDown and End reach the final 27/47px respectively. At 844×390 all Read content fits (clientHeight=scrollHeight=209), so a focusable scroll target and scrolling are unnecessary.
- Closing restores HUD opener focus and preserves the exact full saved game and placed-card plan. Actual Swing afterward resolves one real pitch and records history length 1.
- Root and page stay at scroll 0,0. No page errors.

Actual screenshots `667x320-read-end.png` and `844x300-keyboard-bottom.png` were visually inspected. They show fixed header/tabs, readable final Read text, and visible keyboard focus on the final menu button.

`report.json` contains final metrics and assertions. `check.cjs` preserves the actual browser procedure. Earlier R1 baseline screenshots and scripts remain in sibling `../independent-ux/` unchanged.

Limits: dev candidate only (not rebuilt production 5341), Chromium emulated touch, three sizes rather than every viewport, no physical Safari/phone. The parent maintains separate broader 5-size/6-tab coverage.
