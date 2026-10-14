#!/usr/bin/env python3
"""Runtime files for the four catcher-cam pitchers joining the roster on 2026-10-14.

Jade Viper and Copper Sirocco atlases already follow the game contract (release at frame 76,
no baked ball). Onyx Eclipse and Emerald Tempest arrived from an outside generator with their
release 11-20 frames late and a drawn ball flying out of the hand (frames 84-96), which would
double the game's own Pixi ball. Their runtime atlas is therefore:
  * retimed: the windup (source 0..release) is time-compressed onto game frames 0..76 and the
    follow-through after it is shifted, so frame 0 stays the set stance and the release lands on 76. Onyx: 84-96 = arm extended with the ball still drawn in the fist, 97 = pronation, hand empty. Emerald: 87 = last
    cocked frame with the ball in hand, 88 = arm through and hand empty;
  * stripped of the drawn ball: the red-seamed white disc found in each cell is erased.
Onyx and Emerald stand high in their cells, so their runtime atlas is also lowered
until the set-stance feet sit near the bottom like the other pitchers. The source atlases stay untouched. Also writes, per pitcher, a trimmed frame-0 figure cutout
(map silhouette, KO cut) and a WebP portrait for framed views.

  python3 scripts/build-runtime-pitchers-1014.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
A = ROOT / 'assets'
CELL, COLS, ROWS = 256, 10, 12
GAME_RELEASE = 76

PITCHERS = {
    'jade-viper': dict(atlas=A / 'pitcher-study-jade-viper/atlases/jade-viper-pitch-120-atlas.png',
                       portrait=A / 'pitcher-study-jade-viper/source/jade-viper-portrait.png'),
    'copper-sirocco': dict(atlas=A / 'pitcher-study-copper-sirocco/v2/atlases/copper-sirocco-pitch-120-atlas.png',
                           portrait=A / 'pitcher-study-copper-sirocco/v2/source/copper-sirocco-portrait.png'),
    'onyx-eclipse': dict(atlas=A / 'pitcher-study-onyx-eclipse/onyx-eclipse-atlas-256x256-10x12-120f.png',
                         portrait=A / 'pitcher-study-onyx-eclipse/onyx-eclipse-master-lhp.jpg',
                         source_release=96, ground=True),
    'emerald-tempest': dict(atlas=A / 'pitcher-study-emerald-tempest/emerald-tempest-atlas-256x256-10x12-120f.png',
                            portrait=A / 'pitcher-study-emerald-tempest/emerald-tempest-master-rhp.jpg',
                            source_release=87, ground=True),
}


def cells(img):
    a = np.array(img.convert('RGBA'))
    return [a[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL].copy() for r in range(ROWS) for c in range(COLS)]


def erase_ball(cell):
    """Remove the drawn ball: its red seam ring locates it, then the ring and the white inside go."""
    R, G, B, a = (cell[..., i].astype(int) for i in range(4))
    red = (a > 40) & (R > 150) & (G < 110) & (B < 110) & (R - G > 70)
    ys, xs = np.nonzero(red)
    if len(xs) < 20:
        return 0
    cy, cx = np.median(ys), np.median(xs)
    near = (np.abs(ys - cy) <= 12) & (np.abs(xs - cx) <= 12)
    ys, xs = ys[near], xs[near]
    y0, y1, x0, x1 = ys.min() - 2, ys.max() + 3, xs.min() - 2, xs.max() + 3
    box = np.zeros(red.shape, bool)
    box[max(0, y0):y1, max(0, x0):x1] = True
    ball = box & (a > 0) & (red | (np.minimum(np.minimum(R, G), B) > 170) | ((R > 120) & (R - G > 40)))
    cell[ball] = 0
    return int(ball.sum())


def ground(out):
    """Move every cell down by the same amount so the set-stance feet sit at ~95% of the cell, like
    the other catcher-cam pitchers (the stage anchors the pitcher by her feet; tests/mobile-playtest-103
    wants them below 90%). Never pushes the lowest foot of any frame out of the cell."""
    feet = int(np.nonzero(out[0][..., 3].any(axis=1))[0].max())
    lowest = max(int(np.nonzero(c[..., 3].any(axis=1))[0].max()) for c in out)
    dy = max(0, min(round(CELL * .95) - feet, CELL - 1 - lowest))
    if dy:
        for c in out:
            c[dy:] = c[:CELL - dy].copy()
            c[:dy] = 0
    return dy


def build_atlas(pid, spec):
    src = cells(Image.open(spec['atlas']))
    shift = spec.get('source_release', GAME_RELEASE) - GAME_RELEASE
    rel = GAME_RELEASE + shift
    pick = lambda i: round(i * rel / GAME_RELEASE) if i <= GAME_RELEASE else min(len(src) - 1, i + shift)
    out = [src[pick(i)].copy() for i in range(len(src))]
    erased = sum(erase_ball(c) for c in out) if shift else 0
    dy = ground(out) if spec.get('ground') else 0
    if not shift and not dy:
        return spec['atlas'], out
    sheet = np.zeros((ROWS * CELL, COLS * CELL, 4), np.uint8)
    for i, c in enumerate(out):
        r, col = divmod(i, COLS)
        sheet[r * CELL:(r + 1) * CELL, col * CELL:(col + 1) * CELL] = c
    dst = A / f'pitcher-study-{pid}/runtime/{pid}-pitch-120-atlas.png'
    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(sheet).save(dst, optimize=True)
    print(f'{pid}: retimed +{shift}, erased {erased} ball px, lowered {dy}px -> {dst.relative_to(ROOT)}')
    return dst, out


def main():
    for pid, spec in PITCHERS.items():
        _, out = build_atlas(pid, spec)
        run = A / f'pitcher-study-{pid}/runtime'
        run.mkdir(parents=True, exist_ok=True)
        fig = Image.fromarray(out[0])
        fig.crop(fig.getbbox()).save(run / f'{pid}-figure.png', optimize=True)
        por = Image.open(spec['portrait']).convert('RGBA')
        por.thumbnail((800, 800))
        por.save(run / f'{pid}-portrait.webp', quality=84, method=6)
        print(f'{pid}: figure {fig.getbbox()}, portrait {por.size}')


if __name__ == '__main__':
    main()
