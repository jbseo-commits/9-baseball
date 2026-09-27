/* V15 hero batter (assets/production-art/battle-portrait-v15, see its README): the target mockup's
   over-the-shoulder adult batter, 7 keyposes on one baseline-aligned 4x2 sheet (1024x1536 cells).
   The runtime still plays the ten-pose batterMotionV3 contract; poses without their own drawing
   reuse the nearest keypose (trigger holds LOAD, the late follow/finish/settle hold FOLLOW-THROUGH).
   HD illustration, not 1:1 pixel art: it is sampled smooth when scaled down. */
import batterV15Sheet from '../../assets/production-art/battle-portrait-v15/batter-sheet.png';

export const BATTER_V15_SHEET={
  src:batterV15Sheet,
  cols:4,rows:2,smooth:true,
  order:{ready:0,load:1,trigger:1,'swing-start':2,'swing-mid':3,contact:4,'follow-through-early':5,'follow-through-late':6,finish:6,settle:6},
};
