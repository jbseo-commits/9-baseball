import src from '../../assets/landscape-ballpark-v2/batter-sheet.webp';
export const LANDSCAPE_BATTER={src,cols:4,rows:2,smooth:false,baseline:486/512,
  order:{ready:0,load:1,trigger:2,'swing-start':2,'swing-mid':3,contact:3,'follow-through-early':4,'follow-through-late':5,finish:5,settle:6},
  // Authored cell measurements, not global actor movement. Compensate for the
  // contact drawing's leftward cell drift and second-row transparent padding.
  anchors:{ready:{x:0,baseline:486/512},load:{x:14/384,baseline:486/512},trigger:{x:20/384,baseline:486/512},'swing-start':{x:20/384,baseline:486/512},'swing-mid':{x:65/384,baseline:486/512},contact:{x:65/384,baseline:486/512},'follow-through-early':{x:0,baseline:468/512},'follow-through-late':{x:0,baseline:468/512},finish:{x:0,baseline:468/512},settle:{x:-5/384,baseline:468/512}}};
