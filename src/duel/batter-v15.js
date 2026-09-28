/* V15 hero batter (assets/production-art/battle-portrait-v15, see its README): the target mockup's
   over-the-shoulder adult batter, 7 keyposes on one baseline-aligned 4x2 sheet.
   The runtime still plays the ten-pose batterMotionV3 contract; poses without their own drawing
   reuse the nearest keypose (trigger holds LOAD, the late follow/finish/settle hold FOLLOW-THROUGH).
   HD illustration, not 1:1 pixel art: it is sampled smooth when scaled down.

   #103 M09: the runtime sheet is the master at half size (512x768 cells, 2048x1536). The batter is
   drawn at most ~340 CSS px tall at devicePixelRatio 2, so 768 px cells still oversample, and the
   texture drops from 48 MB to 12 MB of GPU memory — the 4096 px master was what phones failed to
   upload. Pixi and the DOM fallback both read this one sheet, so whichever renders, it is the same
   batter on the same baseline (the fallback used to be an older batter from another art set). */
import batterV15Sheet from '../../assets/production-art/battle-portrait-v15/batter-sheet-runtime.png';

export const BATTER_V15_SHEET={
  src:batterV15Sheet,
  cols:4,rows:2,smooth:true,
  /* feet touch the ground 1527/1536 down each cell (manifest.json baseline_px) */
  baseline:1527/1536,
  order:{ready:0,load:1,trigger:1,'swing-start':2,'swing-mid':3,contact:4,'follow-through-early':5,'follow-through-late':6,finish:6,settle:6},
};

/* one pose of a sheet as CSS background values (the DOM fallback) */
export function sheetCellStyle(sheet,pose){
  const cols=sheet.cols||1,rows=sheet.rows||1,cell=sheet.order?.[pose]??0;
  const col=cell%cols,row=Math.floor(cell/cols);
  return {
    backgroundImage:`url(${sheet.src})`,
    backgroundSize:`${cols*100}% ${rows*100}%`,
    backgroundPosition:`${cols>1?col*100/(cols-1):0}% ${rows>1?row*100/(rows-1):0}%`,
  };
}
