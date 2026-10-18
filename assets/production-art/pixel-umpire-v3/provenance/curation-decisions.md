# Selection and curation decisions

- Windup v1 high knee/unclear rearplant rejected; v2 compact preparation retained.
- SwingA v1 skipped elbow-slot/3D barrel lag; v2 has the short projected barrel and connected elbow path.
- FollowA local3 stores the across-back endpoint, but the direct local2→3 jump is not played. FollowB supplies the shortened/end-on/reappearing barrel bridge.
- Repeated LOW resetA variants still teleported hands across shoulders. LOW resetA/B originals are preserved locally and excluded from the runtimeatlas. Compact-overhead recovery was selected instead. resetLift supplies the short liftarc; duplicate finish/overhead candidates remain stored-only.
- Bunt local3 jumped immediately back to READY; the separate buntReset row supplies actual withdrawal/regrip drawings. Final idle always returns to exactwindup0.
- Per-row uniform transforms use helmet-to-support-cleat body references. No pose is individually enlarged to fill its bat-inclusive box. Originalrasters are unchanged. Active followA prop padding is about12px, disclosed instead of shrinking the body solely to claim16px margins.
- Early native READY cache was once overwritten when only its horizontal cellplacement changed42storagepx, then restored from the preserved exact canonicalframe. Provider read timing is not provable without the provider inputrecord. Later references use immutable revisioned filenames and SHA locks. Body/resolution were identical between those two early cache placements.
- Hand/wood anchors are observed on actual curated frames; source footroles are near/lower-left RIGHT rear, far/upper-right LEFT lead. Footcontact is an explicit assumption to review in playback, not motion-capture truth.
