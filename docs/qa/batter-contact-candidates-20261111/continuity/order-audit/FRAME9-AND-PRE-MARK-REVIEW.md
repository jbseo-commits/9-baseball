# Revised frame9 bridge and PRE-high chest-detail review

Source-only local diagnostic at `http://127.0.0.1:5400/` reviewed in Chromium at 1× and 0.5×, 1440×1040 viewport. The revised order is POST-high (1490)→original9 (1570)→original10 (1650)→recovery. No game or gameplay was run; no pixels were moved, interpolated, or edited. Capture images in this directory (`revised-1x-*`, `revised-05x-*`) document the live source page. This is phase diagnostics only.

## Does original9 eliminate the snap?

It removes the first and worst mismatch: POST-high’s fully extended up-right bat now flows to original9’s extended up-right early-follow, with both hands still together on the grip and the player’s feet in the same stance. At 1× and 0.5×, this join reads as continued follow-through; I did not see a material discontinuity there.

Original9→original10 remains a large authored transition: the arms fold up and back, and the barrel swings from extended forward/up-right to crossing the shoulder. The 80ms cell interval is short. At 1× it still reads as a sharp beat, though the change is directionally correct; at 0.5× the longer displayed hold makes the wrap easier to parse but does not supply a visible pose between extension and wrap. It is less jarring than the old direct POST→10 join, but original9 does not fully eliminate the remaining snap. No earlier existing frame is a better late-follow bridge: original10 is already the wrap endpoint; originals11–13 are recovery. If a motion review rejects original9→10 at the frozen clock, the minimal missing art is one shared whole-body late-follow pose with the same grip/identity, torso continuing its turn, and barrel partway from extended up-right to across the shoulder. This is a conditional need, not a production decision; timing review may establish the 80ms transition as acceptable. No second drawing is indicated.

The 1490→1570→1650 order therefore is the best current source sequence. It uses original9 and removes the direct POST-high→old10 jump. Keep foot contacts and the row-specific height recovery as reviewed; do not add a pose just to duplicate existing extension.

## PRE-high chest detail

At native 768×768 full-cell view, PRE-high shows a small distinct dark shape with a warm outline on the white chest near the crossed arms. It is not present in original0 or original4, and it is not repeated in PRE-middle or PRE-low. Its compact, high-contrast silhouette reads more like a mark/emblem than the broad navy fabric crease/trim elsewhere in the jersey. The source view does not establish whether it is an intentionally authored badge, a generated detail, or a dark overlap/shadow artifact; occlusion by the crossed arm makes attribution uncertain. Treat it as a source consistency discrepancy to resolve against the approved character reference before use. Do not remove or paint over it in this audit.

## Decision

PASS for the diagnostic claim that original9 materially improves POST→wrap sequencing. HOLD the stronger claim that the whole wrap transition is smooth: original9→10 remains the only visible candidate gap, and whether it needs one late-follow drawing depends on frozen-clock motion acceptance. The PRE-high mark is visually conspicuous at native scale and unresolved against the reference. No art/code/repo files were changed.
