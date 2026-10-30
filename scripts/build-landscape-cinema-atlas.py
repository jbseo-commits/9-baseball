"""Pack authored image_gen drawings. Only crop/register/resize/encode; no limb warps or fabricated motion."""
from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/production-art/landscape-cinema';SRC=OUT/'source'
def source(name):return SRC/name
# Artist-reviewed isolated regions. Some bats cross a nominal source grid edge.
batter=[
 ('ready','batter-keys.png',(0,0,512,520),65),
 ('half-load','batter-bridges.png',(0,0,512,520),63),
 ('load','batter-keys.png',(512,0,1024,520),64),
 ('stride','batter-bridges.png',(512,0,1024,520),63),
 ('plant','batter-keys.png',(1024,0,1536,520),64),
 ('hip-drive','batter-drive.png',(0,0,631,623),80),
 ('barrel-lag','batter-drive.png',(631,0,1262,623),80),
 ('downswing','batter-drive.png',(0,623,695,1246),15),
 ('contact','batter-keys.png',(0,520,596,1024),40),
 ('early-follow','batter-bridges.png',(596,520,1060,1024),20),
 ('follow','batter-keys.png',(596,520,1024,1024),35),
 ('recover','batter-keys.png',(1024,520,1536,1024),35),
 ('return-low','batter-return.png',(0,0,887,887),145),
 ('return-high','batter-return.png',(887,0,1774,887),145),
]
pitcher=[
 ('set','pitcher-poses.png',(0,0,512,768),18,(148,753)),
 ('release','pitcher-poses.png',(512,0,1024,768),96,(165,650)),
 ('follow','pitcher-poses.png',(0,768,600,1536),22,(193,723)),
 ('fatigue','pitcher-poses.png',(600,768,1024,1536),22,(86,703)),
 ('coil','../mockup-v1-intake/pitcher-home.webp',(0,0,1024,1536),45,(595,1495)),
]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def build(items,who,cell,cols,anchor,body_height,world_body,world_foot):
 rows=(len(items)+cols-1)//cols;atlas=Image.new('RGBA',(cell*cols,cell*rows));frames=[];contact=None
 for i,item in enumerate(items):
  name,file,box,head,*fixed=item
  path=(OUT/file if file.startswith('../') else source(file)).resolve()
  im=Image.open(path).convert('RGBA').crop(box);alpha=np.asarray(im.getchannel('A'));yy,xx=np.where(alpha>160)
  if fixed:foot=fixed[0]
  else:
   bottom=int(yy.max());ys,xs=np.where((alpha>160)&(np.indices(alpha.shape)[0]>=bottom-4));foot=(float(np.median(xs)),bottom)
  scale=body_height/(foot[1]-head);pos=(round(anchor[0]-foot[0]*scale),round(anchor[1]-foot[1]*scale))
  fitted=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
  frame=Image.new('RGBA',(cell,cell));frame.alpha_composite(fitted,pos)
  # No trimming/cutting of the registered drawing at runtime cell boundary.
  bb=frame.getchannel('A').point(lambda a:255 if a>160 else 0).getbbox()
  if bb and (bb[0]<=0 or bb[1]<=0 or bb[2]>=cell or bb[3]>=cell):raise ValueError((who,name,'cell clipping',bb))
  atlas.alpha_composite(frame,((i%cols)*cell,(i//cols)*cell))
  f={'id':i,'name':name,'source':str(path.relative_to(ROOT)),'crop':list(box),'sourceFoot':list(foot),'sourceHeadY':head,'scale':scale,'registration':list(pos),'foot':list(anchor),'alphaBounds':list(bb)}
  if who=='batter' and name=='contact':
   point=(485-box[0],690-box[1]);contact={'x':pos[0]+point[0]*scale,'y':pos[1]+point[1]*scale};f['contact']=contact
  if who=='pitcher' and name=='release':
   point=(562-box[0],34-box[1]);contact={'x':pos[0]+point[0]*scale,'y':pos[1]+point[1]*scale};f['release']=contact
  frames.append(f)
 # Source atlas preserved losslessly; runtime uses a budgeted WebP derivative.
 atlas.save(OUT/(who+'-atlas.png'))
 atlas.save(OUT/(who+'-atlas.webp'),format='WEBP',quality=80,method=6,exact=False)
 return {'file':who+'-atlas.webp','sourceWidth':cell,'sourceHeight':cell,'columns':cols,'rows':rows,'frames':frames,'anchor':{'x':anchor[0],'y':anchor[1]},'worldFoot':{'x':world_foot[0],'y':world_foot[1]},'worldHeight':cell*world_body/body_height,'event':contact,'runtimeBytes':(OUT/(who+'-atlas.webp')).stat().st_size,'sha256':sha(OUT/(who+'-atlas.webp'))}
b=build(batter,'batter',640,4,(150,590),450,569,(520,909))
p=build(pitcher,'pitcher',384,3,(130,320),260,293,(832,580))
m={'schema':1,'scope':'explicit sample-actor landscape preview; existing roster mapping unchanged','authoredBatterPoses':len(batter),'authoredPitcherPoses':len(pitcher),'not120IndependentDrawings':True,'handedness':{'batter':'right','pitcher':'right','pitcherGlove':'left'},'batter':b,'pitcher':p,'sources':[{ 'file':str(f.relative_to(ROOT)),'sha256':sha(f)} for f in SRC.glob('*.png')],'imagegenRuns':['exec-9e5b730b-cb94-41aa-9133-ee76ff704d99','exec-41cbc478-0b2c-48b7-b713-7dc81c1bb19d','exec-0f11948a-b491-4400-bd59-61730212c290','exec-697a7961-e01d-4f44-8a21-c5f3d0030f98','exec-a7e53f96-86b2-4922-8748-d4152ec73e21']}
(OUT/'motion.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('runtime bytes',b['runtimeBytes'],p['runtimeBytes'],'total',b['runtimeBytes']+p['runtimeBytes'])
