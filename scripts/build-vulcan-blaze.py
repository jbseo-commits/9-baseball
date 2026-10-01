"""Build the catcher-facing Vulcan Blaze sprite atlas from authored pose sheets."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "assets" / "pitcher-study-v5"
CHARACTER = "vulcan-blaze"


def main() -> None:
    from build_catcher_pitcher import build_catcher_atlas

    timeline = [
        ("keys", 0, "set", 9),
        ("bridges", 0, "hands-rise", 8),
        ("keys", 1, "coil", 9),
        ("bridges", 1, "deeper-coil", 8),
        ("keys", 2, "downhill-drive", 9),
        ("bridges", 2, "lead-foot-descend", 8),
        ("keys", 3, "stride-plant", 9),
        ("bridges", 3, "foot-plant", 8),
        ("bridges", 4, "arm-acceleration", 8),
        ("keys", 4, "release", 6),
        ("keys", 5, "follow-through", 18),
        ("bridges", 5, "recovery", 20),
    ]
    meta = {
        "id": "vulcan-blaze-pitch-v1",
        "name": "볼칸 블레이즈",
        "facing": "toward-camera",
        "throws": "toward-camera",
        "viewpoint": "catcher-behind-home-plate",
        "throwsWith": "right",
        "gloveHand": "left",
        "armSlot": "high-three-quarter",
        "signaturePitch": "splinker-103",
        "releaseFrame": 76,
        "runtimeIntegrated": True,
    }
    build_catcher_atlas(CHARACTER, ASSET, timeline, meta)
    print(f"Vulcan Blaze atlas and manifest built successfully at {ASSET}")


if __name__ == "__main__":
    main()

