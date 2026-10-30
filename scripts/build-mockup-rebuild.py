"""Pack image_gen-authored assets. Crop, alpha-isolate neighbouring sheet figures,
register ground anchors, encode; never rotate/warp limbs or invent inbetweens.
Original sheets and individual extracted PNG drawings are retained.
"""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import hashlib,json,shutil,numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/production-art/mockup-rebuild';SRC=OUT/'source';SRC.mkdir(parents=True,exist_ok=True)
GENERATED=Path('/workspace/generated_images')
INPUTS={
 'reference':'exec-ba72675e-3fce-4ee1-8570-cb4c7c14c7e3.png',
 'field':'exec-e414704f-03ee-482d-a662-9570e3838e0d.png',
 'ready':'exec-33f0b278-6521-40e5-b22d-08542baf5eb8.png',
 'pre':'exec-406597f1-73cf-4474-b17a-354222f06648.png',
 'post':'exec-e892d8fb-de5e-42e2-82fc-4ac94c6c029e.png',
 'return':'exec-bc4e6303-1cf2-4f74-9ea8-a6523090c14a.png',
 'pitcher':'exec-7078a173-c341-40d6-a586-9471adfd7fa0.png',
 'cards':'exec-f15af985-3400-4910-8dc6-0d42d2d7d0e2.png',
 'skins':'exec-6a5fc5ea-b163-40fb-b262-d8a5f36377f3.png',
}
for name,f in INPUTS.items():
 target=SRC/(name+'.png')
 if not target.exists():shutil.copyfile(GENERATED/f,target)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def runtime_pixels(im):
 rgba=np.asarray(im.convert('RGBA')).copy();a=rgba[:,:,3]
 # The generator's near-opaque interior is exported as material, not a faint
 # background wash. Preserve the 2px alpha fringe and every original master.
 interior=ndimage.binary_erosion(a>190,iterations=2);a[interior]=255
 rgba[a==0,:3]=0
 return Image.fromarray(rgba)

def figures(name,count,columns=3,rows=2):
 im=Image.open(SRC/(name+'.png')).convert('RGBA');a=np.asarray(im.getchannel('A'))
 labels,n=ndimage.label(a>190);sizes=np.bincount(labels.ravel());ids=np.argsort(sizes[1:])[-count:]+1
 items=[]
 for label in ids:
  yy,xx=np.where(labels==label);box=(int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1))
  # Source figures cross nominal grid edges. Keep each connected drawing and
  # its 4px antialias fringe, excluding adjacent drawings, not fixed grid cuts.
  keep=ndimage.binary_dilation(labels==label,iterations=4)
  rgba=np.asarray(im).copy();rgba[:,:,3]=np.where(keep,rgba[:,:,3],0)
  crop=(max(0,box[0]-5),max(0,box[1]-5),min(im.width,box[2]+5),min(im.height,box[3]+5))
  cut=Image.fromarray(rgba).crop(crop)
  col=min(columns-1,int((box[0]+box[2])/2/(im.width/columns)))
  row=min(rows-1,int((box[1]+box[3])/2/(im.height/rows)))
  items.append({'im':cut,'crop':crop,'slot':row*columns+col,'source':name+'.png','component':int(label)})
 items.sort(key=lambda x:x['slot'])
 if len({x['slot'] for x in items})!=count:raise ValueError((name,'ambiguous sheet slots'))
 return items

def isolated(name):
 item=figures(name,1,1,1)[0];return item

pre=figures('pre',6);post=figures('post',6);pitch=figures('pitcher',6)
ready=isolated('ready');ret=isolated('return')
bnames=['ready','half-load','load','stride','plant','hip-drive','barrel-lag','downswing','contact','early-follow','follow','recover','return-low','return-high']
bitems=[ready,*pre,*post,ret]
# Approximate anatomical helmet tops, measured on original generated sheets,
# independent of the raised bat tip. Packing is the same authored-foot method
# used by the existing cinema assets, with a larger cell to avoid bat clipping.
bheads=[255,80,70,85,545,528,545,17,17,15,527,527,548,237]
pnames=['set','release','follow','fatigue','coil']
pitems=[pitch[i] for i in [0,2,3,4,1]];pheads=[8,65,583,527,8]

def pack(names,items,heads,who,cell,cols,anchor,body_height,world_body,world_foot):
 atlas=Image.new('RGBA',(cell*cols,cell*((len(names)+cols-1)//cols)));frames=[];event=None;ready_data=None
 for i,(name,item,head_global) in enumerate(zip(names,items,heads)):
  im=item['im'];a=np.asarray(im.getchannel('A'));yy,xx=np.where(a>190)
  # The batter's near-left shoe is the stable stance reference. In sheets the
  # opposite shoe may be lower in perspective; never alternate between feet.
  if who=='batter':
   eligible=(a>190)&(np.indices(a.shape)[1]<(xx.min()+(xx.max()-xx.min())*.36))&(np.indices(a.shape)[0]>(yy.min()+(yy.max()-yy.min())*.65))
   fy,fx=np.where(eligible)
  else:fy,fx=yy,xx
  bottom=int(fy.max());near=(fy>=bottom-4);foot=(float(np.median(fx[near])),bottom)
  head=head_global-item['crop'][1]
  multiplier={'release':.88,'follow':.85,'fatigue':.92}.get(name,1) if who=='pitcher' else 1
  scale=body_height*multiplier/(foot[1]-head)
  pos=(round(anchor[0]-foot[0]*scale),round(anchor[1]-foot[1]*scale))
  fitted=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
  frame=Image.new('RGBA',(cell,cell));frame.alpha_composite(fitted,pos)
  bb=frame.getchannel('A').point(lambda x:255 if x>160 else 0).getbbox()
  # Detect source cropping from the fitted rectangle too, not just final alpha.
  local=im.getchannel('A').point(lambda x:255 if x>190 else 0).getbbox()
  transformed=[pos[0]+local[0]*scale,pos[1]+local[1]*scale,pos[0]+local[2]*scale,pos[1]+local[3]*scale]
  if min(transformed)<1 or max(transformed)>cell-1:raise ValueError((who,name,'atlas cell clipping',transformed))
  f={'id':i,'name':name,'source':str((SRC/item['source']).relative_to(ROOT)),'sourceComponent':item['component'],'crop':list(item['crop']),'sourceFoot':list(foot),'sourceHeadY':head,'scale':scale,'registration':list(pos),'foot':list(anchor),'alphaBounds':list(bb)}
  if (who,name) in [('batter','contact'),('pitcher','release')]:
   p=(1039,174) if who=='batter' else (1169,239)
   event={'x':pos[0]+(p[0]-item['crop'][0])*scale,'y':pos[1]+(p[1]-item['crop'][1])*scale};f['contact' if who=='batter' else 'release']=event
  if who=='batter' and i==0:
   # High-resolution ready drawing uses the SAME registration as atlas0,
   # avoiding a low-resolution enlargement in the prolonged decision state.
   im.save(OUT/'batter-ready.webp',quality=88,method=6,exact=False)
   runtime_pixels(im).save(OUT/'batter-ready.avif',quality=88,speed=6)
   ready_data={'file':'batter-ready.avif','width':fitted.width,'height':fitted.height,'x':pos[0],'y':pos[1]}
  target=SRC/'poses'/who/(name+'.png');target.parent.mkdir(parents=True,exist_ok=True);im.save(target)
  atlas.alpha_composite(frame,((i%cols)*cell,(i//cols)*cell));frames.append(f)
 atlas.save(OUT/(who+'-atlas.png'))
 atlas.save(OUT/(who+'-atlas.webp'),quality=78,method=6,exact=False)
 runtime_pixels(atlas).save(OUT/(who+'-atlas.avif'),quality=80,speed=6)
 return {'file':who+'-atlas.avif','sourceWidth':cell,'sourceHeight':cell,'columns':cols,'rows':(len(names)+cols-1)//cols,'frames':frames,'anchor':{'x':anchor[0],'y':anchor[1]},'worldFoot':{'x':world_foot[0],'y':world_foot[1]},'worldHeight':cell*world_body/body_height,'event':event,'ready':ready_data,'runtimeBytes':(OUT/(who+'-atlas.avif')).stat().st_size}

b=pack(bnames,bitems,bheads,'batter',768,4,(210,700),450,569,(520,909))
p=pack(pnames,pitems,pheads,'pitcher',640,3,(300,570),340,293,(832,580))
motion={'schema':2,'scope':'authored sample actors; actual roster approval unchanged','authoredBatterPoses':14,'authoredPitcherPoses':5,'not120IndependentDrawings':True,'handedness':{'batter':'right','pitcher':'right','pitcherGlove':'left'},'batter':b,'pitcher':p}
(OUT/'motion.json').write_text(json.dumps(motion,ensure_ascii=False,indent=2)+'\n')

field=Image.open(SRC/'field.png');field.resize((1338,753),Image.Resampling.LANCZOS).save(OUT/'stadium.avif',quality=68,speed=6)
cards=Image.open(SRC/'cards.png');kinds=['place','rally','strike','laser','slug','defend','scout','watch','wall'];(OUT/'cards').mkdir(exist_ok=True)
for i,kind in enumerate(kinds):
 x=i%3;y=i//3;crop=(round(x*cards.width/3)+3,round(y*cards.height/3)+3,round((x+1)*cards.width/3)-3,round((y+1)*cards.height/3)-3)
 cards.crop(crop).resize((320,213),Image.Resampling.LANCZOS).save(OUT/'cards'/(kind+'.webp'),quality=78,method=6)
skins=figures('skins',6,2,3);skin_names=['scoreboard','card','selected','opponent','swing','watch'];(OUT/'skins').mkdir(exist_ok=True)
for item,name in zip(skins,skin_names):
 im=item['im'];bb=im.getchannel('A').point(lambda a:255 if a>160 else 0).getbbox();im=im.crop(bb)
 maxw=840 if name=='scoreboard' else 560 if name in ('card','selected') else 420 if name=='opponent' else 216
 if im.width>maxw:im=im.resize((maxw,round(im.height*maxw/im.width)),Image.Resampling.LANCZOS)
 im.save(OUT/'skins'/(name+'.webp'),quality=82,method=6,exact=False)

manifest={'reference':{'file':'source/reference.png','sha256':sha(SRC/'reference.png'),'notExactLatestChatUpload':True},'generator':'image_gen','date':'2026-10-29','sources':[{'name':name,'file':'source/'+name+'.png','run':f.removesuffix('.png'),'sha256':sha(SRC/(name+'.png'))} for name,f in INPUTS.items()],'processing':'isolate connected sheet figures plus4px AA fringe; crop/register/resize/encode; no limb warp or artificial frames','runtime':[{'file':str(f.relative_to(OUT)),'bytes':f.stat().st_size,'sha256':sha(f)} for f in OUT.rglob('*') if f.is_file() and (f.suffix=='.avif' or f.suffix=='.webp' and f.parent.name in ('cards','skins'))]}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('runtime bytes',sum(x['bytes'] for x in manifest['runtime']))
