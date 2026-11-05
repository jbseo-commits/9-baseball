#!/usr/bin/env python3
"""Compile reviewed 12 drawings onto the existing 120-tick/60fps playback contract.

No limb synthesis, pose-dependent recentering, or invented in-between drawings.
Native source bytes and the historical review package stay untouched.
"""
from pathlib import Path
from PIL import Image
import hashlib, json, sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/pitcher-review-grounding-r2'
OUT = ROOT / 'assets/pitcher-grounded-runtime-v1'
SHA = lambda b: hashlib.sha256(b).hexdigest()

def main():
    source = json.loads((SOURCE / 'manifest.json').read_text())
    annotation = json.loads((SOURCE / 'grounding-annotations.json').read_text())
    contacts = {c['slug']: c for c in annotation['characters']}
    captures = json.loads((SOURCE / 'references/game-camera.json').read_text())['captures']
    cap = next(c for c in captures if c['capture'] == 'desktop')
    transform = cap['worldTransform']
    foot = cap['rubberScreen']['contact']
    world_foot = {'x': (foot['x']-transform['e'])/transform['a'], 'y': (foot['y']-transform['f'])/transform['d']}
    # Exactly the rendered scale that was visually accepted in the before/after review.
    visible_world_height = cap['actorHeightReference']/transform['d'] * 342/640
    assert annotation['manual_review_complete'] and len(source['characters']) == 20
    OUT.mkdir(exist_ok=True)
    (OUT / 'atlases').mkdir(exist_ok=True)
    (OUT / 'runtime').mkdir(exist_ok=True)
    previous = json.loads((OUT/'manifest.json').read_text()) if '--reuse-atlases' in sys.argv and (OUT/'manifest.json').exists() else {}
    previous = {c['id']:c for c in previous.get('characters',[])}
    registration, stance, release, stride, records = {}, {}, {}, {}, []
    for c in source['characters']:
        slug = c['slug']; a = contacts[slug]
        assert a['manually_reviewed'] and a['anchor'] == c['anchor']
        frames = []
        for i, rel in enumerate(c['poses']):
            im = Image.open(SOURCE / rel).convert('RGBA')
            assert im.size == (512,512)
            assert SHA(im.tobytes()) == a['source_pose_pixel_sha256'][str(i)], f'{slug}/{i}: unreviewed pixels'
            frames.append(im.resize((256,256),Image.Resampling.LANCZOS))
        starts = [round(t*60/1000) for t in c['phase_ms']]
        rf = round(c['release_ms']*60/1000)
        assert starts[6] == rf and rf in (76,79)
        atlas = Image.new('RGBA',(2560,3072))
        drawing_at = []
        for tick in range(120):
            i = max(i for i,t in enumerate(starts) if t <= tick)
            atlas.paste(frames[i], ((tick%10)*256,(tick//10)*256))
            drawing_at.append(i)
        file = OUT / 'atlases' / f'{slug}-pitch-120-atlas.webp'
        cached = previous.get(slug,{})
        if not (cached.get('sourcePosePixelSHA256') == a['source_pose_pixel_sha256'] and file.exists() and SHA(file.read_bytes()) == cached.get('atlasSHA256')):
            atlas.save(file,'WEBP',quality=94,method=6,exact=True)
        # The source atlas satisfies the existing authoring/export contract.
        # Runtime stores each actual drawing only once, avoiding ten copies
        # of identical pixels on the network and in mobile GPU memory.
        compact = Image.new('RGBA',(768,1024))
        for i,im in enumerate(frames): compact.paste(im,((i%3)*256,(i//3)*256))
        runtime_file = OUT / 'runtime' / f'{slug}-pitch-12-drawings.webp'
        compact.save(runtime_file,'WEBP',quality=94,method=6,exact=True)
        point = lambda p: {k:p[k]/2 for k in ('x','y')}
        registration[slug] = {
            'id':slug,'file':runtime_file.relative_to(ROOT).as_posix(),'sourceAtlas':file.relative_to(ROOT).as_posix(),'releaseFrame':rf,
            'columns':3,'rows':4,'drawingAtTick':drawing_at,
            'anchor':point(c['anchor']),'release':point(c['release_point']),
            'landing':point(c['landing_point']),'landingFrame':starts[4],
            'visibleHeight':c['scale_basis_height']/2,'visibleWorldHeight':visible_world_height,
            'worldFoot':world_foot,'throwingHand':c['throwing_hand'],
            'registration':'reviewed anatomical pivot sole; fixed transform across all 12 drawings',
            'sourceManifest':'assets/pitcher-review-grounding-r2/manifest.json',
        }
        stance[slug] = [c['anchor']['x']/512,c['anchor']['y']/512]
        release[slug] = [c['release_point']['x']/512,c['release_point']['y']/512]
        stride[slug] = [starts[4],c['landing_point']['x']/512,c['landing_point']['y']/512]
        records.append({'id':slug,'motionRevision':c['motion_revision'],'file':file.relative_to(ROOT).as_posix(),
            'sourcePosePixelSHA256':a['source_pose_pixel_sha256'],'atlasSHA256':SHA(file.read_bytes()),
            'sourceDrawings':12,'timelineTicks':120,'fps':60,'phaseStartTicks':starts,'drawingAtTick':drawing_at,
            'runtimeFile':runtime_file.relative_to(ROOT).as_posix(),'runtimeSHA256':SHA(runtime_file.read_bytes()),
            'redrawn':slug in source['redrawn_characters'],'bytes':file.stat().st_size,'runtimeBytes':runtime_file.stat().st_size})
        print(f'{slug}: {file.stat().st_size//1024} KiB, release {rf}, 12 authored drawings')
    manifest = {'version':1,'clientDate':'2026-11-06','approvalQuote':'좋아 전원 고유패턴, 전용 기믹 적용하고 네가 봤을 때 가장 좋은 에셋들로 메인 병합해줘',
        'scope':'explicit runtime integration and main merge approval; historical review manifest remains an immutable candidate record',
        'sourceManifestSHA256':SHA((SOURCE/'manifest.json').read_bytes()),'method':'12 authored drawings held on 120 ticks; no interpolated limb motion',
        'characters':records,'totalAtlasBytes':sum(r['bytes'] for r in records),'totalRuntimeBytes':sum(r['runtimeBytes'] for r in records)}
    for p,data in [(OUT/'manifest.json',manifest),(ROOT/'src/duel/battle-vnext/roster-registration.json',registration),
                   (ROOT/'src/duel/pitcher-stance.json',stance),(ROOT/'src/duel/pitcher-release.json',release),(ROOT/'src/duel/pitcher-stride.json',stride)]:
        p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(f"Total: {manifest['totalAtlasBytes']/1024/1024:.2f} MiB")

if __name__ == '__main__': main()
