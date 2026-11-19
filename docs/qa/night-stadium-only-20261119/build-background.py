from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[3]
p=root/'assets/production-art/night-stadium'
im=Image.open(p/'stadium-source.png').convert('RGB')
# Piecewise inverse landmark registration; existing game coordinates are untouched.
xknots=[(0,0),(200,834),(399,1671)]
yknots=[(0,0),(164,536),(214,874),(224,940)]
def source(v,knots):
 for (a,b),(c,d) in zip(knots,knots[1:]):
  if v<=d:return max(0,min(c,round(a+(v-b)*(c-a)/(d-b))))
 return knots[-1][0]
xs=[source(x,xknots) for x in range(1672)];ys=[source(y,yknots) for y in range(941)]
out=Image.new('RGB',(1672,941));src=im.load();dst=out.load()
for y,sy in enumerate(ys):
 for x,sx in enumerate(xs):dst[x,y]=src[sx,sy]
out.save(p/'stadium-registered.webp',lossless=True,method=6)
assert xs[834]==200 and ys[536]==164 and ys[874]==214
(root/'docs/qa/night-stadium-only-20261119/mapping.json').write_text(json.dumps({'source':[400,225],'world':[1672,941],'xKnots':xknots,'yKnots':yknots,'sampling':'nearest; nonuniform background-only mapping','mound':[834,536],'home':[834,874]},indent=2))
print('registered1672x941; landmark assertions pass')
