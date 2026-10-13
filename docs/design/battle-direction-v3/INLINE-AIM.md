# Inline portrait aim — impact before implementation, 2026-10-11

User questions the portrait popup and prefers uninterrupted card selection. Public375x667 verification found that the existing course button opens a native modal on demand, rather than automatically. Replace this with an always-visible3x3 aim board, retaining the field, hand and action in one viewport. Root is sole writer; independent reviewer is read-only.

| Axis | Impact | Mitigation planned before editing |
| --- | --- | --- |
| UI/layout | Yes | Portrait footer: 144px aim column with44px cells, remaining column for selected MAIN/SUPPORT strip, commit and secondary actions. Retain card hand above. Use full available height on tall phones. |
| Input/gestures | Yes | Remove open/close/modal steps. Aim edits current MAIN or SUPPORT directly, preserves selection across rotation; manual card/aim/support input stops spectator timer. Keep horizontal hand and plan scrolling. |
| Rules/balance | No | Current card effects, resource cost, forecast bounds and battle engine unchanged. |
| Save/load | No | In-memory hybrid; original storage untouched. |
| Mobile | Yes | Verify375x667/390x844/844x390/1280x720 including long hand/support and result, aim cells and controls hit targets. |
| Scroll | Verify | Bound hybrid only. No body/root overflow changes, ensure footer and hand remain visible, original route scroll preserved. |
| Existing flows | Verify | Original entry/title/resume check plus existing route/reward/facility/save suite and smoke. |
| Regression | Yes | Assert no dialog at portrait, direct aim, spectator stop on manual action, separate support aim and rotation, real commit/result. Full suite and smoke. |
| Build/deploy | Yes | Both entries/base paths and60MB budget. Update PR26 and isolated Pages preview, then actual public portrait play. |

This supersedes the portrait-modal design in earlier revision notes. No new raster art, character or physical field geometry changes are planned. Phone viewport emulation does not prove physical-device ergonomics.

## Implementation and verification

Removed the native course dialog and its opener/close state. The same section stays mounted across orientation changes. Portrait uses a144px aim column with9 targets of44×44px, plus a180px footer containing selected-card strip, commit and secondary actions. The remaining right column is205px at375px viewport width. The strip scrolls horizontally for multiple supports and retains the fixed52px add button. Tall portrait uses the full available height. MAIN/SUPPORT card and target, public probability interpretation and outside-ball range remain visible. Manual card, aim, support and action handlers stop spectator play; shared spectator execution continues normally.

The first built energy-error check found inherited align-items:start shrinking the63px plan row to46px, which overlapped its44px strip. Set only portrait plan-panel align-self:stretch. Final measurement: strip y483–527, single-line14px error y530–544, primary y551–605. The error no longer covers card controls.

Final automated checks:981/981 across167 files;33/33 hybrid tests after the CSS fix; production build passed;56.3/60MB; original20-seed smoke passed (16 rewards,1 win). All9 aim centers and primary/add centers hit their own elements at375×667,390×844,844×390,1280×720, with document=viewport,scrollY0 and0 dialogs. JSON records ready/support/energy/result/next-batter states. UI regressions cover independent support aim, same DOM through rotation, actual2-card consumption and manual auto cancellation.

Real Pixi fixture,seed90210: scout prep retained the current pitch, MAIN pinpoint zone7 plus SUPPORT eyeLevel zone9 survived rotation; adding push gave3/2 energy error; removing it allowed a real2-card lucky single,HP60→43 and a1st-base runner. Next batter recharged energy3/3. No forced outcome or injected UI state. Ready4, support-edit, error and result screenshots accompany inline-viewport-evidence.json. Remaining limitations: auxiliary labels are small, some cards/supports need horizontal swipe, and physical phone/browser chrome testing is outstanding. Earlier art/geometry/audio and original-flow evidence remains in QA.md.
