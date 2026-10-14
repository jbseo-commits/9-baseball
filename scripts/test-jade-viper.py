"""Asset contract checks independent of the atlas packer's drawing code."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root=Path(__file__).resolve().parents[1]/'assets/pitcher-study-jade-viper'
m=json.loads((root/'jade-viper-manifest.json').read_text())
atlas=Image.open(root/m['atlas'])
assert atlas.mode=='RGBA' and atlas.size==(2560,3072)
assert (m['frameCount'],m['fps'],m['releaseFrame'])==(120,60,76)
assert m['runtimeIntegrated'] is False and m['productionReady'] is False
hashes=[]
for f in range(120):
    tile=atlas.crop((f%10*256,f//10*256,f%10*256+256,f//10*256+256))
    alpha=tile.getchannel('A')
    box=alpha.point(lambda a:255 if a>127 else 0).getbbox()
    assert box and min(box[:2])>=0 and max(box[2:])<=256
    assert alpha.getpixel((0,0))==0 and alpha.getpixel((255,255))==0
    hashes.append(hashlib.sha256(tile.tobytes()).hexdigest())
    p=m['poses'][m['frameToPose'][f]]
    assert p['frame']<=f and p['ballHeld']==(f<76)
    assert hashes[-1]==m['formatQA']['sourceChecks'][m['frameToPose'][f]]['registeredSha256']
assert len(set(hashes))==30 and hashes[75]!=hashes[76] and hashes[0]!=hashes[119]
assert m['poses'][m['frameToPose'][76]]['id']=='07-release'
approved=json.loads((root/'approved/motion-r1/manifest.json').read_text())
for p in approved['poses']:
    new=next(q for q in m['poses'] if q['id']==p['id'])
    assert hashlib.sha256((root/new['source']).read_bytes()).hexdigest()==p['sha256']
for kind in ['keys','bridges']:
    sheet=Image.open(root/'source'/f'jade-viper-{kind}.png')
    assert sheet.mode=='RGBA' and sheet.size==(1536,1024)
    for n in range(6):
        assert sheet.crop((n%3*512,n//3*512,n%3*512+512,n//3*512+512)).getchannel('A').getbbox()
report={'status':'passed','frameCells':120,'distinctPixelFrames':30,'approvedSourceHashes':12,'releaseIndex':76,'runtimeIntegrated':False,'scope':'Dimensions, cell-to-drawing packing, alpha, immutable originals and metadata release contract. Visual ball/anatomy checks are separate.'}
(root/'qa/asset-check.json').write_text(json.dumps(report,indent=2)+'\n')
print('120 atlas cells,30 pixel drawings,12 original hashes,release76 and transparent sheets: passed.')
