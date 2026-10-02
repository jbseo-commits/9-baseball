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
    from build_catcher_pitcher import build_catcher_atlas

    timeline = [
        ("keys", 0, "set", 14),
        ("bridges", 0, "hands-rise", 12),
        ("keys", 1, "coil", 13),
        ("bridges", 1, "deeper-coil", 12),
        ("keys", 2, "compact-lift", 10),
        ("bridges", 2, "drive-off-rubber", 6),
        ("keys", 3, "stride-lag", 4),
        ("bridges", 3, "foot-plant", 3),
        ("bridges", 4, "arm-whip", 2),
        ("keys", 4, "release", 4),
        ("keys", 5, "follow-through", 14),
        ("bridges", 5, "recovery", 26),
    ]
    meta = {
        "id": "gale-twister-pitch-v1",
        "name": "게일 트위스터",
        "facing": "toward-camera",
        "throws": "toward-camera",
        "viewpoint": "catcher-behind-home-plate",
        "throwsWith": "right",
        "gloveHand": "left",
        "armSlot": "high-three-quarter",
        "signaturePitch": "airbender-changeup",
        "releaseFrame": 76,
        "runtimeIntegrated": True,
    }
    build_catcher_atlas(CHARACTER, ASSET, timeline, meta)
    print(f"Gale Twister atlas and manifest built successfully at {ASSET}")


if __name__ == "__main__":
    main()

