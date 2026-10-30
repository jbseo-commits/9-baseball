"""Extract the imagegen-authored sheet into text-free runtime card illustrations.
No painted UI, costs, range, or rules in the assets. Exact observed sheet edges,
not assumed equal cells. The original source is preserved for review.
"""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]/'assets/production-art/atbat-cards'
source=root/'source/illustrations.png'
im=Image.open(source).convert('RGB')
assert im.size==(1254,1254)
names=['place','rally','strike','laser','scout','wall','watch','slug','defend']
xs=[0,418,837,1254];ys=[0,416,811,1254]
frames=[]
for i,name in enumerate(names):
    c=i%3;r=i//3
    box=(xs[c]+3,ys[r]+3,xs[c+1]-3,ys[r+1]-3)
    image=im.crop(box)
    image.thumbnail((200,200),Image.Resampling.LANCZOS)
    target=root/(name+'.webp')
    image.save(target,'WEBP',quality=70,method=6)
    frames.append({'kind':name,'sourceCrop':box,'width':image.width,'height':image.height,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(root/'manifest.json').write_text(json.dumps({'source':'source/illustrations.png','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'authoring':'image_gen 2026-10-29; isolated art only, no game text','scope':'opt-in atbat view only','frames':frames},ensure_ascii=False,indent=2)+'\n')
print('runtime',sum(f['bytes'] for f in frames),'bytes')
