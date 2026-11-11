#!/usr/bin/env python3
"""Read-only source normalizer and frozen foot-registration report.

It never edits the input. It uniformly normalizes the square source to 1024².
It creates a 1024x768 normalized cell only if every alpha value in rows 768–1023
is zero. Foot metrics use the frozen 724-cell patches mapped once to 768 px and
the approved 768-cell reference padded on the right (never resized).
"""
import argparse, hashlib, json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

CANON=724
CELL=768
EXPECTED=1024
PATCHES={'rear':[130,625,235,665], 'front':[400,632,550,651]}
THRESHOLDS=(16,128,240)
T9=(1044.0,610.78125)
ORIGIN=(-128.125,-133.75)
SCALE=1.5625
BALL_RADIUS_WORLD=8.0

def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1<<20),b''):h.update(b)
    return h.hexdigest()

def mapped_patch(box):
    # Frozen canonical-to-768 single whole-canvas scale; conservative half-open edges.
    k=CELL/CANON
    x0,y0,x1,y1=box
    return [math.floor(x0*k),math.floor(y0*k),math.ceil(x1*k),math.ceil(y1*k)]

def bounds(mask):
    ys,xs=np.where(mask)
    if len(xs)==0:return None
    return [int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]

def edge_drift(cb,rb,name):
    if cb is None or rb is None:return None
    vals={}
    if name=='rear':
        vals={'toeRight':abs(cb[2]-rb[2]),'soleBottom':abs(cb[3]-rb[3])}
    else:
        vals={'heelLeft':abs(cb[0]-rb[0]),'toeRight':abs(cb[2]-rb[2]),'soleBottom':abs(cb[3]-rb[3])}
    return {'anchoredEdgesPx':vals,'maxAnchoredDriftPx':max(vals.values())}

def foot_report(cand,ref):
    out={}
    for name,box in PATCHES.items():
        x0,y0,x1,y1=mapped_patch(box)
        row={'patchCanonical724':box,'patch768': [x0,y0,x1,y1], 'thresholds':{}}
        for th in THRESHOLDS:
            cm=cand[y0:y1,x0:x1,3]>=th
            rm=ref[y0:y1,x0:x1,3]>=th
            inter=int(np.count_nonzero(cm&rm)); union=int(np.count_nonzero(cm|rm))
            iou=inter/union if union else 0.0
            cb=bounds(cm); rb=bounds(rm)
            drift=edge_drift(cb,rb,name)
            passed=(iou>=0.75 and drift is not None and drift['maxAnchoredDriftPx']<=4*(CELL/CANON)) if th==128 else None
            row['thresholds'][str(th)]={'iou':round(iou,6),'candidateBoundsInPatchPx':cb,'referenceBoundsInPatchPx':rb,'anchoredBoundaryDrift':drift,'gatePassAt128':passed}
        row['passAlpha128']=row['thresholds']['128']['gatePassAt128']
        out[name]=row
    return {'patches':out,'registrationGatePass':all(v['passAlpha128'] for v in out.values())}

def composite(rgb, bg):
    layer=Image.new('RGBA',rgb.size,bg+(255,)); layer.alpha_composite(rgb); return layer.convert('RGB')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('source',type=Path)
    ap.add_argument('--reference',type=Path,default=Path('/workspace/9zone-juice100-implementation/docs/qa/contact-plane-contract-20261111/contact-frame-8.png'))
    ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--barrel-roi',nargs=4,type=int,metavar=('X0','Y0','X1','Y1'),help='manually reviewed semantic barrel ROI in normalized 1024 coordinates')
    args=ap.parse_args(); args.out_dir.mkdir(parents=True,exist_ok=True)
    src=Image.open(args.source).convert('RGBA')
    if src.width!=src.height: raise SystemExit(f'REJECT: source is not square: {src.size}')
    normalized=src.resize((EXPECTED,EXPECTED),Image.Resampling.LANCZOS)
    arr=np.asarray(normalized)
    alpha=arr[:,:,3]
    lower=alpha[CELL:,:]
    lower_count=int(np.count_nonzero(lower)); lower_bbox=None
    if lower_count:
        ys,xs=np.where(lower!=0); lower_bbox=[int(xs.min()),int(ys.min()+CELL),int(xs.max()+1),int(ys.max()+CELL+1)]
    normalized_path=args.out_dir/'outside-call3-contact-1024.png'
    normalized.save(normalized_path)
    # A component cleanup is allowed only for complete 8-connected alpha>0 components
    # that cross/touch the forbidden lower rows and satisfy the user's narrow detached-noise bounds.
    labels,nlabels=label(alpha>0,np.ones((3,3),dtype=np.uint8))
    counts=np.bincount(labels.ravel())
    largest=int(np.argmax(counts[1:])+1) if nlabels else 0
    lower_components=[]; clean_labels=[]
    for cid in range(1,nlabels+1):
        ys,xs=np.where(labels==cid)
        if not np.any(ys>=CELL): continue
        comp_alpha=alpha[ys,xs]; bbox=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
        row={'id':cid,'pixels':int(len(xs)),'bboxXYXY':bbox,'bboxWH':[bbox[2]-bbox[0],bbox[3]-bbox[1]],'maxAlpha':int(comp_alpha.max()),'intersectsSubjectMainComponent':cid==largest}
        row['eligible']=bool(cid!=largest and len(xs)<=128 and bbox[2]-bbox[0]<=16 and bbox[3]-bbox[1]<=16 and int(comp_alpha.max())<=1)
        lower_components.append(row)
        if row['eligible']:clean_labels.append(cid)
    cleanup_ok=(lower_count==0 or (len(lower_components)>0 and all(r['eligible'] for r in lower_components)))
    clean_arr=arr.copy()
    if cleanup_ok and clean_labels:
        clean_mask=np.isin(labels,clean_labels)
        clean_arr[clean_mask]=0
    clean_lower_count=int(np.count_nonzero(clean_arr[CELL:,:,3]))
    clean_norm=Image.fromarray(clean_arr,'RGBA')
    cleaned_path=args.out_dir/'outside-call3-contact-cleaned-1024.png' if cleanup_ok else None
    crop_path=args.out_dir/'outside-call3-contact-1024x768.png' if cleanup_ok and clean_lower_count==0 else None
    if cleaned_path: clean_norm.save(cleaned_path)
    if crop_path: clean_norm.crop((0,0,EXPECTED,CELL)).save(crop_path)
    changed=np.any(clean_arr!=arr,axis=2)
    # Integrity proof: every pixel outside the authorized component union is unchanged.
    changed_pixels=int(np.count_nonzero(changed))
    subject_before=hashlib.sha256(arr[labels==largest].tobytes()).hexdigest() if largest else None
    subject_after=hashlib.sha256(clean_arr[labels==largest].tobytes()).hexdigest() if largest else None
    refim=Image.open(args.reference).convert('RGBA')
    if refim.size!=(CELL,CELL): raise SystemExit(f'REJECT: approved reference is not 768x768: {refim.size}')
    ref=np.zeros((CELL,CELL,4),dtype=np.uint8); ref[:,:,:]=np.asarray(refim)
    # No crop of the candidate is performed when bottom alpha exists. Metrics are
    # diagnostic only, read from its top 768 rows using the fixed common mapping.
    foot=foot_report(clean_arr[:CELL,:,:],ref)
    target_cell=((T9[0]-ORIGIN[0])/SCALE,(T9[1]-ORIGIN[1])/SCALE)
    alpha=clean_arr[:,:,3]
    whole_actor={}; barrel={}; roi_mask=None
    for th in THRESHOLDS:
        mask=alpha>=th
        ys,xs=np.where(mask)
        if len(xs):
            dx=np.maximum(np.abs(target_cell[0]-xs)-.5,0); dy=np.maximum(np.abs(target_cell[1]-ys)-.5,0); ds=np.hypot(dx,dy); j=int(np.argmin(ds))
            whole_actor[str(th)]={'distanceWorldPx':round(float(ds[j]*SCALE),6),'nearestSourcePixelCenter':[int(xs[j]),int(ys[j])],'diskRadius8Overlaps':bool(ds[j]*SCALE<=BALL_RADIUS_WORLD)}
        else: whole_actor[str(th)]={'distanceWorldPx':None,'nearestSourcePixelCenter':None,'diskRadius8Overlaps':False}
    if args.barrel_roi:
        x0,y0,x1,y1=args.barrel_roi
        if not (0<=x0<x1<=EXPECTED and 0<=y0<y1<=CELL): raise SystemExit('REJECT: barrel ROI must be within normalized top 768 rows')
        roi_mask=np.zeros((EXPECTED,EXPECTED),dtype=bool); roi_mask[y0:y1,x0:x1]=True
        for th in THRESHOLDS:
            mask=(alpha>=th)&roi_mask; ys,xs=np.where(mask)
            if len(xs):
                dx=np.maximum(np.abs(target_cell[0]-xs)-.5,0); dy=np.maximum(np.abs(target_cell[1]-ys)-.5,0); ds=np.hypot(dx,dy); j=int(np.argmin(ds))
                barrel[str(th)]={'distanceWorldPx':round(float(ds[j]*SCALE),6),'nearestSourcePixelCenter':[int(xs[j]),int(ys[j])],'nearestWorldPixelCenter':[round(ORIGIN[0]+(xs[j]+.5)*SCALE,6),round(ORIGIN[1]+(ys[j]+.5)*SCALE,6)],'diskRadius8Overlaps':bool(ds[j]*SCALE<=BALL_RADIUS_WORLD),'pixelsInMask':int(len(xs))}
            else: barrel[str(th)]={'distanceWorldPx':None,'nearestSourcePixelCenter':None,'diskRadius8Overlaps':False,'pixelsInMask':0}
    report={'status':('BOTTOM_ALPHA_COMPONENT_REJECT' if not cleanup_ok else ('STRICT_CROP_AND_FOOT_PASS' if foot['registrationGatePass'] else 'FOOT_GATE_FAIL')),
      'cleanup':{'initial32PixelHeuristic':'FAIL' if any(r['pixels']>32 for r in lower_components) else 'PASS','authorisedNarrowCriterion':'each entire alpha>0 8-connected component crossing row768 is detached from the largest subject component, <=128 total pixels, bbox <=16x16, alpha max<=1; otherwise reject','bottomTouchingComponentCount':len(lower_components),'qualifyingComponentCount':sum(bool(r['eligible']) for r in lower_components),'allQualify':cleanup_ok,'removedComponents':clean_labels if cleanup_ok else [],'removedWholeComponentPixelCount':changed_pixels,'sourceNormalizedRGBAUnchanged':True,'largestSubjectRGBAsha256Before':subject_before,'largestSubjectRGBAsha256After':subject_after,'allChangedPixelsWithinApprovedComponentUnion':bool(not np.any(changed & ~np.isin(labels,clean_labels))) if cleanup_ok else False,'components':lower_components},
      'source':{'path':str(args.source),'sha256':sha(args.source),'inputSize':list(src.size),'normalizedSize':list(normalized.size),'normalizedPng':str(normalized_path),'normalizedPngSha256':sha(normalized_path)},
      'reference':{'path':str(args.reference),'sha256':sha(args.reference),'size':list(refim.size),'padding':'right-only to common 1024x768; original 768x768 pixels unchanged'},
      'T9FixedMapping':{'world':list(T9),'worldPerSourcePixel':SCALE,'originWorld':list(ORIGIN),'cellCoordinates':list(target_cell),'ballRadiusWorldPx':BALL_RADIUS_WORLD,'ballRadiusSourcePx':BALL_RADIUS_WORLD/SCALE,'wholeActorDistanceLowerBound':whole_actor,'manuallyAnnotatedBarrelROI':list(args.barrel_roi) if args.barrel_roi else None,'barrelDistances':barrel},
      'normalization':{'filter':'Pillow LANCZOS uniform square resize to 1024x1024','bottomRowsStart':CELL,'rawAlphaPixelsAtOrBelowRow768':lower_count,'rawLowerAlphaMax':int(lower.max()) if lower.size else 0,'rawLowerAlphaBBoxXYXY':lower_bbox,'cleanedLowerAlphaPixels':clean_lower_count,'cropAllowed':bool(crop_path),'cleaned1024Path':str(cleaned_path) if cleaned_path else None,'croppedPath':str(crop_path) if crop_path else None},
      'frozenFootCriteria':{'canonicalCell':CANON,'comparisonCell':CELL,'scale':CELL/CANON,'alphaGate':128,'iouMin':0.75,'anchoredToeSoleBoundaryMaxCanonicalPx':4,'maxMappedBoundaryPx':4*CELL/CANON,'rearAnchorEdges':['toeRight','soleBottom'],'frontAnchorEdges':['heelLeft','toeRight','soleBottom'],'rearHeelPivotUnconstrained':True,'results':foot},
      'limits':'Source registration diagnostic only. Does not approve identity, hands/grip, bat dimensions, barrel contact, transition, plane, runtime, or commercial quality.'}
    report_path=args.out_dir/'outside-call3-source-validation.json'; report_path.write_text(json.dumps(report,indent=2)+'\n')
    # Proper source-over composites for visual review; these do not alter source pixels.
    comp=Image.new('RGB',(2*EXPECTED,EXPECTED),(255,255,255))
    comp.paste(composite(normalized,(244,244,244)),(0,0)); comp.paste(composite(normalized,(20,27,38)),(EXPECTED,0))
    draw=ImageDraw.Draw(comp); draw.text((12,12),'LIGHT source-over',(20,20,20)); draw.text((EXPECTED+12,12),'DARK source-over',(255,255,255))
    comp.save(args.out_dir/'outside-call3-light-dark.png')
    guide=clean_norm.copy(); gd=ImageDraw.Draw(guide); tx,ty=target_cell; rr=BALL_RADIUS_WORLD/SCALE
    gd.ellipse((tx-rr,ty-rr,tx+rr,ty+rr),outline=(255,20,60,255),width=2); gd.line((tx-12,ty,tx+12,ty),fill=(255,20,60,255),width=2); gd.line((tx,ty-12,tx,ty+12),fill=(255,20,60,255),width=2); gd.text((tx+9,ty-16),'T9',(255,20,60,255))
    if args.barrel_roi: gd.rectangle(tuple(args.barrel_roi),outline=(40,220,255,255),width=2); gd.text((args.barrel_roi[0],args.barrel_roi[1]-14),'manual barrel ROI',(40,220,255,255))
    guide.save(args.out_dir/'outside-call3-registration-guide.png')
    print(json.dumps({'status':report['status'],'rawBottomAlphaCount':lower_count,'bottomTouchingComponents':len(lower_components),'qualifyingComponents':sum(bool(r['eligible']) for r in lower_components),'cleanedBottomAlphaCount':clean_lower_count,'foot':foot,'T9':report['T9FixedMapping']},indent=2))
if __name__=='__main__':main()
