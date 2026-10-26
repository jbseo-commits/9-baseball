import src from '../../assets/landscape-ballpark-v3/batter-atlas.webp';
import layout from '../../assets/landscape-ballpark-v3/layout.json';
import {landscapeBatterTimeline} from './landscape-batter-motion.js';
const order={ready:0,load:1,trigger:2,'swing-start':3,'swing-mid':5,contact:6,'swing-through':6,'follow-through-early':7,'follow-through-late':8,finish:9,settle:10,'recover-front':11,'recover-raise':12,'recover-ready':13};
// Pixels in the canonical384×320 cells. Ready/load/lift hold the rear shoe;
// planted swing/recovery align the lead shoe heel interval (see art QA notes).
const offsets={ready:0,load:3,trigger:-9,'swing-start':-6,'swing-mid':-8,contact:18,'swing-through':18,
  'follow-through-early':6,'follow-through-late':6,finish:8,settle:10,'recover-front':6,'recover-raise':4,'recover-ready':2};
export const LANDSCAPE_BATTER={src,smooth:false,baseline:304/320,aspect:384/320,
  width:layout.width,height:layout.height,rects:layout.rects,order,timeline:landscapeBatterTimeline,
  anchors:Object.fromEntries(Object.keys(order).map(pose=>[pose,{x:offsets[pose]/384,baseline:304/320}]))};
