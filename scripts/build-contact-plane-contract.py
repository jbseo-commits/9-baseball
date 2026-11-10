#!/usr/bin/env python3
"""Offline authoring diagnostic, never a production collider or a pose generator.

Reads the registered atlas cell, isolates existing bat alpha using disclosed manual
ROIs, and measures proposed crossing disks against complete occupied pixel squares.
No actor deformation, re-fitting, outcome calculation, engine state or RNG access.
"""
import argparse
import base64
import hashlib
import io
import json
import math
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
ART = REPO / 'assets/production-art/mockup-rebuild'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(image):
    stream = io.BytesIO()
    image.save(stream, format='PNG')
    return stream.getvalue()


def distance_to_pixels(point, pixels, origin, scale):
    """Exact minimum distance to the union of closed scaled pixel squares."""
    if not pixels:
        raise ValueError('Empty mask')
    best = math.inf
    for x, y in pixels:
        left, top = origin[0] + x * scale, origin[1] + y * scale
        dx = max(left - point[0], 0, point[0] - left - scale)
        dy = max(top - point[1], 0, point[1] - top - scale)
        best = min(best, math.hypot(dx, dy))
    return best


def build(out):
    output = out.resolve()
    if output.is_relative_to(REPO) and not output.is_relative_to((REPO/'docs/qa').resolve()):
        raise ValueError('Repository output is allowed only under docs/qa; use an external task directory otherwise')
    motion = json.loads((ART / 'motion.json').read_text())
    layout = json.loads((ART / 'layout.json').read_text())
    source = ART / 'batter-atlas.png'
    atlas = Image.open(source).convert('RGBA')
    batter = motion['batter']
    frame = next(f for f in batter['frames'] if f['id'] == 8)
    w, h = batter['sourceWidth'], batter['sourceHeight']
    col, row = frame['id'] % batter['columns'], frame['id'] // batter['columns']
    cell = atlas.crop((col*w, row*h, (col+1)*w, (row+1)*h))
    anchor, foot = frame['foot'], layout['actors']['batter']['worldFoot']
    scale = layout['actors']['batter']['worldHeight'] / h
    origin = (foot['x']-anchor[0]*scale, foot['y']-anchor[1]*scale)
    world = lambda p: [origin[0]+p[0]*scale, origin[1]+p[1]*scale]
    # Manual semantic separation, not AI segmentation. No neighboring subject
    # enters these atlas-cell rectangles. The hand/handle boundary is uncertain.
    rois = {'workingBat': [470, 376, 650, 419], 'barrel': [530, 376, 650, 419]}
    alpha = cell.getchannel('A')
    masks = {}
    for name, (left, top, right, bottom) in rois.items():
        masks[name] = {}
        for threshold in (16, 128, 240):
            masks[name][threshold] = [(x,y) for y in range(top,bottom)
                                      for x in range(left,right) if alpha.getpixel((x,y)) >= threshold]
    # Anatomical landmarks are independent manual observations, not fitted to C.
    landmarks = {'shoulderTop': {'atlasY':306, 'uncertaintyPx':10},
                 'pantsWaistTop': {'atlasY':440, 'uncertaintyPx':8},
                 'leadKneeLower': {'atlasY':580, 'uncertaintyPx':12}}
    upper_y = (landmarks['shoulderTop']['atlasY']+landmarks['pantsWaistTop']['atlasY'])/2
    plane = {'xMin':729, 'xMax':939, 'yMin':world([0,upper_y])[1],
             'yMax':world([0,landmarks['leadKneeLower']['atlasY']])[1]}
    targets = []
    for zone in range(10):
        u, v = ((zone%3+.5)/3, (zone//3+.5)/3) if zone<9 else (1.5,.5)
        point = [plane['xMin']+u*(plane['xMax']-plane['xMin']),
                 plane['yMin']+v*(plane['yMax']-plane['yMin'])]
        targets.append({'zone':zone, 'normalized':[u,v], 'world':point,
                        'kind':'inside' if zone<9 else 'outside-proposal'})
    contact = world([frame['contact']['x'],frame['contact']['y']])
    radius = 8
    def measure(point):
        raw={name:{str(t):distance_to_pixels(point,pixels,origin,scale)
                      for t,pixels in levels.items()} for name,levels in masks.items()}
        values={n:{t:round(d,4) for t,d in levels.items()} for n,levels in raw.items()}
        return {'distanceWorldPx':values,
                'diskOverlapsBarrelAt128':raw['barrel']['128']<=radius,
                'barrelMarginWorldPxAt128':round(radius-raw['barrel']['128'],4)}
    for target in targets:
        target.update(measure(target['world']))
    cell_png = encoded(cell)
    mask = Image.new('RGBA',cell.size)
    for pixel in masks['barrel'][128]:
        mask.putpixel(pixel,(81,235,192,210))
    mask_png = encoded(mask)
    # Authoring PNG pixels differ from deployed AVIF pixels. Measure the deployed
    # alpha separately instead of calling the source mask an exact runtime mask.
    avif_source = ART / batter['file']
    avif = Image.open(avif_source).convert('RGBA')
    avif_cell = avif.crop((col*w,row*h,(col+1)*w,(row+1)*h))
    avif_alpha = avif_cell.getchannel('A')
    sensitivity = {}
    left,top,right,bottom = rois['barrel']
    for threshold in (16,128,240):
        pixels=[(x,y) for y in range(top,bottom) for x in range(left,right)
                if avif_alpha.getpixel((x,y))>=threshold]
        measured=[distance_to_pixels(t['world'],pixels,origin,scale) for t in targets]
        sensitivity[str(threshold)]={
            'pixelCount':len(pixels),
            'maskSymmetricDifferencePixels':len(set(pixels)^set(masks['barrel'][threshold])),
            'distancesWorldPx':[round(d,4) for d in measured],
            'sameOverlapClassificationAsSourcePng':all((d<=radius)==(distance_to_pixels(t['world'],masks['barrel'][threshold],origin,scale)<=radius)
                                                       for d,t in zip(measured,targets))}
    report = {
        'status':'UNAPPROVED_AUTHORING_HYPOTHESIS_NOT_RUNTIME',
        'source':{'atlas':str(source.relative_to(REPO)), 'sha256':digest(source.read_bytes()),
                  'frame':8,'cellSize':[w,h], 'cellPixelSha256':digest(cell.tobytes()),
                  'cellPngSha256':digest(cell_png), 'sourcePixelsUnmodified':True,
                  'motionSha256':digest((ART/'motion.json').read_bytes()),
                  'layoutSha256':digest((ART/'layout.json').read_bytes())},
        'registration':{'scale':scale,'originWorld':origin,'footWorld':foot,'anchorAtlas':anchor},
        'productionAvifSensitivity':{'file':str(avif_source.relative_to(REPO)),
                                    'sha256':digest(avif_source.read_bytes()),
                                    'cellPixelSha256':digest(avif_cell.tobytes()),
                                    'sourcePngPixelIdentity':avif_cell.tobytes()==cell.tobytes(),
                                    'barrelByAlphaThreshold':sensitivity},
        'manualLandmarks':landmarks,
        'plane':{'boundsWorld':plane,'widthProposal':210,'centerXProposal':834,
                 'heightBasis':'midpoint of manual shoulder/waist to manual lower lead knee',
                 'uncertainty':'Upper ±9 atlas px / lower ±12; width/center are design proposals, not measured plate width.'},
        'mapping':{'inside':'world=(xMin+u*width,yMin+v*height); u=(column+.5)/3, v=(row+.5)/3',
                   'ui':'Use normalized central UI cell identity; never inverse-project its responsive rectangle as the physical plane.',
                   'outside':'zone9 proposal u=1.5,v=.5, not an engine-recorded side or current offset sentinel'},
        'ballProposal':{'radiusAtPlaneWorldPx':radius,'isApproved':False,
                        'depth':'release z=1 → plane z=0 → past plane z<0; schematic only, not a measured 3D camera',
                        'layerOrder':'proposed: stadium → pitcher/approach ball → batter; contact/outgoing ball resolves at plane; input UI stays above scene',
                        'continuity':'one incoming ball; no second contact ball or target-dependent pre-LOCK cue'},
        'mask':{'manualAtlasRois':rois,'boundaryUncertaintyAtlasPx':3,
                'alphaThresholds':[16,128,240],
                'semanticLimit':'workingBat excludes grip/knob and may include uncertain hand-edge pixels; barrel excludes tapered wood/handle. This is manual semantic isolation of existing alpha, not a certified collider.',
                'pixelCounts':{n:{str(t):len(p) for t,p in levels.items()} for n,levels in masks.items()},
                'metric':'minimum Euclidean distance to union of occupied pixel squares, not bat centerline',
                'rasterizationUncertaintyWorldPx':round(scale/math.sqrt(2),4)},
        'registeredCControl':{'world':contact,**measure(contact)},
        'targets':targets,
        'limits':['No plane/pose approved or connected to production.',
                  '2/9 is a nominal hypothesis measurement; landmark/ROI uncertainties are declared, not propagated into overlap bands. It does not imply seven new drawings.',
                  'PNG source masks are not pixel-identical to runtime AVIF; separate alpha sensitivity is reported.',
                  'No continuous swing, swept volume, contact timing or human fun proof.',
                  'Separate drawings7/9 are transitions, not alternative impact poses.',
                  'Do not turn a 2D overlap into hit chance/damage or move/stretch the actor to fit.',
                  'Only after target and reach review, author missing whole-body poses and adjacent transitions.'],
    }
    if not report['registeredCControl']['diskOverlapsBarrelAt128']:
        raise ValueError('Registered C does not overlap the existing barrel; inspect ROI/registration')
    if targets[9]['diskOverlapsBarrelAt128']:
        raise ValueError('Outside proposal unexpectedly touches current barrel')
    out.mkdir(parents=True,exist_ok=True)
    (out/'contact-frame-8.png').write_bytes(cell_png)
    (out/'barrel-mask.png').write_bytes(mask_png)
    (out/'contract.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    payload=json.dumps(report,ensure_ascii=False).replace('<',chr(92)+'u003c')
    page=HTML.replace('__DATA__',payload).replace('__CELL__',base64.b64encode(cell_png).decode()).replace('__MASK__',base64.b64encode(mask_png).decode())
    (out/'index.html').write_text(page)
    print(json.dumps({'out':str(out),'insideBarrelOverlaps':sum(t['diskOverlapsBarrelAt128'] for t in targets[:9]),'registeredC':report['registeredCControl'],'status':report['status']},indent=2))


HTML='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>9ZONE 타격면 원화 계약 후보</title><style>
:root{color-scheme:dark;font:16px/1.6 system-ui;background:#101a24;color:#e9f0f5}body{max-width:1200px;margin:auto;padding:20px}h1{font-size:24px}aside{border-left:3px solid #edbe71;padding:12px;background:#1c2b39}button,select{font:inherit;min-height:44px;background:#263e50;color:white;border:1px solid #899eaa;padding:6px;margin:8px 8px 8px 0}svg{width:100%;background:#182834}text{font:14px system-ui;fill:white}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:6px;border-bottom:1px solid #415360}#table{overflow:auto}a{color:#9ce5f0}.muted{color:#c4d1db}#status{min-height:3.2em}@media(max-width:600px){body{padding:10px}h1{font-size:21px}}
</style><body><h1>실제 배트 픽셀과 타격면 후보</h1><aside>미승인 원화 제작용 진단입니다. 게임의 존·판정·투구는 바꾸지 않았습니다. 타격면 너비·공 크기·존 밖 방향은 가설이고 인체 기준점은 수동 추정입니다. 겹침은 연속 스윙이나 실제 적중을 증명하지 않습니다.</aside><p class="muted">원본 아틀라스8번 셀을 공통 발 기준 그대로 표시합니다. 청록색은 원화 PNG 알파에서 분리한 배럴 픽셀입니다. 배포 AVIF는 픽셀이 달라 별도 민감도 검사를 기록했습니다. 겹침 수는 가설의 대표값이며 오차 범위를 전파한 보장은 아닙니다.</p><label>진단 접점 <select id="target"></select></label><button id="mask" aria-pressed="true">배럴 마스크 숨기기</button><p id="status" role="status"></p><svg id="world" viewBox="0 200 1200 800" role="img" aria-label="기존 접촉 포즈와 미승인 10개 접점 대조"></svg><div id="table"><table><thead><tr><th>접점(행·열)</th><th>세계 좌표</th><th>배럴까지 거리</th><th>반경8 진단 원 겹침</th></tr></thead><tbody id="rows"></tbody></table></div><p>회색 바는 수동 인체 기준점입니다. 어깨/허리의 중간과 앞무릎 아래를 높이 가설로 썼으며, 정확한 3D 스트라이크존 등록은 남아 있습니다. 금색 C는 기존에 등록된 단일 접촉 이벤트입니다.</p><p><a href="contract.json">좌표·가설·오차·원본 SHA256</a> · <a href="contact-frame-8.png">변형하지 않은 접촉 셀</a> · <a href="barrel-mask.png">배럴 마스크</a></p><script>
const D=__DATA__,$=id=>document.getElementById(id),world=$('world'),sel=$('target');let shown=true;
const cell='data:image/png;base64,__CELL__',mask='data:image/png;base64,__MASK__';
const name=t=>t.zone===9?'존 밖(가설)':`${Math.floor(t.zone/3)+1}행 ${t.zone%3+1}열`;
D.targets.forEach(t=>sel.add(new Option(name(t),t.zone)));sel.value='1';
$('rows').innerHTML=D.targets.map(t=>`<tr><td>${name(t)}</td><td>${t.world.map(n=>n.toFixed(1)).join(', ')}</td><td>${t.distanceWorldPx.barrel['128'].toFixed(1)} px</td><td>${t.diskOverlapsBarrelAt128?'겹침':'미도달'}</td></tr>`).join('');
function render(){const b=D.plane.boundsWorld,s=D.registration.scale,o=D.registration.originWorld,t=D.targets[+sel.value],c=D.registeredCControl.world;
let m=`<image href="${cell}" x="${o[0]}" y="${o[1]}" width="${768*s}" height="${768*s}"/>`;
if(shown)m+=`<image href="${mask}" x="${o[0]}" y="${o[1]}" width="${768*s}" height="${768*s}"/>`;
m+=`<rect x="${b.xMin}" y="${b.yMin}" width="${b.xMax-b.xMin}" height="${b.yMax-b.yMin}" fill="#f7c36812" stroke="#f7c368"/>`;
for(let i=1;i<3;i++)m+=`<path d="M${b.xMin+(b.xMax-b.xMin)*i/3} ${b.yMin}V${b.yMax}M${b.xMin} ${b.yMin+(b.yMax-b.yMin)*i/3}H${b.xMax}" stroke="#f7c368" opacity=".5"/>`;
Object.entries(D.manualLandmarks).forEach(([n,p])=>{let y=o[1]+p.atlasY*s;m+=`<path d="M100 ${y}H600" stroke="#92a5b3" stroke-dasharray="4 5"/><text x="100" y="${y-6}">${n} ±${p.uncertaintyPx} atlas px</text>`});
D.targets.forEach(q=>m+=`<circle cx="${q.world[0]}" cy="${q.world[1]}" r="8" fill="${q===t?'white':'none'}" stroke="${q.diskOverlapsBarrelAt128?'#65ebc2':'#f4a8a5'}"/><text x="${q.world[0]+12}" y="${q.world[1]+5}">${q.zone===9?'OUT?':q.zone+1}</text>`);
m+=`<circle cx="${c[0]}" cy="${c[1]}" r="4" fill="#ffd16a"/><text x="${c[0]+7}" y="${c[1]-10}">C</text>`;world.innerHTML=m;
$('status').textContent=`${name(t)} · 배럴까지 ${t.distanceWorldPx.barrel['128'].toFixed(1)} world px · ${t.diskOverlapsBarrelAt128?'반경8 진단 원이 겹침':'기존 접촉 원화는 미도달'} · 판정/모션 승인 아님`;
}sel.onchange=render;$('mask').onclick=()=>{shown=!shown;$('mask').setAttribute('aria-pressed',String(shown));$('mask').textContent=shown?'배럴 마스크 숨기기':'배럴 마스크 보이기';render()};render();
</script></body></html>'''

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=Path('/tmp/9zone-contact-plane-contract'))
    build(parser.parse_args().out)
