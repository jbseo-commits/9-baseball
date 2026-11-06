"""Propose boot-only contacts for manual visual review; never animate or fit a pose."""
from pathlib import Path
from collections import deque
import json,numpy as np
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parent
m=json.loads((ROOT/'manifest.json').read_text());rows=[]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
def boot_contact(im,side):
 a=np.array(im.getchannel('A'));mask=a>=128;mask[:420,:]=False
 seen=np.zeros(mask.shape,dtype=bool);components=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  q=deque([(int(x),int(y))]);seen[y,x]=True;pts=[]
  while q:
   xx,yy=q.popleft();pts.append((xx,yy))
   for dx,dy in ((-1,0),(1,0),(0,-1),(0,1)):
    nx,ny=xx+dx,yy+dy
    if 0<=nx<512 and 420<=ny<512 and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
  if len(pts)<80:continue
  xs=np.array([p[0] for p in pts]);ys=np.array([p[1] for p in pts]);bottom=int(ys.max())+1
  if bottom<465:continue
  sole=xs[ys>=bottom-4]
  components.append({'x':float(np.median(sole)),'y':float(bottom),'span':[int(sole.min()),int(sole.max())+1],'boot_bbox':[int(xs.min()),int(ys.min()),int(xs.max())+1,bottom],'pixels':len(pts)})
 if not components:raise ValueError('no visible boot candidates')
 return sorted(components,key=lambda p:p['x'])[0 if side=='left' else -1]

boards=[]
for group in range(4):
 board=Image.new('RGB',(1024,5*130),'#dbe4e6');draw=ImageDraw.Draw(board)
 for row,c in enumerate(m['characters'][group*5:group*5+5]):
  handed=c['throwing_hand'];pivot_side='right' if handed=='left' else 'left';contacts={}
  for col,i in enumerate((0,1,2,4)):
   im=Image.open(ROOT/c['poses'][i]).convert('RGBA');side=('left' if pivot_side=='right' else 'right') if i==4 else pivot_side
   p=boot_contact(im,side);contacts[str(i)]=p
   crop=im.crop((0,380,512,512)).resize((256,66),Image.Resampling.NEAREST);x=col*256;y=row*130+45;board.paste(crop,(x,y),crop)
   px=x+p['x']/2;py=y+(p['y']-380)/2;draw.ellipse((px-4,py-4,px+4,py+4),fill='#cc2634');draw.line((x+p['span'][0]/2,py,x+p['span'][1]/2,py),fill='#cc2634',width=2)
   draw.text((x+4,row*130+25),f"{c['phases'][i]} {p['x']:.0f},{p['y']:.0f}",font=font,fill='#20394a')
  draw.text((4,row*130+7),f"{c['slug']} / {handed.upper()} / pivot {pivot_side}",font=font,fill='#20394a')
  rows.append({'slug':c['slug'],'pivot_foot':c['throwing_hand'],'pivot_screen_side':pivot_side,'preparation_contacts':{k:contacts[k] for k in ('0','1','2')},'anchor':{'x':contacts['0']['x'],'y':contacts['0']['y']},'landing_point':{'x':contacts['4']['x'],'y':contacts['4']['y']},'method':'boot-component candidate, red markers require actual human visual review; never median both feet','manually_reviewed':False})
 board.save(ROOT/'previews'/f'boot-contact-review-{group+1}.png')
(ROOT/'grounding-annotation-proposals.json').write_text(json.dumps({'revision':'grounding-R2','manual_review_complete':False,'characters':rows},ensure_ascii=False,indent=2)+'\n')
print('Proposed20 boot registrations; four review boards written. No sprite changed.')
