#!/usr/bin/env python3
"""Pack curated authored in-betweens. No generated poses, warps or optical flow.

One scale per source batch; documented whole-drawing sole registration can
correct a generated canvas offset without reshaping limbs. All12 original key
pixels are immutable except explicit G024 key revisions. Event times stay
fixed. Runtime sheets contain each drawing once; the
separate 10x12 export retains the existing 120-tick/60fps authoring contract.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse, hashlib, json, math

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

def compile_all(only_slug=None):
 base=json.loads((OUT/'base-registration.json').read_text());selection=json.loads((OUT/'selection.json').read_text())
 if only_slug is not None:
  if only_slug not in base:raise ValueError('unknown pitcher: '+only_slug)
  saved_manifest=json.loads((OUT/'manifest.json').read_text());saved_live=json.loads((ROOT/'src/duel/battle-vnext/roster-registration.json').read_text())
  if sum(r['id']==only_slug for r in saved_manifest['characters'])!=1 or only_slug not in saved_live:raise ValueError('missing or duplicate existing pitcher: '+only_slug)
 records=[];live={}
 for name in ['runtime','atlases','review']:(OUT/name).mkdir(exist_ok=True)
 for slug,old in base.items():
  if only_slug and slug!=only_slug:continue
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
  replacements={s['originalIndex']:s for s in chosen.get('keyReplacements',[])}
  frames=[];key_indices=[];provenance=[]
  def authored(s):
   batch_file=s.get('sourceSheet',chosen['sourceSheet']);batch=source if batch_file==chosen['sourceSheet'] else Image.open(ROOT/batch_file).convert('RGBA');bc=s.get('sourceColumns',6);br=s.get('sourceRows',4)
   if batch_file not in batches:
    alignment=s.get('registrationAlignment','foot');explicit=s.get('batchRegistration')
    if explicit:bs=explicit['scale'];bx,by=explicit['translation']
    else:bs,bx,by=registration(batch,s['referenceOriginalKey'],bc,br,alignment)
    batches[batch_file]={'scale':bs,'translation':[bx,by],'referenceOriginalKey':s['referenceOriginalKey'],'alignment':alignment}
   fit=batches[batch_file];bs=fit['scale'];bx,by=fit['translation'];raw=cell(batch,s['sourceCell'],bc,br)
   sampling=Image.Resampling.NEAREST if s.get('resampling')=='nearest' else Image.Resampling.BICUBIC
   normalized=raw.transform((256,256),Image.Transform.AFFINE,(1/bs,0,-bx/bs,0,1/bs,-by/bs),sampling)
   before_registration_sha=sha(normalized.tobytes());offset=s.get('drawingAnchorOffset',[0,0])
   if offset!=[0,0]:
    registered=Image.new('RGBA',(256,256));registered.paste(normalized,tuple(offset));normalized=registered
   return normalized,{'sourceSheet':batch_file,'sourceCell':s['sourceCell'],'pixelSHA256':sha(normalized.tobytes()),'beforeAnchorRegistrationPixelSHA256':before_registration_sha,'drawingAnchorOffset':offset,'notes':s['notes']}
  for ordinal,key in enumerate(keys):
   key_indices.append(len(frames))
   if ordinal in replacements:
    normalized,proof=authored(replacements[ordinal]);frames.append(normalized);provenance.append({**proof,'kind':'authored-key-replacement','originalIndex':ordinal,'previousPixelSHA256':sha(key.tobytes())})
   else:frames.append(key);provenance.append({'kind':'original-key','originalIndex':ordinal,'pixelSHA256':sha(key.tobytes())})
   for s in [x for x in selected if x['afterKey']==ordinal]:
    normalized,proof=authored(s);frames.append(normalized);provenance.append({**proof,'kind':'authored-inbetween','afterKey':ordinal})
  cols=5;rows=math.ceil(len(frames)/cols);compact=Image.new('RGBA',(256*cols,256*rows))
  for i,im in enumerate(frames):compact.paste(im,(i%cols*256,i//cols*256))
  runtime=OUT/'runtime'/f'{slug}-pitch-drawings.webp';compact.save(runtime,lossless=True,exact=True,method=6)
  decoded=Image.open(runtime).convert('RGBA')
  for i,key in enumerate(keys):assert sha(cell(decoded,key_indices[i],cols,rows).tobytes())==provenance[key_indices[i]]['pixelSHA256'],slug+' key packing changed'
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
  live[slug]={**old,**chosen.get('registrationOverrides',{}),'file':str(runtime.relative_to(ROOT)),'sourceAtlas':str(atlas.relative_to(ROOT)),'columns':cols,'rows':rows,'keyDrawings':key_indices,'recoveryDrawings':recovery,'releaseDrawing':key_indices[6],'landingDrawing':key_indices[4],'drawingAtTick':timing,'authoredDrawings':len(frames),'newInbetweenDrawings':len(selected),'interpolationManifest':'assets/pitcher-inbetweens-v1/manifest.json'}
  records.append({'id':slug,'runtimeFile':str(runtime.relative_to(ROOT)),'runtimeSHA256':sha(runtime.read_bytes()),'file':str(atlas.relative_to(ROOT)),'atlasSHA256':sha(atlas.read_bytes()),'sourceSheet':chosen['sourceSheet'],'sourceSheetSHA256':sha((ROOT/chosen['sourceSheet']).read_bytes()),'originalRuntimeFile':old['file'],'originalRuntimeSHA256':sha((ROOT/old['file']).read_bytes()),'columns':cols,'rows':rows,'keyDrawings':key_indices,'sourceDrawings':len(frames),'preservedOriginalDrawings':12-len(replacements),'replacedOriginalDrawings':len(replacements),'newInbetweenDrawings':len(selected),'timelineTicks':120,'fps':60,'drawingAtTick':timing,'normalization':{'scale':scale,'translation':[dx,dy]},'batchRegistrations':batches,'drawings':provenance,'runtimeBytes':runtime.stat().st_size})
  print(slug,len(frames),runtime.stat().st_size,flush=True)
 manifest={'version':3,'clientDate':'2026-11-07 KST','authorizationQuote':'모든 투수 확인하고 완성한다음 깃허브 올려줘','previousRelease':{'commit':'3de6257','newDrawings':85},'previousInbetweenReplacements':13,'previousRecoveryDrawings':10,'lowSlotRecoveryDrawings':6,'method':selection['method'],'characters':records,'totalRevisedKeys':sum(x['replacedOriginalDrawings'] for x in records),'totalNewPitcherDrawings':sum(x['newInbetweenDrawings'] for x in records),'totalRuntimeBytes':sum(x['runtimeBytes'] for x in records),'qualityLimit':'Curated additional drawings, not 120 newly authored drawings per character or proof of commercial animation quality. Rejected candidates and earlier HELD histories remain unchanged.'}
 if only_slug:
  # Selective corrections preserve every unrelated record and file. Existing
  # publication metadata describes the roster, not just this one-pose repair.
  previous=json.loads((OUT/'manifest.json').read_text())
  previous['characters']=[records[0] if r['id']==only_slug else r for r in previous['characters']]
  for field,source in [('totalRevisedKeys','replacedOriginalDrawings'),('totalNewPitcherDrawings','newInbetweenDrawings'),('totalRuntimeBytes','runtimeBytes')]:previous[field]=sum(r[source] for r in previous['characters'])
  manifest=previous
  previous_live=json.loads((ROOT/'src/duel/battle-vnext/roster-registration.json').read_text());previous_live[only_slug]=live[only_slug];live=previous_live
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (ROOT/'src/duel/battle-vnext/roster-registration.json').write_text(json.dumps(live,indent=2)+'\n')
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--slug',help='rebuild only one existing pitcher; preserve the rest of the roster')
 compile_all(parser.parse_args().slug)
