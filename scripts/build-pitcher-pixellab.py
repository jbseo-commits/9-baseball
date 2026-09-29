#!/usr/bin/env python3
"""PixelLab pitch animations -> clean unique drawings -> the runtime's 120-frame atlas.

Each pitcher lives in assets/pitcher-pixellab-v1/<id>/:
  source/*.png     PixelLab output frames (256x256, transparent), exactly as used
  sequence.json    play order: [pose, source file, ticks held at 60fps]; release pose; cleanup options

This script writes, for every pitcher folder (or the ids given):
  <id>/frames/uNN-<pose>.png                     cleaned unique drawings (shared palette)
  atlases/<id>-pitch-120-atlas.png               10x12 grid of 256x256 frames, 120 ticks, release at 76
  previews/<id>-pitch.gif, <id>-filmstrip.png    review copies
  <id>-manifest.json                             timing, key poses, stance / stride / release points

The runtime (BallparkActors / PitcherAtlasSprite) plays any 120-frame atlas at 60fps and launches
the ball at frame 76, so a PixelLab drawing is simply held for as many ticks as it needs.

  python scripts/build-pitcher-pixellab.py                      # every pitcher folder
  python scripts/build-pitcher-pixellab.py regular-02-teal-mirage
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/pitcher-pixellab-v1'
FRAME, COLS, ROWS, TICKS, FPS, RELEASE_TICK = 256, 10, 12, 120, 60, 76
BACKDROP = (22, 30, 44, 255)  # night-field navy for previews only


# ---------- shoe marks: model-drawn swoosh-like marks -> the design's plain copper panel ----------
def _in_box(r, g, b, lo, hi):
    return (r >= lo[0]) & (r <= hi[0]) & (g >= lo[1]) & (g <= hi[1]) & (b >= lo[2]) & (b <= hi[2])


def _classes(a, cfg):
    r, g, b = (a[:, :, i].astype(int) for i in range(3))
    op = a[:, :, 3] > 0
    if 'markRgbMin' in cfg:
        mark = op & _in_box(r, g, b, cfg['markRgbMin'], cfg['markRgbMax'])
    else:  # copper/orange marks (the first pilot's cleats)
        mark = op & (r > 140) & (g > 60) & (g < 160) & (b < 115) & (r - b > 80) & (r - g > 35)
    shoe = op & _in_box(r, g, b, cfg['shoeRgbMin'], cfg['shoeRgbMax'])
    cream = op & (r > 195) & (g > 185) & (b > 150) & (r - b < 70)
    skin = op & (r > 200) & (g > 140) & (g < 215) & (b > 100) & (r - b > 45) & ~mark
    return op, mark, shoe, cream, skin


def _components(m):
    seen = np.zeros_like(m, bool)
    out = []
    for y, x in zip(*np.nonzero(m)):
        if seen[y, x]:
            continue
        q = deque([(y, x)])
        seen[y, x] = True
        pts = []
        while q:
            cy, cx = q.popleft()
            pts.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < m.shape[0] and 0 <= nx < m.shape[1] and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
        out.append(np.array(pts))
    return out


def _ring(pts, inside):
    ring = set()
    for y, x in pts:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < inside.shape[0] and 0 <= nx < inside.shape[1] and not inside[ny, nx]:
                    ring.add((ny, nx))
    return np.array(sorted(ring))


def shoe_marks(a, cfg, boxes=None):
    """mark-coloured clusters that sit inside a shoe (shoe colour around them, no sock/skin): in the lower
    half of the body, or — when the shoe colour also appears elsewhere on the outfit — inside the given foot boxes"""
    op, mark, shoe, cream, skin = _classes(a, cfg)
    ys = np.nonzero(op)[0]
    top, height = ys.min(), ys.max() - ys.min() + 1
    found = []
    for pts in _components(mark):
        if len(pts) < 4 or len(pts) > cfg.get('markMaxSize', 10 ** 9):
            continue
        cy, cx = pts.mean(axis=0)
        if boxes is not None:
            if not any(x0 <= cx <= x1 and y0 <= cy <= y1 for x0, y0, x1, y1 in boxes):
                continue
        elif (cy - top) / height < 0.5:
            continue
        ring = _ring(pts, mark)
        share = lambda m: float(m[ring[:, 0], ring[:, 1]].mean())
        if share(shoe) >= 0.3 and share(cream) <= 0.1 and share(skin) <= 0.4:
            found.append((pts, ring[shoe[ring[:, 0], ring[:, 1]]]))
    return found


def design_stamp(design, cfg, boxes=None):
    """the design frame's own shoe emblem (largest mark cluster) as (dy, dx, rgb) around its centre"""
    pts, _ = max(shoe_marks(design, cfg, boxes), key=lambda m: len(m[0]))
    cy, cx = np.round(pts.mean(axis=0)).astype(int)
    return [(int(y - cy), int(x - cx), design[y, x, :3].copy()) for y, x in pts]


def fix_shoe_marks(a, cfg, panel, stamp=None, boxes=None):
    """repaint each mark with its shoe colour, then put back the design's panel (a 3-row bar) or emblem stamp"""
    a = a.copy()
    for pts, shoe_ring in shoe_marks(a, cfg, boxes):
        cols, counts = np.unique(a[shoe_ring[:, 0], shoe_ring[:, 1], :3], axis=0, return_counts=True)
        a[pts[:, 0], pts[:, 1], :3] = cols[counts.argmax()]
        inside = np.zeros(a.shape[:2], bool)
        inside[pts[:, 0], pts[:, 1]] = True
        inside[shoe_ring[:, 0], shoe_ring[:, 1]] = True
        cy, cx = np.round(pts.mean(axis=0)).astype(int)
        if stamp:
            for dy, dx, rgb in stamp:
                if inside[cy + dy, cx + dx]:
                    a[cy + dy, cx + dx, :3] = rgb
            continue
        w = int(np.clip(round(np.sqrt(len(pts) * 1.6)), 4, 6))
        for yy in range(cy - 1, cy + 2):
            for xx in range(cx - w // 2, cx - w // 2 + w):
                if inside[yy, xx]:
                    a[yy, xx, :3] = panel
    return a


def snap_to_ground(a, ground_y):
    """PixelLab can lift the whole figure off the ground line; the planted foot goes back onto it"""
    op = a[:, :, 3] > 0
    shift = ground_y - int(np.where(op.any(axis=1))[0].max())
    if shift == 0:
        return a
    out = np.zeros_like(a)
    if shift > 0:
        out[shift:] = a[:-shift]
    else:
        out[:shift] = a[-shift:]
    return out


# ---------- one palette for every drawing, so colours never flicker between frames ----------
def _lab(rgb):
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]).T
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], axis=1)


def shared_palette(frames, delta_e):
    """the art's own colours, most used first; a colour within delta_e of a kept one joins it"""
    cols, counts = np.unique(np.concatenate([f[f[:, :, 3] > 0][:, :3] for f in frames]), axis=0, return_counts=True)
    cols = cols[np.argsort(-counts)]
    lab = _lab(cols)
    keep = []
    for i in range(len(cols)):
        if not keep or np.min(np.linalg.norm(lab[keep] - lab[i], axis=1)) > delta_e:
            keep.append(i)
    return cols[keep], lab[keep]


def snap(a, pal, pal_lab):
    a = a.copy()
    m = a[:, :, 3] > 0
    lab = _lab(a[m][:, :3])
    a[m, :3] = pal[np.argmin(((lab[:, None, :] - pal_lab[None]) ** 2).sum(axis=2), axis=1)]
    a[:, :, 3] = np.where(m, 255, 0)
    return a


# ---------- the points the battle needs (same rules as scripts/pitcher-*-points.py) ----------
def stance_point(a):
    """where her feet stand in the set frame: mean x of the lowest 3-6% of the body, bottom y"""
    op = a[:, :, 3] > 40
    bot = int(np.where(op.any(axis=1))[0].max())
    xs = [np.nonzero(op[int(bot - FRAME * f):bot + 1])[1].mean() for f in (0.03, 0.06)]
    return [round(float(np.mean(xs)) / FRAME, 3), round((bot + 1) / FRAME, 3)]


def stride_point(ticks):
    """front foot = leftmost point of the lowest 6% over ticks 30-74; plants on the first tick within 3% of full reach"""
    foot = {}
    for k in range(30, 75):
        op = ticks[k][:, :, 3] > 40
        bot = int(np.where(op.any(axis=1))[0].max())
        band = op[int(bot - FRAME * .06):bot + 1]
        foot[k] = (int(np.where(band.any(axis=0))[0].min()), bot)
    reach = min(x for x, _ in foot.values())
    k = next(k for k in sorted(foot) if foot[k][0] <= reach + FRAME * .03)
    return [k, round(foot[k][0] / FRAME, 3), round(foot[k][1] / FRAME, 3)]


def release_point(ticks):
    """the throwing hand one tick after release: leftmost opaque point at chest height (20-60%)"""
    op = ticks[RELEASE_TICK + 1][:, :, 3] > 40
    y0, y1 = int(FRAME * .2), int(FRAME * .6)
    band = op[y0:y1]
    x = int(np.where(band.any(axis=0))[0].min())
    y = y0 + int(np.where(band[:, x])[0].mean())
    return [round(x / FRAME, 3), round(y / FRAME, 3)]


def build(pid):
    folder = BASE / pid
    seq = json.loads((folder / 'sequence.json').read_text(encoding='utf-8'))
    steps = seq['sequence']
    assert sum(t for _, _, t in steps) == TICKS, f'{pid}: ticks must total {TICKS}'
    poses = [p for p, _, _ in steps]
    assert sum(t for _, _, t in steps[:poses.index(seq['releasePose'])]) == RELEASE_TICK, f'{pid}: release must start at tick {RELEASE_TICK}'

    raw = {}
    for _, src, _ in steps:
        if src not in raw:
            raw[src] = np.array(Image.open(folder / 'source' / src).convert('RGBA'))
            assert raw[src].shape[:2] == (FRAME, FRAME), f'{pid}/{src} must be {FRAME}x{FRAME}'
    cleanup = seq.get('cleanup', {})
    if 'groundY' in cleanup:
        raw = {src: snap_to_ground(a, cleanup['groundY']) for src, a in raw.items()}
    shoe = cleanup.get('shoeMarks')
    if shoe:
        design_src = shoe['designFrame']
        # foot boxes (frame coordinates after the ground snap) confine the fix when given
        box = (lambda src: shoe['markBoxes'].get(src, [])) if 'markBoxes' in shoe else (lambda src: None)
        design = raw[design_src]
        marks = np.concatenate([design[p[:, 0], p[:, 1], :3] for p, _ in shoe_marks(design, shoe, box(design_src))])
        cols, counts = np.unique(marks, axis=0, return_counts=True)
        panel = cols[counts.argmax()]
        stamp = design_stamp(design, shoe, box(design_src)) if shoe.get('panel') == 'stamp' else None
        raw = {src: (a if src == design_src else fix_shoe_marks(a, shoe, panel, stamp, box(src))) for src, a in raw.items()}
    pal, pal_lab = shared_palette(list(raw.values()), cleanup.get('paletteDeltaE', 4.5))
    clean = {src: snap(a, pal, pal_lab) for src, a in raw.items()}

    frames_dir = folder / 'frames'
    frames_dir.mkdir(exist_ok=True)
    for old in frames_dir.glob('u*.png'):
        old.unlink()
    unique = []
    for pose, src, _ in steps:
        if src not in [s for _, s in unique]:
            unique.append((pose, src))
    for i, (pose, src) in enumerate(unique):
        Image.fromarray(clean[src], 'RGBA').save(frames_dir / f'u{i:02d}-{pose}.png', optimize=True)

    ticks = [clean[src] for _, src, t in steps for _ in range(t)]
    atlas = Image.new('RGBA', (FRAME * COLS, FRAME * ROWS), (0, 0, 0, 0))
    for k, a in enumerate(ticks):
        r, c = divmod(k, COLS)
        atlas.paste(Image.fromarray(a, 'RGBA'), (c * FRAME, r * FRAME))
    (BASE / 'atlases').mkdir(exist_ok=True)
    atlas_path = BASE / 'atlases' / f'{pid}-pitch-120-atlas.png'
    atlas.save(atlas_path, optimize=True)

    (BASE / 'previews').mkdir(exist_ok=True)
    gif, durations = [], []
    for _, src, t in steps:
        im = Image.new('RGBA', (FRAME, FRAME), BACKDROP)
        im.alpha_composite(Image.fromarray(clean[src], 'RGBA'))
        gif.append(im.resize((FRAME * 2, FRAME * 2), Image.NEAREST).convert('P', palette=Image.ADAPTIVE, colors=255))
        durations.append(round(t * 1000 / FPS / 10) * 10)
    gif[0].save(BASE / 'previews' / f'{pid}-pitch.gif', save_all=True, append_images=gif[1:],
                duration=durations, loop=0, disposal=1, optimize=True)
    strip = Image.new('RGBA', (len(unique) * (FRAME + 6) + 6, FRAME + 12), BACKDROP)
    for i, (_, src) in enumerate(unique):
        strip.alpha_composite(Image.fromarray(clean[src], 'RGBA'), (6 + i * (FRAME + 6), 6))
    strip.save(BASE / 'previews' / f'{pid}-filmstrip.png', optimize=True)

    key_poses, tick = [], 0
    for i, (pose, src, t) in enumerate(steps):
        key_poses.append({'frame': tick, 'ticks': t, 'pose': pose,
                          'drawing': [s for _, s in unique].index(src)})
        tick += t
    manifest = {
        'id': f'{pid}-pitch-pixellab-v1',
        'character': pid,
        'facing': 'screen-left',
        'throws': 'screen-left',
        'frameCount': TICKS,
        'uniqueDrawingCount': len(unique),
        'fps': FPS,
        'durationMs': round(TICKS * 1000 / FPS),
        'releaseFrame': RELEASE_TICK,
        'frameSize': [FRAME, FRAME],
        'atlas': f'atlases/{pid}-pitch-120-atlas.png',
        'atlasColumns': COLS,
        'atlasRows': ROWS,
        'paletteColors': int(len(pal)),
        'keyPoses': key_poses,
        'stance': stance_point(ticks[0]),
        'stride': stride_point(ticks),
        'release': release_point(ticks),
        'generator': seq.get('generator', {}),
    }
    (BASE / f'{pid}-manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'{pid}: {len(unique)} drawings, {len(pal)} colours, stance {manifest["stance"]}, '
          f'stride {manifest["stride"]}, release {manifest["release"]}')
    return manifest


if __name__ == '__main__':
    ids = sys.argv[1:] or sorted(p.name for p in BASE.iterdir() if (p / 'sequence.json').exists())
    for pid in ids:
        build(pid)
