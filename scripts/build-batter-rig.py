"""Cut the V15 READY pose into cutout-rig layers: legs (base), upper body, arms+gloves, bat.
The runtime (BallparkActors, BATTER_V15_RIG in src/duel/batter-v15.js) moves them for the idle and
the load, so the batter breathes and waggles instead of standing still. Holes each layer leaves in
the one under it are inpainted, so the small rotations never open a gap.

  python scripts/build-batter-rig.py     # needs Pillow, numpy, opencv-python-headless

Writes assets/production-art/battle-portrait-v15/rig/{legs,upper,arms,bat}.png at the runtime cell
size (512x768, the same scale as batter-sheet-runtime.png). Pivots in src/duel/batter-v15.js are in
that cell space (half of the source coordinates below)."""
import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets/production-art/battle-portrait-v15/batter-ready.png')
OUT = os.path.join(ROOT, 'assets/production-art/battle-portrait-v15/rig')
im = Image.open(SRC).convert('RGBA'); Wd, Ht = im.size

def poly_mask(pts, blur=0):
    m = Image.new('L', (Wd, Ht), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m

# polygons in source pixels (1024x1536)
BAT = [(262, 372), (300, 300), (470, 0), (600, 0), (600, 20), (400, 330), (352, 405)]
ARMS = [(10, 380), (110, 360), (190, 320), (300, 318), (352, 360), (380, 440), (430, 510), (560, 530),
        (610, 600), (600, 705), (500, 725), (380, 700), (300, 650), (230, 610), (150, 570), (60, 548), (10, 470)]
UPPER_Y = 792  # the belt: above it is the upper body, below it the legs

a = np.array(im)
alpha = a[..., 3]

def layer_from(mask):
    out = a.copy(); out[..., 3] = (alpha.astype(float) * (np.array(mask) / 255)).astype(np.uint8); return out

bat_m = poly_mask(BAT)
arms_m = poly_mask(ARMS)
arms_m = Image.fromarray(np.maximum(np.array(arms_m), 0))
upper_m = Image.new('L', (Wd, Ht), 0); ImageDraw.Draw(upper_m).rectangle([0, 0, Wd, UPPER_Y], fill=255)

bat = layer_from(bat_m)
arms_only = np.minimum(np.array(arms_m), 255 - np.array(bat_m))
arms = layer_from(Image.fromarray(arms_only.astype(np.uint8)))
upper_only = np.minimum(np.array(upper_m), 255 - np.maximum(np.array(arms_m), np.array(bat_m)))
upper = layer_from(Image.fromarray(upper_only.astype(np.uint8)))
legs_m = Image.new('L', (Wd, Ht), 0); ImageDraw.Draw(legs_m).rectangle([0, UPPER_Y - 40, Wd, Ht], fill=255)
legs = layer_from(legs_m)

def fill_under(layer, hole_mask, keep_inside):
    """inpaint the RGB under `hole_mask` (where the layer above was cut out) and make it opaque
    only where the body is: inside `keep_inside` (a dilated silhouette of this layer)."""
    rgb = cv2.cvtColor(layer[..., :3], cv2.COLOR_RGB2BGR)
    hole = (hole_mask > 0).astype(np.uint8) * 255
    known = (layer[..., 3] > 128).astype(np.uint8)
    # inpaint from this layer's own opaque pixels only
    src = rgb.copy(); src[known == 0] = 0
    fill = cv2.inpaint(src, cv2.bitwise_or(hole, (1 - known) * 255), 9, cv2.INPAINT_TELEA)
    fill = cv2.cvtColor(fill, cv2.COLOR_BGR2RGB)
    out = layer.copy()
    region = (hole > 0) & (keep_inside > 0) & (layer[..., 3] < 128)
    out[region, :3] = fill[region]; out[region, 3] = 255
    return out

# where the arms sat over the torso: fill the torso under them (inside the torso's silhouette + the arms' footprint)
TORSO = [(290, 420), (460, 440), (720, 430), (740, 800), (300, 800), (280, 620)]
torso_sil = np.minimum((alpha > 0).astype(np.uint8) * 255, np.array(poly_mask(TORSO)))
arm_hole = cv2.dilate((arms_only > 0).astype(np.uint8) * 255, np.ones((19, 19), np.uint8))
upper_f = fill_under(upper, arm_hole & (alpha > 0).astype(np.uint8) * 255, torso_sil)

# the gloves under the bat handle: fill the arms layer where the bat covered it
bat_hole = cv2.dilate((np.array(bat_m) > 0).astype(np.uint8) * 255, np.ones((11, 11), np.uint8))
arms_sil = cv2.dilate((arms[..., 3] > 128).astype(np.uint8) * 255, np.ones((9, 9), np.uint8))
arms_f = fill_under(arms, bat_hole & arms_sil, arms_sil)

os.makedirs(OUT, exist_ok=True)
layers = [('legs', legs), ('upper', upper_f), ('arms', arms_f), ('bat', bat)]
for name, arr in layers:
    Image.fromarray(arr).resize((Wd // 2, Ht // 2), Image.LANCZOS).save(os.path.join(OUT, name + '.png'), optimize=True)

# check: the layers stacked at rest give back the source
comp = Image.new('RGBA', (Wd, Ht))
for _, arr in layers: comp.alpha_composite(Image.fromarray(arr))
diff = np.abs(np.array(comp).astype(int) - a.astype(int))[..., :3][alpha > 128].mean()
print('recompose mean diff on the body', round(float(diff), 3))
