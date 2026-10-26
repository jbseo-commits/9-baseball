import src from '../../assets/landscape-ballpark-v3/tide-return/return-atlas.png';
import {redRushFrameAt} from './pitcher-sd.js';
export const TIDE_RETURN={src,cols:6,rows:1,scale:.91,baseline:250/256,
  // Bottom-six-pixel shoe interval centres, measured on canonical frames.
  shoe:[182.5,168.5,162.5,184.5,202.5,203.5],target:[174,174,174,178,181,183]};
export function widePitcherFrame(elapsed,artId,knockedOut=false){
  if(artId!=='tide-vesper'||knockedOut||elapsed<2000)return {source:'atlas',frame:redRushFrameAt(elapsed),scale:1};
  if(elapsed>=2600)return {source:'atlas',frame:0,scale:1};
  const frame=Math.min(5,Math.floor((elapsed-2000)/100));
  return {source:'return',frame,scale:TIDE_RETURN.scale,baseline:TIDE_RETURN.baseline,
    x:(TIDE_RETURN.target[frame]-128-TIDE_RETURN.scale*(TIDE_RETURN.shoe[frame]-128))/256};
}
