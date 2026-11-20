from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[3];out=root/'assets/pixel-batter-review-v1'
src=Image.open(out/'batter-night-poses.webp').convert('RGBA');assert src.size==(960,160);assert set(src.getchannel('A').getdata())<={0,255}
anchors=[(49,152),(45,152),(24,152),(36,149),(31,150),(22,151)]
# Existing14timing slots, six supplied drawings; no synthesized tween.
slots=[0,1,1,1,1,2,2,2,3,4,4,5,5,0]
base=json.loads((root/'assets/production-art/mockup-rebuild/motion.json').read_text())['batter'];atlas=Image.new('RGBA',(3072,3072));frames=[]
for i,s in enumerate(slots):
 cell=Image.new('RGBA',(768,768));pose=src.crop((s*160,0,(s+1)*160,160)).resize((640,640),Image.Resampling.NEAREST);x,y=210-anchors[s][0]*4,700-anchors[s][1]*4
 cell.alpha_composite(pose,(x,y));assert sum(cell.getchannel('A').getdata())==sum(pose.getchannel('A').getdata()),'clipping'
 atlas.alpha_composite(cell,((i%4)*768,(i//4)*768));frames.append({'id':i,'name':base['frames'][i]['name'],'sourcePose':s,'alphaBounds':list(cell.getbbox()),'foot':[210,700]})
frames[8]['contact']={'x':642,'y':344}
base.update(file='batter-runtime.webp',frames=frames,ready=None,event={'x':642,'y':344},authoredDrawings=6,sourceAnchors=anchors,slotMapping=slots)
atlas.save(out/'batter-runtime.webp',lossless=True);(out/'batter-runtime.json').write_text(json.dumps(base,indent=2)+'\n')
