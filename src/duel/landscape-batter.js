import src from '../../assets/landscape-ballpark-v3/batter-atlas.webp';
import layout from '../../assets/landscape-ballpark-v3/layout.json';
import {landscapeBatterTimeline} from './landscape-batter-motion.js';
import uncoilSrc from '../../assets/landscape-ballpark-v4/batter-uncoil/atlas.webp';
import bridgeSrc from '../../assets/landscape-ballpark-v4/batter-bridge/atlas.webp';
import raiseSrc from '../../assets/landscape-ballpark-v4/batter-recovery/atlas.webp';
import registration from '../../assets/landscape-ballpark-v4/registration.json';
const order={ready:0,load:1,trigger:2,'swing-start':3,'swing-mid':5,contact:6,'swing-through':6,'follow-through-early':7,'follow-through-late':8,finish:9,settle:10,'recover-front':11,'recover-raise':12,'recover-shoulder':12,'recover-ready':13};
// Pixels in the canonical384×320 cells. Ready/load/lift hold the rear shoe;
// planted swing/recovery align the lead shoe heel interval (see art QA notes).
const offsets={ready:0,load:3,trigger:-9,'swing-start':-6,'swing-mid':-8,contact:18,'swing-through':18,
  'follow-through-early':6,'follow-through-late':6,finish:8,settle:10,'recover-front':6,'recover-raise':4,'recover-shoulder':4,'recover-ready':2};
const page=(src,name,count,order)=>({src,width:count*384,height:320,rects:Array.from({length:count},(_,i)=>({x:i*384,y:0,w:384,h:320})),order,
  anchors:Object.fromEntries(Object.entries(order).map(([pose,i])=>[pose,registration[name][i]]))});
const uncoil=page(uncoilSrc,'batter-uncoil',1,{'recover-uncoil':0});
const bridge=page(bridgeSrc,'batter-bridge',5,{'recover-unwind':1,'recover-lower':2,'recover-drop':3,settle:4});
const raise=page(raiseSrc,'batter-recovery',8,{'recover-low':2,'recover-turn':3,'recover-front':4,'recover-raise':5});
const poseSheets=Object.fromEntries([uncoil,bridge,raise].flatMap(p=>Object.keys(p.order).map(pose=>[pose,p])));
export const LANDSCAPE_BATTER={src,smooth:false,baseline:304/320,aspect:384/320,
  width:layout.width,height:layout.height,rects:layout.rects,order,poseSheets,timeline:landscapeBatterTimeline,
  anchors:{...Object.fromEntries(Object.keys(order).map(pose=>[pose,{x:offsets[pose]/384,baseline:304/320}])),...uncoil.anchors,...bridge.anchors,...raise.anchors,
    'recover-shoulder':registration['legacy-tail'][4],'recover-ready':registration['legacy-tail'][5]}};
