"""Original native52x10 pixel UI motif: no source art, rescale or filter."""
from PIL import Image,ImageDraw
from pathlib import Path
im=Image.new('RGBA',(52,10));d=ImageDraw.Draw(im)
# Low masonry silhouette, not a target/grid or a ball landing indication.
d.rectangle((1,4,50,8),fill='#102a29');d.rectangle((3,5,48,7),fill='#36715c')
for x in [3,15,27,39]:
 d.rectangle((x,1,x+8,6),fill='#102a29');d.rectangle((x+1,2,x+7,5),fill='#62a481');d.line((x+1,2,x+7,2),fill='#e1d6a0')
d.line((4,8,47,8),fill='#102a29');d.line((9,6,42,6),fill='#36715c')
im.save(Path(__file__).resolve().parents[1]/'assets/pixel-ui/emerald-low-wall.png')
