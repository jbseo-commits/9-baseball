"""Clean defringing, head-locked gaze, consistent cap, and smooth athletic in-betweening for catcher-facing pitchers."""
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


def remove_white_bg_defringed(
    img_path: str | Path,
    target_size: tuple[int, int] = (1536, 1024),
    extra_seeds: tuple[tuple[int, int], ...] = (),
) -> Image.Image:
    """Extract foreground from white background with 1-pixel erosion and black transparent background."""
    img = Image.open(img_path).convert("RGB")
    if img.size != target_size:
        img = img.resize(target_size, Image.Resampling.LANCZOS)
    arr = np.asarray(img).copy()
    h, w, _ = arr.shape

    # Erase thin authored ground lines under top row (around h * 0.47) and bottom row (around h * 0.97)
    for y_range in (range(int(h * 0.44), int(h * 0.50)), range(int(h * 0.94), h - 7)):
        for y in y_range:
            isolated = (np.min(arr[y - 6, :, :], axis=1) > 230) & (np.min(arr[y + 6, :, :], axis=1) > 230)
            dark_on_row = isolated & (np.min(arr[y, :, :], axis=1) < 160)
            if np.sum(dark_on_row) > 10:
                arr[y, dark_on_row, :] = 255

    max_c = np.max(arr, axis=2)
    min_c = np.min(arr, axis=2)
    sat = max_c - min_c
    is_white = (min_c > 220) & (sat < 30)

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

    for sy, sx in extra_seeds:
        if 0 <= sy < h and 0 <= sx < w and is_white[sy, sx] and not mask[sy, sx]:
            q.append((sy, sx))
            mask[sy, sx] = True

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and is_white[ny, nx]:
                mask[ny, nx] = True
                q.append((ny, nx))

    clean = np.zeros((h, w, 4), dtype=np.uint8)
    clean[~mask, :3] = arr[~mask]
    clean[~mask, 3] = 255

    # 1px alpha erosion to eliminate antialiased edge halo
    alpha_im = Image.fromarray(clean[:, :, 3])
    eroded_alpha = alpha_im.filter(ImageFilter.MinFilter(3))
    clean[:, :, 3] = np.asarray(eroded_alpha)

    # Clean transparent pixels to black: prevents white bleed when downscaled or rendered over dark textures
    clean[clean[:, :, 3] == 0, :3] = 0
    return Image.fromarray(clean)


def connected_silhouettes(sheet: Image.Image) -> list[Image.Image]:
    """Isolate 6 connected components from a 3x2 grid."""
    alpha = np.asarray(sheet.getchannel("A"))
    height, width = alpha.shape
    coarse_alpha = Image.fromarray(alpha).resize(
        (width // SCALE, height // SCALE), Image.Resampling.BILINEAR
    )
    arr = np.asarray(coarse_alpha) > ALPHA_CUTOFF

    # Close small gaps in lineart
    dilated = np.pad(arr, 1, mode="constant")
    closed = (
        dilated[:-2, 1:-1]
        | dilated[2:, 1:-1]
        | dilated[1:-1, :-2]
        | dilated[1:-1, 2:]
        | arr
    )

    seen = np.zeros(closed.shape, dtype=bool)
    height, width = closed.shape
    components: list[tuple[int, list[tuple[int, int]], float, float]] = []

    for y in range(height):
        for x in range(width):
            if not closed[y, x] or seen[y, x]:
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
                for nx, ny in (
                    (px - 1, py),
                    (px + 1, py),
                    (px, py - 1),
                    (px, py + 1),
                    (px - 1, py - 1),
                    (px + 1, py + 1),
                    (px - 1, py + 1),
                    (px + 1, py - 1),
                ):
                    if (
                        0 <= nx < width
                        and 0 <= ny < height
                        and closed[ny, nx]
                        and not seen[ny, nx]
                    ):
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
        place_x = max(4, min(SIZE - w - 4, place_x))
        # Anchor bottom to ground cleat baseline
        place_y = SIZE - h - 12
        canvas.alpha_composite(scaled, (place_x, place_y))
        result.append(canvas)
    return result


def ensure_consistent_caps(key_poses: list[Image.Image], bridge_poses: list[Image.Image]) -> list[Image.Image]:
    """Ensure Vulcan Blaze has the baseball cap consistently attached in all bridge poses."""
    # Cap 0 from k_poses[0] (front-facing)
    ka0 = np.asarray(key_poses[0])
    ys0, xs0 = np.where(ka0[:50, :, 3] > 100)
    cap0 = key_poses[0].crop((np.min(xs0), 0, np.max(xs0) + 1, 50))

    # Cap 1 from k_poses[1] (clean 3/4 facing)
    ka1 = np.asarray(key_poses[1])
    ys1, xs1 = np.where(ka1[:50, :, 3] > 100)
    cap1 = key_poses[1].crop((np.min(xs1), 0, np.max(xs1) + 1, 50))

    capped_bridges = []
    for i, bp in enumerate(bridge_poses):
        bp_clean = bp.copy()
        ba = np.asarray(bp_clean)
        cap = cap0 if i == 0 else cap1
        head_ys, head_xs = np.where(ba[:45, :, 3] > 100)
        b_cx = (np.min(head_xs) + np.max(head_xs)) // 2 if len(head_xs) else bp_clean.width // 2
        b_top = np.min(head_ys) if len(head_ys) else 0

        dest_x = b_cx - cap.width // 2 + (12 if i == 4 else 2 if i > 0 else 0)
        dest_y = b_top - 2
        comp = Image.new(
            "RGBA",
            (max(bp_clean.width, dest_x + cap.width + 20), max(bp_clean.height, dest_y + cap.height)),
            (0, 0, 0, 0),
        )
        comp.alpha_composite(bp_clean, (max(0, -dest_x), max(0, -dest_y)))
        comp.alpha_composite(cap, (max(0, dest_x), max(0, dest_y)))
        comp_arr = np.asarray(comp)
        c_ys, c_xs = np.where(comp_arr[:, :, 3] > 10)
        capped_bridges.append(comp.crop((np.min(c_xs), np.min(c_ys), np.max(c_xs) + 1, np.max(c_ys) + 1)))
    return capped_bridges


def vector_morph_blend(pose_a: Image.Image, pose_b: Image.Image, t: float) -> Image.Image:
    """Continuous athletic in-betweening: aligns silhouettes along motion vector and eases smoothly."""
    if t <= 0.001:
        return pose_a
    if t >= 0.999:
        return pose_b

    # Ease-in-out cubic for a more explosive whip-like acceleration
    if t < 0.5:
        smooth_t = 4.0 * t * t * t
    else:
        f = (2.0 * t - 2.0)
        smooth_t = 1.0 + 0.5 * f * f * f

    arr_a = np.asarray(pose_a)
    arr_b = np.asarray(pose_b)

    ys_a, xs_a = np.where(arr_a[:, :, 3] > 40)
    ys_b, xs_b = np.where(arr_b[:, :, 3] > 40)

    if len(ys_a) == 0 or len(ys_b) == 0:
        return Image.blend(pose_a, pose_b, smooth_t)

    ca_x, ca_y = np.mean(xs_a), np.mean(ys_a)
    cb_x, cb_y = np.mean(xs_b), np.mean(ys_b)

    # Add a slight vertical arc to the motion to prevent flat ghosting
    arc = math.sin(t * math.pi) * 3.0

    shift_x = (cb_x - ca_x) * smooth_t
    shift_y = (cb_y - ca_y) * smooth_t - arc

    a_shifted = pose_a.transform(
        pose_a.size,
        Image.Transform.AFFINE,
        (1, 0, -round(shift_x), 0, 1, -round(shift_y)),
        resample=Image.Resampling.BILINEAR,
        fillcolor=(0, 0, 0, 0),
    )
    b_shift_x = -(cb_x - ca_x) * (1.0 - smooth_t)
    b_shift_y = -(cb_y - ca_y) * (1.0 - smooth_t) - arc
    b_shifted = pose_b.transform(
        pose_b.size,
        Image.Transform.AFFINE,
        (1, 0, -round(b_shift_x), 0, 1, -round(b_shift_y)),
        resample=Image.Resampling.BILINEAR,
        fillcolor=(0, 0, 0, 0),
    )

    return Image.blend(a_shifted, b_shifted, smooth_t)


def build_catcher_atlas(
    character: str,
    asset_dir: Path,
    timeline: list[tuple[str, int, str, int]],
    manifest_meta: dict,
) -> None:
    """Build a complete 120-frame SD atlas with continuous in-betweening and athletic pitching rhythm."""
    source_dir = asset_dir / "source"
    atlases_dir = asset_dir / "atlases"
    previews_dir = asset_dir / "previews"
    atlases_dir.mkdir(parents=True, exist_ok=True)
    previews_dir.mkdir(parents=True, exist_ok=True)

    keys_sheet = Image.open(source_dir / f"{character}-keys.png").convert("RGBA")
    bridges_sheet = Image.open(source_dir / f"{character}-bridges.png").convert("RGBA")

    key_cells = connected_silhouettes(keys_sheet)
    bridge_cells = connected_silhouettes(bridges_sheet)

    if character == "vulcan-blaze":
        bridge_cells = ensure_consistent_caps(key_cells, bridge_cells)

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
            # Continuous athletic in-betweening across ALL frames:
            # t progresses smoothly from 0.0 to 1.0 throughout the dwell
            if slot_idx == 0 and local < 6:
                # Initial set stance breathing: micro 1px breath
                t = 0.0
                frame_img = cur_pose
            else:
                t = local / float(dwell)
                frame_img = vector_morph_blend(cur_pose, next_pose, t)

            # Catcher-facing downhill perspective motion:
            # During windup (0~42): subtle breathing rhythm (dy: -1 to 0)
            # During stride (42~76): forward drive downhill (dy: 0 to +2)
            # After release (76~100): follow-through deceleration and recoil back to 0
            if current_frame_idx < 42:
                dy = round(-1.0 * math.sin(math.pi * current_frame_idx / 42.0))
            elif current_frame_idx < 76:
                prog = (current_frame_idx - 42) / 34.0
                dy = round(2.0 * prog)
            elif current_frame_idx < 100:
                prog = (current_frame_idx - 76) / 24.0
                dy = round(2.0 * (1.0 - prog))
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
    frame_counter = 0
    for kind, p_idx, p_name, dwell in timeline:
        key_pose_data.append(
            {
                "frame": frame_counter,
                "pose": p_name,
                "source": kind,
                "cell": p_idx,
                "duration": dwell,
            }
        )
        frame_counter += dwell

    manifest = {
        "character": character,
        "atlas": f"atlases/{character}-pitch-120-atlas.png",
        "frameCount": FRAMES,
        "uniqueFrameCount": len(hashes),
        "fps": FPS,
        "durationMs": 2000,
        "releaseFrame": manifest_meta.get("releaseFrame", 76),
        "frameSize": [SIZE, SIZE],
        "atlasColumns": COLS,
        "atlasRows": ROWS,
        "authoredPoseCount": 12,
        "keyPoses": key_pose_data,
        "grid": {"cols": COLS, "rows": ROWS, "cellWidth": SIZE, "cellHeight": SIZE},
        **manifest_meta,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Successfully built catcher-facing atlas for {character} at {atlas_path}")

