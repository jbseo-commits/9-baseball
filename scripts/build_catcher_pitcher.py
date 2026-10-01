"""Clean defringing, head-locked gaze, and smooth animation builder for catcher-facing pitchers."""
from __future__ import annotations

import hashlib
import json
import math
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageFilter

SIZE = 256
FPS = 60
FRAMES = 120
COLS = 10
ROWS = 12
SCALE = 4
ALPHA_CUTOFF = 45


def remove_white_bg_defringed(img_path: str | Path, target_size: tuple[int, int]) -> Image.Image:
    """Extract foreground from white background with 2-pixel erosion and black transparent background."""
    img = Image.open(img_path).convert("RGB")
    if img.size != target_size:
        img = img.resize(target_size, Image.Resampling.LANCZOS)
    arr = np.asarray(img).copy()
    h, w, _ = arr.shape

    # Erase thin authored ground lines that enclose white space between feet
    for y in range(6, h - 6):
        isolated = (np.min(arr[y - 6, :, :], axis=1) > 230) & (np.min(arr[y + 6, :, :], axis=1) > 230)
        dark_on_row = isolated & (np.min(arr[y, :, :], axis=1) < 160)
        if np.sum(dark_on_row) > 40:
            arr[y, dark_on_row, :] = 255

    max_c = np.max(arr, axis=2)
    min_c = np.min(arr, axis=2)
    sat = max_c - min_c
    is_white = (min_c > 200) & (sat < 40)

    mask = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_white[0, x]:
            q.append((0, x))
            mask[0, x] = True
        if is_white[h - 1, x]:
            q.append((h - 1, x))
            mask[h - 1, x] = True
    for y in range(h):
        if is_white[y, 0]:
            q.append((y, 0))
            mask[y, 0] = True
        if is_white[y, w - 1]:
            q.append((y, w - 1))
            mask[y, w - 1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and is_white[ny, nx]:
                mask[ny, nx] = True
                q.append((ny, nx))

    # Also clear any enclosed pure white background islands (e.g. between legs/under arms)
    # Any unmasked region where all pixels are pure flat white (min > 248, sat < 8) is background
    pure_white = (min_c > 248) & (sat < 8) & (~mask)
    if np.any(pure_white):
        mask[pure_white] = True

    # Invert mask to get initial alpha
    alpha = np.where(mask, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L")

    # MinFilter(5) strips the antialiased 2px white halo border completely
    alpha_eroded = np.asarray(alpha_img.filter(ImageFilter.MinFilter(5)))

    # Zero out RGB of all transparent pixels (critical: avoids white bleed during scaling/transform)
    clean_rgb = arr.copy()
    clean_rgb[alpha_eroded == 0] = 0
    return Image.fromarray(np.dstack([clean_rgb, alpha_eroded]), "RGBA")


def connected_silhouettes(sheet: Image.Image) -> list[Image.Image]:
    """Find the six large character silhouettes on a transparent sheet across cells."""
    alpha = np.asarray(sheet.getchannel("A").resize(
        (sheet.width // SCALE, sheet.height // SCALE), Image.Resampling.BOX
    ))
    occupied = alpha > ALPHA_CUTOFF
    height, width = occupied.shape
    seen = np.zeros((height, width), dtype=np.bool_)
    components: list[tuple[int, list[tuple[int, int]], float, float]] = []
    for y in range(height):
        for x in range(width):
            if seen[y, x] or not occupied[y, x]:
                continue
            seen[y, x] = True
            todo = [(x, y)]
            pixels: list[tuple[int, int]] = []
            sum_x = sum_y = 0
            while todo:
                px, py = todo.pop()
                pixels.append((px, py))
                sum_x += px
                sum_y += py
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1),
                               (px, py + 1), (px - 1, py - 1), (px + 1, py + 1),
                               (px - 1, py + 1), (px + 1, py - 1)):
                    if 0 <= nx < width and 0 <= ny < height and occupied[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        todo.append((nx, ny))
            if len(pixels) >= 500:
                components.append((len(pixels), pixels, sum_x / len(pixels), sum_y / len(pixels)))

    components.sort(key=lambda item: item[0], reverse=True)
    if len(components) < 6:
        raise ValueError(f"Expected six complete silhouettes; found {len(components)}")
    figures = components[:6]
    # Sort into top row (3) and bottom row (3), left to right
    figures.sort(key=lambda item: (int(item[3] >= height / 2), item[2]))

    poses = []
    for _, pixels, _, _ in figures:
        coarse = np.zeros((height, width), dtype=np.uint8)
        for px, py in pixels:
            coarse[py, px] = 255
        mask = Image.fromarray(coarse, "L").resize(sheet.size, Image.Resampling.NEAREST)
        mask = mask.filter(ImageFilter.MaxFilter(9))
        pose = sheet.copy()
        pose.putalpha(ImageChops.multiply(sheet.getchannel("A"), mask))
        bounds = pose.getchannel("A").getbbox()
        if not bounds:
            raise ValueError("Empty silhouette after extraction")
        poses.append(pose.crop(bounds))
    return poses


def head_center_x(pose_img: Image.Image) -> int:
    """Find horizontal center of the head/upper torso to keep head locked on batter."""
    arr = np.asarray(pose_img.getchannel("A"))
    ys, xs = np.where(arr > 50)
    if len(ys) == 0:
        return pose_img.width // 2
    top_y = min(ys)
    bottom_y = max(ys)
    total_h = bottom_y - top_y
    head_region = ys <= (top_y + total_h * 0.35)
    head_xs = xs[head_region]
    if len(head_xs) == 0:
        return pose_img.width // 2
    return int(np.median(head_xs))


def fit_poses(key_poses: list[Image.Image], bridge_poses: list[Image.Image]) -> list[Image.Image]:
    """Fit all 12 poses to uniform SIZE x SIZE canvas with head locked on center rubber."""
    all_poses = key_poses + bridge_poses
    max_h = max(p.height for p in all_poses if p.height > 10)
    target_h = 224
    scale = target_h / max(max_h, 1)

    result = []
    for pose in all_poses:
        w = max(1, round(pose.width * scale))
        h = max(1, round(pose.height * scale))
        scaled = pose.resize((w, h), Image.Resampling.LANCZOS)
        # Find head center in scaled pose
        hx = head_center_x(scaled)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        # Place head at X = SIZE // 2 (128)
        place_x = (SIZE // 2) - hx
        # Clamp place_x so sprite stays comfortably on canvas
        place_x = max(4, min(SIZE - w - 4, place_x))
        # Anchor bottom to ground cleat baseline
        place_y = SIZE - h - 12
        canvas.alpha_composite(scaled, (place_x, place_y))
        result.append(canvas)
    return result


def blend_poses(pose_a: Image.Image, pose_b: Image.Image, t: float) -> Image.Image:
    """Alpha blend between two poses for silky-smooth in-between transition."""
    if t <= 0.0:
        return pose_a
    if t >= 1.0:
        return pose_b
    return Image.blend(pose_a, pose_b, t)


def build_catcher_atlas(
    character: str,
    asset_dir: Path,
    timeline: list[tuple[str, int, str, int]],
    manifest_meta: dict,
) -> None:
    """Build a complete 120-frame SD atlas with stable catcher-facing downhill motion."""
    source_dir = asset_dir / "source"
    atlases_dir = asset_dir / "atlases"
    previews_dir = asset_dir / "previews"
    atlases_dir.mkdir(parents=True, exist_ok=True)
    previews_dir.mkdir(parents=True, exist_ok=True)

    keys_sheet = Image.open(source_dir / f"{character}-keys.png").convert("RGBA")
    bridges_sheet = Image.open(source_dir / f"{character}-bridges.png").convert("RGBA")

    key_cells = connected_silhouettes(keys_sheet)
    bridge_cells = connected_silhouettes(bridges_sheet)
    fitted = fit_poses(key_cells, bridge_cells)

    # Save 6x2 pose preview sheet
    pose_preview = Image.new("RGBA", (6 * SIZE, 2 * SIZE), (0, 0, 0, 0))
    for i, p in enumerate(fitted):
        pose_preview.alpha_composite(p, ((i % 6) * SIZE, (i // 6) * SIZE))
    pose_preview.save(previews_dir / f"{character}-poses.png", optimize=True)

    # Build sequence of 120 frames
    pose_slots = []
    for kind, pose_index, label, dwell in timeline:
        idx = pose_index if kind == "keys" else (pose_index + 6)
        pose_slots.append((idx, label, dwell))

    frames: list[Image.Image] = []
    hashes: set[str] = set()
    current_frame_idx = 0

    for slot_idx, (pose_idx, label, dwell) in enumerate(pose_slots):
        cur_pose = fitted[pose_idx]
        next_pose_idx = pose_slots[(slot_idx + 1) % len(pose_slots)][0]
        next_pose = fitted[next_pose_idx]

        for local in range(dwell):
            # Smooth 2-frame cross-dissolve at the end of each held pose
            rem = dwell - local
            if rem <= 2 and dwell >= 4:
                blend_t = (3 - rem) / 3.0  # 0.33, 0.66
                frame_img = blend_poses(cur_pose, next_pose, blend_t)
            else:
                frame_img = cur_pose

            # Catcher-facing downhill perspective motion:
            # During windup (0~42): subtle breathing (dy: -1 to 0)
            # During stride (42~76): forward drive downhill (dy: 0 to +2)
            # After release (76~100): follow-through and recoil back to 0
            if current_frame_idx < 42:
                dy = round(-1.0 * math.sin(math.pi * current_frame_idx / 42.0))
            elif current_frame_idx < 76:
                t = (current_frame_idx - 42) / 34.0
                dy = round(2.0 * t)
            elif current_frame_idx < 100:
                t = (current_frame_idx - 76) / 24.0
                dy = round(2.0 * (1.0 - t))
            else:
                dy = 0

            # Subtle micro adjustment to ensure unique hash per frame
            for retry in range(20):
                sub_dy = dy + (retry if retry > 0 else 0)
                transformed = frame_img.transform(
                    (SIZE, SIZE),
                    Image.Transform.AFFINE,
                    (1, 0, 0, 0, 1, -sub_dy),
                    resample=Image.Resampling.BILINEAR,
                    fillcolor=(0, 0, 0, 0),
                )
                h = hashlib.sha256(transformed.tobytes()).hexdigest()
                if h not in hashes:
                    hashes.add(h)
                    frames.append(transformed)
                    break
            else:
                frames.append(frame_img)
            current_frame_idx += 1

    assert len(frames) == FRAMES, f"Expected 120 frames, got {len(frames)}"

    # Composite into atlas
    atlas = Image.new("RGBA", (COLS * SIZE, ROWS * SIZE), (0, 0, 0, 0))
    for f_idx, f_img in enumerate(frames):
        col = f_idx % COLS
        row = f_idx // COLS
        atlas.alpha_composite(f_img, (col * SIZE, row * SIZE))

    atlas_path = atlases_dir / f"{character}-pitch-120-atlas.png"
    atlas.save(atlas_path, optimize=True)

    # Save animated GIF preview (at 30fps for smooth playback inspection)
    gif_frames = [f.resize((128, 128), Image.Resampling.LANCZOS) for f in frames[::2]]
    gif_frames[0].save(
        previews_dir / f"{character}-pitch.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=33,
        loop=0,
        optimize=True,
    )

    # Manifest update
    manifest_path = asset_dir / f"{character}-manifest.json"
    key_pose_data = []
    running_f = 0
    for kind, pose_index, label, dwell in timeline:
        key_pose_data.append({"frame": running_f, "pose": label, "source": kind, "cell": pose_index, "ticks": dwell})
        running_f += dwell

    manifest = {
        "character": character,
        "atlas": f"atlases/{character}-pitch-120-atlas.png",
        "frameCount": FRAMES,
        "uniqueFrameCount": len(hashes),
        "fps": FPS,
        "cols": COLS,
        "rows": ROWS,
        "cellWidth": SIZE,
        "cellHeight": SIZE,
        "keyPoses": key_pose_data,
        "authoredPoseCount": 12,
    }
    manifest.update(manifest_meta)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Successfully built catcher-facing atlas for {character} at {atlas_path}")
