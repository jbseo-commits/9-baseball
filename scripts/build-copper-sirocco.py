"""Package 12 authored poses as a held-pose candidate; no limb tween claim."""
from __future__ import annotations
import hashlib
import io
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / 'assets/pitcher-study-copper-sirocco'
CHARACTER = 'copper-sirocco'
TIMELINE = [
    ('keys', 0, 'set', 9), ('bridges', 0, 'hands-rise', 8),
    ('keys', 1, 'coil', 9), ('bridges', 1, 'deeper-coil', 8),
    ('keys', 2, 'leg-lift', 9), ('bridges', 2, 'knee-lower', 8),
    ('keys', 3, 'stride', 9), ('bridges', 3, 'foot-plant', 8),
    ('bridges', 4, 'arm-whip', 8), ('keys', 4, 'release', 6),
    ('keys', 5, 'follow-through', 18), ('bridges', 5, 'recovery', 20),
]

def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def write_png(path, image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG', optimize=True)
    data = buffer.getvalue()
    Image.open(io.BytesIO(data)).verify()
    temp = path.with_suffix('.png.tmp')
    temp.write_bytes(data)
    temp.replace(path)

def main():
    spec = importlib.util.spec_from_file_location('roster', ROOT / 'scripts/build-pitcher-roster-sd.py')
    if spec is None or spec.loader is None:
        raise RuntimeError('Missing shared extractor')
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    raw = {}
    sheet_checks = {}
    for kind in ('keys', 'bridges'):
        path = ASSET / 'source' / f'{CHARACTER}-{kind}.png'
        sheet = Image.open(path).convert('RGBA')
        assert sheet.size == (1536, 1024), sheet.size
        alpha = sheet.getchannel('A')
        assert alpha.getextrema()[0] == 0
        raw[kind] = builder.connected_silhouettes(sheet)
        assert len(raw[kind]) == 6
        sheet_checks[kind] = {'size': list(sheet.size), 'alphaZeroPixels': alpha.histogram()[0], 'extractedFigures': 6}
    for folder in ('source/poses', 'poses256', 'atlases', 'previews'):
        (ASSET / folder).mkdir(parents=True, exist_ok=True)
    # One scale for all poses; baseline is alpha-bbox proxy, not measured foot tracking.
    scale = 228 / max(max(p.size) for group in raw.values() for p in group)
    frames, markers, fitted, pose_checks = [], [], {}, []
    atlas = Image.new('RGBA', (2560, 3072))
    contact = Image.new('RGB', (1536, 576), '#172029')
    draw = ImageDraw.Draw(contact)
    for n, (kind, cell, label, dwell) in enumerate(TIMELINE):
        pose = raw[kind][cell]
        write_png(ASSET / 'source/poses' / f'{label}.png', pose)
        size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
        resized = pose.resize(size, Image.Resampling.NEAREST)
        sprite = Image.new('RGBA', (256, 256))
        offset = ((256 - size[0]) // 2, 248 - size[1])
        sprite.alpha_composite(resized, offset)
        sprite.save(ASSET / 'poses256' / f'{label}.png', optimize=True)
        fitted[label] = sprite
        bounds = sprite.getchannel('A').getbbox()
        assert bounds and min(bounds[:2]) >= 8 and max(bounds[2:]) <= 248, bounds
        pose_checks.append({'pose': label, 'alphaBounds': list(bounds), 'sourceSize': list(pose.size), 'fitOffset': list(offset), 'marginPassed': True})
        contact.paste(sprite, ((n % 6) * 256, (n // 6) * 288), sprite)
        draw.text(((n % 6) * 256 + 12, (n // 6) * 288 + 258), label, fill='white')
        markers.append({'frame': len(frames), 'pose': label, 'source': kind, 'cell': cell, 'dwell': dwell})
        frames.extend([sprite] * dwell)
    assert len(frames) == 120
    assert next(m['frame'] for m in markers if m['pose'] == 'release') == 76
    for i, sprite in enumerate(frames):
        atlas.alpha_composite(sprite, ((i % 10) * 256, (i // 10) * 256))
    atlas.save(ASSET / 'atlases' / f'{CHARACTER}-pitch-120-atlas.png', optimize=True)
    contact.save(ASSET / 'previews' / f'{CHARACTER}-poses.png', optimize=True)
    compare = Image.new('RGB', (960, 340), '#172029')
    old = Image.open(ROOT / 'assets/pitcher-study-v2/previews/tide-vesper-poses.png').convert('RGBA').crop((0, 0, 256, 256))
    cd = ImageDraw.Draw(compare)
    x = 12
    for size in (128, 192, 256):
        for name, sprite in [('Copper', fitted['set']), ('Tide', old)]:
            resized = sprite.resize((size, size), Image.Resampling.NEAREST)
            compare.paste(resized, (x, 280 - size), resized)
            cd.text((x, 292), f'{name} {size}px', fill='white')
            x += size + 10
    # Width for all six comparison sprites is 1212px.
    if x > compare.width:
        compare = Image.new('RGB', (x, 340), '#172029')
        cd = ImageDraw.Draw(compare); x2 = 12
        for size in (128, 192, 256):
            for name, sprite in [('Copper', fitted['set']), ('Tide', old)]:
                resized = sprite.resize((size, size), Image.Resampling.NEAREST)
                compare.paste(resized, (x2, 280 - size), resized)
                cd.text((x2, 292), f'{name} {size}px', fill='white'); x2 += size + 10
    compare.save(ASSET / 'previews' / f'{CHARACTER}-scale-comparison.png', optimize=True)
    def background(sprite):
        canvas = Image.new('RGB', (256, 256), '#172029')
        canvas.paste(sprite, (0, 0), sprite)
        return canvas
    gif_frames = [background(frames[min(119, round(i * 60 / 25))]) for i in range(50)]
    gif_frames[0].save(ASSET / 'previews' / f'{CHARACTER}-pitch.gif', save_all=True, append_images=gif_frames[1:], duration=40, loop=0)
    video = ASSET / 'previews' / f'{CHARACTER}-pitch.mp4'
    with tempfile.TemporaryDirectory(prefix='copper-build-') as temp:
        for i, sprite in enumerate(frames):
            background(sprite).save(Path(temp) / f'{i:03d}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '60', '-i', str(Path(temp) / '%03d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(video)], check=True)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,r_frame_rate,duration', '-of', 'json', str(video)]))['streams'][0]
    assert probe['nb_frames'] == '120' and probe['r_frame_rate'] == '60/1' and float(probe['duration']) == 2
    unique = len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames})
    assert unique == 12
    references = json.loads((ASSET / 'references.json').read_text())
    manifest = {'id': CHARACTER + '-pitch-candidate-v1', 'character': CHARACTER, 'name': '코퍼 시로코', 'adult_age': 29, 'throwsWith': 'right', 'gloveHand': 'left', 'facing': 'toward-camera', 'viewpoint': 'catcher-behind-home-plate', 'runtimeIntegrated': False, 'frameSize': [256, 256], 'frameCount': 120, 'uniqueFrameCount': unique, 'authoredPoseCount': 12, 'fps': 60, 'durationMs': 2000, 'atlasColumns': 10, 'atlasRows': 12, 'atlas': f'atlases/{CHARACTER}-pitch-120-atlas.png', 'releaseFrame': 76, 'keyPoses': markers, 'motionStatus': 'held_pose_candidate', 'motion_validation': 'reference_unverified', 'references': references, 'footAnchorMethod': 'shared alpha-bbox baseline proxy; manual pose landmarks require review', 'gifFps': 25, 'gifDurationMs': 2000, 'validation': 'validation.json'}
    if (ASSET / 'landmarks.json').exists():
        manifest['landmarks'] = 'landmarks.json'
    write_json(ASSET / f'{CHARACTER}-manifest.json', manifest)
    validation = {'status': 'candidate_packaging_passed', 'sheets': sheet_checks, 'individualPosePngCount': 12, 'atlasSize': list(atlas.size), 'frameCount': 120, 'uniqueFrameCount': unique, 'releaseFrame': 76, 'poses': pose_checks, 'mp4': probe, 'motionValidation': 'reference_unverified', 'pending': ['observed source-video timestamps', 'additional authored intermediate poses for smooth motion', 'manual foot/waist/shoulder/ball landmarks', 'actual mobile portrait/landscape/PC game context', 'blind commercial art quality review', 'runtime integration and regression'], 'fullGameTests': 'not run: isolated unused art candidate'}
    validation['manualLandmarks'] = 'landmarks.json (approximate; precise runtime validation pending)'
    write_json(ASSET / 'validation.json', validation)
    print(json.dumps({'poses': 12, 'frames': 120, 'uniqueFrames': unique, 'atlas': list(atlas.size), 'mp4': probe, 'status': 'candidate_packaging_passed'}))

if __name__ == '__main__':
    main()
