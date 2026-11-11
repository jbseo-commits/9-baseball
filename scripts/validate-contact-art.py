#!/usr/bin/env python3
"""Offline contact-art gate. No pose fitting, generation or game-file writes.

World-layout measurements are skipped unless every pose retains both approved
foot patches. A geometric pass still requires independent anatomy/style/motion
review and does not approve a physical plane or production integration.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('contact_metric', REPO/'scripts/build-contact-plane-contract.py')
metric = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metric)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def source_over(image, color):
    result = Image.new('RGBA', image.size, (*color,255))
    result.alpha_composite(image.convert('RGBA'))
    return result.convert('RGB')


def foot_registration(image, reference, patches, min_iou=.75, max_drift=4):
    """Compare without body fitting; reference uses the one whole-cell ratio."""
    n = image.width
    scaled_reference = reference.resize((n,n), Image.Resampling.LANCZOS)
    a, b = image.getchannel('A'), scaled_reference.getchannel('A')
    result = {}
    for name, box in patches.items():
        crop = tuple(round(v*n/724) for v in box)
        left = a.crop(crop).point(lambda v: 255 if v>=128 else 0)
        right = b.crop(crop).point(lambda v: 255 if v>=128 else 0)
        ma, mb = left.tobytes(),right.tobytes()
        union = sum(bool(x or y) for x,y in zip(ma,mb))
        intersection = sum(bool(x and y) for x,y in zip(ma,mb))
        bounds_a,bounds_b = left.getbbox(),right.getbbox()
        differences = [abs(x-y)*724/n for x,y in zip(bounds_a,bounds_b)] if bounds_a and bounds_b else None
        # The rear heel is raised and may rotate while its toe/sole stays put.
        # The planted front shoe retains heel-left as well as toe-right/sole.
        anchors = (2,3) if name=='rear' else (0,2,3)
        drift = max(differences[i] for i in anchors) if differences else None
        iou = intersection/union if union else 0
        result[name] = {'iou':iou,'boundaryDriftIn724CellPixels':drift,
                        'allBoundsDriftIn724CellPixels':max(differences) if differences else None,
                        'anchorEdges':['toeRight','soleBottom'] if name=='rear' else ['heelLeft','toeRight','soleBottom'],
                        'candidatePatchBounds':bounds_a,'referencePatchBounds':bounds_b,
                        'pass':iou>=min_iou and drift is not None and drift<=max_drift}
    return {'patches':result,'pass':all(p['pass'] for p in result.values())}


def alpha_evidence(image):
    """Low-alpha RGB is not a visible halo verdict. Preserve the source bytes."""
    rgba=image.get_flattened_data() if hasattr(image,'get_flattened_data') else image.getdata()
    bright=[p for p in rgba if (p[0]>=240 and p[1]<=30 and p[2]<=30)
            or (p[0]>=240 and p[1]>=240 and p[2]<=30)]
    alpha_min,alpha_max=image.getchannel('A').getextrema()
    return {'alphaMin':alpha_min,'alphaMax':alpha_max,
            'nearPureRedOrYellow':len(bright),
            'nearPureRedOrYellowAlphaAtMost2':sum(p[3]<=2 for p in bright),
            'nearPureRedOrYellowAlphaAtLeast128':sum(p[3]>=128 for p in bright),
            'interpretation':'Inspect normal source-over composites. Raw RGB at alpha1–2 is not opaque fringe.'}


def analyze(sheet, reference, contract, criteria, annotations=None):
    if sheet.width!=sheet.height*3:
        raise ValueError('Expected exactly three equal square cells in a3:1 sheet')
    n=sheet.height
    if reference.width!=reference.height:
        raise ValueError('Approved reference must be a square atlas cell')
    frames=[sheet.crop((i*n,0,(i+1)*n,n)) for i in range(3)]
    gate=criteria['registrationGate']
    rows=[{'frame':i,'registration':foot_registration(frame,reference,criteria['footPatchesNative'],
              gate['footPatchAlpha128IoUMin'],gate['toeSoleBoundaryMaxDriftNativePx']),
           'alpha':alpha_evidence(frame)} for i,frame in enumerate(frames)]
    registration=all(r['registration']['pass'] for r in rows)
    structural=all(r['alpha']['alphaMin']<=2 and r['alpha']['alphaMax']==255 for r in rows)
    report={'schema':1,'status':'REGISTRATION_FAILED' if not registration else 'NEEDS_BARREL_ANNOTATION',
            'registrationPass':registration,'transparentSourcePass':structural,
            'contactStatus':'NOT_EVALUATED','rows':rows,'runtimeApproved':False,
            'manualReview':'Anatomy, identity, full bat dimensions, style, transitions and scene quality require independent review.',
            'limits':'The proposed plane is not approved. One cell ratio or numeric pass does not prove3D contact or commercial quality.'}
    if not structural:
        report['status']='TRANSPARENCY_FAILED'
        return report,frames
    # Batch fails closed: do not turn even the other rows into accepted world
    # contacts while one actor's registration is wrong.
    if not registration or annotations is None:
        return report,frames
    if len(annotations)!=3:
        raise ValueError('Exactly three independently reviewed barrel annotations required')
    origin=contract['registration']['originWorld']
    world_scale=contract['registration']['scale']*reference.height/n
    radius=contract['ballProposal']['radiusAtPlaneWorldPx']
    all_hits=True
    for row,frame,annotation in zip(rows,frames,annotations):
        box=tuple(round(v*n/724) for v in annotation['barrelRoiIn724Cell'])
        if not (0<=box[0]<box[2]<=n and 0<=box[1]<box[3]<=n):
            raise ValueError('Barrel ROI must be inside its original cell')
        a=frame.getchannel('A');tests=[]
        for threshold in (16,128,240):
            pixels=[(x,y) for y in range(box[1],box[3]) for x in range(box[0],box[2]) if a.getpixel((x,y))>=threshold]
            if not pixels: raise ValueError('Empty annotated barrel mask')
            for target in contract['targets'][row['frame']*3:row['frame']*3+3]:
                distance=metric.distance_to_pixels(target['world'],pixels,origin,world_scale)
                tests.append({'zone':target['zone'],'alphaThreshold':threshold,
                              'distanceWorldLayoutPixels':distance,'diskOverlaps':distance<=radius})
        row['conditionalContact']=tests
        primary=[t for t in tests if t['alphaThreshold']==128]
        all_hits=all_hits and all(t['diskOverlaps'] for t in primary)
    report.update(status='GEOMETRY_REVIEW_READY' if all_hits else 'CONTACT_FAILED',
                  contactStatus='NOMINAL_GEOMETRY_PASS' if all_hits else 'FAIL')
    return report,frames


def validate_output(out):
    path=out.resolve()
    if path.is_relative_to(REPO) and not path.is_relative_to((REPO/'docs/qa').resolve()):
        raise ValueError('Repository output is allowed only below docs/qa')


def run(args):
    validate_output(args.out)
    criteria=json.loads(args.criteria.read_text());contract=json.loads(args.contract.read_text())
    ref_bytes=args.reference.read_bytes()
    expected=criteria.get('approvedFramePngSha256')
    if not expected or sha(ref_bytes)!=expected:
        raise ValueError('Approved reference SHA256 mismatch; review the source before remeasuring')
    sheet=Image.open(args.sheet).convert('RGBA');reference=Image.open(args.reference).convert('RGBA')
    annotations=json.loads(args.barrels.read_text()) if args.barrels else None
    report,frames=analyze(sheet,reference,contract,criteria,annotations)
    sources=[('sheet',args.sheet),('reference',args.reference),('criteria',args.criteria),('contract',args.contract)]
    if args.barrels:
        sources.append(('barrels',args.barrels))
        report['reviewedBarrelAnnotations']=annotations
    report['sources']={k:{'path':str(v),'sha256':sha(v.read_bytes())} for k,v in sources}
    report['mapping']={'oneWholeCellRatio':sheet.height/reference.height,
                       'worldPerSourcePixel':contract['registration']['scale']*reference.height/sheet.height,
                       'noIndependentPoseFit':True}
    args.out.mkdir(parents=True,exist_ok=True)
    for name,color in [('dark',(12,21,32)),('light',(244,244,240))]:
        source_over(sheet,color).save(args.out/f'source-over-{name}.png')
    diagnostic=source_over(sheet,(244,244,240));draw=ImageDraw.Draw(diagnostic)
    n=sheet.height;origin=contract['registration']['originWorld'];k=contract['registration']['scale']*reference.height/n
    for i in range(3):
        for t in contract['targets'][i*3:i*3+3]:
            x=(t['world'][0]-origin[0])/k+i*n;y=(t['world'][1]-origin[1])/k
            draw.ellipse((x-5,y-5,x+5,y+5),outline=(0,100,145),width=2)
    diagnostic.save(args.out/'unchanged-art-with-targets.png')
    (args.out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'contactStatus':report['contactStatus'],
                      'registrationPass':report['registrationPass'],'runtimeApproved':False,'out':str(args.out)}))
    return 0 if report['status']=='GEOMETRY_REVIEW_READY' else 2


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sheet',type=Path,required=True)
    parser.add_argument('--reference',type=Path,default=REPO/'docs/qa/contact-plane-contract-20261111/contact-frame-8.png')
    parser.add_argument('--contract',type=Path,default=REPO/'docs/qa/contact-plane-contract-20261111/contract.json')
    parser.add_argument('--criteria',type=Path,required=True)
    parser.add_argument('--barrels',type=Path)
    parser.add_argument('--out',type=Path,required=True)
    raise SystemExit(run(parser.parse_args()))
