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

