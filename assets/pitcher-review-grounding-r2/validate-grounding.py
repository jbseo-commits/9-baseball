"""Check reviewed boot pixels against an independently traced photographed rubber."""
from pathlib import Path
import json,math,hashlib
from PIL import Image

ROOT=Path(__file__).resolve().parent
def inside(point,poly,tolerance=.6):
 # Distance-normalized convex polygon half planes; tolerance is display pixels, not invented source points.
 cross=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  dx=b[0]-a[0];dy=b[1]-a[1];cross.append((dx*(point[1]-a[1])-dy*(point[0]-a[0]))/math.hypot(dx,dy))
 return min(cross)>=-tolerance or max(cross)<=tolerance
def validate():
 m=json.loads((ROOT/'manifest.json').read_text());cam=json.loads((ROOT/'references/game-camera.json').read_text());rows=[];failures=[];before=[]
 assert len(m['characters'])==20
 for c in m['characters']:
  g=c['grounding'];assert g['manually_reviewed'];assert c['anchor']==g['anchor']=={k:g['preparation_contacts']['0'][k] for k in ('x','y')}
  assert c['landing_point']!=c['anchor']
  assert c['throwing_hand']==g['pivot_foot']
  assert c['packing']['not_motion_synthesis'] and c['frame_size']==512
  for i in (0,1,2):
   p=g['preparation_contacts'][str(i)];im=Image.open(ROOT/c['poses'][i]).convert('RGBA');px=round(p['x']);py=round(p['y'])-2
   band=im.getchannel('A').crop((px-2,py-2,px+3,py+2));assert band.getextrema()[1]>=128,(c['slug'],i,'marked point does not touch boot pixels')
   for cap in cam['captures']:
    scale=cap['actorHeightReference']*342/640/c['scale_basis_height'];target=cap['rubberScreen']['contact'];poly=cap['rubberScreen']['polygon'];point=[target['x']+(p['x']-c['anchor']['x'])*scale,target['y']+(p['y']-c['anchor']['y'])*scale]
    row={'slug':c['slug'],'phase':i,'capture':cap['capture'],'actual_reviewed_boot_point':point,'rubber_polygon':poly,'inside_rubber':inside(point,poly),'source_alpha_band_verified':True};rows.append(row)
    if not row['inside_rubber']:failures.append(row)
    pp=c['prior_grounding']['preparation_contacts'][str(i)];s0=cap['actorHeightReference']*342/640/c['prior_scale_basis_height'];mound=cap['moundScreen'];prior=[mound['x']+(pp['x']-c['prior_anchor']['x'])*s0,mound['y']+(pp['y']-c['prior_anchor']['y'])*s0];before.append({'slug':c['slug'],'phase':i,'capture':cap['capture'],'source_annotated_boot_point':prior,'inside_rubber':inside(prior,poly)})
 report={'status':'passed' if not failures else 'failed','characters':20,'after_boot_checks':len(rows),'before_outside_rubber':sum(not b['inside_rubber'] for b in before),'after_outside_rubber':len(failures),'tolerance_display_px':.6,'method':'manually reviewed boot pixels, independent field-photo polygon; one shared anchor/scale across sequence; lead landing not forced onto rubber','failures':failures,'after':rows,'before':before}
 (ROOT/'reports/boot-rubber-qa.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ('after','before')},indent=2));assert not failures
if __name__=='__main__':validate()
