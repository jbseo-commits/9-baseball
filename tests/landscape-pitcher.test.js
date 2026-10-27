import {it,expect} from 'vitest';
import {widePitcherFrame,TIDE_RETURN} from '../src/duel/landscape-pitcher.js';
it('keeps all original release and pitching frames and uses six authored return poses only after 2000ms',()=>{
  expect(widePitcherFrame(1267,'tide-vesper')).toEqual({source:'atlas',frame:76,scale:1});
  expect(widePitcherFrame(1999,'tide-vesper').source).toBe('atlas');
  for(let i=0;i<6;i++)expect(widePitcherFrame(2000+i*100,'tide-vesper').frame).toBe(i);
  expect(widePitcherFrame(2600,'tide-vesper')).toEqual({source:'atlas',frame:0,scale:1});
});
it('plants each return shoe at its declared ground location, with the same scale in DOM and Pixi',()=>{
  for(let i=0;i<6;i++){
    const s=widePitcherFrame(2000+i*100,'tide-vesper');
    expect(128+s.x*256+s.scale*(TIDE_RETURN.shoe[i]-128)).toBeCloseTo(TIDE_RETURN.target[i]);
    expect(s.baseline).toBe(250/256);expect(s.scale).toBe(.91);
  }
});
it('gives knockout priority over recovering to ready and leaves other pitchers untouched',()=>{
  expect(widePitcherFrame(2200,'tide-vesper',true)).toEqual({source:'atlas',frame:119,scale:1});
  expect(widePitcherFrame(2200,'regular-01-red-rush')).toEqual({source:'atlas',frame:119,scale:1});
});
