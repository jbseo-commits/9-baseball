"""Pack separately drawn Jade Viper poses; no generated limb interpolation.

The approved twelve source PNGs are immutable. Each extra drawing is retained
separately, registered once, and held for explicit cells. A 60fps atlas does
not imply 120 independently authored drawings or production motion acceptance.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "assets/pitcher-study-jade-viper"
SIZE, COLUMNS, ROWS, FRAMES, FPS = 256, 10, 12, 120, 60
BG, PANEL, INK, MUTED = "#0c191e", "#172f30", "#eaf5eb", "#a4c5b1"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def font(size):
    for name in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default(size=size)


def register(pose):
    source = ASSET / pose["source"]
    image = Image.open(source)
    if image.mode != "RGBA":
        raise ValueError(f"{source}: real RGBA source required")
    scale = pose["scale"]
    # Scale/translation register one complete drawing in the common canvas.
    # They do not vary within a hold and do not create inbetween limb motion.
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    xy = [round(pose["x"]), round(pose["y"])]
    box = image.getchannel("A").point(lambda a: 255 if a > 127 else 0).getbbox()
    if box is None:
        raise ValueError(f"{source}: empty alpha")
    bounds = [box[0]+xy[0], box[1]+xy[1], box[2]+xy[0], box[3]+xy[1]]
    if min(bounds[:2]) < 0 or max(bounds[2:]) > SIZE:
        raise ValueError(f"{source}: subject outside tile: {bounds}")
    result = Image.new("RGBA", (SIZE, SIZE))
    result.alpha_composite(image, xy)
    return result, {"id": pose["id"], "sourceSha256": digest(source.read_bytes()),
                    "registeredBounds": bounds, "rgba": True,
                    "registeredSha256": digest(result.tobytes())}


def placard(canvas, image, xy, side):
    # Presentation only: display existing pixels, without transforming anatomy.
    canvas.alpha_composite(image.resize((side, side), Image.Resampling.NEAREST), xy)


def preview_frame(frame, drawings, poses, mapping, baseline, speed):
    image = Image.new("RGBA", (1280, 720), BG)
    draw = ImageDraw.Draw(image)
    draw.text((30, 22), "JADE VIPER / ATLAS R1 CANDIDATE", font=font(28), fill=INK)
    draw.text((30, 63), f"{speed} playback | same 2-second timing | cell {frame:03d} / 119", font=font(18), fill=MUTED)
    for x, title in [(30, "APPROVED 12 DRAWINGS"), (452, f"EXPANDED {len(poses)} DRAWINGS")]:
        draw.rounded_rectangle((x, 135, x+400, 535), radius=10, fill=PANEL)
        draw.text((x, 105), title, font=font(19), fill=INK)
    placard(image, drawings[baseline[frame]], (30, 135), 400)
    placard(image, drawings[mapping[frame]], (452, 135), 400)
    draw.text((925, 105), "GAME-SIZE STUDY", font=font(18), fill=INK)
    draw.rectangle((925, 156, 1091, 322), fill=PANEL, outline=MUTED)
    placard(image, drawings[mapping[frame]], (925, 156), 166)
    draw.text((925, 340), "166px display box", font=font(17), fill=MUTED)
    pose = poses[mapping[frame]]
    draw.text((925, 384), "BALL HELD" if pose["ballHeld"] else "EMPTY HAND", font=font(19), fill="#92e2b5")
    draw.text((30, 569), f"{pose['id']} | {pose['label']}", font=font(21), fill=INK)
    draw.text((30, 609), "Release: cell 76 (zero-based). Stops at settle. Drawings held; no image blending.", font=font(17), fill=MUTED)
    draw.text((30, 643), "120 cells / 60fps format is not proof of smooth production motion. Runtime not integrated.", font=font(16), fill=MUTED)
    draw.rounded_rectangle((30, 685, 1250, 691), radius=3, fill="#315044")
    draw.rounded_rectangle((30, 685, 30+round(1220*(frame+1)/FRAMES), 691), radius=3, fill="#84dbaa")
    return image.convert("RGB")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video-frames", action="store_true", help="also render comparison frames for FFmpeg")
    args = parser.parse_args()
    config = read(ASSET / "source/pose-map.json")
    poses = sorted(config["poses"], key=lambda p: p["frame"])
    assert len(poses) == 30 and poses[0]["frame"] == 0
    assert len({p["frame"] for p in poses}) == len(poses)
    assert [p for p in poses if p["id"] == "07-release"][0]["frame"] == 76
    assert all(p["ballHeld"] == (p["frame"] < 76) for p in poses)
    approved = read(ASSET / "approved/motion-r1/manifest.json")
    for old in approved["poses"]:
        pose = next(p for p in poses if p["id"] == old["id"])
        assert digest((ASSET / pose["source"]).read_bytes()) == old["sha256"]
    mapping = [max(i for i,p in enumerate(poses) if p["frame"] <= f) for f in range(FRAMES)]
    baseline = [max(i for i,p in enumerate(poses) if p["frame"] <= f and p["approvedR1"]) for f in range(FRAMES)]
    drawings, checks = [], []
    for pose in poses:
        image, check = register(pose)
        drawings.append(image)
        checks.append(check)
    assert len({c["sourceSha256"] for c in checks}) == len(poses)
    assert len({c["registeredSha256"] for c in checks}) == len(poses)
    for folder in ["atlases", "previews", "qa"]:
        (ASSET / folder).mkdir(exist_ok=True)
    atlas = Image.new("RGBA", (SIZE*COLUMNS, SIZE*ROWS))
    for frame, pose_index in enumerate(mapping):
        atlas.alpha_composite(drawings[pose_index], (frame%COLUMNS*SIZE, frame//COLUMNS*SIZE))
    atlas_name = "jade-viper-pitch-120-atlas.png"
    atlas.save(ASSET / "atlases" / atlas_name, optimize=True)
    # True transparent, evenly separated 3x2 source sheets for the six approved
    # keys and bridges. Labels/backgrounds are kept in preview files only.
    for kind in ["key", "bridge"]:
        sheet = Image.new("RGBA", (1536, 1024))
        indices = [i for i,p in enumerate(poses) if p["approvedR1"] and p["kind"] == kind]
        assert len(indices) == 6
        for n,i in enumerate(indices):
            placard(sheet, drawings[i], (n%3*512, n//3*512), 512)
        sheet.save(ASSET / "source" / f"jade-viper-{kind}s.png", optimize=True)
    contact = Image.new("RGBA", (1536, 1630), BG)
    d = ImageDraw.Draw(contact)
    d.text((28, 17), "JADE VIPER / 30 DRAWINGS / ATLAS R1 CANDIDATE", font=font(28), fill=INK)
    d.text((28, 57), "12 approved poses + 18 new inbetweens | 120 cells / 60fps / 2 seconds", font=font(18), fill=MUTED)
    for i,p in enumerate(poses):
        x,y = i%6*256, 105+i//6*298
        d.rectangle((x+5,y,x+250,y+290), fill=PANEL)
        placard(contact, drawings[i], (x,y+25), 256)
        d.text((x+12,y+5), f"{p['frame']:03d} {p['id']}", font=font(14), fill="#e7cf8a" if not p["approvedR1"] else INK)
    d.text((28, 1601), "New drawings and timing remain candidates. Motion QA is separate from atlas-format validation.", font=font(17), fill=MUTED)
    contact.convert("RGB").save(ASSET / "previews/jade-viper-30-poses.png", optimize=True)
    manifest = {
        "id": "jade-viper-atlas-r1", "slug": "jade-viper", "adult_age": 28,
        "status": "integrated_candidate", "meaning": "feature-branch art candidate, no game runtime mapping",
        "concept_revision": "R2", "approved_motion_revision": "R1", "atlas_revision": "R1-candidate",
        "facing": "toward-camera", "viewpoint": "catcher-behind-home-plate", "throwsWith": "right", "gloveHand": "left",
        "frameCount": FRAMES, "fps": FPS, "durationMs": 2000, "frameSize": [SIZE,SIZE],
        "atlasColumns": COLUMNS, "atlasRows": ROWS, "atlas": "atlases/"+atlas_name,
        "releaseFrame": 76, "frameIndexing": "zero-based", "releaseTimeMsExact": 76*1000/FPS,
        "authoredPoseCount": len(poses), "approvedPoseCount": 12, "newInbetweenCount": len(poses)-12,
        "uniquePixelFrameCount": len(poses), "repeatedHoldCells": FRAMES-len(poses),
        "renderMethod": "static per-drawing registration and explicit holds; no per-frame rotate/translate, crossfade, morph, or forced unique hashes",
        "runtimeIntegrated": False, "productionReady": False, "approval": read(ASSET/"approval.json"),
        "reference_mode": "verified_cache", "camera_reference": approved["camera_reference"],
        "cached_motion_reference": approved["cached_motion_reference"],
        "referenceNote": "Existing stride/landing/follow-through analytical notes only. No new footage searched or played in atlas stage; no measured whole-windup or exact-release validation.",
        "timingNote": "New author-chosen 2-second candidate. Earlier approved R1 animatic was 3070ms. Baseline comparison is retimed to the same 2 seconds.",
        "displayNote": "Preserves R1 approximate cap width25.5 in256 square and earlier166px box; about15% smaller than camera still board. Larger preview scales are inspection aids, not measured gameplay layouts.",
        "registrationNote": "Manual approximate cap and foot annotations, not a rig or biomechanical measurements.",
        "knownLimitations": ["30 separately drawn poses held across120cells; not120 independent drawings", "New inbetweens and2-second recovery timing await visual acceptance", "Premium pixel-grid cleanup and true game portrait/landscape/desktop acceptance not claimed", "No roster, HP, release event, save data, runtime or deployment modification"],
        "poses": poses, "frameToPose": mapping, "baselineFrameToPose": baseline,
        "formatQA": {"status":"passed", "sourceChecks":checks, "approvedSourceHashesVerified":12},
        "motionQA": read(ASSET/"qa/motion-review.json") if (ASSET/"qa/motion-review.json").exists() else {"status":"pending"},
    }
    write(ASSET/"jade-viper-manifest.json", manifest)
    write(ASSET/"qa/format-check.json", manifest["formatQA"])
    template = (ROOT/"scripts/jade-viper-preview.html").read_text(encoding="utf-8")
    atlas_data = base64.b64encode((ASSET/"atlases"/atlas_name).read_bytes()).decode("ascii")
    html = template.replace("__JADE_ATLAS__", "data:image/png;base64,"+atlas_data).replace("__JADE_DATA__",json.dumps({"poses":poses,"mapping":mapping,"baseline":baseline},ensure_ascii=False).replace("<","\\u003c"))
    (ASSET/"previews/jade-viper-atlas-r1.html").write_text(html, encoding="utf-8")
    if args.video_frames:
        frames = ASSET/"previews/rendered"
        frames.mkdir(exist_ok=True)
        for f in range(FRAMES):
            preview_frame(f,drawings,poses,mapping,baseline,"1x").save(frames/f"fast-{f:03d}.png")
            preview_frame(f,drawings,poses,mapping,baseline,"0.5x").save(frames/f"slow-{f:03d}.png")
        # A missing/corrupt PNG can make FFmpeg silently stop an image sequence.
        # Validate every intermediate before handing the sequence to the encoder.
        for prefix in ["fast", "slow"]:
            for f in range(FRAMES):
                with Image.open(frames/f"{prefix}-{f:03d}.png") as check:
                    check.verify()
    print(json.dumps({"cells":FRAMES,"drawings":len(poses),"heldCells":FRAMES-len(poses),"atlas":list(atlas.size),"release":76,"format":"passed","motion":manifest["motionQA"]["status"]}))


if __name__ == "__main__":
    main()
