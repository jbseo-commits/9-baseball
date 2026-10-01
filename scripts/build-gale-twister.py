"""Build the catcher-facing Gale Twister sprite atlas from authored pose sheets."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "assets" / "pitcher-study-v4"
CHARACTER = "gale-twister"


def main() -> None:
    base = ROOT / "scripts" / "build-pitcher-roster-sd.py"
    spec = importlib.util.spec_from_file_location("pitcher_roster_builder", base)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {base}")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.ASSET = ASSET
    builder.SOURCE = ASSET / "source"
    builder.FACING_CORRECTIONS = {}
    # Keep the release on frame 76, matching runtime ball release timing.
    builder.TIMELINE = [
        ("keys", 0, "set", 9),
        ("bridges", 0, "hands-rise", 8),
        ("keys", 1, "coil", 9),
        ("bridges", 1, "deeper-coil", 8),
        ("keys", 2, "compact-lift", 9),
        ("bridges", 2, "drive-off-rubber", 8),
        ("keys", 3, "stride-lag", 9),
        ("bridges", 3, "foot-plant", 8),
        ("bridges", 4, "arm-whip", 8),
        ("keys", 4, "release", 6),
        ("keys", 5, "follow-through", 18),
        ("bridges", 5, "recovery", 20),
    ]
    assert sum(item[3] for item in builder.TIMELINE) == 120
    builder.build(CHARACTER)

    path = ASSET / f"{CHARACTER}-manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest.update(
        id=f"{CHARACTER}-pitch-v1",
        name="게일 트위스터",
        facing="toward-camera",
        throws="toward-camera",
        viewpoint="catcher-behind-home-plate",
        throwsWith="right",
        gloveHand="left",
        armSlot="high-three-quarter",
        signaturePitch="airbender-changeup",
        releaseFrame=76,
        runtimeIntegrated=True,
    )
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Gale Twister atlas and manifest built successfully at {ASSET}")


if __name__ == "__main__":
    main()
