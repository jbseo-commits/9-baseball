from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[3]
p=root/'assets/red-fox-twelve-pose-v1'
assert hashlib.sha256((p/'red-fox-pitch-sprite-sheet.png').read_bytes()).hexdigest()=='4a5ecae4981f0dc99e4349dc211d099c4032f6fe0bcbb28be0f677442de6aeb3'
assert hashlib.sha256((p/'metadata.json').read_bytes()).hexdigest()=='b3b6aee38ee1f810b7823667edc61a7f048675f48362e42719fb5f92db7fcd45'
im=Image.open(p/'red-fox-pitch-sprite-sheet.png').convert('RGBA');atlas=Image.new('RGBA',(1024,768));records=[]
for i in range(12):
 c=im.crop((i%4*128,i//4*112,i%4*128+128,i//4*112+112));a=(40,96) if i<4 else (82,96);d=(100,233) if i<4 else (194,248);o=(d[0]-3*a[0],d[1]-3*a[1]);cell=Image.new('RGBA',(256,256));scaled=c.resize((384,336),Image.Resampling.NEAREST);cell.alpha_composite(scaled,o)
 assert sum(cell.getchannel('A').histogram())==65536
 # Prove packing crops transparent margins only.
 assert sum(cell.getchannel('A').getdata())==sum(c.getchannel('A').getdata())*9
 atlas.alpha_composite(cell,(i%4*256,i//4*256));records.append({'frame':i,'sourceAnchor':a,'cellOrigin':o,'cellFoot':d,'bounds':cell.getbbox()})
atlas.save(root/'assets/pitcher-inbetweens-v1/runtime/regular-07-red-fox-pitch-drawings.webp',lossless=True,method=6)
(Path(__file__).parent/'packing.json').write_text(json.dumps(records,indent=2)+'\n')
f=root/'src/duel/battle-vnext/roster-registration.json';data=json.loads(f.read_text());r=data['regular-07-red-fox']
counts=[19,11,14,9,8,6,6,6,3,6,12,20];assert sum(counts)==120 and sum(counts[:8])==79
r.update(columns=4,rows=3,drawingAtTick=[i for i,n in enumerate(counts) for _ in range(n)],keyDrawings=[0,1,2,3,5,7,8,9,10,10,11,11],recoveryDrawings=[11],releaseDrawing=8,landingDrawing=5,landingFrame=sum(counts[:5]),anchor={'x':100,'y':233},release={'x':230,'y':59},landing={'x':194,'y':248},visibleHeight=231,authoredDrawings=12,newInbetweenDrawings=0)
f.write_text(json.dumps(data,indent=2)+'\n')
for name,value in [('pitcher-release.json',[230/256,59/256]),('pitcher-stride.json',[r['landingFrame'],194/256,248/256])]:
 f=root/'src/duel'/name;d=json.loads(f.read_text());d[r['id']]=value;f.write_text(json.dumps(d,indent=2)+'\n')
