from pathlib import Path
from PIL import Image
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[3];source=Path('/workspace/fox-v5-approved-input');m=json.loads((source/'anchors.json').read_text());path='assets/pitcher-inbetweens-v1/runtime/regular-07-red-fox-pitch-drawings.webp';old=Path('/tmp/fox-v5-baseline.webp');old.write_bytes(subprocess.check_output(['git','show','518dc7d:'+path],cwd=root));im=Image.open(old).convert('RGBA');before=im.copy();records={}
for key,entry in m['frames'].items():
 f=source/entry['name'];assert hashlib.sha256(f.read_bytes()).hexdigest()==entry['sha256'];c=Image.open(f).convert('RGBA');assert c.size==(256,256);assert list(c.getbbox())==entry['bounds'];i=int(key);im.paste(c,(i%4*256,i//4*256));records[key]={'sha256':entry['sha256'],'decodedRGBAsha256':hashlib.sha256(c.tobytes()).hexdigest()}
im.save(root/path,lossless=True,exact=True,method=6);decoded=Image.open(root/path).convert('RGBA')
records['cells']=[]
for i in range(12):
 box=(i%4*256,i//4*256,i%4*256+256,i//4*256+256);actual=decoded.crop(box).tobytes();expected=Image.open(source/m['frames'][str(i)]['name']).convert('RGBA').tobytes() if str(i) in m['frames'] else before.crop(box).tobytes();assert actual==expected;records['cells'].append({'cell':i,'sha256':hashlib.sha256(actual).hexdigest(),'matchesSuppliedOrBaseline':True})
records['unchangedCells']=[0,1,2,3,4,5,6,10,11];records['sourceCommit']='d43031c7483056d244273fad69a7e68abd1fd1fc';records['anchorsSha256']=hashlib.sha256((source/'anchors.json').read_bytes()).hexdigest();records['release']=m['candidate_tip_packed_xy'];(Path(__file__).parent/'input-verification.json').write_text(json.dumps(records,indent=2))
f=root/'src/duel/battle-vnext/roster-registration.json';d=json.loads(f.read_text());r=d['regular-07-red-fox'];r['release']={'x':94.54,'y':119.18};r['status']='approved V5 replacement poses7/8/9; remaining pose continuity HELD';r['registration']='unchanged lead194,248; V5 packed release94.54,119.18; other9cells exact baseline';f.write_text(json.dumps(d,indent=2)+'\n')
f=root/'src/duel/pitcher-release.json';d=json.loads(f.read_text());d['regular-07-red-fox']=[94.54/256,119.18/256];f.write_text(json.dumps(d,indent=2)+'\n')
