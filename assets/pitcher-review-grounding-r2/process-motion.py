"""Package actual native drawings: fixed grid, alpha cleanup, no motion synthesis."""
from pathlib import Path
import hashlib,json,shutil,subprocess,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.frames.alpha_floor import clear_haze

ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'manifest.json').read_text())
captures=json.loads((ROOT/'references/game-camera.json').read_text())['captures']
annotations_path=ROOT/'grounding-annotations.json'
annotations=json.loads(annotations_path.read_text()) if annotations_path.exists() else {}
overrides={a['slug']:a for a in annotations.get('characters',[])} if annotations.get('manual_review_complete') else {}
assert set(overrides)=={c['slug'] for c in manifest['characters']}, 'R2 requires complete reviewed boot annotations before writing output; run annotation proposals and review new source first.'
assert all(a.get('manually_reviewed') and len(a.get('source_pose_pixel_sha256',{}))==12 for a in overrides.values()), 'R2 annotations must bind all12 reviewed drawings.'
redrawn={'regular-03-amber-sinker','regular-05-violet-sting','tide-vesper','copper-sirocco','onyx-eclipse'}
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
qa=[]
overview=Image.new('RGB',(5*256,4*278),'#dce3e6')
od=ImageDraw.Draw(overview)
for n,char in enumerate(manifest['characters']):
 slug=char['slug']; records={}
 for part in ('keys','bridges'):
  p=ROOT/'reports'/f'{slug}-{part}-generation.json'
  if p.exists(): records[part]=json.loads(p.read_text())
 if len(records)!=2: continue
 master=Path(char['master_png']);master=master if master.is_absolute() else ROOT/master
 assert hashlib.sha256(master.read_bytes()).hexdigest()==char['master_sha256']
 sheets={};alpha_reports={}
 for part,r in records.items():
  im=Image.open(ROOT/r['source'])
  assert im.mode=='RGBA' and im.size==(1536,1024),(slug,part,im.mode,im.size)
  im,ar=clear_haze(im,floor=64,edge=2)
  assert ar['changed_solid_pixels']==0 and ar['changed_edge_pixels']==0
  sheets[part]=im;alpha_reports[part]=ar
 out=ROOT/'poses'/slug;out.mkdir(parents=True,exist_ok=True)
 pdir=ROOT/'previews/frames'/slug;pdir.mkdir(parents=True,exist_ok=True)
 gifdir=ROOT/'previews/gif-frames'/slug;gifdir.mkdir(parents=True,exist_ok=True)
 char['poses']=[];char['preview_frames']=[];frames=[];checks=[]
 strip=Image.new('RGB',(6*256,2*282),'#dce3e6');sd=ImageDraw.Draw(strip)
 for i,name in enumerate(char['phases']):
  part='keys' if i%2==0 else 'bridges';cell=i//2;x=cell%3*512;y=cell//3*512
  f=sheets[part].crop((x,y,x+512,y+512))
  if slug in redrawn:
   raw_alpha=np.array(f.getchannel('A'))
   raw_edge=np.concatenate((raw_alpha[0],raw_alpha[-1],raw_alpha[:,0],raw_alpha[:,-1]))
   assert not (raw_edge>=64).any(),(slug,name,'real source contour clipped; redraw, do not pad to hide it')
   # One constant packaging transform for ALL 12 drawings, never individual fitting or limb animation.
   padded=Image.new('RGBA',(512,512),(0,0,0,0));padded.paste(f.resize((480,480),Image.Resampling.NEAREST),(16,16));f=padded
  before=np.array(f)
  a=before.copy();a[a[:,:,3]==0,:3]=0
  assert np.array_equal(a[:,:,3],before[:,:,3]) and np.array_equal(a[a[:,:,3]>0],before[before[:,:,3]>0])
  f=Image.fromarray(a,'RGBA');alpha=f.getchannel('A');bb=alpha.getbbox()
  assert hashlib.sha256(f.tobytes()).hexdigest()==overrides[slug]['source_pose_pixel_sha256'][str(i)],(slug,name,'source changed: review contacts and hand registration before rebuilding')
  assert bb and alpha.getextrema()[0]==0 and alpha.getextrema()[1]>=220,(slug,name,'invalid alpha')
  margin=min(bb[0],bb[1],512-bb[2],512-bb[3]);assert margin>=3,(slug,name,'clipping',bb)
  rel=f'poses/{slug}/{i:02}-{name}.png';f.save(ROOT/rel,optimize=True)
  char['poses'].append(rel);frames.append(f)
  preview=f.resize((256,256),Image.Resampling.NEAREST)
  relp=f'previews/frames/{slug}/{i:02}.webp';preview.save(ROOT/relp,lossless=True,method=3,exact=False)
  preview.save(gifdir/f'{i:02}.png');char['preview_frames'].append(relp)
  sx=(i%6)*256;sy=(i//6)*282;strip.paste(preview,(sx,sy+24),preview)
  sd.text((sx+8,sy+5),f'{i:02} {name}',font=font,fill='#193442')
  checks.append({'phase':name,'part':part,'source_cell':cell,'size':[512,512],'alpha_bbox':list(bb),'edge_margin':margin,'sha256':hashlib.sha256(f.tobytes()).hexdigest()})
 assert len(set(c['sha256'] for c in checks))==12
 bb=checks[0]['alpha_bbox'];anchor=overrides[slug]['anchor']
 char['landing_point']=overrides[slug]['landing_point'];char['grounding']=overrides[slug]
 revision='motion-G3' if any(r['revision']=='motion-G3' for r in records.values()) else 'motion-G2' if any(r['revision']=='motion-G2' for r in records.values()) else 'motion-M2' if any(r['revision']=='motion-M2' for r in records.values()) else 'motion-M1'
 char.update({'anchor':anchor,'scale_basis_height':bb[3]-bb[1],'frame_size':512,'preview_texture_size':256,'drawings':12,'status':'motion_candidate','source_sheets':{p:r['source'] for p,r in records.items()},'source_revisions':{p:r['revision'] for p,r in records.items()},'motion_revision':revision,'packing':{'method':'common 480px resize + 16px padding across all 12 drawings' if slug in redrawn else 'fixed native 512px cells','scale':.9375 if slug in redrawn else 1,'pad':16 if slug in redrawn else 0,'not_motion_synthesis':True}})
 # Release point is hand-authored after release sheet inspection; never infer from whole-body bbox.
 char.setdefault('release_point',None)
 if master.resolve()!=(ROOT/'identity'/f'{slug}.png').resolve():shutil.copy2(master,ROOT/'identity'/f'{slug}.png')
 char['identity_preview']=f'identity/{slug}.png'
 char['contact_sheet']=f'previews/{slug}-12poses.png';strip.save(ROOT/char['contact_sheet'])
 char['gif']=f'previews/{slug}-12poses.gif'
 # Run the native GIF route, then only repack durations to the authored event clock.
 subprocess.run(['/workspace/asset-tools/bin/asset-tool','2dimg2motion','gif',str(gifdir),'--output',str(ROOT/char['gif']),'--duration-ms','160','--background','#dce3e6'],capture_output=True,text=True,check=True,timeout=60)
 gifframes=[]
 for f in frames:
  rgb=Image.new('RGB',(256,256),'#dce3e6');small=f.resize((256,256),Image.Resampling.NEAREST);rgb.paste(small,(0,0),small);gifframes.append(rgb)
 durations=[char['phase_ms'][i+1]-t if i<11 else char['duration_ms']-t for i,t in enumerate(char['phase_ms'])]
 gifframes[0].save(ROOT/char['gif'],save_all=True,append_images=gifframes[1:],duration=durations,loop=0,disposal=2)
 with Image.open(ROOT/char['gif']) as g:assert g.n_frames==12
 geometry=[]
 for c in captures:
  meta=c['composition']['pitcher'];bounds=meta['frames'][0]['alphaBounds'];visible=(bounds[3]-bounds[1])/meta['sourceHeight']*c['actorHeightReference'];k=visible/char['scale_basis_height'];m=c.get('rubberScreen',{}).get('contact',c['moundScreen']);z=c['zone'];v=c['viewport']
  for check in checks:
   l,t,r,b=check['alpha_bbox'];x=m['x']+(l-anchor['x'])*k;y=m['y']+(t-anchor['y'])*k;right=m['x']+(r-anchor['x'])*k;bottom=m['y']+(b-anchor['y'])*k
   overlap=max(0,min(right,z['x']+z['width'])-max(x,z['x']))*max(0,min(bottom,z['y']+z['height'])-max(y,z['y']))
   geometry.append({'capture':c['capture'],'phase':check['phase'],'screen_bbox':[x,y,right,bottom],'viewport_fit':x>=0 and y>=0 and right<=v['width'] and bottom<=v['height'],'zone_bbox_overlap_area':overlap})
 preview=frames[6].resize((256,256),Image.Resampling.NEAREST);ox=n%5*256;oy=n//5*278;overview.paste(preview,(ox,oy+22),preview);od.text((ox+6,oy+3),slug,font=font,fill='#193442')
 qa.append({'slug':slug,'source_master_unchanged':True,'source_revisions':char['source_revisions'],'drawings':12,'poses':checks,'alpha_cleanup':alpha_reports,'geometry':geometry,'semantic_anatomy_review':'separate manual review, not inferred by hashes','production_motion_approved':False})
manifest.update({'processed_characters':len(qa),'processed_poses':len(qa)*12,'stage':'full-motion-candidates-in-review','render_contract':'12 original drawings on authored event clock; no optical-flow, affine limb motion, or 120 unique drawing claim'})
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'reports/pose-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
overview.save(ROOT/'previews/all-20-release.png')
print(json.dumps({'characters':len(qa),'drawings':len(qa)*12,'geometry_checks':sum(len(q['geometry']) for q in qa),'bad_projection':sum(not g['viewport_fit'] or g['zone_bbox_overlap_area']>0 for q in qa for g in q['geometry'])}))
