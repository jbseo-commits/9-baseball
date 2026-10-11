"""Package directly authored V2 poses using measured pose ground anchors.

No mirroring, procedural limb drawing, fake unique-frame rotation, or tween claim.
"""
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
ASSET = ROOT / 'assets/pitcher-study-copper-sirocco/v2'
NAME = 'copper-sirocco'
# Interstitial drawings bridge every pair, including recovery back to set.
TIMELINE = [
    ('keys', 0, 'set', 5), ('inbetweens-a', 0, 'set-to-rise', 4),
    ('bridges', 0, 'hands-rise', 4), ('inbetweens-a', 1, 'rise-to-overhead', 4),
    ('keys', 1, 'overhead-windup', 5), ('inbetweens-a', 2, 'overhead-to-load', 4),
    ('bridges', 1, 'hands-lower', 4), ('inbetweens-a', 3, 'knee-rising', 4),
    ('keys', 2, 'leg-lift', 5), ('inbetweens-a', 4, 'knee-uncoiling', 4),
    ('bridges', 2, 'hand-separation', 4), ('inbetweens-a', 5, 'stride-extension', 4),
    ('keys', 3, 'stride', 5), ('inbetweens-b', 0, 'approach-plant', 4),
    ('bridges', 3, 'foot-plant', 4), ('inbetweens-b', 1, 'arm-cocking', 4),
    ('bridges', 4, 'arm-whip', 4), ('inbetweens-b', 2, 'release-extension', 4),
    ('keys', 4, 'release', 3), ('inbetweens-b', 3, 'early-follow', 3),
    ('keys', 5, 'follow-through', 9), ('inbetweens-b', 4, 'settling-follow', 9),
    ('bridges', 5, 'recovery', 10), ('inbetweens-b', 5, 'back-to-set', 10),
]
assert sum(item[3] for item in TIMELINE) == 120
PIVOT_TARGET = [65, 240]
LEAD_TARGET = [210, 240]


def validate_landmarks(landmarks):
    """Reject the former per-pose centering and ball/hand metadata regressions."""
    expected = {item[2] for item in TIMELINE}
    if set(landmarks) != expected:
        raise ValueError('Landmarks must cover exactly the 24 authored poses')
    for n, (_, _, label, _) in enumerate(TIMELINE):
        lm = landmarks[label]
        planted = 13 <= n <= 22
        target = LEAD_TARGET if planted else PIVOT_TARGET
        foot = 'left-lead' if planted else 'right-pivot'
        ball = 'held-right' if n < 18 else 'released-empty-right'
        if lm['groundAnchorTarget'] != target or lm['anchorFoot'] != foot:
            raise ValueError(f'{label}: ground anchor must share its phase target')
        if lm['handedness'] != 'right-ball-left-glove' or lm['ballState'] != ball:
            raise ValueError(f'{label}: handedness or release-state mismatch')


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def write_png(path, picture):
    # Verify the complete encoding before atomically publishing the file.
    buffer = io.BytesIO()
    picture.save(buffer, format='PNG', optimize=True)
    data = buffer.getvalue()
    Image.open(io.BytesIO(data)).verify()
    temp = path.with_suffix('.png.tmp')
    temp.write_bytes(data)
    temp.replace(path)


def extract_sources():
    spec = importlib.util.spec_from_file_location('extractor', ROOT / 'scripts/build-pitcher-roster-sd.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    poses = {}
    for kind in dict.fromkeys(p[0] for p in TIMELINE):
        im = Image.open(ASSET / 'source' / f'{NAME}-{kind}.png').convert('RGBA')
        if im.size != (1536, 1024):
            raise ValueError(f'{kind}: incorrect dimensions {im.size}')
        if im.getchannel('A').getextrema()[0] != 0:
            raise ValueError(f'{kind}: missing transparent alpha')
        silhouettes = module.connected_silhouettes(im)
        if len(silhouettes) != 6:
            raise ValueError(f'{kind}: expected six distinct drawings')
        poses[kind] = silhouettes
    return poses


def main():
    for folder in ('source/poses', 'poses256', 'atlases', 'previews'):
        (ASSET / folder).mkdir(parents=True, exist_ok=True)
    raw = extract_sources()
    landmarks = json.loads((ASSET / 'landmarks.json').read_text())['poses']
    validate_landmarks(landmarks)
    # Choose one common scale that leaves margins even after the foot is aligned.
    scale = 228 / max(max(p.size) for group in raw.values() for p in group)
    for kind, cell, label, _ in TIMELINE:
        pose = raw[kind][cell]
        point = landmarks[label]['groundAnchorSource']
        target = landmarks[label]['groundAnchorTarget']
        extents = (point[0], point[1], pose.width - point[0], pose.height - point[1])
        spaces = (target[0] - 8, target[1] - 8, 248 - target[0], 248 - target[1])
        for extent, space in zip(extents, spaces):
            if extent > 0:
                scale = min(scale, space / extent)
    sprites, checks, markers, frames = {}, [], [], []
    contact = Image.new('RGB', (1536, 1152), '#16232d')
    draw = ImageDraw.Draw(contact)
    for n, (kind, cell, label, dwell) in enumerate(TIMELINE):
        pose = raw[kind][cell]
        write_png(ASSET / 'source/poses' / f'{label}.png', pose)
        lm = landmarks[label]
        anchor, target = lm['groundAnchorSource'], lm['groundAnchorTarget']
        if not (0 <= anchor[0] < pose.width and 0 <= anchor[1] < pose.height):
            raise ValueError(f'{label}: source foot landmark outside pose')
        if pose.getpixel(tuple(anchor))[3] < 128:
            raise ValueError(f'{label}: source foot landmark is not visible')
        size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
        offset = (target[0] - round(anchor[0] * scale), target[1] - round(anchor[1] * scale))
        sprite = Image.new('RGBA', (256, 256))
        sprite.alpha_composite(pose.resize(size, Image.Resampling.NEAREST), offset)
        bounds = sprite.getchannel('A').getbbox()
        if not bounds or min(bounds[:2]) < 7 or max(bounds[2:]) > 249:
            raise ValueError(f'{label}: clipped or insufficient margin {bounds}')
        write_png(ASSET / 'poses256' / f'{label}.png', sprite)
        sprites[label] = sprite
        x, y = n % 6 * 256, n // 6 * 288
        contact.paste(sprite, (x, y), sprite)
        draw.text((x + 8, y + 258), f'{len(frames):03d} {label}', fill='white')
        markers.append({'frame': len(frames), 'pose': label, 'source': kind, 'cell': cell, 'dwell': dwell})
        checks.append({'pose': label, 'alphaBounds': bounds, 'groundAnchorTarget': target,
                       'anchorFoot': lm['anchorFoot'], 'offset': offset, 'sourceSize': pose.size,
                       'renderedAnchor': [offset[0] + round(anchor[0] * scale), offset[1] + round(anchor[1] * scale)],
                       'handedness': lm['handedness'], 'ballState': lm['ballState']})
        frames.extend([sprite] * dwell)
    release = next(p['frame'] for p in markers if p['pose'] == 'release')
    assert len(frames) == 120 and release == 76
    unique = len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames})
    assert unique == 24
    # Both feet are visible in the last stride. Verify that the lead-foot
    # switch does not repeat the large frame-to-frame sliding in V1.
    last_stride = landmarks['stride']['leftLeadSource']
    stride_check = next(c for c in checks if c['pose'] == 'stride')
    prior_lead = [stride_check['offset'][i] + round(last_stride[i] * scale) for i in (0, 1)]
    switch_distance = ((prior_lead[0] - LEAD_TARGET[0]) ** 2 + (prior_lead[1] - LEAD_TARGET[1]) ** 2) ** .5
    if switch_distance > 24:
        raise ValueError(f'Lead-foot anchor switch jumps {switch_distance:.1f}px')
    atlas = Image.new('RGBA', (2560, 3072))
    for i, frame in enumerate(frames):
        atlas.alpha_composite(frame, (i % 10 * 256, i // 10 * 256))
    write_png(ASSET / 'atlases' / f'{NAME}-pitch-120-atlas.png', atlas)
    write_png(ASSET / 'previews' / f'{NAME}-poses.png', contact)
    comparison = Image.new('RGB', (1024, 648), '#16232d')
    compare_draw = ImageDraw.Draw(comparison)
    for column, label in enumerate(('set', 'overhead-windup', 'leg-lift', 'release')):
        for y, size in ((0, 128), (152, 192), (368, 256)):
            thumb = sprites[label].resize((size, size), Image.Resampling.NEAREST)
            comparison.paste(thumb, (column * 256 + (256 - size) // 2, y), thumb)
            compare_draw.text((column * 256 + 4, y + size + 4), f'{label} @{size}px', fill='white')
    write_png(ASSET / 'previews' / f'{NAME}-scale-comparison.png', comparison)
    preview_frames = []
    for frame in frames:
        bg = Image.new('RGB', (256, 256), '#16232d')
        bg.paste(frame, (0, 0), frame)
        preview_frames.append(bg)
    # GIF is a 25fps sample of the 60fps atlas, with exact two-second duration.
    samples = [preview_frames[min(119, round(i * 60 / 25))] for i in range(50)]
    samples[0].save(ASSET / 'previews' / f'{NAME}-pitch.gif', save_all=True,
                    append_images=samples[1:], duration=40, loop=0)
    video = ASSET / 'previews' / f'{NAME}-pitch.mp4'
    with tempfile.TemporaryDirectory(prefix='copper-v2-') as tmp:
        for i, frame in enumerate(preview_frames):
            frame.save(Path(tmp) / f'{i:03d}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '60', '-i', str(Path(tmp) / '%03d.png'),
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(video)], check=True)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames',
                    '-show_entries', 'stream=width,height,nb_frames,nb_read_frames,r_frame_rate,duration',
                    '-of', 'json', str(video)]))['streams'][0]
    assert probe['nb_read_frames'] == '120' and probe['r_frame_rate'] == '60/1' and float(probe['duration']) == 2
    pngs = list(ASSET.rglob('*.png'))
    for path in pngs:
        with Image.open(path) as png:
            png.verify()
    with Image.open(ASSET / 'previews' / f'{NAME}-pitch.gif') as gif:
        gif_duration = 0
        for frame in range(gif.n_frames):
            gif.seek(frame)
            gif_duration += gif.info['duration']
        assert gif_duration == 2000
    manifest = {'id': NAME + '-pitch-candidate-v2', 'character': NAME, 'adult_age': 29,
                'runtimeIntegrated': False, 'frameSize': [256, 256], 'frameCount': 120,
                'uniqueFrameCount': unique, 'authoredPoseCount': 24, 'fps': 60, 'durationMs': 2000,
                'atlasColumns': 10, 'atlasRows': 12, 'atlas': f'atlases/{NAME}-pitch-120-atlas.png',
                'releaseFrame': release, 'keyPoses': markers, 'throwsWith': 'right', 'gloveHand': 'left',
                'motionStatus': 'authored_pose_candidate', 'footAnchorMethod': 'manual visible foot landmarks',
                'commonScale': scale, 'landmarks': 'landmarks.json', 'references': 'references.json',
                'validation': 'validation.json', 'smooth60fpsLimbAnimation': False}
    write_json(ASSET / f'{NAME}-manifest.json', manifest)
    validation = {'status': 'candidate_packaging_passed', 'atlasSize': atlas.size, 'frameCount': 120,
                  'authoredPoseCount': 24, 'uniqueFrameCount': unique, 'releaseFrame': release,
                  'commonScale': scale, 'poses': checks, 'mp4': probe,
                  'pngIntegrity': {'verified': len(pngs), 'status': 'passed'},
                  'gifDurationMs': gif_duration,
                  'sharedGroundAnchors': {'rightPivot': PIVOT_TARGET, 'leftLead': LEAD_TARGET},
                  'anchorSwitch': {'fromPose': 'stride', 'toPose': 'approach-plant',
                                   'previousLeadPosition': prior_lead, 'nextLeadPosition': LEAD_TARGET,
                                   'distancePx': switch_distance, 'maxAllowedPx': 24},
                  'visualReviewRequired': True, 'pending': ['game placement and UI', 'fully smooth limb animation',
                      'user approval of glamour/face', 'camera-specific source motion verification']}
    write_json(ASSET / 'validation.json', validation)
    print(json.dumps({'poses': unique, 'frames': len(frames), 'scale': scale, 'releaseFrame': release, 'mp4': probe}))


if __name__ == '__main__':
    main()
