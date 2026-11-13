#!/usr/bin/env python3
"""Build and verify a source-only, lossless external 4x4 atlas."""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image

OUT=Path(__file__).resolve().parent
OLD=Path('/workspace/9zone-swing-continuity-20261111/runtime-candidate/batter-courses.webp')
NEW=Path('/workspace/9zone-roulette-connection-20261111/outside-audit/call2/outside-call2-contact-1024x768.png')
C2REPORT=Path('/workspace/9zone-roulette-connection-20261111/outside-audit/call2/outside-call2-source-validation.json')
ROIJSON=Path('/workspace/9zone-contact-sequence-20261111/corrected-barrels.json')
PREVAUDIT=Path('/workspace/9zone-roulette-connection-20261111/outside-audit/T9-registration-audit.json')
ATLAS=OUT/'batter-course-4x4.webp'


def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(p.read_bytes())
def cell_hash(arr): return sha_bytes(np.ascontiguousarray(arr).tobytes())
def bbox_mask(mask):
    ys,xs=np.where(mask)
    return None if not len(xs) else [int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]

old_im=Image.open(OLD).convert('RGBA')
assert old_im.size==(3072,2304),old_im.size
old=np.asarray(old_im)
new_im=Image.open(NEW).convert('RGBA')
assert new_im.size==(1024,768),new_im.size
new=np.asarray(new_im)
old_cells={}
canvas=Image.new('RGBA',(4096,3072),(0,0,0,0))
for f in range(10):
    x=(f%4)*768;y=(f//4)*768
    src=old[y:y+768,x:x+768,:].copy()
    old_cells[f]=src
    slot=Image.new('RGBA',(1024,768),(0,0,0,0));slot.paste(Image.fromarray(src),(0,0))
    canvas.paste(slot,(f%4*1024,f//4*768))
# New outside contact is already the normalized, noise-cleaned 1024x768 source.
canvas.paste(new_im,(2*1024,2*768)) # frame 10 = row2, col2; preserve hidden RGBA exactly
canvas.save(ATLAS,format='WEBP',lossless=True,quality=100,method=6,exact=True)

# Decode the actual lossless WebP and verify cell pixels, padding, empty slots, and source masks.
out_im=Image.open(ATLAS).convert('RGBA')
assert out_im.size==(4096,3072),out_im.size
out=np.asarray(out_im)
checks=[]
for f in range(10):
    x=(f%4)*1024;y=(f//4)*768
    got=out[y:y+768,x:x+768,:]
    if not np.array_equal(got,old_cells[f]): raise SystemExit(f'old cell {f} changed')
    pad=out[y:y+768,x+768:x+1024,:]
    if np.any(pad): raise SystemExit(f'old cell {f} right pad is not transparent')
    checks.append({'frame':f,'sourceRGBAsha256':cell_hash(old_cells[f]),'decodedAtlasRGBAsha256':cell_hash(got),'pixelExact':True,'rightPaddingTransparent':True})
frame10=out[2*768:3*768,2*1024:3*1024,:].copy()
if not np.array_equal(frame10,new): raise SystemExit('frame 10 contact differs from normalized source')
checks.append({'frame':10,'sourceRGBAsha256':cell_hash(new),'decodedAtlasRGBAsha256':cell_hash(frame10),'pixelExact':True,'sourceValidationSha256':sha_file(C2REPORT)})
empty=[]
for f in range(11,16):
    x=(f%4)*1024;y=(f//4)*768
    a=out[y:y+768,x:x+1024,:]
    if np.any(a): raise SystemExit(f'empty frame {f} contains pixels')
    empty.append(f)

# Contact frame ROI provenance, alpha masks and semantic barrel mask hashes.
roi_docs=json.loads(ROIJSON.read_text())
old_roi_audit=json.loads(PREVAUDIT.read_text())
call2=json.loads(C2REPORT.read_text())
T9=[1044.0,610.78125]; origin=[-128.125,-133.75]; scale=1.5625
contact_frames=[]
for idx,f in enumerate((1,4,7)):
    cell=old_cells[f]
    roi=roi_docs[idx]['barrelRoiIn724Cell']
    k=768/724
    x0,y0,x1,y1=roi
    box=[int(np.floor(x0*k)),int(np.floor(y0*k)),int(np.ceil(x1*k)),int(np.ceil(y1*k))]
    pxa=np.asarray(cell)
    masks={}
    for th in (16,128,240):
        alpha_mask=pxa[:,:,3]>=th
        semantic=alpha_mask.copy();semantic[:box[1],:]=False;semantic[box[3]:,:]=False;semantic[:,:box[0]]=False;semantic[:,box[2]:]=False
        masks[str(th)]={'alphaMaskSha256':cell_hash(alpha_mask.astype(np.uint8)),'alphaPixelCount':int(alpha_mask.sum()),'semanticBarrelMaskSha256':cell_hash(semantic.astype(np.uint8)),'semanticMaskPixelCount':int(semantic.sum())}
    prev=next(r for r in old_roi_audit['prior_candidate_frames'] if r['frame']==f)
    targetdata=prev['barrel_target_distances']
    contact_frames.append({'frame':f,'cellSize':[768,768],'cellRGBAsha256':cell_hash(cell),'fixedROI':{'source':'/workspace/9zone-contact-sequence-20261111/corrected-barrels.json','sourceSha256':sha_file(ROIJSON),'canonical724CellROI':roi,'mapped768CellROI':box,'scaleOnlyWholeCell':True,'excludesBodyAndHandsByAuthorAnnotation':True},'masks':masks,'targetChecks':targetdata})
# Frame10 manual call2 barrel provenance.
box=call2['T9FixedMapping']['manuallyAnnotatedBarrelROI']
masks={}
for th in (16,128,240):
    alpha_mask=frame10[:,:,3]>=th
    semantic=alpha_mask.copy();semantic[:box[1],:]=False;semantic[box[3]:,:]=False;semantic[:,:box[0]]=False;semantic[:,box[2]:]=False
    masks[str(th)]={'alphaMaskSha256':cell_hash(alpha_mask.astype(np.uint8)),'alphaPixelCount':int(alpha_mask.sum()),'semanticBarrelMaskSha256':cell_hash(semantic.astype(np.uint8)),'semanticMaskPixelCount':int(semantic.sum())}
contact_frames.append({'frame':10,'cellSize':[1024,768],'cellRGBAsha256':cell_hash(frame10),'fixedROI':{'source':'/workspace/9zone-roulette-connection-20261111/outside-audit/call2/outside-call2-source-validation.json','sourceSha256':sha_file(C2REPORT),'normalizedCellROI':box,'manualSemanticAnnotation':'black barrel plus warm rim; wood handle and both hands excluded'},'masks':masks,'targetChecks':{'T9':call2['T9FixedMapping']['barrelDistances']}})
registry={'status':'EXTERNAL_SOURCE_ATLAS_STATIC_VALIDATION_PASS','atlas':{'path':str(ATLAS),'sha256':sha_file(ATLAS),'decodedRGBAsha256':cell_hash(out),'decodedSize':[4096,3072],'format':'lossless WebP, exact RGBA requested/verified'},'oldSource':{'path':str(OLD),'sha256':sha_file(OLD),'decodedSize':list(old_im.size),'oldFrames0to9PixelExact':True},'newSource':{'path':str(NEW),'sha256':sha_file(NEW),'call2Request':'/workspace/9zone-roulette-connection-20261111/outside-audit/call2/outside-call2-contact-request.json','call2RequestSha256':sha_file(Path('/workspace/9zone-roulette-connection-20261111/outside-audit/call2/outside-call2-contact-request.json')),'sourceValidationSha256':sha_file(C2REPORT),'copiedAs1024x768PixelExact':True},'layout':{'cell':[1024,768],'columns':4,'rows':4,'frame0to9':'original 768×768 source pixels at cell top-left, padded 256 transparent pixels on the right; no resize','frame10':'call2 normalized 1024×768 source at cell top-left','emptyFrames':empty,'targetWorld':T9,'originWorld':origin,'worldPerSourcePixel':scale},'decodedPixelChecks':checks,'contactFrames':contact_frames,'limits':'External static atlas and source binding only; no runtime import, gameplay/physical-plane approval, motion pass, deployment, or commercial quality approval.'}
(OUT/'contact-frame-registry.json').write_text(json.dumps(registry,indent=2)+'\n')
(OUT/'final-atlas-validation.json').write_text(json.dumps({'status':registry['status'],'atlasSha256':registry['atlas']['sha256'],'decodedRGBAsha256':registry['atlas']['decodedRGBAsha256'],'decodedSize':registry['atlas']['decodedSize'],'oldFramesPixelExact':len(checks[:10])==10 and all(c['pixelExact'] for c in checks[:10]),'newFrame10PixelExact':checks[10]['pixelExact'],'emptyFramesVerified':empty,'contactFrameHashesAndROIs':'contact-frame-registry.json'},indent=2)+'\n')
print(json.dumps({'status':registry['status'],'atlas':registry['atlas'],'oldChecks':len(checks[:10]),'newFrame10':checks[10],'emptyFrames':empty},indent=2))
