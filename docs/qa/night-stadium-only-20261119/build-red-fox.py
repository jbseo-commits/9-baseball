from pathlib import Path
from PIL import Image
import subprocess,json
root=Path(__file__).resolve().parents[3];p=root/'assets/red-fox-sixpose';p.mkdir(exist_ok=True)
names=['set','lift','stride','release','follow','recover'];anchors=[(39,89),(44,90),(65,91),(64,92),(47,92),(61,92)]
atlas=Image.new('RGBA',(768,512));registration=[]
for i,(name,anchor) in enumerate(zip(names,anchors)):
 f=p/(name+'.png')
 if not f.exists():f.write_bytes(subprocess.check_output(['git','show',f'e0ad972:docs/qa/red-fox-single-pitch-20261119/assets/{name}.png'],cwd=root))
 im=Image.open(f).convert('RGBA');dest=(100,230) if i<2 else (174,242);xy=(dest[0]-anchor[0]*2,dest[1]-anchor[1]*2);cell=Image.new('RGBA',(256,256));cell.alpha_composite(im.resize((192,192),Image.Resampling.NEAREST),xy);atlas.alpha_composite(cell,((i%3)*256,(i//3)*256));registration.append({'pose':name,'sourceAnchor':anchor,'cellOrigin':xy,'cellFoot':dest})
atlas.save(root/'assets/pitcher-inbetweens-v1/runtime/regular-07-red-fox-pitch-drawings.webp',lossless=True,method=6)
Image.open(p/'set.png').save(root/'assets/pitcher-mobs-v1/regular-07-red-fox.png')
(root/'docs/qa/night-stadium-only-20261119/red-fox-packing.json').write_text(json.dumps(registration,indent=2))
