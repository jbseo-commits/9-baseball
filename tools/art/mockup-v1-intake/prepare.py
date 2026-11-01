#!/usr/bin/env python3
"""Export approved mockup references to WebP; never redraw, crop or resize.

Run from any directory: python tools/art/mockup-v1-intake/prepare.py [--check]
Requires Pillow with WebP. Sources and hashes come from PR #63's package manifest.
The isolated output does not mutate the shared runtime optimizer or register actors.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageStat, __version__ as pillow_version, features

ROOT = Path(__file__).resolve().parents[3]
PACKAGE = ROOT / 'docs/design/mockup-v1'
OUTPUT = ROOT / 'assets/production-art/mockup-v1-intake'
NAMES = ('stadium-wide.png', 'batter-catcher.png', 'pitcher-home.png', 'cards.png')
SETTINGS = {'format': 'WEBP', 'quality': 92, 'method': 6, 'alpha_quality': 100, 'exact': True}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metadata_sha256(path):
    # Git autocrlf may change JSON line endings on Windows. Normalize only CRLF,
    # never JSON values/spacing or the PNG/WebP bytes protected by sha256().
    return hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest()


def selected_sources():
    receipt = json.loads((PACKAGE / 'PACKAGE-MANIFEST.json').read_text(encoding='utf-8'))
    entries = {Path(x['path']).name: x for x in receipt['selected_runtime_art']}
    if set(entries) != set(NAMES):
        raise ValueError('Selected source set changed; review before export.')
    sources = []
    for name in NAMES:
        entry = entries[name]
        path = PACKAGE / entry['path']
        if sha256(path) != entry['sha256']:
            raise ValueError(f'Source hash changed: {name}')
        with Image.open(path) as image:
            if list(image.size) != entry['dimensions'] or image.mode != entry['mode']:
                raise ValueError(f'Source dimensions/mode changed: {name}')
        sources.append((path, entry))
    return sources


def compare(source, runtime):
    """Measure visible RGB error over both light/dark backgrounds and exact alpha."""
    with Image.open(source) as original, Image.open(runtime) as decoded:
        if original.size != decoded.size or decoded.format != 'WEBP':
            raise ValueError(f'Dimensions/format mismatch: {runtime.name}')
        a, b = original.convert('RGBA'), decoded.convert('RGBA')
        if a.getchannel('A').tobytes() != b.getchannel('A').tobytes():
            raise ValueError(f'Alpha changed: {runtime.name}')
        errors = []
        for color in ('#f5edda', '#101f24'):
            background = Image.new('RGBA', a.size, color)
            x = Image.alpha_composite(background, a).convert('RGB')
            y = Image.alpha_composite(background, b).convert('RGB')
            difference = ImageStat.Stat(ImageChops.difference(x, y))
            errors.append(math.sqrt(sum(v * v for v in difference.rms) / 3))
        rmse = max(errors)
        return {'alpha_exact': True, 'worst_composited_rgb_rmse': round(rmse, 4),
                'worst_composited_psnr_db': round(20 * math.log10(255 / rmse), 3) if rmse else None}


def build():
    if not features.check('webp'):
        raise ValueError('Pillow WebP support required.')
    sources = selected_sources()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    entries = []
    for source, selected in sources:
        target = OUTPUT / (source.stem + '.webp')
        with Image.open(source) as image:
            # Preserve original dimensions and alpha. No art edits or geometry changes.
            image.save(target, **SETTINGS)
        metrics = compare(source, target)
        entries.append({'source': source.relative_to(ROOT).as_posix(),
                        'source_sha256': selected['sha256'], 'source_bytes': source.stat().st_size,
                        'file': target.name, 'sha256': sha256(target), 'bytes': target.stat().st_size,
                        'dimensions': selected['dimensions'], 'source_mode': selected['mode'], **metrics})
    manifest = {'schema': 1, 'source_base': 'bb409c093fb27b83f30105d0642593e541eacb90',
                'status': 'reference derivatives; not registered in the game',
                'pillow_version': pillow_version, 'libwebp_version': features.version('webp'),
                'settings': SETTINGS, 'geometry': 'scene-layout.json', 'coverage': 'actor-coverage.json',
                'metadata_sha256_mode': 'CRLF-to-LF; all other bytes unchanged',
                'metadata_sha256': {name: metadata_sha256(OUTPUT / name) for name in ('scene-layout.json', 'actor-coverage.json')},
                'source_bytes': sum(e['source_bytes'] for e in entries),
                'runtime_bytes': sum(e['bytes'] for e in entries), 'assets': entries}
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def check():
    sources = selected_sources()
    manifest = json.loads((OUTPUT / 'manifest.json').read_text(encoding='utf-8'))
    entries = {e['file']: e for e in manifest['assets']}
    if manifest['settings'] != SETTINGS:
        raise ValueError('Export settings changed; regenerate and review.')
    for name in ('scene-layout.json', 'actor-coverage.json'):
        if metadata_sha256(OUTPUT / name) != manifest['metadata_sha256'][name]:
            raise ValueError(f'Metadata changed: {name}')
    if set(entries) != {Path(n).stem + '.webp' for n in NAMES}:
        raise ValueError('Missing or unexpected derivative entry.')
    for source, selected in sources:
        target = OUTPUT / (source.stem + '.webp')
        entry = entries[target.name]
        if entry['source_sha256'] != selected['sha256'] or entry['source'] != source.relative_to(ROOT).as_posix():
            raise ValueError(f'Stale source receipt: {target.name}')
        if entry['source_bytes'] != source.stat().st_size:
            raise ValueError(f'Stale source size: {target.name}')
        if sha256(target) != entry['sha256'] or target.stat().st_size != entry['bytes']:
            raise ValueError(f'Derivative hash/size changed: {target.name}')
        if entry['dimensions'] != selected['dimensions'] or entry['source_mode'] != selected['mode']:
            raise ValueError(f'Stale dimensions/mode: {target.name}')
        if compare(source, target) != {k: entry[k] for k in ('alpha_exact', 'worst_composited_rgb_rmse', 'worst_composited_psnr_db')}:
            raise ValueError(f'Stale comparison metrics: {target.name}')
    if sum(e['bytes'] for e in entries.values()) != manifest['runtime_bytes']:
        raise ValueError('Runtime byte total mismatch.')
    if sum(e['source_bytes'] for e in entries.values()) != manifest['source_bytes']:
        raise ValueError('Source byte total mismatch.')
    print(json.dumps({'assets': len(entries), 'source_bytes': manifest['source_bytes'],
                      'runtime_bytes': manifest['runtime_bytes'], 'alpha_exact': True,
                      'sha256_verified': True, 'dimensions_preserved': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Read-only verification of committed outputs')
    args = parser.parse_args()
    try:
        if not args.check:
            build()
        check()
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f'Asset intake failed: {error}\n')
