// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import BattleScene,{SAMPLE_ACTORS} from '../src/duel/battle-vnext/BattleScene.jsx';
const timeline={impactAt:600,releaseAt:680,settleAt:900,duration:1100,freeze:80};
const playback={action:'swing',timeline,startedAt:-10000,pitchReleaseAt:300};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('explicit scene seeks drive actors and the one overlay without spawning a live clock/ball',()=>{
 const raf=vi.fn();vi.stubGlobal('requestAnimationFrame',raf);
 const props={actors:SAMPLE_ACTORS,size:{width:844,height:390},framing:'atbat',playback};
 const overlay=<svg data-testid="single-review-ball"/>;
 const {container,rerender}=render(<BattleScene {...props} phase="flight" reviewFrame={{elapsed:400,effect:null,overlay}}/>);
 expect(raf).not.toHaveBeenCalled();expect(container.querySelectorAll('[data-testid=single-review-ball]')).toHaveLength(1);
 expect(container.querySelector('.bv-ball-sprite')).toBeNull();expect(container.querySelector('.bv-ball-wake')).toBeNull();
 expect(container.querySelector('.bv-world').style.transform).toBe(container.querySelector('.bv-effect-world').style.transform);
 const before=container.querySelector('.bv-actor-batter').dataset.pose;
 rerender(<BattleScene {...props} phase="result" result={{kind:'hit'}} reviewFrame={{elapsed:600,effect:null,overlay}}/>);
 expect(container.querySelector('.bv-actor-batter').dataset.pose).not.toBe(before);expect(raf).not.toHaveBeenCalled();
 rerender(<BattleScene {...props} phase="flight" reviewFrame={{elapsed:400,effect:null,overlay}}/>);
 expect(container.querySelector('.bv-actor-batter').dataset.pose).toBe(before);
});
it('baseline review uses native effects at explicit time, while ordinary callers retain RAF',()=>{
 const raf=vi.fn();vi.stubGlobal('requestAnimationFrame',raf);
 const props={actors:SAMPLE_ACTORS,size:{width:844,height:390},playback,phase:'flight'};
 const {container,rerender}=render(<BattleScene {...props} reviewFrame={{elapsed:450}}/>);
 expect(container.querySelector('.bv-ball-sprite')).not.toBeNull();expect(raf).not.toHaveBeenCalled();
 rerender(<BattleScene {...props}/>);expect(raf).toHaveBeenCalledTimes(1);
});
