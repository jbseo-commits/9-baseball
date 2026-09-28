"""Build Violet Nocturne's isolated 120-frame pitching atlas from authored poses.

Reuses the roster atlas builder's extraction and fixed-size output so this study
can be compared with the current game without modifying the shipped roster.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
BASE_BUILDER = ROOT / "scripts" / "build-pitcher-roster-sd.py"
STUDY = ROOT / "assets" / "pitcher-study-v1"
CHARACTER = "violet-nocturne"


def main() -> None:
    spec = importlib.util.spec_from_file_location("pitcher_roster_builder", BASE_BUILDER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {BASE_BUILDER}")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.ASSET = STUDY
    builder.SOURCE = STUDY / "source"
    builder.FACING_CORRECTIONS = {}
    # A pitch is a one-shot; ending on recovery avoids a visible reset jump.
    builder.TIMELINE = [*builder.TIMELINE[:-2], ("bridges", 5, "recovery-hold", 18)]
    builder.build(CHARACTER)

    path = STUDY / f"{CHARACTER}-manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["id"] = f"{CHARACTER}-pitch-study-v1"
    manifest["throwsWith"] = "right"
    manifest["gloveHand"] = "left"
    manifest["armSlot"] = "sidearm"
    manifest["facing"] = "toward-camera"
    manifest["throws"] = "toward-camera"
    manifest["viewpoint"] = "catcher-behind-home-plate"
    manifest["runtimeIntegrated"] = False
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
