#!/usr/bin/env python3
"""G024 pixel/coordinate audit. Does not certify animation biomechanics."""
from pathlib import Path
from PIL import Image
import json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[1]
sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):return json.loads((ROOT/p).read_text())
def cell(im,i,cols,rows):
 w,h=im.size
 return im.crop((round(i%cols*w/cols),round(i//cols*h/rows),round((i%cols+1)*w/cols),round((i//cols+1)*h/rows))).convert('RGBA')
pack=read('assets/pitcher-inbetweens-v1/manifest.json');reg=read('src/duel/battle-vnext/roster-registration.json');base=read('assets/pitcher-inbetweens-v1/base-registration.json');selection=read('assets/pitcher-inbetweens-v1/selection.json')
baseline='3de625703e5bcd43682a9ad54e557df995d00066'
prior=json.loads(subprocess.check_output(['git','show',baseline+':assets/pitcher-inbetweens-v1/manifest.json'],cwd=ROOT));prior_reg=json.loads(subprocess.check_output(['git','show',baseline+':src/duel/battle-vnext/roster-registration.json'],cwd=ROOT));old={c['id']:c for c in prior['characters']}
records=[];preserved=revised=0;cached={}
for c in pack['characters']:
 slug=c['id'];r=reg[slug];im=Image.open(ROOT/c['runtimeFile']).convert('RGBA');orig=Image.open(ROOT/c['originalRuntimeFile']).convert('RGBA');changed=bool(selection['characters'][slug].get('keyReplacements'))
 assert sha((ROOT/c['runtimeFile']).read_bytes())==c['runtimeSHA256']
 for i,d in enumerate(c['drawings']):
  frame=cell(im,i,c['columns'],c['rows']);assert sha(frame.tobytes())==d['pixelSHA256']
  if d['kind']=='original-key':assert frame.tobytes()==cell(orig,d['originalIndex'],3,4).tobytes();preserved+=1
  elif d['kind']=='authored-key-replacement':
   assert sha(cell(orig,d['originalIndex'],3,4).tobytes())==d['previousPixelSHA256'];revised+=1
 record={'id':slug,'runtimeSHA256':c['runtimeSHA256'],'changed':changed}
 if not changed:
  assert c['runtimeSHA256']==old[slug]['runtimeSHA256'];assert r==prior_reg[slug]
 else:
  assert r['releaseFrame']==base[slug]['releaseFrame'] and r['landingFrame']==base[slug]['landingFrame']
  assert r['drawingAtTick'][-1]==0 and len(r['drawingAtTick'])==120
  annotations={}
  for kind in ['release','landing']:
   frame=cell(im,r[kind+'Drawing'],c['columns'],c['rows']);point=r[kind];alpha=frame.getpixel((int(point['x']),int(point['y'])))[3]
   # Sole center may fall between individual cleat studs; allow3px only there.
   radius=3 if kind=='landing' else 0
   nearby=max(frame.getpixel((int(point['x'])+dx,int(point['y'])+dy))[3] for dx in range(-radius,radius+1) for dy in range(-radius,radius+1))
   assert nearby>128,(slug,kind,point,alpha)
   annotations[kind]={'point':point,'alphaAtPoint':alpha,'alphaWithinTolerance':nearby,'pixelTolerance':radius,'sourceTick':r[kind+'Frame']}
  for s in selection['characters'][slug]['keyReplacements']+[s for s in selection['characters'][slug]['selected'] if 'g024' in s.get('sourceSheet','')]:
   file=s['sourceSheet']
   if file not in cached:cached[file]=Image.open(ROOT/file).convert('RGBA')
   raw=cell(cached[file],s['sourceCell'],s['sourceColumns'],s['sourceRows']);bounds=raw.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox();fit=s['batchRegistration'];k=fit['scale'];x,y=fit['translation'];b=[bounds[0]*k+x,bounds[1]*k+y,bounds[2]*k+x,bounds[3]*k+y];assert b[0]>=0 and b[1]>=0 and b[2]<=256 and b[3]<=256,(slug,'clipped',b)
  record.update(annotations=annotations,slot=r['armSlot'],drawings=c['sourceDrawings'],revisedKeys=c['replacedOriginalDrawings'])
 records.append(record)
assert revised==16 and preserved==224 and sum(c['changed'] for c in records)==3
print(json.dumps({'pass':True,'baselineCommit':baseline,'preservedOriginalKeys':preserved,'revisedOriginalKeys':revised,'unchangedRuntimesAndRegistration':17,'inbetweens':pack['totalNewPitcherDrawings'],'characters':records,'limitation':'Pixel/coordinate checks do not establish biomechanics or commercial animation quality.'},indent=2))
