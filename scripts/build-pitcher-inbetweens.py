#!/usr/bin/env python3
"""Pack curated authored in-betweens. No generated poses, warps or optical flow.

One scale per source batch; documented whole-drawing sole registration can
correct a generated canvas offset without reshaping limbs. All12 original key
pixels and release/landing events are immutable. Runtime sheets contain each drawing once; the
separate 10x12 export retains the existing 120-tick/60fps authoring contract.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json, math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/pitcher-inbetweens-v1'
def sha(data):return hashlib.sha256(data).hexdigest()
def cell(im,i,cols,rows):
 w,h=im.size
 return im.crop((round(i%cols*w/cols),round(i//cols*h/rows),round((i%cols+1)*w/cols),round((i//cols+1)*h/rows))).convert('RGBA')
def bounds(im):return im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
def foot(im):
 a=im.getchannel('A');b=bounds(im);y=b[3]-1
 xs=[x for x in range(im.width) if any(a.getpixel((x,yy))>128 for yy in range(max(0,y-4),y+1))]
 groups=[]
 for x in xs:
  if not groups or x-groups[-1][-1]>3:groups.append([])
  groups[-1].append(x)
 g=next((g for g in groups if len(g)>2),xs)
 return (g[(len(g)-1)//2]+g[len(g)//2])/2,y

def compile_all():
 base=json.loads((OUT/'base-registration.json').read_text());selection=json.loads((OUT/'selection.json').read_text())
 records=[];live={}
 for name in ['runtime','atlases','review']:(OUT/name).mkdir(exist_ok=True)
 for slug,old in base.items():
  chosen=selection['characters'][slug];source=Image.open(ROOT/chosen['sourceSheet']).convert('RGBA')
  original=Image.open(ROOT/old['file']).convert('RGBA');keys=[cell(original,i,3,4) for i in range(12)]
  def registration(sheet,reference_key,cols,rows,alignment='foot'):
   reference=cell(sheet,0,cols,rows);b=bounds(reference);k=bounds(keys[reference_key]);scale=(k[3]-k[1])/(b[3]-b[1])
   if alignment=='bounds-center':
    # A one-pixel change in the lower sole must not switch the chosen foot and
    # translate a complete batch by the entire stance width. Register both
    # redraw/reference bounds once; never fit individual middle drawings.
    return scale,(k[0]+k[2])/2-(b[0]+b[2])/2*scale,(k[3]-1)-(b[3]-1)*scale
   fx,fy=foot(reference);tx,ty=foot(keys[reference_key]);return scale,tx-fx*scale,ty-fy*scale
  scale,dx,dy=registration(source,0,6,4)
  batches={chosen['sourceSheet']:{'scale':scale,'translation':[dx,dy],'referenceOriginalKey':0}}
  selected=sorted(chosen['selected'],key=lambda x:(x['afterKey'],x['sourceCell']))
  assert selected,slug+' has no accepted drawing'
  assert all(0<=s['afterKey']<=11 and 0<=s['sourceCell']<24 for s in selected)
  frames=[];key_indices=[];provenance=[]
  for ordinal,key in enumerate(keys):
   key_indices.append(len(frames));frames.append(key);provenance.append({'kind':'original-key','originalIndex':ordinal,'pixelSHA256':sha(key.tobytes())})
   for s in [x for x in selected if x['afterKey']==ordinal]:
    batch_file=s.get('sourceSheet',chosen['sourceSheet']);batch=source if batch_file==chosen['sourceSheet'] else Image.open(ROOT/batch_file).convert('RGBA');bc=s.get('sourceColumns',6);br=s.get('sourceRows',4)
    if batch_file not in batches:
     alignment=s.get('registrationAlignment','foot');explicit=s.get('batchRegistration')
     if explicit:bs=explicit['scale'];bx,by=explicit['translation']
     else:bs,bx,by=registration(batch,s['referenceOriginalKey'],bc,br,alignment)
     batches[batch_file]={'scale':bs,'translation':[bx,by],'referenceOriginalKey':s['referenceOriginalKey'],'alignment':alignment}
    fit=batches[batch_file];bs=fit['scale'];bx,by=fit['translation'];raw=cell(batch,s['sourceCell'],bc,br)
    # Shared registration is a canvas operation, never limb/pose invention.
    sampling=Image.Resampling.NEAREST if s.get('resampling')=='nearest' else Image.Resampling.BICUBIC
    normalized=raw.transform((256,256),Image.Transform.AFFINE,(1/bs,0,-bx/bs,0,1/bs,-by/bs),sampling)
    before_registration_sha=sha(normalized.tobytes());offset=s.get('drawingAnchorOffset',[0,0])
    if offset!=[0,0]:
     registered=Image.new('RGBA',(256,256));registered.paste(normalized,tuple(offset));normalized=registered
    frames.append(normalized);provenance.append({'kind':'authored-inbetween','sourceSheet':batch_file,'sourceCell':s['sourceCell'],'afterKey':ordinal,'pixelSHA256':sha(normalized.tobytes()),'beforeAnchorRegistrationPixelSHA256':before_registration_sha,'drawingAnchorOffset':offset,'notes':s['notes']})
  cols=5;rows=math.ceil(len(frames)/cols);compact=Image.new('RGBA',(256*cols,256*rows))
  for i,im in enumerate(frames):compact.paste(im,(i%cols*256,i//cols*256))
  runtime=OUT/'runtime'/f'{slug}-pitch-drawings.webp';compact.save(runtime,lossless=True,exact=True,method=6)
  decoded=Image.open(runtime).convert('RGBA')
  for i,key in enumerate(keys):assert sha(cell(decoded,key_indices[i],cols,rows).tobytes())==sha(key.tobytes()),slug+' original changed'
  recovery=[key_indices[11],*range(key_indices[11]+1,len(frames)),0] if selection.get('returnToReady') else None
  source_lengths=[old['drawingAtTick'].count(i) for i in range(12)]
  if recovery:
   # Spend the existing upright/gather tail on readable recovery drawings.
   # Release/landing and the full120-tick length do not move. Even the source
   # atlas (used by legacy/practice) gives each gather/ready drawing3 ticks.
   tail_budget=source_lengths[10]+source_lengths[11]
   source_lengths[11]=min(tail_budget-3,max(source_lengths[11],len(recovery)*3))
   source_lengths[10]=tail_budget-source_lengths[11]
  timing=[]
  for ordinal in range(12):
   length=source_lengths[ordinal];start=key_indices[ordinal];span=(key_indices[ordinal+1]-start) if ordinal<11 else 1
   timing.extend(recovery[i*len(recovery)//length] if ordinal==11 and recovery else start+i*span//length for i in range(length))
  assert len(timing)==120 and len(set(timing))==len(frames)
  assert timing[old['releaseFrame']]==key_indices[6] and max(timing[:old['releaseFrame']])<key_indices[6]
  export=Image.new('RGBA',(2560,3072))
  for tick,index in enumerate(timing):export.paste(frames[index],(tick%10*256,tick//10*256))
  atlas=OUT/'atlases'/f'{slug}-pitch-120-atlas.webp';export.save(atlas,lossless=True,exact=True,method=6)
  review=Image.new('RGB',(cols*256,rows*276),'#22313a');draw=ImageDraw.Draw(review)
  for i,im in enumerate(frames):review.paste(im,(i%cols*256,i//cols*276),im);draw.text((i%cols*256+4,i//cols*276+256),f'{i} '+('KEY '+str(key_indices.index(i)) if i in key_indices else 'INBETWEEN'),fill='white')
  review.save(OUT/'review'/f'{slug}.jpg',quality=90)
  live[slug]={**old,'file':str(runtime.relative_to(ROOT)),'sourceAtlas':str(atlas.relative_to(ROOT)),'columns':cols,'rows':rows,'keyDrawings':key_indices,'recoveryDrawings':recovery,'releaseDrawing':key_indices[6],'landingDrawing':key_indices[4],'drawingAtTick':timing,'authoredDrawings':len(frames),'newInbetweenDrawings':len(selected),'interpolationManifest':'assets/pitcher-inbetweens-v1/manifest.json'}
  records.append({'id':slug,'runtimeFile':str(runtime.relative_to(ROOT)),'runtimeSHA256':sha(runtime.read_bytes()),'file':str(atlas.relative_to(ROOT)),'atlasSHA256':sha(atlas.read_bytes()),'sourceSheet':chosen['sourceSheet'],'sourceSheetSHA256':sha((ROOT/chosen['sourceSheet']).read_bytes()),'originalRuntimeFile':old['file'],'originalRuntimeSHA256':sha((ROOT/old['file']).read_bytes()),'columns':cols,'rows':rows,'keyDrawings':key_indices,'sourceDrawings':len(frames),'preservedOriginalDrawings':12,'newInbetweenDrawings':len(selected),'timelineTicks':120,'fps':60,'drawingAtTick':timing,'normalization':{'scale':scale,'translation':[dx,dy]},'batchRegistrations':batches,'drawings':provenance,'runtimeBytes':runtime.stat().st_size})
  print(slug,len(frames),runtime.stat().st_size,flush=True)
 manifest={'version':2,'clientDate':'2026-11-07 KST','authorizationQuote':'모든 투수 확인하고 완성한다음 깃허브 올려줘','previousRelease':{'commit':'e4225dd','newDrawings':75},'authoredReplacements':13,'newRecoveryDrawings':10,'method':selection['method'],'characters':records,'totalNewPitcherDrawings':sum(x['newInbetweenDrawings'] for x in records),'totalRuntimeBytes':sum(x['runtimeBytes'] for x in records),'qualityLimit':'Curated additional drawings, not 120 newly authored drawings per character or proof of commercial animation quality. Rejected candidates and earlier HELD histories remain unchanged.'}
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (ROOT/'src/duel/battle-vnext/roster-registration.json').write_text(json.dumps(live,indent=2)+'\n')
if __name__=='__main__':compile_all()
