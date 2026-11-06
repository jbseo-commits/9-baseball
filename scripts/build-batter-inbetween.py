#!/usr/bin/env python3
"""One authored bat-rotation in-between, registered against immutable key6."""
from pathlib import Path
from PIL import Image
import json,hashlib
R=Path(__file__).resolve().parents[1];P=R/'assets/production-art/batter-inbetweens-v1';m=json.loads((P/'manifest.json').read_text())
im=Image.open(R/m['source']).convert('RGBA');w,h=m['cellSize'];i=m['selectedSourceCell'];im=im.crop((i*w,0,(i+1)*w,h));s=m['scale'];dx,dy=m['translation']
im=im.transform((768,768),Image.Transform.AFFINE,(1/s,0,-dx/s,0,1/s,-dy/s),Image.Resampling.BICUBIC)
im.save(P/'swing-bridge.webp',lossless=True,exact=True,method=6)
print('batter in-between', (P/'swing-bridge.webp').stat().st_size)
