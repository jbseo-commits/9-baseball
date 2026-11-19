"""Original integer-coordinate pixel painting. No source image, resizing or filters.

Run from any directory: python3 build_scene.py. Pillow rasterizes directly at 320x180.
The authored palette and polygons are the editable source, not postprocessed artwork.
"""
from pathlib import Path
import base64
import hashlib
import json
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
PAL = {
    'ink':'#101522', 'sky':'#161e32', 'haze':'#23334a', 'city':'#1b293e',
    'steel':'#33465b', 'rail':'#526277', 'seat':'#283749', 'seatlight':'#3c5060',
    'wall':'#203841', 'walllight':'#34565a', 'grass':'#31534b', 'stripe':'#385f52',
    'grassdark':'#27443f', 'dirtshadow':'#604d4e', 'dirt':'#8b6a59',
    'dirtlight':'#ae8768', 'clay':'#c39c77', 'chalk':'#c9c5a1',
    'lamp':'#f2dca3', 'lightcase':'#9c9980', 'amber':'#be9867',
    'sign':'#6e8a86', 'cloud':'#29364b', 'deep':'#131d2b',
    'copper':'#a85b4d','hair':'#54343b','red':'#b64749',
    'skin':'#d2a17e','skinlight':'#efc49b','cream':'#e4ddba',
}
im = Image.new('RGB', (320,180), PAL['sky'])
d = ImageDraw.Draw(im)
def rect(box,c): d.rectangle(box, fill=PAL[c])
def poly(points,c): d.polygon(points,fill=PAL[c])
def line(points,c,width=1): d.line(points,fill=PAL[c],width=width)

# Broad night sky shapes, no gradients, random texture, blur or dithering.
poly([(0,43),(54,43),(54,39),(118,39),(118,43),(178,43),(178,40),(238,40),(238,45),(319,45),(319,80),(0,80)],'haze')
poly([(93,19),(114,19),(114,17),(143,17),(143,20),(154,20),(154,22),(103,22),(103,21),(93,21)],'cloud')
poly([(196,29),(212,29),(212,27),(242,27),(242,30),(264,30),(264,32),(196,32)],'cloud')
# Skyline stays subordinate to field; deliberately sparse lit windows.
for x,y,w in [(53,42,14),(74,48,11),(91,34,17),(115,45,14),(135,40,8),(177,44,12),(196,37,17),(221,45,13),(244,39,11)]:
    rect((x,y,x+w,72),'city')
    rect((x+2,y+3,x+3,y+5),'steel')
    rect((x+w-4,y+9,x+w-3,y+11),'steel')
line([(99,34),(99,29)],'steel')
line([(204,37),(204,32)],'steel')
# Grandstand roof and banks form a shallow bowl around the central mound.
poly([(0,38),(62,58),(112,68),(208,68),(258,58),(319,38),(319,93),(0,93)],'deep')
poly([(0,42),(63,62),(112,72),(208,72),(258,62),(319,42),(319,48),(258,67),(208,77),(112,77),(63,67),(0,48)],'steel')
line([(0,41),(62,61),(112,71),(208,71),(258,61),(319,41)],'rail')
poly([(0,53),(65,72),(112,81),(208,81),(255,72),(319,53),(319,88),(0,88)],'seat')
# Seating grouped in long clusters, not individually speckled crowd heads.
for y in [60,67,74]:
    line([(0,y),(66,y+17),(112,y+24)],'seatlight')
    line([(208,y+24),(254,y+17),(319,y)],'seatlight')
for x in [19,46,75,102]:
    line([(x,56+x//4),(x-8,87)],'deep',2)
    line([(319-x,56+x//4),(327-x,87)],'deep',2)
rect((115,79,204,86),'seat')
for x in range(119,204,9): rect((x,81,x+4,82),'seatlight')
# Small scoreboard, architectural signage rather than gameplay HUD.
rect((136,57,183,77),'ink'); rect((138,59,181,75),'wall')
rect((141,62,178,63),'sign')
for x in [143,151,159,167,175]: rect((x,68,x+2,71),'amber')
rect((151,76,153,82),'steel'); rect((168,76,170,82),'steel')
# Outfield wall and continuous top rail.
poly([(0,84),(78,91),(242,91),(319,84),(319,101),(0,101)],'wall')
line([(0,84),(78,91),(242,91),(319,84)],'walllight',2)
for x in range(8,320,24): line([(x,88 if x<70 or x>250 else 93),(x,100)],'walllight')
rect((145,95,174,97),'sign')
# Lighting rigs: stepped metal cases and discrete lamps, no glow filter.
for x in [30,280]:
    rect((x+3,24,x+5,68),'steel')
    line([(x-1,34),(x+8,49),(x-1,62)],'rail')
    rect((x-12,12,x+17,27),'ink'); rect((x-11,13,x+16,25),'lightcase')
    rect((x-10,14,x+15,24),'steel')
    for a in range(5):
        for b in range(2): rect((x-9+a*5,15+b*5,x-7+a*5,17+b*5),'lamp')
    line([(x-12,27),(x+17,27)],'amber')
# Outfield plane, larger quiet stripes emphasize depth toward home plate.
rect((0,101,319,179),'grass')
poly([(0,105),(319,105),(319,112),(0,112)],'stripe')
poly([(0,123),(319,123),(319,138),(0,138)],'stripe')
poly([(0,158),(319,158),(319,179),(0,179)],'stripe')
# Infield diamond from catcher, near field fills bottom corners.
poly([(159,103),(263,137),(201,179),(109,179),(53,137)],'dirtshadow')
poly([(159,105),(259,137),(199,179),(110,179),(57,137)],'dirt')
poly([(159,112),(222,136),(157,161),(94,136)],'grassdark')
poly([(159,113),(216,136),(157,157),(99,136)],'grass')
# Infield dirt edge deliberately clean, 1px alternating runs follow perspective.
line([(59,137),(109,176)],'dirtlight')
line([(258,137),(204,176)],'dirtlight')
# Mound at contract foot landmark (159,111), clear landing plane.
poly([(147,109),(153,107),(166,107),(173,110),(172,113),(148,114),(144,112)],'dirtshadow')
poly([(149,108),(165,108),(171,110),(169,112),(149,112),(146,111)],'dirtlight')
line([(151,108),(164,108),(167,109)],'clay')
rect((156,109,162,109),'chalk')
# Baselines converge toward home, with flat diamond-shaped bases.
line([(0,106),(156,158),(319,105)],'chalk')
poly([(56,133),(61,132),(65,135),(60,137)],'chalk')
poly([(251,134),(256,132),(261,134),(257,137)],'chalk')
poly([(155,104),(159,103),(163,104),(159,106)],'chalk')
# Home plate foreground and batter boxes convey the catcher viewpoint.
poly([(126,151),(185,151),(219,179),(94,179)],'dirtlight')
poly([(144,154),(168,154),(170,161),(156,169),(142,161)],'dirtshadow')
poly([(146,154),(166,154),(167,160),(156,166),(145,160)],'chalk')
line([(146,154),(166,154)],'lamp')
line([(133,151),(114,151),(99,173),(129,173),(136,158)],'chalk')
line([(178,151),(197,151),(213,173),(183,173),(176,158)],'chalk')
# Minimal broad cleat scuffs: texture only on foreground dirt.
line([(105,178),(118,178)],'dirt')
line([(194,177),(206,177)],'dirt')
line([(122,158),(128,158)],'dirt')
line([(183,161),(189,161)],'dirt')

im.save(OUT/'stadium-background.png')
# Original 60px adult pitcher. Identity based on parent direct pixel audit of
# libfile_3ea5017dd9e8819185c1d78ca54d2ab4, not a raster input to this builder.
# Anatomical right/ball hand is viewer-left; left glove is viewer-right.
poly([(148,111),(151,109),(168,109),(175,112),(171,114),(151,114)],'dirtshadow')
# Tall tied ponytail: auburn shadow mass and contiguous copper rim clusters.
poly([(163,54),(168,52),(174,54),(177,59),(176,66),(180,73),(179,80),(175,85),(176,77),(172,73),(170,64),(166,62)],'ink')
poly([(165,55),(169,54),(173,56),(175,60),(173,67),(177,74),(177,79),(173,72),(171,65),(168,61)],'hair')
line([(169,54),(173,56),(175,60),(174,64)],'copper')
line([(174,70),(177,75),(177,78)],'copper')
line([(168,55),(170,59),(171,65),(173,70)],'copper')
# Long planted legs with different knee planes; no detached foot markers.
poly([(153,81),(164,81),(168,90),(167,102),(169,109),(165,112),(160,110),(161,100),(159,91),(157,100),(156,110),(149,112),(147,109),(151,101),(150,91)],'ink')
poly([(153,83),(159,85),(157,94),(155,100),(151,99),(152,92)],'cream')
poly([(160,84),(164,83),(166,91),(165,100),(161,100),(162,92)],'chalk')
poly([(153,85),(155,85),(154,96),(152,99),(151,99)],'red')
line([(164,85),(166,91),(165,98)],'red')
poly([(153,96),(155,94),(154,100),(151,100)],'rail')
rect((151,101,155,102),'cream'); rect((162,101,165,102),'cream')
rect((151,104,155,104),'red'); rect((162,104,165,104),'red')
poly([(150,108),(154,108),(155,110),(152,111),(147,111),(147,110)],'steel')
line([(148,111),(154,111)],'cream')
poly([(163,108),(166,108),(168,110),(167,111),(161,111),(161,110)],'steel')
line([(162,111),(167,111)],'cream')
# Jersey shape and natural waist/hip taper.
poly([(153,63),(161,62),(167,65),(169,72),(165,78),(165,83),(161,86),(152,83),(153,77),(149,72),(149,67)],'ink')
poly([(153,64),(157,65),(159,69),(161,65),(164,64),(167,67),(166,73),(163,76),(153,75),(151,69)],'cream')
poly([(153,69),(156,71),(163,71),(163,76),(154,75)],'chalk')
line([(152,65),(155,65),(158,69)],'red')
line([(161,65),(163,64),(166,66)],'red')
rect((154,76,162,77),'red')
poly([(154,78),(162,78),(162,80),(164,82),(153,82)],'skin')
rect((155,78,161,79),'skinlight')
rect((152,83,164,84),'ink'); rect((157,83,159,83),'amber')
# Offsetting ball-hand and glove creates two separate readable equipment shapes.
poly([(149,66),(153,68),(152,73),(149,76),(152,78),(151,82),(147,80),(144,76),(146,70)],'ink')
poly([(149,66),(152,67),(152,70),(148,70)],'chalk')
line([(148,70),(151,71)],'red')
poly([(147,72),(149,72),(148,77),(143,80),(140,78),(144,76)],'steel')
poly([(140,77),(144,77),(145,79),(142,81),(139,79)],'skin')
# One baseball with 3x3 bright core, outlined against the dark sleeve/field.
rect((137,72,144,79),'ink'); rect((139,73,142,78),'cream'); rect((138,74,143,77),'cream')
rect((139,74,141,76),'lamp'); rect((142,75,142,77),'red')
poly([(166,68),(169,70),(169,75),(166,78),(162,77),(161,73)],'ink')
poly([(163,70),(167,69),(170,71),(169,75),(165,77),(162,75)],'hair')
line([(163,71),(165,70),(168,70)],'red')
line([(164,73),(168,73),(167,75)],'red')
# Head/neck, 7-head athletic proportions. Minimal face at this actual scale.
rect((156,61,160,65),'skin')
poly([(153,54),(161,53),(164,56),(162,62),(159,65),(154,62),(152,58)],'hair')
poly([(154,56),(161,55),(162,59),(160,62),(157,63),(154,60)],'skin')
poly([(155,56),(159,55),(160,59),(158,61),(156,60)],'skinlight')
rect((155,58,156,58),'ink'); rect((160,57,161,57),'ink')
rect((158,61,159,61),'copper')
# Cap and chest both carry explicit tiny 9 glyphs; no arbitrary glyph font.
poly([(152,53),(154,51),(161,51),(164,54),(164,56),(152,56)],'ink')
rect((154,52,160,54),'steel')
line([(151,56),(164,55)],'red',2)
for x,y in [(157,52),(158,52),(157,53),(158,53),(158,54)]: rect((x,y,x,y),'cream')
for x,y in [(157,70),(158,70),(159,70),(157,71),(159,71),(157,72),(158,72),(159,72),(159,73),(157,74),(158,74),(159,74)]: rect((x,y,x,y),'red')
im.save(OUT/'stadium-native.png')
pixels=set(im.getdata())
assert pixels <= {tuple(bytes.fromhex(c[1:])) for c in PAL.values()}
manifest={'scope':'single static Red Fox night-stadium study; not approved production art', 'native':[320,180],
          'authoring':'original integer Pillow primitives; no input image/resize/filter',
          'palette':PAL,'usedColors':len(pixels),'camera':{'home':[156,158],'mound':[159,111]},
          'sha256':hashlib.sha256((OUT/'stadium-native.png').read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
data=base64.b64encode((OUT/'stadium-native.png').read_bytes()).decode()
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>붉은 여우 — 네이티브 픽셀 연구</title>
<style>*{box-sizing:border-box}body{margin:0;background:#101522;color:#c9c5a1;font:14px system-ui,sans-serif}main{padding:16px;max-width:1440px;margin:auto}header{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;margin-bottom:16px}h1{font-size:18px;margin:0}p{line-height:1.6;margin:12px 0}#stage{width:max-content;margin:0 auto}canvas{display:block;image-rendering:pixelated;width:320px;height:180px}small{color:#8c9ca7}button{font:inherit;color:inherit;background:#23334a;border:1px solid #526277;padding:8px 12px;cursor:pointer}footer{margin-top:16px}body.narrow main{padding:0}body.narrow header,body.narrow footer{padding:8px}</style>
<main><header><h1>붉은 여우 · 밤 경기장</h1><small>단일 정지 장면 · 검토 후보</small></header><div id="stage"><canvas width="320" height="180" aria-label="포수 뒤에서 바라본 밤 경기장. 마운드에 선 9번 붉은 여우 투수."></canvas></div><footer><button id="native">1× 원본 보기</button> <small id="scale"></small><p>320×180 원본 격자에 새로 그린 한 프레임입니다. 승인 디자인을 참고한 연구 후보이며, 새 픽셀 화풍과 장면은 아직 승인되지 않았습니다.</p><small>네이티브 320×180 · 정수 배율 · 외부 파일/네트워크 불필요</small></footer></main>
<script>const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;let one=false;function fit(){document.body.classList.toggle('narrow',innerWidth<352);const pad=innerWidth<352?0:32;const scale=one?1:Math.max(1,Math.min(4,Math.floor((innerWidth-pad)/320),Math.floor((innerHeight-150)/180)));canvas.style.width=320*scale+'px';canvas.style.height=180*scale+'px';document.querySelector('#scale').textContent=scale+'× · '+320*scale+' × '+180*scale;window.studyScale=scale;}document.querySelector('#native').onclick=()=>{one=!one;document.querySelector('#native').textContent=one?'화면 맞춤 (정수 배율)':'1× 원본 보기';fit()};addEventListener('resize',fit);const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0);window.sceneReady=true;fit()};img.src='data:image/png;base64,DATA';fit();</script></html>'''
(OUT/'preview.html').write_text(html.replace('DATA',data))
print(json.dumps(manifest))
